"""Run on a free Colab NVIDIA GPU. No API keys, account upgrades or paid calls."""
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path

os.environ['WANDB_DISABLED'] = 'true'
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'

import torch
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, Trainer, TrainingArguments, set_seed

ROOT = Path('/content/rajat-training')
MODEL = 'Qwen/Qwen3-4B'
REVISION = '1cfa9a7208912126459214e8b04321603b3df60c'
MAX_LENGTH = 1024
EPOCHS = 2
SEED = 77
EXPORT = ROOT / 'export'
EXPORT.mkdir(parents=True, exist_ok=True)

if not torch.cuda.is_available():
    raise RuntimeError('No NVIDIA GPU is allocated. Choose Runtime > Change runtime type > T4 GPU in FREE Colab. If unavailable, try later; do not purchase compute.')
free, total = torch.cuda.mem_get_info()
if free < 10 * 1024**3:
    raise RuntimeError('Less than 10 GiB GPU memory is free. Start a fresh free GPU session; no paid upgrade is required by this notebook.')
if not (2, 4) <= tuple(int(part) for part in torch.__version__.split('+')[0].split('.')[:2]) < (3, 0):
    raise RuntimeError(f'Unsupported preinstalled PyTorch {torch.__version__}; this setup expects 2.4–2.x. Do not replace the GPU runtime with CPU PyTorch.')

set_seed(SEED)
compute_dtype = torch.bfloat16 if torch.cuda.get_device_capability()[0] >= 8 else torch.float16
print('GPU:', torch.cuda.get_device_name(), 'free GiB:', round(free / 1024**3, 1))
print('Loading', MODEL, 'at pinned revision', REVISION)
tokenizer = AutoTokenizer.from_pretrained(MODEL, revision=REVISION, trust_remote_code=False)
tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = 'right'
base = AutoModelForCausalLM.from_pretrained(
    MODEL, revision=REVISION, trust_remote_code=False, use_safetensors=True,
    quantization_config=BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type='nf4', bnb_4bit_use_double_quant=True, bnb_4bit_compute_dtype=compute_dtype),
    device_map={'': 0}, torch_dtype=compute_dtype, attn_implementation='sdpa',
)
base = prepare_model_for_kbit_training(base, use_gradient_checkpointing=True, gradient_checkpointing_kwargs={'use_reentrant': False})
model = get_peft_model(base, LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05, target_modules='all-linear', bias='none', task_type='CAUSAL_LM'))
model.print_trainable_parameters()

instruction = (ROOT / 'instruction.txt').read_text(encoding='utf-8')
train_rows = [json.loads(line) for line in (ROOT / 'train.jsonl').read_text(encoding='utf-8').splitlines() if line]
eval_rows = [json.loads(line) for line in (ROOT / 'eval.jsonl').read_text(encoding='utf-8').splitlines() if line]
validation_rows = [row for row in eval_rows if row['partition'] == 'validation']
test_rows = [row for row in eval_rows if row['partition'] == 'test']
assert validation_rows and test_rows, 'Validation and final test partitions are required'

def prompt_for(row):
    payload = {'QUESTION': row['question'], 'HISTORY': row['history'], 'DOCUMENTS': row['documents']}
    return tokenizer.apply_chat_template(
        [{'role': 'system', 'content': instruction}, {'role': 'user', 'content': json.dumps(payload, ensure_ascii=False)}],
        tokenize=False, add_generation_prompt=True, enable_thinking=False,
    )

def encode(row):
    prompt = tokenizer(prompt_for(row), add_special_tokens=False)['input_ids']
    completion = tokenizer(json.dumps(row['output'], ensure_ascii=False), add_special_tokens=False)['input_ids'] + [tokenizer.eos_token_id]
    if len(prompt) + len(completion) > MAX_LENGTH:
        raise ValueError(f"Example {row['id']} has {len(prompt) + len(completion)} tokens; shorten its context explicitly instead of silently truncating evidence.")
    return {'input_ids': prompt + completion, 'attention_mask': [1] * (len(prompt) + len(completion)), 'labels': [-100] * len(prompt) + completion}

class Rows(torch.utils.data.Dataset):
    def __init__(self, rows): self.rows = [encode(row) for row in rows]
    def __len__(self): return len(self.rows)
    def __getitem__(self, index): return self.rows[index]

def collate(batch):
    width = max(len(row['input_ids']) for row in batch)
    return {key: torch.tensor([row[key] + [pad] * (width - len(row[key])) for row in batch], dtype=torch.long)
            for key, pad in [('input_ids', tokenizer.pad_token_id), ('attention_mask', 0), ('labels', -100)]}

train_data, eval_data = Rows(train_rows), Rows(validation_rows)
Rows(test_rows)  # Validate lengths without using final test targets for checkpoint selection.
print('Training examples:', len(train_data), 'validation examples:', len(eval_data), 'final test examples:', len(test_rows))

def compact(text): return ' '.join(str(text).split())

def assess(raw, row):
    """Structural/source checks only. Human review is required for entailment."""
    issues = []
    try:
        output = json.loads(raw)
        if not isinstance(output, dict): raise ValueError('JSON must be an object')
    except (ValueError, TypeError):
        return {'issues': ['invalid JSON'], 'output': None}
    if output.get('response_type') != row['output']['response_type']: issues.append('response type differs')
    if output.get('supported') is not row['output']['supported']: issues.append('support decision differs')
    claims = output.get('claims')
    if not isinstance(claims, list):
        return {'issues': issues + ['claims must be an array'], 'output': output}
    if output.get('supported'):
        if not claims: issues.append('missing factual claims')
    elif claims:
        issues.append('non-answer contains factual claims')
    docs = {doc['id']: doc for doc in row['documents']}
    cited = set()
    for claim in claims:
        if not isinstance(claim, dict):
            issues.append('claim must be an object'); continue
        doc = docs.get(claim.get('source_id'))
        quote = compact(claim.get('quote', ''))
        if not doc or len(quote) < 20 or quote not in compact(doc['text']): issues.append('invalid source quote')
        else: cited.add(doc['id'])
        if not isinstance(claim.get('text'), str) or not claim['text'].strip(): issues.append('empty factual claim')
    expected_sources = {claim['source_id'] for claim in row['output']['claims']}
    if not expected_sources.issubset(cited): issues.append('missing expected evidence source')
    if output.get('response_type') in ['partial', 'clarify', 'missing', 'out_of_scope', 'refuse'] and not output.get('message'):
        issues.append('missing clarification/gap message')
    return {'issues': sorted(set(issues)), 'output': output}

def evaluate_answers():
    model.eval()
    results = []
    for row in eval_rows:
        inputs = tokenizer(prompt_for(row), return_tensors='pt', add_special_tokens=False).to('cuda')
        with torch.inference_mode():
            ids = model.generate(**inputs, max_new_tokens=512, do_sample=False, pad_token_id=tokenizer.pad_token_id, eos_token_id=tokenizer.eos_token_id, use_cache=True)
        raw = tokenizer.decode(ids[0, inputs['input_ids'].shape[-1]:], skip_special_tokens=True).strip()
        result = {'id': row['id'], 'partition': row['partition'], 'question': row['question'], 'expected': row['output'], 'documents': row['documents'], 'raw': raw, **assess(raw, row)}
        results.append(result)
        print(row['id'], 'PASS' if not result['issues'] else ', '.join(result['issues']))
    return results

def digest_trainable():
    digest = hashlib.sha256()
    for name, parameter in model.named_parameters():
        if parameter.requires_grad:
            digest.update(name.encode())
            digest.update(parameter.detach().float().cpu().contiguous().numpy().tobytes())
    return digest.hexdigest()

print('Evaluating the pretrained baseline on held-out examples...')
with model.disable_adapter():
    baseline = evaluate_answers()
(EXPORT / 'baseline.json').write_text(json.dumps(baseline, ensure_ascii=False, indent=2), encoding='utf-8')
before_digest = digest_trainable()
model.train()
model.config.use_cache = False
args = TrainingArguments(
    output_dir=str(ROOT / 'checkpoints'), num_train_epochs=EPOCHS,
    per_device_train_batch_size=1, per_device_eval_batch_size=1, gradient_accumulation_steps=4,
    learning_rate=1e-4, lr_scheduler_type='cosine', warmup_ratio=0.1,
    fp16=compute_dtype == torch.float16, bf16=compute_dtype == torch.bfloat16,
    gradient_checkpointing=True, gradient_checkpointing_kwargs={'use_reentrant': False},
    optim='paged_adamw_8bit', max_grad_norm=0.3, logging_steps=5,
    eval_strategy='epoch', save_strategy='epoch', save_total_limit=2,
    load_best_model_at_end=True, metric_for_best_model='eval_loss', greater_is_better=False,
    report_to=[], seed=SEED, data_seed=SEED, dataloader_num_workers=0,
)
trainer = Trainer(model=model, args=args, train_dataset=train_data, eval_dataset=eval_data, data_collator=collate)
result = trainer.train()
after_digest = digest_trainable()
if before_digest == after_digest:
    raise RuntimeError('Adapter weights did not change; do not claim this run trained a model.')
model.save_pretrained(EXPORT / 'adapter', safe_serialization=True)
tokenizer.save_pretrained(EXPORT / 'tokenizer')
print('Evaluating the trained adapter on the same held-out examples...')
trained = evaluate_answers()
(EXPORT / 'trained.json').write_text(json.dumps(trained, ensure_ascii=False, indent=2), encoding='utf-8')

def passing(results): return sum(not row['issues'] for row in results)
summary = {
    'model': MODEL, 'revision': REVISION, 'gpu': torch.cuda.get_device_name(),
    'packages': {name: importlib.metadata.version(name) for name in ['torch', 'transformers', 'peft', 'accelerate', 'bitsandbytes']},
    'train_examples': len(train_rows), 'heldout_examples': len(eval_rows), 'epochs': EPOCHS,
    'validation_examples': len(validation_rows), 'final_test_examples': len(test_rows),
    'trainable_parameters': sum(p.numel() for p in model.parameters() if p.requires_grad),
    'adapter_digest_before': before_digest, 'adapter_digest_after': after_digest,
    'training_metrics': result.metrics, 'baseline_structural_pass': passing(baseline), 'trained_structural_pass': passing(trained),
    'final_test_baseline_pass': passing([row for row in baseline if row['partition'] == 'test']),
    'final_test_trained_pass': passing([row for row in trained if row['partition'] == 'test']),
    'note': 'Changed adapter weights prove a fine-tuning run occurred. Structural passes and lower loss do not prove semantic correctness or general ChatGPT-level ability. Human review of every held-out answer is required before deployment.',
    'deployment': 'Experimental local adapter; no automatic change to the public assistant.',
}
(EXPORT / 'summary.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
print(json.dumps(summary, indent=2))

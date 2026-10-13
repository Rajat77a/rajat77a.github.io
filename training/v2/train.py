"""Free-GPU QLoRA candidate. Never automatically publishes a model."""
import hashlib
import json
import os
import time
from pathlib import Path
os.environ['WANDB_DISABLED']='true'
os.environ['HF_HUB_DISABLE_TELEMETRY']='1'
import torch
from transformers import AutoTokenizer,AutoModelForCausalLM,BitsAndBytesConfig,Trainer,TrainingArguments,EarlyStoppingCallback,set_seed
from peft import LoraConfig,get_peft_model,prepare_model_for_kbit_training
from grade import assess,summary

ROOT=Path('/content/rajat-training-v2')
EXPORT=ROOT/'export';EXPORT.mkdir(exist_ok=True)
MODEL='Qwen/Qwen3-4B';REVISION='1cfa9a7208912126459214e8b04321603b3df60c'
MAX_LENGTH=3072;SEED=177
if not torch.cuda.is_available():raise RuntimeError('A free NVIDIA GPU is required. Do not purchase compute.')
if torch.cuda.mem_get_info()[0]<10*1024**3:raise RuntimeError('Less than 10 GiB GPU memory is available. Use a fresh free session.')
set_seed(SEED)
splits={name:[json.loads(line) for line in (ROOT/f'{name}.jsonl').read_text().splitlines() if line] for name in ['train','validation','test','regression']}
print('GPU:',torch.cuda.get_device_name(),'splits:',{name:len(rows) for name,rows in splits.items()})
tokenizer=AutoTokenizer.from_pretrained(MODEL,revision=REVISION,trust_remote_code=False)
tokenizer.pad_token=tokenizer.eos_token;tokenizer.padding_side='right'
def prompt(row):return tokenizer.apply_chat_template([{'role':'user','content':row['prompt']}],tokenize=False,add_generation_prompt=True,enable_thinking=False)
def encode(row):
    prefix=tokenizer(prompt(row),add_special_tokens=False)['input_ids']
    completion=tokenizer(json.dumps(row['output'],ensure_ascii=False),add_special_tokens=False)['input_ids']+[tokenizer.eos_token_id]
    if len(prefix)+len(completion)>MAX_LENGTH:raise ValueError(f"{row['id']}: evidence would be truncated")
    return {'input_ids':prefix+completion,'attention_mask':[1]*(len(prefix)+len(completion)),'labels':[-100]*len(prefix)+completion}
class Rows(torch.utils.data.Dataset):
    def __init__(self,rows):self.rows=[encode(row) for row in rows]
    def __len__(self):return len(self.rows)
    def __getitem__(self,index):return self.rows[index]
datasets={name:Rows(rows) for name,rows in splits.items()}
def collate(batch):
    width=max(len(row['input_ids']) for row in batch)
    return {key:torch.tensor([row[key]+[pad]*(width-len(row[key])) for row in batch]) for key,pad in [('input_ids',tokenizer.pad_token_id),('attention_mask',0),('labels',-100)]}
dtype=torch.bfloat16 if torch.cuda.get_device_capability()[0]>=8 else torch.float16
base=AutoModelForCausalLM.from_pretrained(MODEL,revision=REVISION,trust_remote_code=False,use_safetensors=True,
    quantization_config=BitsAndBytesConfig(load_in_4bit=True,bnb_4bit_quant_type='nf4',bnb_4bit_use_double_quant=True,bnb_4bit_compute_dtype=dtype),
    device_map={'':0},torch_dtype=dtype,attn_implementation='sdpa')
base=prepare_model_for_kbit_training(base,use_gradient_checkpointing=True,gradient_checkpointing_kwargs={'use_reentrant':False})
model=get_peft_model(base,LoraConfig(r=8,lora_alpha=16,lora_dropout=0.1,target_modules='all-linear',bias='none',task_type='CAUSAL_LM'))
model.print_trainable_parameters()
def digest():
    result=hashlib.sha256()
    for name,parameter in model.named_parameters():
        if parameter.requires_grad:result.update(name.encode());result.update(parameter.detach().float().cpu().contiguous().numpy().tobytes())
    return result.hexdigest()
def evaluate(name):
    model.eval();results=[]
    for row in splits[name]:
        inputs=tokenizer(prompt(row),return_tensors='pt',add_special_tokens=False).to('cuda')
        with torch.inference_mode():ids=model.generate(**inputs,max_new_tokens=700,do_sample=False,use_cache=True,pad_token_id=tokenizer.pad_token_id)
        raw=tokenizer.decode(ids[0,inputs['input_ids'].shape[-1]:],skip_special_tokens=True).strip()
        result={'id':row['id'],'family':row['family'],'task':row['task'],'question':row['question'],'critical':row.get('checks',{}).get('critical',False),'raw':raw,'expected':row['output'],'documents':row['documents'],**assess(raw,row)}
        results.append(result);print(name,row['id'],'PASS' if not result['issues'] else result['issues'],flush=True)
    return results
with model.disable_adapter():
    baseline_validation=evaluate('validation')
    baseline_test=evaluate('test')
(EXPORT/'baseline.json').write_text(json.dumps({'validation':baseline_validation,'test':baseline_test},ensure_ascii=False,indent=2))
before=digest();model.train();model.config.use_cache=False
args=TrainingArguments(output_dir=str(ROOT/'checkpoints'),num_train_epochs=2,per_device_train_batch_size=1,per_device_eval_batch_size=1,gradient_accumulation_steps=4,
    learning_rate=3e-5,weight_decay=0.01,lr_scheduler_type='cosine',warmup_ratio=0.1,fp16=dtype==torch.float16,bf16=dtype==torch.bfloat16,
    gradient_checkpointing=True,gradient_checkpointing_kwargs={'use_reentrant':False},optim='paged_adamw_8bit',max_grad_norm=0.3,
    eval_strategy='epoch',save_strategy='epoch',save_total_limit=2,load_best_model_at_end=True,metric_for_best_model='eval_loss',greater_is_better=False,
    logging_steps=5,report_to=[],seed=SEED,data_seed=SEED,dataloader_num_workers=0)
trainer=Trainer(model=model,args=args,train_dataset=datasets['train'],eval_dataset=datasets['validation'],data_collator=collate,callbacks=[EarlyStoppingCallback(early_stopping_patience=1)])
started=time.time();training=trainer.train();after=digest()
if before==after:raise RuntimeError('No changed adapter weights. No training can be claimed.')
model.save_pretrained(EXPORT/'adapter',safe_serialization=True);tokenizer.save_pretrained(EXPORT/'tokenizer')
trained_validation=evaluate('validation');trained_test=evaluate('test');regression=evaluate('regression')
(EXPORT/'trained.json').write_text(json.dumps({'validation':trained_validation,'test':trained_test,'regression':regression},ensure_ascii=False,indent=2))
bv,bt,tv,tt=map(summary,[baseline_validation,baseline_test,trained_validation,trained_test])
gate=tt['rate']>=0.90 and tt['rate']>=bt['rate'] and tv['rate']>=bv['rate'] and tt['critical_failures']==0
report={'model':MODEL,'revision':REVISION,'gpu':torch.cuda.get_device_name(),'training_seconds':round(time.time()-started,1),'train_examples':len(splits['train']),
    'trainable_parameters':sum(p.numel() for p in model.parameters() if p.requires_grad),'adapter_digest_before':before,'adapter_digest_after':after,
    'training_metrics':training.metrics,'baseline_validation':bv,'baseline_test':bt,'trained_validation':tv,'trained_test':tt,'regression':summary(regression),
    'automated_gate_passed':gate,'human_review_complete':False,'deployment_approved':False,
    'note':'90% is a target on these task checks, not universal perfection. A candidate must also pass semantic review and hosting evaluation. The public model is unchanged.'}
(EXPORT/'summary.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2),flush=True)
review=[{'id':r['id'],'question':r['question'],'answer':r['output'],'automatic_issues':r['issues'],'human_correct':None,'review_note':''} for r in trained_test]
(EXPORT/'human-review.json').write_text(json.dumps(review,ensure_ascii=False,indent=2))

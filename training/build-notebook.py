"""Build a self-contained Colab notebook without executing training on this laptop."""
import ast
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
cells = []

def markdown(text):
    cells.append({'cell_type': 'markdown', 'metadata': {}, 'source': text.splitlines(keepends=True)})

def code(text):
    ast.parse(text)
    cells.append({'cell_type': 'code', 'execution_count': None, 'metadata': {}, 'outputs': [], 'source': text.splitlines(keepends=True)})

markdown('''# Rajat’s assistant — free Qwen3 4B QLoRA experiment

This notebook performs **actual adapter-weight training** on the pretrained
Qwen3 4B model. It teaches source-grounded answers, clarification, partial answers,
missing-information explanations, and corrections of false premises.

It uses the **free Colab GPU tier**, with no API keys, purchases, subscriptions,
paid APIs, tracking account, or model uploads. GPU availability is not guaranteed.
If Colab offers no free GPU, stop and try later; never upgrade to run this notebook.

**Before running:** open Runtime → Change runtime type → choose T4 GPU on the free
tier. Then Runtime → Run all. Use a fresh session. The notebook downloads pretrained
weights onto Colab, evaluates them, trains LoRA adapters, repeats evaluation, and
downloads a results ZIP. Keep that ZIP before closing the session.

This is a small supervised fine-tuning experiment. It does not create a foundation
model, increase the base model’s parameter count, guarantee better answers, or
provide permanent hosting. The public portfolio keeps using its existing hosted
model until a trained model passes review and its hosting is resolved.

[Free Colab limits](https://research.google.com/colaboratory/faq.html) ·
[Qwen3 4B](https://huggingface.co/Qwen/Qwen3-4B) ·
[QLoRA with PEFT](https://huggingface.co/docs/peft/en/developer_guides/quantization)
''')

code('''import sys
import torch
if not torch.cuda.is_available():
    raise RuntimeError("Choose a free T4 GPU using Runtime > Change runtime type. If no free GPU is available, try later; do not buy compute.")
print("Free-session GPU:", torch.cuda.get_device_name())
''')

markdown('''## Install the pinned training libraries

The existing GPU-enabled PyTorch installation is retained. No remote custom model
code is enabled. This cell installs packages into this temporary Colab session.
''')
code('''import subprocess
subprocess.check_call([sys.executable, "-m", "pip", "install", "--quiet",
    "transformers==4.57.6", "peft==0.18.1", "accelerate==1.12.0", "bitsandbytes==0.49.2"])
''')

manifest = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
markdown(f'''## Materialize the reviewed starter dataset

The dataset is embedded in this notebook: **{manifest['train']} training examples**
and **{manifest['eval']} held-out examples** ({manifest['validation']} for checkpoint
validation and {manifest['test']} for the final test). It contains hand-authored synthetic
conversations using public resume and project passages. It contains no private
documents, keys, passwords, or real visitor chats.

Held-out examples use five document IDs absent from all training prompts.
Question and family identities are also split. The dataset builder checks exact
quotes against the current public index and runs factual claims through the
existing validator. This remains a modest starter dataset, not a large general
conversation corpus. Adding repetitive examples is not the same as improving it.

Labels use structured JSON so an application can distinguish answering,
clarifying, declining, and partially answering. The visitor-facing wording is in
the claims and message fields; they are not meant to see raw JSON.
''')

payload = {name: (ROOT / name).read_text(encoding='utf-8') for name in ['train.jsonl', 'eval.jsonl', 'manifest.json', 'instruction.txt', 'colab_train.py']}
code('''from pathlib import Path
import json
root = Path("/content/rajat-training")
root.mkdir(parents=True, exist_ok=True)
payload = json.loads(''' + repr(json.dumps(payload, ensure_ascii=False)) + ''')
for name, text in payload.items():
    (root / name).write_text(text, encoding="utf-8")
print(json.loads(payload["manifest.json"]))
''')

markdown('''## Baseline → weight training → evaluation

The run uses 4-bit NF4 base weights, rank-16 LoRA adapters, batch size 1,
gradient accumulation 4, a 1,024-token limit, and two epochs. Only completion
tokens are trained; prompt/context tokens are masked. Examples that would lose
evidence to truncation stop the run instead of silently training damaged data.

The best checkpoint is selected using only the validation partition's loss.
Final test answers never enter training or checkpoint selection. A generation
comparison records response type, support decision, citations, and exact quotes.
The run records adapter hashes before and after training to verify that weights
changed. Structural scores and lower loss do not establish semantic correctness.
Read every held-out answer before using the trained model.

Checkpoints and outputs live on the temporary runtime disk. A session interruption
can lose them. This notebook makes no paid calls and does not bypass Colab limits.
''')
code('''import runpy
runpy.run_path(str(root / "colab_train.py"), run_name="__main__")
''')

markdown('''## Download the adapter and evidence of the run

The ZIP includes the adapter, tokenizer, baseline/trained answers, package versions,
parameter counts, training metrics, and changed-weight hashes. A LoRA adapter must
be loaded with the exact base model and revision it was trained on.

The export is not automatically deployed and does not directly replace the
current Groq model. This notebook does not perform a model conversion for Ollama.
After we review the results, we can select a supported local loading/conversion
path. Free Colab is used for this training experiment, not public chatbot hosting.
''')
code('''import shutil
from google.colab import files
export = root / "export"
summary = json.loads((export / "summary.json").read_text())
assert summary["adapter_digest_before"] != summary["adapter_digest_after"], "No changed weights recorded"
shutil.copy2(root / "manifest.json", export / "dataset-manifest.json")
shutil.copy2(root / "instruction.txt", export / "instruction.txt")
shutil.copy2(root / "colab_train.py", export / "training-script.py")
archive = shutil.make_archive("/content/rajat-assistant-qlora-results", "zip", export)
print("Baseline structural passes:", summary["baseline_structural_pass"])
print("Trained structural passes:", summary["trained_structural_pass"])
print("Review the actual answers in baseline.json and trained.json; a larger score is not a correctness guarantee.")
files.download(archive)
''')

notebook = {
    'nbformat': 4, 'nbformat_minor': 5,
    'metadata': {'colab': {'name': 'Rajat_Assistant_QLoRA.ipynb'}, 'accelerator': 'GPU', 'kernelspec': {'display_name': 'Python 3', 'language': 'python', 'name': 'python3'}, 'language_info': {'name': 'python'}},
    'cells': cells,
}
for number, cell in enumerate(cells):
    cell['id'] = f'rajat-cell-{number}'
path = ROOT / 'Rajat_Assistant_QLoRA.ipynb'
path.write_text(json.dumps(notebook, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Created {path.name}: {len(cells)} cells, all code cells syntax checked. GPU training has not run.')

import ast
import json
from pathlib import Path
root=Path(__file__).resolve().parent
cells=[]
def md(text):cells.append({'cell_type':'markdown','metadata':{},'source':text.splitlines(True)})
def code(text):
    ast.parse(text)
    cells.append({'cell_type':'code','metadata':{},'execution_count':None,'outputs':[],'source':text.splitlines(True)})
manifest=json.loads((root/'manifest.json').read_text())
md(f'''# Rajat Assistant V2 — measured fine-tuning

Target: **90%+ on defined task checks**, with separate semantic review. This is
not a promise of universal accuracy. Public GPT-OSS 20B hosting is unchanged.

Dataset: {manifest['counts']}. Training examples and validation/test families are
separate. The 16 exposed V1 tests are regression-only. Some source passages were
used in earlier evaluation; this is a fresh-question benchmark, not a claim of
complete independence from all prior development.

Training uses Qwen3 4B, 4-bit NF4, rank-8 LoRA, a lower learning rate (3e-5),
completion-only loss, validation checkpoints and early stopping. It preserves
the base model's parameter count. The 20B hosted model is not fine-tuned here.

Use **free T4 GPU** in Runtime → Change runtime type, then Run all.
No API key, subscription, purchase, paid inference, tracking service or upload
of model weights is required. Stop if a free GPU is unavailable. There is no
Google Drive mounting and no automatic publication of the resulting adapter.

The run evaluates the base, trains a candidate, evaluates it, and exports results.
The final test cannot choose checkpoints. If the candidate regresses or misses
the target, it is rejected rather than silently lowering the benchmark.
''')
code('''import torch
if not torch.cuda.is_available():
    raise RuntimeError("Choose a free T4 GPU. If unavailable, try later; do not purchase compute.")
print(torch.cuda.get_device_name())
''')
md('## Install pinned libraries in this temporary free runtime')
code('''import subprocess, sys
subprocess.check_call([sys.executable,"-m","pip","install","--quiet",
    "transformers==4.57.6","peft==0.18.1","accelerate==1.12.0","bitsandbytes==0.49.2"])
''')
payload={name:(root/name).read_text(encoding='utf-8') for name in ['train.jsonl','validation.jsonl','test.jsonl','regression.jsonl','manifest.json','train.py','grade.py']}
code('''import json
from pathlib import Path
root=Path("/content/rajat-training-v2")
root.mkdir(exist_ok=True)
payload=json.loads('''+repr(json.dumps(payload,ensure_ascii=False))+''')
for name,text in payload.items(): (root/name).write_text(text,encoding="utf-8")
print(json.loads(payload["manifest.json"]))
''')
md('## Baseline → candidate training → frozen evaluation\n\nRead progress below. Training loss is not the quality score. The candidate is never auto-deployed.')
code('''import runpy, sys
sys.path.insert(0,str(root))
runpy.run_path(str(root/"train.py"),run_name="__main__")
''')
md('## Export and review\n\nKeep the ZIP before the temporary session ends. The report includes both model scores, changed-weight hashes and blank human-review fields. An automated score alone cannot approve deployment.')
code('''import shutil
from google.colab import files
export=root/"export"
report=json.loads((export/"summary.json").read_text())
assert report["adapter_digest_before"]!=report["adapter_digest_after"]
for name in ["manifest.json","train.py","grade.py"]: shutil.copy2(root/name,export/name)
archive=shutil.make_archive("/content/rajat-assistant-v2-results","zip",export)
print(json.dumps(report,indent=2))
print("Archive:",archive)
files.download(archive)
''')
notebook={'cells':cells,'metadata':{'colab':{'name':'Rajat_Assistant_V2.ipynb'},'accelerator':'GPU','kernelspec':{'display_name':'Python 3','name':'python3'},'language_info':{'name':'python'}},'nbformat':4,'nbformat_minor':5}
(root/'Rajat_Assistant_V2.ipynb').write_text(json.dumps(notebook,ensure_ascii=False,indent=1),encoding='utf-8')
print('Built V2 notebook:',len(cells),'cells')

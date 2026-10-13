# V2 candidate, not a deployed model

The goal is at least 90% on a frozen task benchmark, without regressions or
critical uncited-owner failures. Human semantic review is a separate release
requirement. Automated checks alone do not establish factual correctness.

V1's independent structural result fell from 11/16 to 9/16 after training. V2
therefore starts from the pretrained base again, aligns targets with the current
runtime JSON schemas, adds general conversation examples, and lowers LoRA rank
and learning rate. V1 adapter weights are not used.

The data is synthetic and hand-authored from public evidence and ordinary
concept examples. It contains no real visitor conversations or private files.
V1 exposed tests are regression-only. Final-question families are excluded from
training; the source provenance limitation is recorded in the manifest.

Rebuild: `node training/v2/build-data.mjs`, then run `build-notebook.py` with Python.
Open the notebook in free Colab, select a T4, run all, and keep the exported ZIP.
Do not upgrade if a free GPU is unavailable. The model runs on the GPU session;
the laptop remains the preparation, testing and local-inference device.

The final test is evaluated before and after training, but cannot select a
checkpoint or hyperparameter. Only validation guides checkpoint selection.
Changing the candidate after inspecting final results requires a new test set.

The hosted portfolio model is GPT-OSS 20B; a Qwen3 adapter cannot be attached to
it. Deploying this candidate would require its matching Qwen3 base and a suitable
inference host. Passing this benchmark does not solve permanent free hosting.

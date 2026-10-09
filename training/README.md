# Rajat's assistant: a free 4B fine-tuning experiment

[Open the notebook in Colab](https://colab.research.google.com/github/Rajat77a/rajat77a.github.io/blob/main/training/Rajat_Assistant_QLoRA.ipynb)

**Status: prepared, not GPU-trained.** This package performs actual QLoRA adapter
training when you run it on a free NVIDIA GPU session. It does not claim that
generating examples or passing the existing website tests trained model weights.

1. Open the notebook and sign into your own Google account if needed.
2. Select **Runtime → Change runtime type → T4 GPU**, using the free tier. If no
   free GPU is available, try later. Do not purchase compute or upgrade a plan.
3. Select **Runtime → Run all**. Keep the downloaded results ZIP before the
   temporary session ends. Review the baseline and trained answers inside it.

The notebook is self-contained: dataset and training script are embedded. It
downloads an ungated Apache-2.0 pretrained model and pinned training libraries.
No API keys, Drive access, model uploads or tracking accounts are needed.
It uses the session's GPU-enabled PyTorch and refuses to run training on a CPU.

## What is trained

The base is **Qwen/Qwen3-4B**, pinned to revision
`1cfa9a7208912126459214e8b04321603b3df60c`. Its pretrained parameters are loaded
in 4-bit NF4 with double quantization. Rank-16 LoRA adapters train with batch size
1, gradient accumulation 4, a 1,024-token limit and two epochs. Context tokens are
masked; only response tokens receive training labels.

The **115 hand-authored synthetic examples** use public resume and project
passages. They teach source-backed answers, specific clarification, partial
answers, different missing-information explanations, and corrections of false
premises. They include forged achievements, invented metrics, ambiguous follow-ups
and earlier assistant messages containing false information. The training targets
do not name the competition team.

**10 validation examples** select the checkpoint by validation loss. **16 final
test examples** never enter training loss or checkpoint selection. Source IDs and
question families are disjoint across all three partitions. Final test scores
should not be repeatedly optimized against: future iterations need fresh tests.
This small starter dataset cannot establish broad conversational competence.

Before/after generation uses identical held-out questions and deterministic
decoding. The exported summary records actual trainable parameter counts, package
versions, training metrics and adapter-weight hashes. Changed hashes establish
that a training run changed weights. Structural checks cover JSON, response
category, evidence sources and exact quotes; **they do not prove that a claim
logically follows from its quote**. Review every final test answer manually.

## Export and website integration

The ZIP contains `adapter/`, `tokenizer/`, `baseline.json`, `trained.json`,
`summary.json`, the instruction, dataset manifest and training script. Keep the
adapter with the exact base model/revision. The notebook does not convert it for
Ollama or automatically deploy it.

The live portfolio continues using its existing hosted 20B model with RAG. This
experimental 4B model is smaller; fine-tuning may improve portfolio behaviour,
but more epochs do not add parameters or guarantee better answers. Before public
integration, we must review quality, confirm a compatible inference runtime and
hosting, and update the backend to handle the new `response_type` and `message`
fields. Its current parser does not implement all these response behaviours.

There are no paid calls in this notebook. Free Colab resources are limited and
not guaranteed, and Colab is not used as permanent public chatbot hosting.
Guaranteed always-on hosting of custom weights at zero cost is not promised.

## Rebuild and verify

From the repository root, run `node training/build-data.mjs`, then
`python training/build-notebook.py` using Python 3. Run `npm test` to check source
integrity, split isolation and the website regressions. Optionally run
`node training/check-token-length.mjs` to download only the pinned model's tokenizer
and check sequence lengths; Colab repeats this check with its Python tokenizer.
The local checks do not execute GPU training.

References: [Qwen3 4B](https://huggingface.co/Qwen/Qwen3-4B),
[PEFT quantized training](https://huggingface.co/docs/peft/en/developer_guides/quantization),
[Colab resource limits](https://research.google.com/colaboratory/faq.html).

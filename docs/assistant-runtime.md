# Assistant runtime

The public assistant uses the existing Groq-hosted GPT-OSS 20B model. The owner's
laptop is not the public server. No paid services or subscriptions were added.
Free service quotas can temporarily limit general replies.

Explicit owner/project questions and personal follow-ups use retrieval and quote
validation. Other messages use a model decision: general answer, clarification,
or portfolio lookup. General answers are labelled and are not verified personal
facts. The general route has no browsing or code execution. Neither routing nor
quote validation guarantees zero hallucinations.

Conversation context is bounded to 12 messages, each at most 1,400 characters;
input messages can be up to 3,000 characters. New chat clears the frontend history.
There is no persistent server-side personal memory and chats do not retrain weights.

## Local laptop mode

Verified hardware: Intel i7-1255U, 16 GB system RAM, Intel Iris Xe. Ollama already
has qwen3:4b (2.5 GB). Use this quantized model as the responsive local baseline;
larger models may trade response speed and available RAM for quality.

PowerShell, from the repository:

```powershell
$env:AI_PROVIDER = 'ollama'
$env:OLLAMA_MODEL = 'qwen3:4b'
$env:OLLAMA_TIMEOUT_MS = '120000'
node scripts/serve-rag.mjs
```

Open http://127.0.0.1:4173/#ask-ai. The preview points requests to localhost and
allows a longer request timeout for CPU inference. Ollama uses 8,192 context
tokens and a bounded output budget. This does not alter the public deployment.
Do not expose Ollama's localhost API publicly.

The experimental Qwen3 4B fine-tuning adapter is not active: it scored below the
base model in the earlier held-out evaluation. This upgrade changes inference
and application behavior, not the parameter count or training data.

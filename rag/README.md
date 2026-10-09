# Document assistant

This is retrieval-augmented generation (RAG), not fine-tuning. The model's weights
are unchanged. Public documents are extracted, split into passages, retrieved
for each question, and supplied as evidence before generation.

## Architecture

Resume PDF + project READMEs + public owner statements → section-aware passages
→ MiniLM semantic search + BM25 with aliases/topic filters → hosted model → claim
and quotation checks → answer with expandable source quotes.

The backend runs a pinned, quantized all-MiniLM-L6-v2 embedding model through
Transformers.js and ONNX Runtime. Document vectors are prepared at build time;
visitor queries are embedded on the hosted backend. Semantic similarity boosts
the existing lexical ranking within source/topic boundaries. Strong semantic
matches can discover passages for previously unrecognized wording. Explicit
privacy, unknown-tool, employer and ambiguity guards remain authoritative.
This weighted ranking is not a separately trained cross-encoder reranker.

There is no vector database, paid embedding API, new account, or laptop dependency.
With 36 passages, vectors fit in a small JSON file. The backend keeps at most
128 query score entries in memory. It refuses stale indexes and falls back to
lexical retrieval if the embedding runtime is unavailable. The browser's outage
fallback remains lexical, avoiding a model download on visitors' devices.

## Sources and precedence

- `assets/docs/Rajat_Krishnan_Resume.pdf` is the source for personal history,
  education, dates, certifications, skills, and achievements.
- Six public project READMEs in `sources/` support project descriptions and
  current stacks. The README for PrepPeer currently says Next.js 15.
- Public portfolio statements support current year and availability. The index
  does not infer a semester, birth date, private facts, or employment from a badge.
- Setup commands, environment configuration, roadmap, and future-plan sections
  are excluded from retrieval. Sources are data, never executable instructions.
- Source hashes and README blob SHAs are retained with passages. Links open the
  public source; README links may show newer content after an upstream update.
- README claims are author descriptions, not independent proof that features,
  real users, security controls, or performance were verified.

Only public documents belong here. GitHub Pages also exposes this repository's
static files; do not add private HR, client, identity, or credential documents.

## Update the evidence

1. Replace the public resume PDF if it changes.
2. Run `python scripts/extract-resume.py` (requires `pypdf`).
3. Run `node scripts/refresh-sources.mjs` (uses the existing authenticated `gh`).
4. Run `node scripts/build-rag.mjs`.
5. Run `npm run rag:prepare` to download the pinned embedding model and rebuild vectors.
6. Run `npm test`, review index changes, then deploy.

Vercel runs `rag:prepare` during each build and includes the model in the backend
function. Model weights in `rag/models/` are ignored by Git; do not commit them.
Dependencies and the source-model revision are pinned. Cold starts still cost
time, and generation continues to use the existing hosted provider's quota.

The generated `index.js` is used by both Vercel and the browser's outage fallback.
It must be rebuilt after changing a source. This is not live crawling.

## Answer policy and limits

Each generated claim must cite a retrieved passage and quote text found in that
passage. Unknown source IDs, invented quotes, unsupported numbers, and certain
unsupported formal claims/tool names are rejected. A failed model call or failed
validation returns source excerpts instead of the former canned profile guesses.
Missing evidence returns an explicit abstention. Previous assistant messages are
not factual evidence. Ambiguous project follow-ups must be clarified.

Exact quotation checks do **not** prove logical entailment of every paraphrase.
RAG reduces hallucinations; it does not guarantee perfect correctness. Keep
testing real visitor questions and review misleading paraphrases and false
abstentions. The initial regression suite checks retrieval, abstention, source
validation, follow-ups, API behavior and outage handling; it does not certify
every possible live model response.

## Optional Ollama testing

Install the local test model with `ollama pull qwen3:4b`. Once installed, set
`AI_PROVIDER=ollama` and `OLLAMA_MODEL` to its installed name, then run
`node scripts/serve-rag.mjs`. The local preview rewrites the endpoint to its own
API. It uses the same retrieval and quotation checks as production.
On Windows, `powershell -ExecutionPolicy Bypass -File scripts/run-local-ai.ps1`
starts this local test configuration at `http://127.0.0.1:4173/#ask-ai`.

The Ollama path is local-only and is not used by the public Vercel deployment.
Its default generation deadline is 60 seconds, configurable with
`OLLAMA_TIMEOUT_MS` (7–120 seconds). Larger models or cold starts can still return
excerpts. This model installation does not fine-tune its weights. Embeddings
use the same MiniLM model locally and online; Ollama is optional for generation.

## Repeatable question evaluation

`tests/questions.mjs` contains 233 questions reviewed against the source documents:
profile, employment, skills, credentials, six projects, unsupported requests,
follow-ups with poisoned assistant history, and every pair of project comparisons.
These are evaluation cases, not model weight training examples.

Run `npm test` for regression checks and `npm run rag:eval -- --output report.json`
for a retrieval report. To test the actual hosted model, use
`npm run rag:eval -- --live --output live-report.json`; `--limit N` limits requests.
The live runner makes sequential requests and records answers, quotes, latency,
and structural flags. Review the answers manually: valid quotes alone do not
prove that every sentence follows from them. Live runs consume the existing
provider's quota; rate limits and model outages are not retrieval failures.
Add `--hybrid` to evaluate the actual semantic-plus-lexical backend retrieval.
Run `node scripts/check-semantic.mjs` for project-name-free paraphrase checks.

Additional adversarial cases live in `tests/hallucination-cases.mjs` (104 cases)
and `tests/claim-traps.test.mjs` (18 misleading paraphrases and three supported
controls). Run `node scripts/evaluate-rag.mjs --hallucinations --live --output
hallucinations.json` to evaluate the hosted assistant; `--ids h1,h53,h98` selects
cases. Invented premises are test inputs only and are never indexed as evidence.
The regression suite requires unsupported cases to abstain before calling a
model, so model outages cannot turn them into loosely related profile excerpts.
Known missing facts/tools and quote contradictions are guarded; this remains
heuristic validation rather than a general semantic entailment proof.

`tests/semantic-traps.test.mjs` adds quantity/unit, clause-negation, assistant
identity, and completed-versus-current employment controls. `--mixed` selects
24 fresh conversational questions for live evaluation and human review. Guarded
employment dates use the document's month range and the server's current date;
ongoing roles explicitly marked Present remain eligible for current-role answers.

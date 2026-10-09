# Document assistant

This is retrieval-augmented generation (RAG), not fine-tuning. The model's weights
are unchanged. Public documents are extracted, split into passages, retrieved
for each question, and supplied as evidence before generation.

## Architecture

Resume PDF + project READMEs + public owner statements → section-aware passages
→ local BM25 lexical retrieval with aliases/topic filters → hosted model → claim
and quotation checks → answer with expandable source quotes.

There is no vector database, embedding API, new account, or laptop dependency.
BM25 is lexical retrieval, not semantic vector search. This is a small-corpus
baseline; retrieval and wording should be evaluated before adding more sources.

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
5. Run `node --test tests/rag.test.mjs`, review index changes, then deploy.

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

The installed Ollama currently has no downloaded model. No model was downloaded
or training job started. Once a suitable local chat model is installed, set
`AI_PROVIDER=ollama` and `OLLAMA_MODEL` to its installed name, then run
`node scripts/serve-rag.mjs`. The local preview rewrites the endpoint to its own
API. It uses the same retrieval and quotation checks as production.

The Ollama path is local-only and is not used by the public Vercel deployment.
Its current 7-second generation deadline is meant for small, warm models;
larger models or cold starts may return excerpts instead. Vector embeddings are
a possible later improvement, but deploying semantic query embeddings would
require an always-on embedding runtime or an external embedding provider.

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

Additional adversarial cases live in `tests/hallucination-cases.mjs` (104 cases)
and `tests/claim-traps.test.mjs` (18 misleading paraphrases and three supported
controls). Run `node scripts/evaluate-rag.mjs --hallucinations --live --output
hallucinations.json` to evaluate the hosted assistant; `--ids h1,h53,h98` selects
cases. Invented premises are test inputs only and are never indexed as evidence.
The regression suite requires unsupported cases to abstain before calling a
model, so model outages cannot turn them into loosely related profile excerpts.
Known missing facts/tools and quote contradictions are guarded; this remains
heuristic validation rather than a general semantic entailment proof.

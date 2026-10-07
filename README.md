# Rajat Krishnan Portfolio

Static portfolio website for GitHub Pages at `https://rajat77a.github.io`.

## Rajat Intelligence

The portfolio includes Rajat Intelligence, a real AI assistant designed to run
through a Vercel serverless backend at `api/chat.js`.

The backend retrieves passages from the public resume and project documentation,
then asks the model to answer with supporting quotations. Answers show source
links and expandable evidence. On a model outage or invalid citations it returns
document excerpts, never uncited profile guesses. See [the RAG guide](rag/README.md)
for source ingestion, limitations, tests, and optional local Ollama testing.

### Vercel AI setup

1. Import this GitHub repository into Vercel.
2. Create a free GroqCloud API key.
3. Add these Vercel environment variables:
   - `AI_PROVIDER=groq`
   - `GROQ_API_KEY`
   - `GROQ_MODEL=openai/gpt-oss-20b`
   - `ALLOWED_ORIGINS=https://rajat77a.github.io,http://localhost:4173,http://127.0.0.1:4173`
4. Deploy the Vercel project.
5. If the portfolio stays on GitHub Pages, copy the Vercel function URL and set
   `ai.endpoint` in `knowledge.js` to:

```js
"https://your-vercel-project.vercel.app/api/chat"
```

If the whole portfolio is hosted on Vercel, leave `ai.endpoint` empty. The site
will call `/api/chat` automatically.

OpenAI is still supported only as an optional paid fallback by setting
`AI_PROVIDER=openai` and adding `OPENAI_API_KEY`.

## Deploy

Push the contents of this repository to the GitHub Pages repository or branch
that serves `rajat77a.github.io`.

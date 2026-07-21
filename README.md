# Rajat Krishnan Portfolio

Static portfolio website for GitHub Pages at `https://rajat77a.github.io`.

## Rajat Intelligence

The portfolio includes Rajat Intelligence, a real AI assistant designed to run
through a Vercel serverless backend at `api/chat.js`.

The backend sends Rajat's approved profile knowledge to the model and instructs
it to answer naturally, stay short, avoid hallucinated claims, and redirect
unrelated questions. If the backend is not configured yet, the frontend falls
back to the local verified assistant powered by `knowledge.js`.

### Vercel AI setup

1. Import this GitHub repository into Vercel.
2. Add these Vercel environment variables:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` set to `gpt-4.1-mini` unless you choose another available model.
   - `ALLOWED_ORIGINS` set to `https://rajat77a.github.io,http://localhost:4173,http://127.0.0.1:4173`
3. Deploy the Vercel project.
4. If the portfolio stays on GitHub Pages, copy the Vercel function URL and set
   `ai.endpoint` in `knowledge.js` to:

```js
"https://your-vercel-project.vercel.app/api/chat"
```

If the whole portfolio is hosted on Vercel, leave `ai.endpoint` empty. The site
will call `/api/chat` automatically.

## Deploy

Push the contents of this repository to the GitHub Pages repository or branch
that serves `rajat77a.github.io`.

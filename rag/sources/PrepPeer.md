# PrepPeer

AI mock interviews with real peer ranking, powered by Next.js 15, Supabase, and Groq.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Fill the values in `.env.local` before testing authenticated flows or AI interview generation. The key variables are documented in `.env.example`.

Generate a dedicated interview-encryption secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Set that output as `INTERVIEW_PROOF_SECRET` locally and in the production
environment. It must be at least 32 characters. When it is absent, PrepPeer
derives a domain-separated migration key from existing server-only key material
so deployments remain available, but a dedicated secret is preferred. Changing
the root secret invalidates interviews that are currently open.

## Deploy

Optimized for [Vercel](https://vercel.com): import this repo, add the environment variables from `.env.example`, and deploy.

## Stack

- Next.js 15 (App Router)
- TypeScript, Tailwind CSS
- Supabase
- Groq
- Framer Motion, Lenis, Recharts, Lucide

## License

This project is licensed under the MIT License — see the LICENSE file for details.

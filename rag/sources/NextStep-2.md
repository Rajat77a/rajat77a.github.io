# NextStep·AI

> **Turn any school report card into a clear, actionable guide for parents.**

NextStep·AI is an EdTech web app that lets parents upload a child's report card (JPG, PNG, or PDF), runs OCR to extract the text, sends it to an AI model for structured analysis, and returns:

- 🟢 / 🟡 / 🔴 subject-level flag scores
- A plain-English **Clarity Check** summary
- A personalised **Tonight's Conversation** script
- Ready-made **Teacher Questions**
- A **30-Day Home Support Plan**
- A **Progress Tracker** to mark habits complete

Teachers and school admins get their own portals with class-level pattern views.

---

## Live Demo

> Deployed on Vercel — link coming soon.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Routing | React Router v6 |
| Styling | Tailwind CSS v3 |
| Animation | Framer Motion |
| Icons | Lucide React |
| AI / OCR | Google Gemini + Tesseract.js |
| Storage | LocalStorage (MVP) |
| Deploy | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
git clone https://github.com/Rajat77a/NextStep-2.git
cd NextStep-2
npm install
```

### Environment Variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_ANTHROPIC_API_KEY` | Claude API key from console.anthropic.com |

### Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Project Structure

```
src/
├── api/          # Data layer (localStorage) + AI analysis calls
├── components/
│   ├── shared/   # PortalNav, FlagBadge, ScrollReveal
│   └── ui/       # Reusable UI primitives
├── hooks/        # useAuth
├── lib/          # reportOcr — Tesseract wrapper
├── pages/
│   ├── parent/   # UploadReport, ClarityCheck, ConversationGuide …
│   ├── teacher/  # TeacherDashboard, TeacherClasses, ClassPatterns
│   └── admin/    # AdminDashboard, ClassManagement, StudentRoster …
└── types/        # Shared TypeScript interfaces
```

---

## User Roles

| Role | Access |
|---|---|
| **Parent** | Upload reports, view Clarity Check, conversation guide, 30-day plan |
| **Teacher** | View class-level patterns and student flag summaries |
| **Admin** | Manage classes, students, teachers, and subscriptions |

---

## Docs

All detailed documentation lives in [`/docs`](./docs/).

| Document | Description |
|---|---|
| [Product Overview](./docs/product-overview.md) | Vision and feature summary |
| [Report Card Flow](./docs/report-card-flow.md) | OCR → AI → storage pipeline |
| [Data Model](./docs/data-model.md) | Entity definitions and relationships |
| [Routing](./docs/routing.md) | URL structure for all three portals |
| [Roadmap](./docs/roadmap.md) | Planned features and milestones |
| [Troubleshooting](./docs/troubleshooting.md) | Common issues and fixes |
| [Vercel Deployment](./docs/vercel-deployment.md) | How to deploy |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for commit conventions and PR guidelines.

---

## License

MIT © 2026 Rajat Krishnan



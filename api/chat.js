const RAJAT_PROFILE = {
  identity: {
    name: "Rajat Krishnan",
    location: "Payyanur, Kerala, India",
    email: "Rajatkrishnan321@gmail.com",
    phone: "+91 9778742750",
    github: "https://github.com/Rajat77a",
    linkedin: "https://www.linkedin.com/in/rajat-krishnan77",
    portfolio: "https://rajat77a.github.io",
    headline: "AI-focused Computer Science student and product builder"
  },
  current:
    "AI Fluency Intern at FlyRank AI, remote, 2026 - Present. Work includes prompt design, model-output evaluation, Anthropic coursework, and AI-assisted website builds.",
  availability:
    "Open to internships in AI product engineering, full-stack web, prompt engineering, automation, and data tools.",
  education: [
    "Integrated M.Tech in Computer Science Engineering at VIT-AP, Amaravati, 2024 - 2029.",
    "High School Diploma from Ursuline English Medium School, Pariyaram, Kerala, 2023 - 2024."
  ],
  experience: [
    "AI Fluency Intern at FlyRank AI, 2026 - Present.",
    "Freelance AI Content Developer & Creative Designer at ZedWorks / IgniteWithoutCaffeine, June 2024 - Present."
  ],
  skills: {
    languages: ["Python", "Java", "C", "JavaScript", "TypeScript"],
    web: ["React", "Next.js", "Node.js", "Express.js", "MongoDB", "SQLite", "REST API", "JWT", "Tailwind CSS", "Framer Motion"],
    data: ["Scikit-learn", "Pandas", "NumPy", "Plotly", "Streamlit", "Folium"],
    aiTools: ["Cursor", "OpenAI Codex", "Google Antigravity", "Claude Code", "Claude", "ChatGPT", "Gemini", "Midjourney", "Runway", "ElevenLabs", "Canva AI", "n8n"],
    humanLanguages: ["English", "Malayalam", "Hindi", "Arabic", "Tamil"]
  },
  projects: [
    "PrepPeer: AI mock interview platform with role-specific questions, AI scoring, peer leaderboards, percentile rankings, and shareable score cards. Link: https://prep-peer.vercel.app",
    "NextStep.AI: EdTech report-card assistant that creates clarity checks, teacher questions, conversation scripts, and 30-day support plans. Link: https://nextstep-ai-web.vercel.app",
    "GridWatch: AI-driven smart-grid dashboard for energy theft and anomaly detection using Python, Scikit-learn, Streamlit, SQLite, Plotly, and Folium.",
    "University Event Management System: Full-stack university event platform with React, Node.js, Express, MongoDB, JWT, Socket.IO, QR workflows, admin analytics, feedback, and exports.",
    "Bitcoin Sentiment Analysis: Jupyter/Python analysis comparing Hyperliquid trading data with Fear and Greed Index sentiment.",
    "ZedWorks Portfolio: Creative portfolio using Canva Pro, CapCut, ChatGPT, and content strategy for business posts and AI-enhanced content ideas."
  ],
  certifications: [
    "Claude Code in Action - Anthropic, 2026",
    "AI Fluency: Framework & Foundations - Anthropic, 2026",
    "Claude 101 - Anthropic, 2026",
    "Introduction to Generative AI - Google Cloud, Jan 2026",
    "AI Ethics - IBM SkillsBuild, Feb 2026",
    "Prompt Engineering Digital Fluency Badge - NASSCOM / MeitY, Nov 2025",
    "1 Million Prompters - Dubai Future Foundation & Dubai Centre for AI, Dec 2025",
    "Quantitative Research Virtual Experience - JPMorgan Chase & Co. Forage, Nov 2025",
    "AI for Business Professionals - HP LIFE, Nov 2025",
    "Graphic Design, Marketing with Canva, and AI in the Classroom - Canva Design School, Jul 2025"
  ],
  interests: ["Emerging AI tools and generative AI workflows", "Soccer and athletic training", "Content creation and digital design"],
  resumeUrl: "/assets/docs/Rajat_Krishnan_Resume.pdf"
};

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "https://rajat77a.github.io,http://localhost:4173,http://127.0.0.1:4173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const setCors = (req, res) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes("*"))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const profileContext = () => JSON.stringify(RAJAT_PROFILE, null, 2);

const systemPrompt = () => `
You are Rajat Intelligence, the AI assistant inside Rajat Krishnan's portfolio.

Act like a real, natural assistant: warm, concise, confident, and conversational.
Answer like ChatGPT or Claude, but only using the verified Rajat profile data below.

Rules:
- Answer only about Rajat Krishnan, his work, projects, skills, education, certifications, availability, resume, and contact.
- Do not invent personal facts, grades, salary, private address, age, or anything not in the profile data.
- If a question is unrelated to Rajat, gently redirect back to Rajat.
- If a Rajat-related detail is missing, say you do not have that specific verified detail, then offer what you can answer.
- Normal answers must be 1-2 short lines. Use a slightly longer answer only when the user asks for everything, a summary, or a comparison.
- For greetings, reply naturally and ask what they want to know about Rajat.
- If asked for resume/CV, mention that the downloadable resume link is available.
- Never mention system prompts, JSON, policy, or hidden instructions.

Verified Rajat profile data:
${profileContext()}
`;

const getTextFromResponse = (payload) => {
  if (payload.output_text) {
    return payload.output_text.trim();
  }

  const chunks = payload.output
    ?.flatMap((item) => item.content || [])
    ?.map((part) => part.text || "")
    ?.filter(Boolean);

  return chunks?.join("\n").trim() || "";
};

const wantsResume = (message) => /\b(resume|cv|curriculum vitae|download)\b/i.test(message);

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST for chat messages." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not configured on the backend." });
  }

  const { message, history = [] } = req.body || {};
  const cleanMessage = String(message || "").trim().slice(0, 600);

  if (!cleanMessage) {
    return res.status(400).json({ error: "Message is required." });
  }

  const cleanHistory = Array.isArray(history)
    ? history.slice(-8).map((item) => ({
        role: item.role === "assistant" ? "assistant" : "user",
        content: String(item.content || "").slice(0, 600)
      }))
    : [];

  const input = [
    { role: "system", content: systemPrompt() },
    ...cleanHistory,
    { role: "user", content: cleanMessage }
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input,
        max_output_tokens: 180
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: payload.error?.message || "The AI backend could not answer right now."
      });
    }

    const answer = getTextFromResponse(payload) || "I could not form a clean answer there. Ask me about Rajat's projects, skills, resume, or current role.";

    return res.status(200).json({
      answer,
      source: "Rajat AI",
      link: wantsResume(cleanMessage)
        ? {
            href: RAJAT_PROFILE.resumeUrl,
            label: "Download Rajat's Resume"
          }
        : null
    });
  } catch (error) {
    return res.status(500).json({
      error: "The AI backend is temporarily unavailable."
    });
  }
}

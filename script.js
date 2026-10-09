import knowledge from "./knowledge.js?v=chat-v2";
import { extractiveAnswer } from "./rag/retrieve.js?v=rag-hallucination-v3";

const revealTargets = document.querySelectorAll(
  ".section-heading, .proof-card, .cert-wall, .project-showcase, .about-section, .capabilities, .contact-section"
);

revealTargets.forEach((target) => target.classList.add("reveal"));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.16 }
);

revealTargets.forEach((target) => observer.observe(target));

const nav = document.querySelector(".nav-pill");
const navLinks = Array.from(document.querySelectorAll(".nav-pill a[href^='#']"))
  .filter((link) => link.getAttribute("href") !== "#" && !link.classList.contains("avatar-link"));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const setActiveNav = () => {
  const scrollPosition = window.scrollY + window.innerHeight * 0.35;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  let activeId = "home";

  sections.forEach((section) => {
    if (section.offsetTop <= scrollPosition) {
      activeId = section.id;
    }
  });

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${activeId}`);
  });

  if (nav) {
    nav.style.setProperty("--progress", maxScroll > 0 ? window.scrollY / maxScroll : 0);
    const activeLink = navLinks.find((link) => link.getAttribute("href") === `#${activeId}`);
    moveNavGlow(activeLink);
  }
};

const moveNavGlow = (link) => {
  if (!nav || !link) {
    return;
  }

  const navBox = nav.getBoundingClientRect();
  const linkBox = link.getBoundingClientRect();
  nav.style.setProperty("--glow-x", `${linkBox.left - navBox.left}px`);
  nav.style.setProperty("--glow-y", `${linkBox.top - navBox.top}px`);
  nav.style.setProperty("--glow-w", `${linkBox.width}px`);
  nav.style.setProperty("--glow-h", `${linkBox.height}px`);
};

setActiveNav();
window.addEventListener("scroll", setActiveNav, { passive: true });

if (nav) {
  navLinks.forEach((link) => {
    link.addEventListener("pointerenter", () => moveNavGlow(link));
  });

  nav.addEventListener("pointerleave", () => {
    const activeLink = navLinks.find((link) => link.classList.contains("active"));
    moveNavGlow(activeLink);
  });
}

const themeToggle = document.querySelector("[data-theme-toggle]");
const themeLabel = document.querySelector("[data-theme-label]");
const themeWipe = document.querySelector("[data-theme-wipe]");

const setTheme = (theme, persist = true) => {
  const nextTheme = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;

  if (persist) {
    try {
      localStorage.setItem("rajat-theme", nextTheme);
    } catch {
      // Theme still changes for this visit if storage is unavailable.
    }
  }

  if (themeLabel) {
    themeLabel.textContent = nextTheme === "light" ? "Dark" : "Light";
  }

  themeToggle?.setAttribute(
    "aria-label",
    nextTheme === "light" ? "Switch to dark mode" : "Switch to light mode"
  );
};

setTheme(document.documentElement.dataset.theme, false);

themeToggle?.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  const buttonBox = themeToggle.getBoundingClientRect();

  if (themeWipe) {
    themeWipe.style.setProperty("--wipe-x", `${buttonBox.left + buttonBox.width / 2}px`);
    themeWipe.style.setProperty("--wipe-y", `${buttonBox.top + buttonBox.height / 2}px`);
    themeWipe.classList.remove("active");
    void themeWipe.offsetWidth;
    themeWipe.classList.add("active");
  }

  window.requestAnimationFrame(() => setTheme(nextTheme));
});

const cursor = document.querySelector(".cursor");
const cursorText = cursor?.querySelector("span");
let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;
let renderedX = cursorX;
let renderedY = cursorY;

const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (canHover && cursor) {
  window.addEventListener("pointermove", (event) => {
    cursorX = event.clientX;
    cursorY = event.clientY;
    const inAssistant = Boolean(event.target.closest?.(".chat-panel, .ai-drawer, .ai-launcher"));
    cursor.classList.toggle("in-assistant", inAssistant);
    if (inAssistant) {
      cursor.classList.remove("active");
      cursorText.textContent = "";
    }
  });

  const animateCursor = () => {
    renderedX += (cursorX - renderedX) * 0.18;
    renderedY += (cursorY - renderedY) * 0.18;
    cursor.style.left = `${renderedX}px`;
    cursor.style.top = `${renderedY}px`;
    requestAnimationFrame(animateCursor);
  };

  animateCursor();

  document.querySelectorAll("[data-cursor], a, button").forEach((element) => {
    if (element.closest(".hero, .chat-panel, .ai-drawer, .ai-launcher") || element.hasAttribute("data-cursor-static")) {
      return;
    }

    element.addEventListener("pointerenter", () => {
      cursor.classList.add("active");
      cursorText.textContent = element.dataset.cursor || "OPEN";
    });

    element.addEventListener("pointerleave", () => {
      cursor.classList.remove("active");
      cursorText.textContent = "";
    });
  });
}

document.querySelectorAll(".project-visual").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    if (!canHover) {
      return;
    }

    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    card.style.setProperty("--mx", x.toFixed(3));
    card.style.setProperty("--my", y.toFixed(3));
  });

  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--mx", 0);
    card.style.setProperty("--my", 0);
  });
});

document.querySelectorAll(".proof-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    if (!canHover) {
      return;
    }

    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    card.style.setProperty("--proof-x", x.toFixed(3));
    card.style.setProperty("--proof-y", y.toFixed(3));
  });

  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--proof-x", 0);
    card.style.setProperty("--proof-y", 0);
  });
});

const setScrollDepth = () => {
  document.querySelectorAll(".project-visual").forEach((card) => {
    const rect = card.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = (center - window.innerHeight / 2) / window.innerHeight;
    card.style.setProperty("--scroll-shift", Math.max(-1, Math.min(1, distance)).toFixed(3));
  });
};

setScrollDepth();
window.addEventListener("scroll", setScrollDepth, { passive: true });
window.addEventListener("resize", () => {
  setActiveNav();
  setScrollDepth();
});


const normalizeQuestion = (value) =>
  value.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").replace(/\s+/g, " ").trim();

const includesAny = (text, words) => words.some((word) => text.includes(word));

const hasAnyWord = (text, words) => {
  const tokens = new Set(text.split(" "));
  return words.some((word) => tokens.has(word));
};

const rajatContextTerms = [
  "rajat", "he", "him", "his", "profile", "portfolio", "candidate", "student", "developer", "builder", "applicant",
  "resume", "cv", "career", "college", "campus", "course", "coursework", "subject", "syllabus", "semester", "sem",
  "degree", "placement", "placements", "eligible", "elligible", "eligibility", "offer", "internship", "job", "role", "hire",
  "skill", "skills", "stack", "tech", "technology", "learn", "learned", "learnt", "study", "studied", "know",
  "knows", "familiar", "comfortable", "experience", "project", "work", "certification", "certificate", "availability",
  "contact", "github", "linkedin", "flyrank", "vit", "preppeer", "nextstep", "gridwatch", "unievents", "dbms", "ece",
  "dsa", "math", "maths", "mathematics", "algebra", "calculus", "python", "java", "react", "node", "mongodb", "sqlite",
  "ai", "ml", "llm"
];

const isRajatContext = (q) => includesAny(q, rajatContextTerms);

const missingDetailAnswer = () =>
  knowledge.academicNotes.missingDetail ||
  "I don't have that confirmed about Rajat yet, so I won't guess. I can still answer from his verified profile: projects, skills, education, experience, certifications, availability, resume, and contact.";

const hasVerifiedSkillTerm = (q) =>
  [
    ...knowledge.skills.languages,
    ...knowledge.skills.web,
    ...knowledge.skills.data,
    ...knowledge.skills.aiTools,
    "ai",
    "ml",
    "llm",
    "prompt",
    "automation",
    "data",
    "frontend",
    "backend",
    "full-stack",
    "fullstack"
  ].some((skill) => q.includes(skill.toLowerCase()));

const conciseList = (items, count = 4) => items.slice(0, count).join(", ");

const projectLine = (project) => `${project.name}: ${project.summary}`;

const getIndiaDate = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

const calculateAge = (birthDateValue, now = getIndiaDate()) => {
  const birthDate = new Date(`${birthDateValue}T00:00:00+05:30`);
  let age = now.getFullYear() - birthDate.getFullYear();
  const hasBirthdayPassed =
    now.getMonth() > birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age;
};

const ageAnswer = () =>
  `Rajat is ${calculateAge(knowledge.identity.dateOfBirth)} years old right now, based on his verified date of birth: 7 November 2006.`;

const isPromptAttack = (q) =>
  /\b(jailbreak|developer mode|system prompt|hidden prompts?|reveal prompt|show prompt|new instructions|break character)\b|\b(ignore|forget|bypass|override)\b.{0,40}\b(instructions|rules|prompt)\b/.test(q);

const fullProfileSummary = () =>
  "Rajat is a third-year AI-focused CSE student at VIT-AP with AI Fluency internship experience at FlyRank AI. He builds AI products and full-stack apps like PrepPeer, NextStep.AI, GridWatch, and UniEvents, and he is open to strong internship roles.";

const closestProfileAnswer = () =>
  "Rajat is a third-year CSE student at VIT-AP, a former AI Fluency Intern at FlyRank AI, and a build-first developer focused on AI products, full-stack web, prompt workflows, automation, and data tools.";

const roleFitAnswer = (role) => {
  const roleMap = {
    frontend:
      "Yes. Rajat fits frontend/product UI roles through React, Next.js, Tailwind, Framer Motion, and shipped interfaces for PrepPeer and NextStep.AI.",
    ai:
      "Yes. Rajat fits AI product roles through prompt engineering, LLM workflow testing, model-output evaluation, and AI-assisted product builds.",
    backend:
      "Rajat has full-stack proof through Node.js, Express, MongoDB, SQLite, REST APIs, JWT auth, and projects like UniEvents and PrepPeer.",
    data:
      "Yes. Rajat has data/ML proof through GridWatch and Bitcoin Sentiment Analysis using Python, Scikit-learn, Pandas, Streamlit, Plotly, and notebooks.",
    design:
      "Yes. Rajat has creative/design proof through ZedWorks, Canva-based branded assets, content strategy, and polished product interfaces."
  };
  return roleMap[role] || roleMap.ai;
};

const verifiedProfileSummary = () =>
  "Verified: Rajat is a third-year CSE student at VIT-AP, former AI Fluency Intern at FlyRank AI, and builder of PrepPeer, NextStep.AI, GridWatch, UniEvents, Bitcoin Sentiment Analysis, and ZedWorks Portfolio.";

const unverifiedTopicsAnswer = () =>
  `Not confirmed yet: ${knowledge.profileMemory.unverifiedTopics}`;

const roleFitSummary = (mode = "default") => {
  if (mode === "technical") {
    return "For AI product/full-stack roles, Rajat has verified proof across prompt workflows, model-output evaluation, React/Next.js interfaces, Node/Express APIs, MongoDB/SQLite, and Python data tools.";
  }

  return "Yes, Rajat is a strong fit for AI product, full-stack web, prompt engineering, automation, and data-tool internships, based on his verified projects and FlyRank AI role.";
};

const matchedKnowledgeAnswer = (q) => {
  const categories = [
    {
      keywords: ["what does rajat do", "what does he do", "what is he doing", "what does rajat build", "what he does", "who is he", "profile", "background", "describe rajat", "describe him", "about him"],
      text: fullProfileSummary(),
      source: "Resume + GitHub"
    },
    {
      keywords: ["is rajat good", "is he good", "how good is rajat", "how good is he", "is rajat talented", "is he talented", "is rajat smart", "is he smart", "is rajat hardworking", "is he hardworking"],
      text:
        "From his work, yes. Rajat shows build-first execution, AI fluency, prompt engineering, full-stack product work, and clear communication across five languages.",
      source: "Resume + GitHub"
    },
    {
      keywords: ["where is rajat from", "where is he from", "location", "hometown", "where does rajat live", "where he lives"],
      text: `Rajat is based in ${knowledge.identity.location}. He studies at VIT-AP in Amaravati, Andhra Pradesh.`,
      source: "Resume"
    },
    {
      keywords: ["contact number", "phone", "phone number", "mobile", "mobile number", "call"],
      text: `Rajat's verified contact details are email ${knowledge.identity.email} and phone ${knowledge.identity.phone}.`,
      source: "Resume"
    },
    {
      keywords: ["github link", "github profile", "linkedin link", "portfolio link", "social links", "links"],
      text: `Portfolio: ${knowledge.identity.portfolio}. GitHub: ${knowledge.identity.github}. LinkedIn: ${knowledge.identity.linkedin}.`,
      source: "Submitted links + GitHub"
    },
    {
      keywords: ["full profile", "complete profile", "overview", "bio", "introduction", "intro"],
      text: fullProfileSummary(),
      source: "Resume + GitHub + submitted links"
    },
    {
      keywords: ["data role", "data analyst", "machine learning", "ml role"],
      text: roleFitAnswer("data"),
      source: "Resume + GitHub"
    },
    {
      keywords: ["design role", "creative role", "content role", "canva", "content creation"],
      text: roleFitAnswer("design"),
      source: "Resume + GitHub"
    },
    {
      keywords: ["all projects", "project list", "list projects"],
      text: `Rajat's verified projects are ${knowledge.projects.map((project) => project.name).join(", ")}.`,
      source: "Resume + GitHub"
    }
  ];

  const match = categories.find((category) => includesAny(q, category.keywords));
  return match ? { text: match.text, source: match.source } : null;
};

const followUpFor = (q, answer) => {
  if (answer.link) {
    return "Want a quick summary of the resume too?";
  }

  if (answer.source === "Scope guard") {
    return "Try asking about Rajat's projects, skills, resume, current role, or contact.";
  }

  if (answer.source?.includes("Privacy")) {
    return "I can still answer the professional stuff clearly.";
  }

  if (includesAny(q, ["hi", "hello", "hey", "how are you", "whats up", "what's up"])) {
    return "Want the quick version of what he is building right now?";
  }

  if (includesAny(q, ["project", "preppeer", "nextstep", "gridwatch", "built", "apps"])) {
    return "Want me to pick his strongest project for recruiters?";
  }

  if (includesAny(q, ["where", "used", "proof", "prove", "proves"])) {
    return "Want to see which project is strongest?";
  }

  if (includesAny(q, ["skill", "stack", "tech", "frontend", "backend", "ai", "data"])) {
    return "Want proof of where he used those skills?";
  }

  if (includesAny(q, ["available", "internship", "hire", "job", "role"])) {
    return "Want a short hiring pitch for him?";
  }

  if (includesAny(q, ["contact", "email", "phone", "linkedin", "github"])) {
    return "Want his resume link as well?";
  }

  if (includesAny(q, ["who", "about", "profile", "background", "how is", "good", "person", "rajat"])) {
    return "Want his projects, skills, or current role next?";
  }

  return "What do you want to know next: projects, skills, resume, or contact?";
};

const humanizeAnswer = (answer) => ({
  ...answer,
  text: answer.text.replace(/^Verified(?: snapshot)?:\s*/i, "")
});

const getAiEndpoint = () => window.RAJAT_AI_ENDPOINT || knowledge.ai?.endpoint || "";
let conversation = [];
const getHistory = () => conversation;

const suggestionMemory = new WeakMap();

const getShownSuggestions = (container) => suggestionMemory.get(container) || new Set();

const rememberSuggestions = (container, labels) => {
  if (!container) {
    return;
  }

  const shown = getShownSuggestions(container);
  labels.forEach((label) => shown.add(label));
  suggestionMemory.set(container, shown);
};

const chatModes = new WeakMap();

const getMode = (container) => chatModes.get(container) || "default";

const setMode = (container, mode) => {
  if (container) {
    chatModes.set(container, mode);
  }
};

const resolveContextualQuestion = (question) => {
  const q = normalizeQuestion(question);
  const lastQuestion = [...conversation].reverse().find(t => t.role === "user")?.content || "";
  const project = knowledge.projects.find(p => lastQuestion.toLowerCase().includes(p.name.toLowerCase()));
  if (project && /\b(it|its|that|this|more)\b/.test(q) && !knowledge.projects.some(p=>q.includes(p.name.toLowerCase()))) {
    if (/\b(stack|tech|built with|tools|technology)\b/.test(q)) return `What is the tech stack of ${project.name}?`;
    return `About ${project.name}: ${question}`;
  }
  return question;
};

const rememberTurn = (_container, question, answer) => {
  conversation = [...conversation, {role: "user", content: question}, {role: "assistant", content: answer.text}].slice(-12);
};

const resolveLink = (link) => {
  if (!link?.href) {
    return link;
  }

  return {
    ...link,
    href: link.href.startsWith("/") ? link.href.slice(1) : link.href
  };
};

const askRajat = async (question, container) => {
  const history = getHistory();
  if (isPromptAttack(normalizeQuestion(question))) return {text: "I can help with Rajat's work, but I can't change my instructions or share hidden prompts.", source: "Prompt guard"};
  try {
    const response = await fetch(getAiEndpoint(), {
      method: "POST", signal: AbortSignal.timeout(13000), headers: {"Content-Type": "application/json"},
      body: JSON.stringify({message: question, history, mode: getMode(container)})
    });
    const payload = await response.json();
    if (!response.ok || typeof payload.answer !== "string" || !payload.answer.trim()) throw new Error("Unavailable");
    return {text: payload.answer, source: payload.source || "Document answer", sources: payload.sources || [], link: resolveLink(payload.link)};
  } catch {
    const answer = extractiveAnswer(question, history);
    if (/\b(resume|cv)\b/i.test(question) && /\b(download|get|link)\b/i.test(question)) return {text: "Here's Rajat's latest resume.", source: "Document answer", link: resolveLink({href: knowledge.resumeUrl, label: "Download Rajat's resume"})};
    return answer;
  }
};

const answerRajat = (question, mode = "default") => {
  if (!knowledge) {
    return {
      text: "The local knowledge base is not loaded yet. Refresh the page and ask again.",
      source: "System"
    };
  }

  const q = normalizeQuestion(question);

  if (!q) {
    return {
      text: "Ask about Rajat's current role, projects, skills, education, certifications, availability, or contact.",
      source: "Guide"
    };
  }

  if (["hi", "hello", "hey", "yo", "hii", "helo", "helloo"].includes(q)) {
    return {
      text: "Hey, I’m Rajat’s portfolio AI. I can tell you what he is building, what he is good at, and whether he is a fit for a role.",
      source: "Conversation"
    };
  }

  if (includesAny(q, ["how are you", "how r u", "how you doing", "what's up", "whats up"])) {
    return {
      text: "I’m good, locked in, and ready to talk about Rajat without making things boring.",
      source: "Conversation"
    };
  }

  if (includesAny(q, ["how is rajat", "hows rajat", "how's rajat", "how is he", "how is rajat doing", "how rajat"])) {
    return {
      text: "Rajat is studying CSE at VIT-AP, building AI/web products, and working on freelance content and design. He completed his FlyRank AI internship in July - August 2026. Want his experience or project list?",
      source: "Resume + GitHub"
    };
  }

  if (includesAny(q, ["who are you", "what are you", "your name", "introduce yourself"])) {
    return {
      text: "I’m Rajat Portfolio Guide, the AI assistant inside this portfolio. I answer from Rajat’s resume, projects, GitHub, and submitted profile details.",
      source: "Conversation"
    };
  }

  if (includesAny(q, ["what can you do", "help", "what should i ask", "questions can i ask"])) {
    return {
      text: "You can ask about Rajat’s current work, internships, projects, tech stack, education, certifications, experience, resume, or contact.",
      source: "Conversation"
    };
  }

  if (includesAny(q, ["tell me more", "more about rajat", "more about him", "details about rajat", "give details"])) {
    return {
      text: fullProfileSummary(),
      source: "Resume + GitHub + submitted links"
    };
  }

  if (["thanks", "thank you", "ty", "nice", "cool", "great"].includes(q)) {
    return {
      text: "Anytime. Want a quick recruiter-style summary of Rajat or a project breakdown?",
      source: "Conversation"
    };
  }

  const knownTopic = isRajatContext(q) || hasAnyWord(q, ["he", "him", "his"]);

  if (isPromptAttack(q) && !knownTopic) {
    return { text: knowledge.boundaries.refusal, source: "Prompt guard" };
  }

  if (includesAny(q, ["capital", "weather", "recipe", "movie", "sports", "news", "bitcoin price", "write code for me", "homework"]) && !knownTopic) {
    return { text: knowledge.boundaries.refusal, source: "Scope guard" };
  }

  if (includesAny(q, ["sem", "semester", "which sem", "which semester"])) {
    return {
      text: knowledge.academicNotes.semester,
      source: "Confirmed academic timeline"
    };
  }

  if (includesAny(q, ["linear algebra", "algebra", "math", "maths", "mathematics", "calculus", "discrete math", "coursework", "course work", "subject"])) {
    return {
      text: knowledge.academicNotes.linearAlgebra,
      source: "Verified-data guard"
    };
  }

  if (includesAny(q, ["koth", "king of the hill", "pwn grounds", "cybersecurity", "cyber security", "ctf", "competition", "achievement"])) {
    return { text: knowledge.achievements.join(" "), source: "Resume + competition certificate" };
  }

  if (includesAny(q, ["dsa", "data structure", "data structures", "algorithm", "algorithms", "operating system", "operating systems", "computer network", "computer networks", "oops", "object oriented", "cloud computing", "cybersecurity", "cyber security", "blockchain", "exam", "marks", "grade", "grades", "attendance", "backlog", "backlogs"])) {
    return {
      text: missingDetailAnswer(),
      source: "Verified-data guard"
    };
  }

  if (includesAny(q, ["placement", "placements", "eligible", "elligible", "eligibility", "campus placement", "campus placements", "placed", "offer", "job offer"])) {
    return {
      text: knowledge.academicNotes.placements,
      source: "Verified-data guard"
    };
  }

  if (includesAny(q, ["did", "does", "has", "can", "could", "would", "is", "was"]) && includesAny(q, ["learn", "learned", "learnt", "study", "studied", "know", "knows", "familiar", "comfortable", "eligible", "elligible", "qualified", "ready"]) && knownTopic && !hasVerifiedSkillTerm(q)) {
    return {
      text: missingDetailAnswer(),
      source: "Verified-data guard"
    };
  }

  if (includesAny(q, ["which year", "college year", "what year", "year of college", "2nd year", "second year", "third year", "3rd year"])) {
    return {
      text: "Rajat is currently a third-year Computer Science student at VIT-AP.",
      source: "Resume + confirmed profile update"
    };
  }

  if (includesAny(q, ["not confirmed", "unverified", "unknown", "missing", "do not know", "don't know", "dont know", "not know"])) {
    return {
      text: unverifiedTopicsAnswer(),
      source: "Verified profile"
    };
  }

  if ((includesAny(q, ["verified", "confirmed"]) && includesAny(q, ["about", "know", "profile", "rajat"])) || includesAny(q, ["what do you know about rajat", "what is verified about rajat"])) {
    return {
      text: verifiedProfileSummary(),
      source: "Verified profile"
    };
  }

  if (includesAny(q, ["fit", "good for", "suitable", "shortlist", "hire", "hiring", "internship", "role"]) && includesAny(q, ["ai", "product", "full stack", "full-stack", "frontend", "backend", "data", "prompt", "automation", "internship", "role"])) {
    return {
      text: roleFitSummary(mode),
      source: "Resume + GitHub"
    };
  }

  const selectedProject = knowledge.projects.find(p => q.includes(p.name.toLowerCase()));
  if (selectedProject && /\b(stack|tech|tools|technology|built with)\b/.test(q)) {
    return {text: `${selectedProject.name} uses ${selectedProject.stack}.`, source: "Resume + GitHub"};
  }

  if (includesAny(q, ["doing", "current", "right now", "today", "role", "flyrank"]) || hasAnyWord(q, ["now"])) {
    return { text: knowledge.current.summary, source: "Resume" };
  }

  if (includesAny(q, ["best project", "strongest project", "project is strongest", "strongest one", "top project", "main project"])) {
    return {
      text:
        "PrepPeer is the strongest AI product proof: role-specific interviews, AI scoring, peer ranking, percentile leaderboards, and shareable score cards.",
      source: "Resume + GitHub"
    };
  }

  if (includesAny(q, ["compare preppeer and nextstep", "preppeer vs nextstep", "nextstep vs preppeer", "difference between preppeer and nextstep"])) {
    return {
      text:
        "PrepPeer helps job seekers train with AI interviews and ranking. NextStep.AI helps parents turn report cards into clear action plans.",
      source: "GitHub"
    };
  }

  const rankedMatch = matchedKnowledgeAnswer(q);
  if (rankedMatch) {
    return rankedMatch;
  }

  if (includesAny(q, ["recruiter summary", "quick summary", "short summary", "summarize rajat", "pitch", "elevator pitch"])) {
    return {
      text:
        "Rajat is a third-year AI-focused CSE student at VIT-AP with AI Fluency internship experience at FlyRank AI, building practical AI products across web, data, and automation.",
      source: "Resume + GitHub"
    };
  }

  if (includesAny(q, ["everything about rajat", "everything about me", "all about rajat", "all about me", "about rajat", "about me", "tell me about rajat", "tell me about me", "who is rajat"])) {
    return {
      text: fullProfileSummary(),
      source: "Resume + GitHub + submitted links"
    };
  }

  if (includesAny(q, ["why rajat", "why should", "why hire", "why consider", "what makes rajat"])) {
    return {
      text:
        "Rajat combines build-first execution with AI fluency: he ships working products, understands prompt workflows, and can move from idea to polished interface fast.",
      source: "Resume + GitHub"
    };
  }

  if (includesAny(q, ["good developer", "good candidate", "good fit", "how good", "as a developer", "as a person", "kind of person", "personality", "mindset", "strength", "strengths"])) {
    return {
      text:
        "From his work, yes. Rajat shows build-first execution, AI fluency, prompt engineering, full-stack product work, and clear communication across five languages.",
      source: "Resume + GitHub"
    };
  }

  if (includesAny(q, ["age", "birthday", "date of birth", "dob", "gpa", "cgpa", "salary", "expected salary", "private", "address"])) {
    return {
      text:
        includesAny(q, ["age", "birthday", "date of birth", "dob"])
          ? ageAnswer()
          : missingDetailAnswer(),
      source: "Privacy + verified-data guard"
    };
  }

  if (includesAny(q, ["available", "internship", "hire", "hiring", "open to", "job", "roles"])) {
    return { text: knowledge.availability, source: "Resume + portfolio" };
  }

  if (includesAny(q, ["study", "college", "university", "vit", "education", "degree", "mtech", "school"])) {
    return {
      text: knowledge.education.join(" "),
      source: "Resume"
    };
  }

  if (includesAny(q, ["experience", "worked", "work experience", "freelance", "zedworks", "ignite", "client"])) {
    return {
      text:
        "Rajat is a former AI Fluency Intern at FlyRank AI and a freelance AI content developer/designer through ZedWorks / IgniteWithoutCaffeine.",
      source: "Resume"
    };
  }

  if (includesAny(q, ["frontend role", "front end role", "frontend fit", "good for frontend", "ui role"])) {
    return {
      text:
        "Yes. Rajat fits frontend/product UI roles through React, Next.js, Tailwind, Framer Motion, and shipped interfaces for PrepPeer and NextStep.AI.",
      source: "Resume + GitHub"
    };
  }

  if (includesAny(q, ["ai role", "ai fit", "prompt role", "good for ai", "ai engineer", "ai product"])) {
    return {
      text:
        "Yes. Rajat fits AI product roles through prompt engineering, LLM workflow testing, model-output evaluation, and AI-assisted product builds.",
      source: "Resume"
    };
  }

  if (includesAny(q, ["backend role", "backend fit", "full stack role", "full-stack role", "fullstack role"])) {
    return {
      text:
        "Rajat has full-stack proof through Node.js, Express, MongoDB, SQLite, REST APIs, JWT auth, and projects like UniEvents and PrepPeer.",
      source: "Resume + GitHub"
    };
  }

  if (includesAny(q, ["dbms", "database management"])) {
    return {
      text: knowledge.academicNotes.dbms,
      source: "Resume + GitHub"
    };
  }

  if (includesAny(q, ["ece", "electronics", "electrical"])) {
    return {
      text: knowledge.academicNotes.ece,
      source: "Verified academic guard"
    };
  }

  if (includesAny(q, ["certification", "certificate", "certified", "anthropic", "google cloud", "ibm", "nasscom", "jpmorgan", "hp life", "canva"])) {
    return {
      text: `Verified certifications include ${conciseList(knowledge.certifications, 5)}. He also has Canva Design School credentials.`,
      source: "Resume"
    };
  }

  if (includesAny(q, ["best project", "strongest project", "project is strongest", "strongest one", "top project", "main project"])) {
    return {
      text:
        "PrepPeer is the strongest AI product proof: role-specific interviews, AI scoring, peer ranking, percentile leaderboards, and shareable score cards.",
      source: "Resume + GitHub"
    };
  }

  if (includesAny(q, ["which project proves", "project proves this", "proves this best", "proof project"])) {
    return {
      text:
        "PrepPeer proves Rajat's AI product skills best, while NextStep.AI proves he can turn AI into a polished user-facing web experience. GridWatch is strongest for Python/data proof.",
      source: "Resume + GitHub"
    };
  }

  if (includesAny(q, ["compare preppeer and nextstep", "preppeer vs nextstep", "nextstep vs preppeer", "difference between preppeer and nextstep"])) {
    return {
      text:
        "PrepPeer helps job seekers train with AI interviews and ranking. NextStep.AI helps parents turn report cards into clear action plans.",
      source: "GitHub"
    };
  }

  const project = knowledge.projects.find((item) => q.includes(item.name.toLowerCase().replace(".ai", "")));
  if (project) {
    return {
      text: projectLine(project),
      source: "GitHub + resume"
    };
  }

  if (includesAny(q, ["project", "built", "builds", "portfolio", "apps", "products"])) {
    return {
      text:
        "Rajat has built PrepPeer, NextStep.AI, GridWatch, UniEvents, Bitcoin Sentiment Analysis, and ZedWorks Portfolio.",
      source: "Resume + GitHub"
    };
  }

  if (includesAny(q, ["skill", "stack", "tech", "technology", "language", "tools", "react", "next", "python", "typescript", "javascript", "node", "mongodb", "ai tools"])) {
    if (includesAny(q, ["where", "used", "proof"])) {
      if (includesAny(q, ["next", "next.js", "react", "typescript", "tailwind", "framer"])) {
        return {
          text: "Rajat used React/Next.js/TypeScript/Tailwind across PrepPeer, NextStep.AI, UniEvents, and this portfolio.",
          source: "Resume + GitHub"
        };
      }

      if (includesAny(q, ["python", "scikit", "pandas", "streamlit", "plotly", "sqlite"])) {
        return {
          text: "Rajat used Python in GridWatch and Bitcoin Sentiment Analysis, covering ML anomaly detection, dashboards, notebooks, and data analysis.",
          source: "Resume + GitHub"
        };
      }

      if (includesAny(q, ["node", "express", "mongodb", "jwt", "api"])) {
        return {
          text: "Rajat used Node.js, Express, MongoDB, JWT, and REST APIs in the University Event Management System and backend-oriented web work.",
          source: "Resume + GitHub"
        };
      }

      return {
        text:
          "Verified project proof: React/Next.js/TypeScript show up in PrepPeer, NextStep.AI, UniEvents, and this portfolio; Python/data tools show up in GridWatch and Bitcoin Sentiment Analysis; Node/Express/MongoDB/API work shows up in UniEvents and backend-oriented web work.",
        source: "Resume + GitHub"
      };
    }

    return {
      text:
        mode === "technical"
          ? `Rajat works across ${conciseList(knowledge.skills.languages, 5)}, web/backend tools like ${conciseList(knowledge.skills.web, 8)}, and data tools like ${conciseList(knowledge.skills.data, 4)}.`
          : `Rajat works across ${conciseList(knowledge.skills.languages, 5)}, plus ${conciseList(knowledge.skills.web, 6)} and AI tools like ${conciseList(knowledge.skills.aiTools, 5)}.`,
      source: "Resume + GitHub"
    };
  }

  if (includesAny(q, ["prompt", "llm", "ai", "model", "codex", "claude", "chatgpt", "gemini"])) {
    return {
      text:
        "Rajat focuses on prompt engineering, LLM workflows, output evaluation, model behavior testing, and AI-assisted product builds.",
      source: "Resume"
    };
  }

  if (includesAny(q, ["contact", "email", "linkedin", "github", "reach", "message"])) {
    return {
      text:
        `Reach Rajat at ${knowledge.identity.email}. GitHub: ${knowledge.identity.github}. LinkedIn: ${knowledge.identity.linkedin}.`,
      source: "Resume + GitHub"
    };
  }

  if (includesAny(q, ["resume", "cv", "download resume", "see resume"])) {
    return {
      text:
        "Here is Rajat's resume as a downloadable PDF. It includes his education, experience, projects, skills, and certifications.",
      source: "Resume",
      link: {
        href: "assets/docs/Rajat_Krishnan_Resume.pdf",
        label: "Download Rajat's Resume"
      }
    };
  }

  if (includesAny(q, ["language", "speak"])) {
    return {
      text: `Rajat speaks ${knowledge.skills.humanLanguages.join(", ")}.`,
      source: "Resume"
    };
  }

  if (includesAny(q, ["interest", "hobby", "outside"])) {
    return {
      text: `Rajat's interests include ${knowledge.interests.join(", ")}.`,
      source: "Resume"
    };
  }

  if (!knownTopic) {
    return { text: knowledge.boundaries.refusal, source: "Scope guard" };
  }

  return {
    text:
      `${closestProfileAnswer()} Ask for current role, projects, skills, education, certifications, resume, or contact for a sharper answer.`,
    source: "Closest verified profile match"
  };
};

const appendMessage = (container, text, type = "bot", source = "", link = null, sources = []) => {
  if (!container) {
    return null;
  }

  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.textContent = type.startsWith("bot") ? text.replace(/\*\*/g, "") : text;
  if (link && type === "bot") {
    const anchor = document.createElement("a");
    anchor.className = "message-link";
    anchor.href = link.href;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
    anchor.textContent = link.label;
    anchor.setAttribute("download", "");
    message.appendChild(anchor);
  }
  const sourceLabels = {
    "Verified-data guard": "Verified profile",
    "Privacy + verified-data guard": "Verified profile",
    "Resume + GitHub": "Resume + projects",
    "GitHub + resume": "Resume + projects",
    "Resume + portfolio": "Resume + portfolio",
    "Closest verified profile match": "Verified profile",
    "Rajat AI": "Rajat AI"
  };
  const quietSources = ["Conversation", "Guide", "Scope guard", "Prompt guard", "System", "AI answer", "Document answer", "Source excerpts"];
  if (source && type === "bot" && !quietSources.includes(source)) {
    const small = document.createElement("small");
    small.textContent = source === "Profile answer" ? "From the portfolio profile · live AI unavailable" : "Resume & projects";
    message.appendChild(small);
  }
  if (type === "bot" && Array.isArray(sources) && sources.length) {
    const list = document.createElement("div");
    list.className = "answer-sources";
    const label = document.createElement("span");
    label.textContent = source === "Source excerpts" ? "From the documents" : "Sources";
    list.appendChild(label);
    sources.slice(0, 6).forEach((item, index) => {
      if (typeof item.url !== "string" || typeof item.title !== "string") return;
      const url = new URL(item.url, window.location.origin);
      const allowed = (url.origin === window.location.origin && url.pathname === "/assets/docs/Rajat_Krishnan_Resume.pdf") || (url.hostname === "github.com" && url.pathname.startsWith("/Rajat77a/")) || (url.hostname === "rajat77a.github.io" && url.protocol === "https:");
      if (!allowed) return;
      const row = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = `${index + 1}. ${item.title}${item.section ? " · " + item.section : ""}`;
      row.appendChild(summary);
      if (item.quote) { const quote = document.createElement("blockquote"); quote.textContent = item.quote; row.appendChild(quote); }
      const anchor = document.createElement("a");
      anchor.href = url.href; anchor.target = "_blank"; anchor.rel = "noreferrer";
      anchor.textContent = "Open source ↗";
      row.appendChild(anchor); list.appendChild(row);
    });
    message.appendChild(list);
  }
  container.appendChild(message);
  container.scrollTop = container.scrollHeight;
  return message;
};

const uniqueSuggestions = (container, preferred, count = 2) => {
  const fallback = [
    "What is Rajat doing right now?",
    "Which project is strongest?",
    "Compare PrepPeer and NextStep",
    "Where did Rajat use these skills?",
    "Is Rajat good for an AI role?",
    "Give a recruiter summary",
    "What roles is he open to?",
    "What is verified about Rajat?",
    "What is not confirmed yet?",
    "Can I download Rajat's resume?",
    "How can I contact Rajat?",
    "What certifications does he have?"
  ];
  const shown = getShownSuggestions(container);
  const candidates = [...preferred, ...fallback].filter((label, index, labels) => labels.indexOf(label) === index);
  const fresh = candidates.filter((label) => !shown.has(label)).slice(0, count);
  return fresh.length ? fresh : candidates.slice(0, count);
};

const suggestionSetFor = (question, answer, container) => {
  const q = normalizeQuestion(question);
  if (answer.link || includesAny(q, ["resume", "cv"])) {
    return uniqueSuggestions(container, ["Give a recruiter summary", "Which project is strongest?", "How can I contact Rajat?"]);
  }
  if (includesAny(q, ["project", "preppeer", "nextstep", "gridwatch", "built"])) {
    return uniqueSuggestions(container, ["Which project is strongest?", "Compare PrepPeer and NextStep", "Where did Rajat use these skills?"]);
  }
  if (includesAny(q, ["skill", "stack", "tech", "python", "react", "ai", "backend", "frontend"])) {
    return uniqueSuggestions(container, ["Where did Rajat use these skills?", "Is Rajat good for an AI role?", "Which project proves this best?"]);
  }
  if (answer.source?.includes("guard")) {
    return uniqueSuggestions(container, ["What is verified about Rajat?", "What roles is he open to?", "What projects has Rajat built?"]);
  }
  return uniqueSuggestions(container, ["What is Rajat doing right now?", "What projects has Rajat built?", "Can I download Rajat's resume?"]);
};

const appendSuggestions = (container, question, answer) => {
  if (!container) {
    return;
  }

  const row = document.createElement("div");
  row.className = "message-suggestions";
  const labels = suggestionSetFor(question, answer, container);
  rememberSuggestions(container, labels);
  labels.forEach((label) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => {
      const form = container.closest(".chat-panel, .ai-drawer")?.querySelector(".chat-form");
      const input = form?.querySelector("textarea, input");
      if (input && form) {
        input.value = label;
        row.remove();
        form.requestSubmit();
      }
    });
    row.appendChild(button);
  });
  container.appendChild(row);
  container.scrollTop = container.scrollHeight;
};

const pageMessages = document.querySelector("[data-chat-messages]");
const drawerMessages = document.querySelector("[data-drawer-messages]");
const chatContainers = [pageMessages, drawerMessages].filter(Boolean);
const showWelcome = container => {
  container.replaceChildren(document.querySelector("#assistant-welcome").content.cloneNode(true));
  container.scrollTop = 0;
};
chatContainers.forEach(showWelcome);
const chatControls = () => document.querySelectorAll(".chat-form textarea, .chat-form button, [data-ask], [data-new-chat]");
let chatPending = false;


const sendQuestion = async (question, form) => {
  question = question.trim().slice(0, 600);
  if (!question || chatPending) return;
  chatPending = true;
  chatControls().forEach(c => c.disabled = true);
  const loading = chatContainers.map(container => {
    container.querySelectorAll(".message-suggestions, .chat-welcome").forEach(row => row.remove());
    appendMessage(container, question, "user");
    container.setAttribute("aria-busy", "true");
    const item = appendMessage(container, "", "bot thinking");
    item.setAttribute("role", "status");
    item.setAttribute("aria-label", "Preparing an answer");
    for (let i = 0; i < 3; i++) { const dot = document.createElement("span"); dot.setAttribute("aria-hidden", "true"); item.appendChild(dot); }
    return item;
  });
  const input = form?.querySelector("textarea, input");
  if (input) input.value = "";
  try {
    const answer = await askRajat(question, pageMessages);
    loading.forEach(item => item.remove());
    chatContainers.forEach(container => {
      appendMessage(container, answer.text, "bot", answer.source, answer.link, answer.sources);
      appendSuggestions(container, question, answer);
    });
    rememberTurn(pageMessages, question, answer);
  } finally {
    loading.forEach(item => item.remove());
    chatPending = false;
    chatControls().forEach(c => c.disabled = false);
    chatContainers.forEach(c => c.setAttribute("aria-busy", "false"));
    input?.focus();
  }
};

document.querySelectorAll(".chat-form").forEach(form => {
  const input = form.querySelector("textarea, input");
  form.addEventListener("submit", event => { event.preventDefault(); sendQuestion(input.value, form); });
  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) { event.preventDefault(); form.requestSubmit(); }
  });
});

document.addEventListener("click", event => {
  const button = event.target.closest("[data-ask]");
  if (button && !button.disabled) {
    const shell = button.closest(".chat-panel, .ai-drawer");
    sendQuestion(button.dataset.ask, shell?.querySelector(".chat-form"));
  }
});

document.querySelectorAll("[data-new-chat]").forEach(button => button.addEventListener("click", () => {
  if (chatPending) return;
  conversation = [];
  chatContainers.forEach(container => {
    container.replaceChildren();
    suggestionMemory.delete(container);
    showWelcome(container);
  });
  document.querySelectorAll(".chat-form textarea").forEach(input => input.value = "");
}));

document.querySelectorAll(".ai-mode-bar").forEach((bar) => {
  const shell = bar.closest(".chat-panel, .ai-drawer");
  const messages = shell?.querySelector(".chat-messages");
  bar.querySelectorAll("[data-ai-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-ai-mode]").forEach((item) => item.classList.toggle("active", item.dataset.aiMode === button.dataset.aiMode));
      chatContainers.forEach(container => setMode(container, button.dataset.aiMode || "default"));
    });
  });
});

const drawer = document.querySelector("[data-ai-drawer]");
const launcher = document.querySelector("[data-ai-launcher]");
const drawerInput = document.querySelector("[data-drawer-input]");
const aiSection = document.querySelector("#ask-ai");

launcher?.addEventListener("click", () => {
  drawer?.classList.add("open");
  drawer?.setAttribute("aria-hidden", "false");
  drawer?.removeAttribute("inert");
  if (drawerMessages) drawerMessages.scrollTop = drawerMessages.scrollHeight;
  window.setTimeout(() => drawerInput?.focus(), 120);
});

document.querySelector("[data-ai-close]")?.addEventListener("click", () => {
  drawer?.classList.remove("open");
  drawer?.setAttribute("aria-hidden", "true");
  drawer?.setAttribute("inert", "");
  launcher?.focus();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && drawer?.classList.contains("open")) {
    drawer?.classList.remove("open");
    drawer?.setAttribute("aria-hidden", "true");
  drawer?.setAttribute("inert", "");
  launcher?.focus();
  }
});

if (launcher && aiSection && "IntersectionObserver" in window) {
  const launcherObserver = new IntersectionObserver(
    ([entry]) => {
      launcher.classList.toggle("is-hidden", entry.isIntersecting && entry.intersectionRatio > 0.22);
    },
    { threshold: [0, 0.22] }
  );

  launcherObserver.observe(aiSection);
}

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
    if (element.closest(".hero")) {
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

const knowledge = window.RAJAT_KNOWLEDGE;
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
  /\b(ignore|forget|bypass|override|jailbreak|developer mode|system prompt|hidden prompt|reveal prompt|show prompt|act as|pretend|new instructions|break character|secret|confidential)\b/.test(q);

const fullProfileSummary = () =>
  "Rajat is a third-year AI-focused CSE student at VIT-AP and an AI Fluency Intern at FlyRank AI. He builds AI products and full-stack apps like PrepPeer, NextStep.AI, GridWatch, and UniEvents, and he is open to strong internship roles.";

const closestProfileAnswer = () =>
  "Rajat is a third-year CSE student at VIT-AP, an AI Fluency Intern at FlyRank AI, and a build-first developer focused on AI products, full-stack web, prompt workflows, automation, and data tools.";

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
  "Verified: Rajat is a third-year CSE student at VIT-AP, AI Fluency Intern at FlyRank AI, and builder of PrepPeer, NextStep.AI, GridWatch, UniEvents, Bitcoin Sentiment Analysis, and ZedWorks Portfolio.";

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

const humanizeAnswer = (answer, question) => {
  const q = normalizeQuestion(question);
  let text = answer.text
    .replace(/^Yes\. Rajat/g, "Yes. Rajat")
    .replace(/^Verified snapshot:\s*/i, "")
    .replace(/I only answer about Rajat's/g, "I’m built to stay focused on Rajat’s")
    .replace(/I do not have that verified public detail for Rajat\./g, "I don’t have that public verified detail, so I won’t invent it.");

  const followUp = followUpFor(q, answer);
  if (followUp && !text.includes("?") && !text.includes(followUp)) {
    text = `${text} ${followUp}`;
  }

  return { ...answer, text };
};

const getAiEndpoint = () => {
  const configured = window.RAJAT_AI_ENDPOINT || knowledge?.ai?.endpoint || "";
  if (configured) {
    return configured;
  }

  if (window.location.hostname.endsWith("github.io")) {
    return "";
  }

  return "/api/chat";
};

const chatMemory = new WeakMap();

const getHistory = (container) => chatMemory.get(container) || [];

const chatModes = new WeakMap();

const getMode = (container) => chatModes.get(container) || "default";

const setMode = (container, mode) => {
  if (container) {
    chatModes.set(container, mode);
  }
};

const rememberTurn = (container, question, answer) => {
  if (!container) {
    return;
  }

  const history = [
    ...getHistory(container),
    { role: "user", content: question },
    { role: "assistant", content: answer.text }
  ].slice(-10);

  chatMemory.set(container, history);
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

const shouldUseLocalGuard = (answer) =>
  [
    "Verified-data guard",
    "Privacy + verified-data guard",
    "Confirmed academic timeline",
    "Verified profile",
    "Resume",
    "Resume + GitHub",
    "Resume + portfolio"
  ].includes(answer?.source);

const askRajat = async (question, container) => {
  const endpoint = getAiEndpoint();
  const mode = getMode(container);
  const localAnswer = humanizeAnswer(answerRajat(question, mode), question);

  if (shouldUseLocalGuard(localAnswer)) {
    return localAnswer;
  }

  if (endpoint) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: question,
          history: getHistory(container),
          mode
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "AI backend failed");
      }

      return {
        text: payload.answer,
        source: payload.source || "Rajat AI",
        link: resolveLink(payload.link)
      };
    } catch (error) {
      console.warn("Rajat AI backend fallback:", error);
    }
  }

  return localAnswer;
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
      text: "Rajat is in build mode: studying CSE at VIT-AP, interning with FlyRank AI, and shipping AI/web products. Want his current role or project list?",
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

  if (includesAny(q, ["thanks", "thank you", "ty", "nice", "cool", "great"])) {
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

  if (includesAny(q, ["doing", "current", "right now", "today", "role", "flyrank"]) || hasAnyWord(q, ["now"])) {
    return { text: knowledge.current.summary, source: "Resume" };
  }

  const rankedMatch = matchedKnowledgeAnswer(q);
  if (rankedMatch) {
    return rankedMatch;
  }

  if (includesAny(q, ["recruiter summary", "quick summary", "short summary", "summarize rajat", "pitch", "elevator pitch"])) {
    return {
      text:
        "Rajat is a third-year AI-focused CSE student at VIT-AP and AI Fluency Intern at FlyRank AI, building practical AI products across web, data, and automation.",
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
        "Rajat is an AI Fluency Intern at FlyRank AI and a freelance AI content developer/designer through ZedWorks / IgniteWithoutCaffeine.",
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

  if (includesAny(q, ["best project", "strongest project", "top project", "main project"])) {
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

const appendMessage = (container, text, type = "bot", source = "", link = null) => {
  if (!container) {
    return null;
  }

  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.textContent = text;
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
  const quietSources = ["Conversation", "Guide", "Scope guard", "Prompt guard", "System"];
  if (source && type === "bot" && !quietSources.includes(source)) {
    const small = document.createElement("small");
    small.textContent = `Checked against ${sourceLabels[source] || source}`;
    message.appendChild(small);
  }
  container.appendChild(message);
  container.scrollTop = container.scrollHeight;
  return message;
};

const suggestionSetFor = (question, answer) => {
  const q = normalizeQuestion(question);
  if (answer.link || includesAny(q, ["resume", "cv"])) {
    return ["Summarize Rajat for HR", "What is his strongest project?"];
  }
  if (includesAny(q, ["project", "preppeer", "nextstep", "gridwatch", "built"])) {
    return ["Which project is strongest?", "Compare PrepPeer and NextStep"];
  }
  if (includesAny(q, ["skill", "stack", "tech", "python", "react", "ai", "backend", "frontend"])) {
    return ["Where did he use these skills?", "Is he good for an AI role?"];
  }
  if (answer.source?.includes("guard")) {
    return ["What is verified about Rajat?", "What roles is he open to?"];
  }
  return ["Current role", "Projects", "Resume"];
};

const appendSuggestions = (container, question, answer) => {
  if (!container) {
    return;
  }

  const row = document.createElement("div");
  row.className = "message-suggestions";
  suggestionSetFor(question, answer).forEach((label) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => {
      const form = container.closest(".chat-panel, .ai-drawer")?.querySelector(".chat-form");
      const input = form?.querySelector("input");
      if (input && form) {
        input.value = label;
        form.requestSubmit();
      }
    });
    row.appendChild(button);
  });
  container.appendChild(row);
  container.scrollTop = container.scrollHeight;
};

const handleChat = (form, input, messages) => {
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) {
      return;
    }

    const button = form.querySelector("button");
    appendMessage(messages, question, "user");
    input.value = "";
    input.disabled = true;
    if (button) {
      button.disabled = true;
    }

    const thinking = appendMessage(messages, "Thinking...", "bot thinking");
    const answer = await askRajat(question, messages);
    thinking?.remove();
    appendMessage(messages, answer.text, "bot", answer.source, answer.link);
    appendSuggestions(messages, question, answer);
    rememberTurn(messages, question, answer);

    input.disabled = false;
    if (button) {
      button.disabled = false;
    }
    input.focus();
  });
};

const pageMessages = document.querySelector("[data-chat-messages]");
const drawerMessages = document.querySelector("[data-drawer-messages]");
handleChat(
  document.querySelector("[data-chat-form]"),
  document.querySelector("[data-chat-input]"),
  pageMessages
);
handleChat(
  document.querySelector("[data-drawer-form]"),
  document.querySelector("[data-drawer-input]"),
  drawerMessages
);

document.querySelectorAll("[data-ask]").forEach((button) => {
  button.addEventListener("click", async () => {
    const question = button.dataset.ask;
    appendMessage(pageMessages, question, "user");
    const thinking = appendMessage(pageMessages, "Thinking...", "bot thinking");
    const answer = await askRajat(question, pageMessages);
    thinking?.remove();
    appendMessage(pageMessages, answer.text, "bot", answer.source, answer.link);
    appendSuggestions(pageMessages, question, answer);
    rememberTurn(pageMessages, question, answer);
  });
});

document.querySelectorAll(".ai-mode-bar").forEach((bar) => {
  const shell = bar.closest(".chat-panel, .ai-drawer");
  const messages = shell?.querySelector(".chat-messages");
  bar.querySelectorAll("[data-ai-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      bar.querySelectorAll("[data-ai-mode]").forEach((item) => item.classList.toggle("active", item === button));
      setMode(messages, button.dataset.aiMode || "default");
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
  window.setTimeout(() => drawerInput?.focus(), 120);
});

document.querySelector("[data-ai-close]")?.addEventListener("click", () => {
  drawer?.classList.remove("open");
  drawer?.setAttribute("aria-hidden", "true");
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    drawer?.classList.remove("open");
    drawer?.setAttribute("aria-hidden", "true");
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

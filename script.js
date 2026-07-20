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

const hero = document.querySelector(".hero");
const orbit = document.querySelector(".hero-orbit");
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

if (hero && orbit) {
  hero.addEventListener("pointermove", (event) => {
    if (!canHover) {
      return;
    }

    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    hero.style.setProperty("--mx", x.toFixed(3));
    hero.style.setProperty("--my", y.toFixed(3));
    orbit.style.transform = `translate(calc(-50% + ${x * 30}px), calc(-50% + ${y * 30}px)) rotateX(${y * -18}deg) rotateY(${x * 24}deg)`;
  });

  hero.addEventListener("pointerleave", () => {
    hero.style.setProperty("--mx", 0);
    hero.style.setProperty("--my", 0);
    orbit.style.transform = "";
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

const conciseList = (items, count = 4) => items.slice(0, count).join(", ");

const projectLine = (project) => `${project.name}: ${project.summary}`;

const answerRajat = (question) => {
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
      text: "Hey, I'm Rajat Intelligence. Ask me about Rajat's projects, current work, skills, certifications, or internship availability.",
      source: "Conversation"
    };
  }

  if (includesAny(q, ["how are you", "how r u", "how you doing", "what's up", "whats up"])) {
    return {
      text: "I'm sharp and ready. Want the quick version of Rajat's current work, best projects, or tech stack?",
      source: "Conversation"
    };
  }

  if (includesAny(q, ["who are you", "what are you", "your name", "introduce yourself"])) {
    return {
      text: "I'm Rajat Intelligence, a custom portfolio assistant built to answer verified questions about Rajat. What do you want to know first?",
      source: "Conversation"
    };
  }

  if (includesAny(q, ["what can you do", "help", "what should i ask", "questions can i ask"])) {
    return {
      text: "Ask me about Rajat's current role, internship availability, projects, tech stack, education, certifications, experience, or contact.",
      source: "Conversation"
    };
  }

  if (includesAny(q, ["thanks", "thank you", "ty", "nice", "cool", "great"])) {
    return {
      text: "Anytime. Want a quick recruiter-style summary of Rajat or a project breakdown?",
      source: "Conversation"
    };
  }

  const rajatTerms = ["rajat", "portfolio", "internship", "project", "skill", "study", "college", "github", "linkedin", "resume", "certification", "experience", "work", "contact", "email", "available", "tech", "stack", "flyrank", "vit", "preppeer", "nextstep", "gridwatch", "zedworks", "frontend", "backend", "full-stack", "fullstack", "python", "react", "next.js", "why", "summary", "recruiter", "fit"];
  const knownTopic = includesAny(q, rajatTerms);

  if (includesAny(q, ["capital", "weather", "recipe", "movie", "sports", "news", "bitcoin price", "write code for me", "homework"]) && !knownTopic) {
    return { text: knowledge.boundaries.refusal, source: "Scope guard" };
  }

  if (includesAny(q, ["doing", "current", "now", "right now", "today", "role", "flyrank"])) {
    return { text: knowledge.current.summary, source: "Resume" };
  }

  if (includesAny(q, ["recruiter summary", "quick summary", "short summary", "summarize rajat", "pitch", "elevator pitch"])) {
    return {
      text:
        "Rajat is an AI-focused CSE student at VIT-AP and AI Fluency Intern at FlyRank AI, building practical AI products across web, data, and automation.",
      source: "Resume + GitHub"
    };
  }

  if (includesAny(q, ["why rajat", "why should", "why hire", "why consider", "what makes rajat"])) {
    return {
      text:
        "Rajat combines build-first execution with AI fluency: he ships working products, understands prompt workflows, and can move from idea to polished interface fast.",
      source: "Resume + GitHub"
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
        `Rajat works across ${conciseList(knowledge.skills.languages, 5)}, plus ${conciseList(knowledge.skills.web, 6)} and AI tools like ${conciseList(knowledge.skills.aiTools, 5)}.`,
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
        "Rajat's resume is available on this portfolio through the Resume link in Contact. It includes his education, experience, projects, skills, and certifications.",
      source: "Resume"
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

  return { text: knowledge.boundaries.unknown, source: "Verified-data guard" };
};

const appendMessage = (container, text, type = "bot", source = "") => {
  if (!container) {
    return;
  }

  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.textContent = text;
  if (source && type === "bot") {
    const small = document.createElement("small");
    small.textContent = `Source: ${source}`;
    message.appendChild(small);
  }
  container.appendChild(message);
  container.scrollTop = container.scrollHeight;
};

const handleChat = (form, input, messages) => {
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) {
      return;
    }

    appendMessage(messages, question, "user");
    input.value = "";
    const answer = answerRajat(question);
    window.setTimeout(() => appendMessage(messages, answer.text, "bot", answer.source), 180);
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
  button.addEventListener("click", () => {
    const answer = answerRajat(button.dataset.ask);
    appendMessage(pageMessages, button.dataset.ask, "user");
    window.setTimeout(() => appendMessage(pageMessages, answer.text, "bot", answer.source), 180);
  });
});

const drawer = document.querySelector("[data-ai-drawer]");
const launcher = document.querySelector("[data-ai-launcher]");
const drawerInput = document.querySelector("[data-drawer-input]");

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

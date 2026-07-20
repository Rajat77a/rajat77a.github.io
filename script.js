const revealTargets = document.querySelectorAll(
  ".section-heading, .project-showcase, .about-section, .capabilities, .contact-section"
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

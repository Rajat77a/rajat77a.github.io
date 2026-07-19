# Rajat Krishnan - Portfolio

Personal portfolio for Rajat Krishnan, a 2nd-year Computer Science student and AI Fluency intern at FlyRank AI. The site presents my AI product work, especially PrepPeer, with a live contact form, launch analytics, social preview metadata, and a FlyRank AI Fluency Graduate badge.

Live site: <https://rajat77a.github.io>

Demo video: add unlisted YouTube link here.

## Who It Is For

This portfolio is for reviewers, internship evaluators, university readers, recruiters, and collaborators who want a fast overview of:

- who I am
- what I build
- how PrepPeer works
- how to contact me
- proof that the site is live, tracked, and maintained

## What The Site Includes

- Home page with positioning, links, contact form, and project preview
- PrepPeer case study page with screenshots and technical decisions
- About page with background, stack, and contact links
- Formspree-powered contact form with no custom backend
- Cloudflare Web Analytics
- SEO description tags and Open Graph social preview tags
- Rocket SVG favicon and Apple touch icon
- FlyRank AI Fluency Graduate badge linked to the verification page
- Responsive dark theme with accessible contrast and tap targets

## Project Structure

```text
.
├── index.html          # Home page, links, contact form, footer badge
├── preppeer.html       # PrepPeer case study
├── about.html          # About page
├── style.css           # Shared layout, dark theme, responsive styles
├── assets/             # Portfolio and PrepPeer images
├── CHANGELOG.md
├── FIX_LOG.md
└── README.md
```

## Setup

You only need a browser and Git. There is no build step.

1. Clone the repository.

```bash
git clone https://github.com/Rajat77a/rajat77a.github.io.git
cd rajat77a.github.io
```

2. Open the site locally.

```bash
# Option 1: open the file directly
start index.html

# Option 2: serve locally with Python
python -m http.server 8000
```

3. If using the Python server, visit:

```text
http://localhost:8000
```

## Deployment

The site is hosted with GitHub Pages from the `main` branch.

1. Commit changes to `main`.
2. Push to GitHub.

```bash
git add .
git commit -m "Describe the change"
git push origin main
```

3. GitHub Pages publishes the updated site at:

```text
https://rajat77a.github.io
```

## Usage Examples

Reviewers can use the site to:

- read the PrepPeer case study at `/preppeer.html`
- learn about my background at `/about.html`
- submit a message through the contact form on the home page
- verify the FlyRank badge from the footer link

Example contact-form flow:

1. Open <https://rajat77a.github.io>
2. Scroll to Contact
3. Enter name, email, and message
4. Submit
5. The page sends the form to Formspree without reloading
6. On success, the page shows: `Thanks - I'll be in touch soon.`

## Architecture

```text
Visitor
  |
  v
GitHub Pages static site
  |
  +--> index.html
  |     +--> Formspree endpoint for contact messages
  |     +--> Cloudflare Web Analytics beacon
  |     +--> FlyRank verification badge link
  |
  +--> preppeer.html
  |     +--> PrepPeer case study assets
  |
  +--> about.html
        +--> Background and contact links
```

The portfolio is intentionally static. GitHub Pages serves the HTML, CSS, and image assets. Formspree handles contact-form delivery, and Cloudflare Web Analytics records traffic without requiring a custom backend.

## V2 Eval Results

| Area | Result | Notes |
|---|---:|---|
| HTTPS live site | Pass | Site loads at `https://rajat77a.github.io` |
| Mobile responsiveness | Pass | Tested with responsive layout and mobile navigation |
| Navigation | Pass | Home, PrepPeer, and About links work |
| Contact form integration | Pass | Formspree endpoint is wired with `fetch()` and no page reload |
| Analytics | Pass | Cloudflare Web Analytics script is installed on all three pages |
| Footer badge | Pass | FlyRank AI Fluency Graduate badge is visible on the home-page footer |
| SEO titles | Pass | Home, PrepPeer, and About titles are set |
| Social preview metadata | Pass | Open Graph title, description, URL, and type are present |
| Favicon | Pass | SVG favicon and Apple touch icon are present |
| Accessibility basics | Pass | Skip link, focus states, semantic landmarks, and 44px tap targets are included |

## FL-08 Limitations

- The site is static, so it does not have a custom backend or admin dashboard.
- The contact form depends on Formspree availability and its free-tier limits.
- Cloudflare Web Analytics may show zero visits until real non-bot traffic is recorded.
- The favicon is an inline SVG emoji, so exact rendering may vary slightly by browser or operating system.
- Social previews can be cached by platforms, so updates may take time to appear after deployment.
- The PrepPeer case study uses static screenshots rather than an embedded live product demo.
- The mobile menu uses a small inline JavaScript toggle instead of a larger navigation framework.
- There is no automated test suite; verification is currently manual browser testing and launch checks.

## Design Decisions

The portfolio uses plain HTML and CSS instead of a JavaScript framework. This keeps the site fast, simple to host on GitHub Pages, and easy for a stranger to inspect. For the contact form, Formspree was chosen because it adds real message delivery without creating or maintaining a backend.

## Guardrails

- The contact form validates required fields in the browser before submission.
- The form submits with `fetch()` and shows a visible success or error message.
- If submission fails, the page gives the fallback email address: `rajatkrishnan321@gmail.com`.
- External links that open new tabs use safe link behavior where added for verification links.

## Contact

- GitHub: <https://github.com/Rajat77a>
- LinkedIn: <https://www.linkedin.com/in/rajat-krishnan77/>
- Email: <rajatkrishnan321@gmail.com>

## License

This project is available under the license included in `LICENSE`.

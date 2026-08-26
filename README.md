# Abuzar Khan — 3D Developer Portfolio

A cinematic developer portfolio built as a product: React 19 + TypeScript, Three.js via React Three Fiber, Motion, Lenis, Tailwind CSS v4 and Vite. The visual identity is a shader-built digital portrait (the real photograph re-lit as a posterised black / deep-red / warm-light sculpture with a luminance-driven parallax) that emerges from darkness in the opening and then travels into the hero in one continuous shot. Every section is rendered from a single typed data source (`src/data`), the resume is real vector HTML/SVG (also exported to PDF), and every WebGL layer has capability detection, offscreen pausing and a CSS fallback.

## Stack

| Layer | Choice |
| --- | --- |
| UI | React 19, TypeScript 5.9 |
| 3D | three.js 0.185, @react-three/fiber 9, @react-three/drei 10 |
| Motion | `motion` (Framer Motion) — scroll-linked, layout/shared-element and micro-interactions |
| Styling | Tailwind CSS v4 (`@theme` tokens in `src/index.css`) |
| Build | Vite 6 (manual chunks: `three`, `r3f`, `motion`) |
| Forms | EmailJS (contact + service requests), region-aware budgets and dial codes |
| Live data | GitHub REST API (public repos / languages), cached 30 min in `sessionStorage` |

## Getting started

```bash
npm install
cp .env.example .env.local     # fill in EmailJS keys; VITE_SITE_URL once deployed
npm run dev                    # http://localhost:3000
```

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build → `build/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check` | typecheck + build |
| `npm run assets` | Regenerates `public/Abuzar-Khan-Resume.pdf`, `public/og.png`, `public/apple-touch-icon.png` from the built site using headless Edge/Chrome (set `BROWSER_PATH` if neither is in a default location). Run after `npm run build` whenever resume data changes. |
| `node scripts/capture-intro.mjs [dir]` | Screenshots the opening sequence at 0.7 / 1.5 / 2.3 / 3.3 / 4.6 s on desktop and phone. |
| `node scripts/smoke-test.mjs` | Headless runtime audit of the production build: console/page errors at desktop, tablet, mobile and reduced-motion; project-detail flow; deep links; print mode; WebGL-disabled fallback; axe-core accessibility; external link status. Screenshots + `report.json` land in `.smoke/` (or `OUT_DIR`). |

## Environment

| Variable | Purpose |
| --- | --- |
| `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY` | EmailJS delivery for the contact form and service requests (template in `emailjs-template.html`). Without them the forms show a friendly "not configured" message. |
| `VITE_SITE_URL` | Public URL (no trailing slash). Enables `<link rel="canonical">`, absolute Open Graph URLs, the JSON-LD `url` and the website line on the resume. When unset, those tags are omitted automatically. |

## Project structure

```
src/
  data/            profile, experience, education, skills, projects  ← single source of truth
  three/           SceneCanvas (WebGL boundary), Portrait (shader portrait), Atmosphere (dust + red light), DeviceMock
  lib/screenPainter.ts   procedural, number-free product UIs painted to canvas textures
  components/      Cursor, Navbar, Magnetic, TiltCard, Reveal, DeviceFigure, ResumeDocument, Fallbacks…
  sections/        Hero, About, TechStack, Projects, ProjectDetail, ExperienceTimeline,
                   GitHubActivity, Resume, Services, Contact, Footer
  hooks/           useRenderProfile (WebGL + device tier), usePointer, useInViewport, useScrollLock…
scripts/           generate-assets.mjs (PDF/OG/icon), smoke-test.mjs (runtime audit)
public/            favicon, manifest, robots, generated PDF/OG/icon
```

## Performance & resilience

- Two persistent WebGL layers — the portrait (one plane + custom shader) and a sparse dust/light atmosphere — plus lazy per-project device scenes. WebGL is detected once; unsupported/low-power (`saveData`) devices get SVG/CSS-3D fallbacks that reuse the same painted screens.
- Device tier (`high` / `medium` / `low`) drives DPR (max 1.75 → 1.0), particle counts, antialiasing and whether the tier-2 project cards use WebGL at all.
- Every canvas stops its render loop when offscreen (`frameloop="never"`) and switches to on-demand rendering under `prefers-reduced-motion`.
- three.js / R3F / drei are lazy-loaded; the initial bundle is ~74 kB gzipped.
- Lenis smooth scrolling, the custom cursor/light, magnetic buttons and tilt cards are disabled for touch and reduced-motion users; the background canvas pauses when the tab is hidden.

## Content accuracy

All content comes from the existing resume/portfolio. Digitopia and Ebani were verified against their live sites on 26 Aug 2026 (see `verifiedNote` in `src/data/projects.ts`). The device mockups are illustrative product UIs painted procedurally — they intentionally contain no fabricated metrics — and GitHub statistics are fetched live, never hard-coded.

## Deployment

Static output in `build/`. Any static host works (Vercel, Netlify, Cloudflare Pages, GitHub Pages). Set `VITE_SITE_URL` in the host's environment, then `npm run build && npm run assets`. The `#project=<id>` deep links are hash-based, so no server rewrites are needed.

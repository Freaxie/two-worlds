# No Instruction Manual

**Two operating systems. One brain. No instruction manual.**
An interactive essay on AuDHD — the co-occurrence of autism and ADHD.

> This branch replaces the earlier Plato & Aristotle exhibition ("The Two Worlds"), which remains on `main`.
> The build setup, single-file mode and helper scripts are carried over from it.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check, then production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | TypeScript only |
| `npm run build:single` | One self-contained `dist-single/index.html` that opens straight from disk |
| `node scripts/shoot.mjs <outDir> <w> <h> [targets…]` | Screenshot chapters of the single-file build (set `CHROME_PATH` if Chrome isn't in the default place) |

Requires Node 20+. Fonts are bundled, so the site makes no third-party requests.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion · Lucide icons.
One small visualisation dependency, `d3-contour`, draws the contour map; the wave field is a hand-written WebGL shader.

## What's in it

| # | Chapter | Interaction |
| --- | --- | --- |
| 00 | Prologue | Cursor-responsive interference field: two wave sources, one field |
| 01 | Orientation | What AuDHD is and isn't; the evidence key; **cognitive landscape** contour map with an overlap slider |
| 02 | Contradiction Engine | Six pairs, **two independent dials** each, with an "outside view" and "inside view" |
| 03 | Inner experience | Seven fragments, each with an autism-associated and an ADHD-associated reading |
| 04 | Self-reflection | Sixteen statements, a written reflection, a generative pattern, notes you can copy. Never a score |
| 05 | Masking & identity | Scroll-driven mask that cracks to reveal the inner monologue; the "two ledgers" toggle |
| 06 | Toolkit | 23 strategies: search, nine category filters, expandable cards, a saved personal manual |
| 07 | Resources | Knowledge sorted by certainty, assessment guide, books, organisations, full reference library |
| 08 | Coda | |

Also: a reading-progress bar, chapter rail, mobile contents dialog, and a **sensory settings** panel
(motion, ambient effects, text size, contrast).

## Project layout

```
src/
  data/         all content: contradictions, fragments, reflection, masking, toolkit, references, resources
  sections/     one component per chapter
  components/
    layout/     Nav, SensoryPanel, ChapterRail, AmbientGlow, Logo
    ui/         ChapterHeader, Evidence badges, Cite, SysMark, Reveal
    visuals/    InterferenceField (WebGL), CognitiveLandscape, MaskVisual
  lib/          settings context, hooks, storage, cross-section events
  styles/       design tokens (Tailwind @theme) and base styles
```

Content lives in `src/data/` and is plain typed data — edit text there without touching components.

## Scientific integrity

- **AuDHD is a community term, not a diagnosis.** DSM-5-TR and ICD-11 define autism and ADHD separately; they can be diagnosed together.
- **Every claim is labelled** as Clinical, Research, Emerging, Practice or Lived experience (`src/data/evidence.ts`).
- **Every citation is real** and was checked against its published record. Reference links go to the official page or to a
  scholarly search for the exact title — no DOIs were guessed. Edit them in `src/data/references.ts`.
- **The self-reflection does not diagnose.** No scores, thresholds or probabilities; statements are original, not taken from
  clinical instruments; answers are held in memory only.
- First-person fragments are composites written for the site, not quotations.
- The site has **not been clinically reviewed**. It is educational, not medical advice.

## Accessibility

- Semantic landmarks, one `h1`, skip link, full keyboard operation, visible focus, focus-trapped dialogs.
- All text colours meet WCAG AA on every surface; axe-core (WCAG 2.1 A/AA + best practices) reports no violations.
- The two systems are distinguished by **shape and label** (diamond / circle / ring), never colour alone.
- Honours `prefers-reduced-motion`, and adds its own controls: reduced motion swaps the scroll-driven mask for a still
  layout, freezes the wave fields and shows the hero immediately.
- No flashing; ambient animation pauses off-screen and runs at a lower budget on phones.

## Privacy

No cookies, analytics or network calls. Sensory settings and saved strategies use `localStorage` on the device;
reflection answers are never stored.

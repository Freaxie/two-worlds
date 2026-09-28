# Si vs Se

An interactive exhibition in eight rooms on two ways of experiencing reality:
**Si** — experienced reality (“What do I know from what I’ve experienced?”) and
**Se** — immediate reality (“What is happening right now?”).

Built with React, Vite, Framer Motion and hand-drawn SVG. Fonts are self-hosted
(Inter Tight, Instrument Serif, JetBrains Mono via Fontsource), so the site works offline.

```sh
npm install
npm run dev          # local dev server
npm run build        # static build in dist/
npm run build:single # one self-contained HTML file in dist-single/
```

## Rooms

1. **Core difference** — one sensing body, two directions of attention (inward spiral vs outward field).
2. **One moment, two perceptions** — a rainy street corner, scroll-driven: Si overlays past evenings and flags what changed; Se tracks what moves.
3. **Two questions** — kinetic type: Si’s question accumulates echoes as you scroll; Se’s lands in a single frame.
4. **Memory vs presence** — Si layers fourteen remembered cups over this one; Se zooms ×48 into the present cup.
5. **Interactive experiment** — a kitchen that transforms under the Si / Se switch (ghosts and annotations vs steam, dust, live clock, pointer-led attention).
6. **Strengths & failure modes** — intensity dials: precedent rings that close into a wall; a stimulus field that tips into overload.
7. **Not opposites** — a live loop where present moments become stored experience and experience projects expectation.
8. **Coda** — the visitor draws: a red point for now, a slowly fading green trace for everything touched.

Motion follows one rule: Si moves slowly and settles (heavy springs, lag, echoes); Se moves instantly (hard cuts, stiff springs, flicker).
`prefers-reduced-motion` is respected throughout.

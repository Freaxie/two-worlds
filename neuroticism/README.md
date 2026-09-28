# Turbulent vs Assertive

An interactive exhibition in eight parts on neuroticism, the Big Five trait for how strongly and how long a
person reacts to threat: **turbulent** (high) and **assertive** (low). A companion to `../ti-vs-te`, built the same way.

React + Vite + Framer Motion + hand-built SVG.

```sh
npm install
npm run dev           # local dev server
npm run build         # typecheck + production build → dist/
npm run build:single  # one self-contained HTML file → dist-single/
```

| # | Part | Idea carried by the motion |
|---|------|----------------------------|
| 01 | Hero | The cursor is a stressor: “Turbulent” scatters and settles slowly, “Assertive” barely moves |
| 02 | Core difference | One stressor, two response curves: peak, recovery time, echoes |
| 03 | One evening | Sticky scroll-scrub through a night after an ambiguous message |
| 04 | Two voices | The worried question trembles harder the longer you look; the calm answer settles once |
| 05 | Failure modes | Same signal, two alarm thresholds: false alarms vs misses |
| 06 | Experiment | One week, seven worries, three real: calibrate what you take seriously |
| 07 | Not opposites | Inverted-U of arousal and performance with a slider |
| 08 | Coda | The old question struck through; the better one underlined |

Experiment content and scoring live in `src/data/week.ts`.

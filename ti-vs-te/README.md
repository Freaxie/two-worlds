# Ti vs Te

An interactive exhibition in eight parts on two ways of making sense of the world:
**Ti** — internal coherence (“Does this make sense?”) and **Te** — external effectiveness (“Does this work?”).

React + Vite + Framer Motion + hand-built SVG. No 3D.

```sh
npm install
npm run dev           # local dev server
npm run build         # typecheck + production build → dist/
npm run build:single  # one self-contained HTML file → dist-single/
```

## Parts

| # | Part | Idea carried by the motion |
|---|------|----------------------------|
| 01 | Hero | Cursor position re-weights the two words: attention is finite |
| 02 | Core difference | Scroll pulls claims inward into a lattice (Ti) / corrects a trajectory onto a target (Te) |
| 03 | One problem, two operations | Sticky scroll-scrub: Ti's path spirals inward, Te's steps outward |
| 04 | Two questions | Ti's letters converge; Te's line travels outward toward an arrow |
| 05 | Failure modes | Zeno hops that never reach “ship” / a greedy climb that stops on the lower peak |
| 06 | Experiment | Fix an overheating cooling loop by switching between Ti and Te lenses |
| 07 | Not opposites | A figure-eight loop; the slider re-weights the lobes |
| 08 | Coda | The old question is struck through; the better one is underlined in both colours |

Experiment logic lives in `src/data/experiment.ts` (pure reducer).

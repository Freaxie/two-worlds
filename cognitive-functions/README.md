# The Cognitive Functions

One website for the four exhibitions: Ti/Te, Ni/Ne, Fi/Fe and Si/Se. A lobby at `/` leads into each room.

```
npm run build:functions   # writes cognitive-functions/dist/
npx serve cognitive-functions/dist
```

| Route          | Source                                          |
| -------------- | ----------------------------------------------- |
| `/`            | `src/hub.html`, the lobby                       |
| `/ti-te.html`  | `exhibitions/ti-te.html`, Internal Coherence × External Effectiveness |
| `/ni-ne.html`  | `exhibitions/ni-ne.html`, Convergence × Divergence |
| `/fi-fe.html`  | `exhibitions/fi-fe.html`, Inner Values × Shared Values |
| `/si-se.html`  | `exhibitions/si-se.html`, Experience × Presence  |

## How the rooms stay intact

The four exhibitions are compiled single-file React builds, copied here verbatim from their published
artifacts. They are not modified. `build.mjs` adds exactly one inline `<script>` to each, right after
`<head>`, from `src/exhibit-nav.js`. That script:

- renders the persistent navigation (← All Functions, plus Ti/Te · Ni/Ne · Fi/Fe · Si/Se) inside a
  **shadow root**, so no CSS passes between it and the exhibition in either direction;
- plays the arrival transition: the room's two colours part like doors;
- plays the exit transitions to the lobby or to another room.

Each room keeps its own document, fonts, stylesheet and React root. So no styles, globals or
animations can collide between exhibitions.

`src/pairs.json` is the single source for the pair names, rooms and colours used by the lobby and the nav.
`dist/hub.html` is the lobby as a page fragment, for hosting as a claude.ai Artifact with the four rooms as
sibling files.

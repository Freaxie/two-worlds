# Essential Life Upgrade

A personal decision engine for spending money on what actually improves your life. It is not a store. It answers one question: given your goals, problems, budget and what you already own, what should you buy next, and what should you not buy yet?

Built for a 26-year-old in India who is budget-conscious but quality-oriented. The priorities are fitness and physique, grooming, focus and follow-through, sleep, a calm room, tech and making, comfort, and safety.

## Run it

```bash
cd life-upgrade
npm install
npm run dev          # http://localhost:5173
npm test             # engine, planner, validation and reducer tests
npm run build        # typecheck + production build in dist/
npm run build:single # one self-contained HTML file in dist-single/
```

Everything runs in the browser. Data lives in `localStorage` (key `essential-life-upgrade/v1`) and survives refreshes. Export and import it as JSON from Settings. No account, no server, no paid APIs.

## What's in it

| Page | What it does |
|---|---|
| **Overview** | Opens with the answer: the best next purchase and its full reasoning. Then the budget, the six questions (top five, recurring problems, what your budget buys, what's already covered, what to postpone, buy-once items), value left on the table per category, and money and time saved. Priority sliders re-rank the top five live. |
| **Catalog** | 85 curated items across 12 categories. Search (`/`), filters for class, category, price, priority, owned or not, and now or later, plus sorting. Filters live in the URL. |
| **Item drawer** | Wishlist, own, purchased, not needed or defer. Target date, price target, tier, manual priority, notes, "I already have an alternative", and "this applies to me" for situational items. Also tier comparison with diminishing-returns flags, the full score breakdown, dependencies, research links, and editing the catalog entry. |
| **Plan** | Budget presets (₹2k, ₹5k, ₹10k, ₹25k, ₹50k) or a custom amount. Balanced (the exact highest-value combination), Minimum viable and Premium setups side by side, a numbered purchase sequence, a value-versus-spend curve, and close calls. Unspent money is reported as kept. |
| **Research** | Specific models, prices, merchants, warranty, specs, pros and cons, with the price's source and check date. Shortlist comparison table, JSON import, and an optional integration endpoint. |
| **Impact** | Rate purchases (usefulness, usage, solved it, buy again). Shows best purchases, biggest mistakes, and what the engine learned. |
| **Quick inventory** | One item at a time, keys 1–4, so nothing is assumed needed. |
| **Method** | The scoring formula, rendered from the engine's own constants. |

## How scoring works

```
base  = severity (25) + frequency (20) + goal fit (25) + time saved (10)   ← × tier quality
      + durability (10) + cost of ownership (10)
score = base × modifiers + learning adjustment, then any manual priority
```

- **Modifiers.** Already covered by something you own ×0.4. Missing a hard dependency ×0.85. Missing a foundation ×0.92. Unconfirmed situational item ×0.8.
- **Learning.** −10 to +8 points per category, from your purchase ratings, shrunk while there are few ratings.
- **Price.** Price never raises a score. Premium tiers gain only through quality and lifespan and lose through cost of ownership. A premium tier is flagged as diminishing returns when it adds less than 2 points per extra ₹1,000.
- **Value per rupee.** Score per ₹1,000 of yearly ownership cost, on a log scale.
- **The planner.** Value captured = (score − 50)^1.5. Balanced solves a group knapsack over dependency-closed bundles. Only items at or above the value bar (default 60) can receive money.

## Honesty about prices

Seed prices are **illustrative ranges** for the Indian market, written without live price checks. The app labels them "est." everywhere. Nothing in the app invents a product, price, review or link. The merchant buttons open real search pages for the item. A price shows as **verified** only when its source and check date are recorded. That happens when you enter it, or when an integration you configure in Settings returns it. Shortlisted verified prices replace estimates in your plans.

## Code layout

```
src/
  domain/    types and taxonomy (goals, categories, classes, frequencies)
  data/      the seed catalog
  engine/    scoring, planner, insights, learning (pure functions, unit-tested)
  state/     reducer store, persistence, validation, import/export
  research/  search links and the optional integration
  components/ ui primitives, marks, charts, overlays, item card, panels
  views/     one file per page
```

Stack: React 19, TypeScript, Vite 8, Tailwind CSS 4, lucide icons and self-hosted Fontsource fonts (Geist, Geist Mono, Newsreader). The charts are hand-built SVG and HTML. Each has a table view.

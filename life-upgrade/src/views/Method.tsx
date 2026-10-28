import { FREQUENCY_META, FREQUENCIES, PRIORITY_META, PRIORITY_TIERS } from '../domain/taxonomy'
import { LEARNING_MAX, LEARNING_MIN, NEUTRAL_SATISFACTION, SATISFACTION_WEIGHTS } from '../engine/learning'
import { MINIMUM_SCORE, PREMIUM_SLACK, VALUE_BASELINE, VALUE_EXPONENT } from '../engine/planner'
import { DURABILITY_FULL_YEARS, MANUAL_BANDS, MODIFIERS, TIME_FULL_MINUTES, UPGRADE_POINTS_PER_K, WEIGHTS } from '../engine/scoring'

/* Reads the engine's own constants, so this page can't drift from the code */

export function Method() {
  const rows: [string, number, string][] = [
    ['Problem severity', WEIGHTS.severity, 'How bad the problem is when left alone, 1–5. Scaled (severity − 1) ÷ 4.'],
    ['Frequency of use', WEIGHTS.frequency, FREQUENCIES.map((f) => `${FREQUENCY_META[f].short} ${FREQUENCY_META[f].factor}`).join(' · ')],
    ['Fit with your goals', WEIGHTS.goals, 'For each goal: (impact ÷ 3) × (your weight ÷ 5). The strongest goal counts in full; each other goal adds 35% of its contribution. Capped at 1.'],
    ['Time saved', WEIGHTS.time, `Minutes of recurring friction removed per week. Full points at ${TIME_FULL_MINUTES} minutes or more.`],
    ['Durability', WEIGHTS.durability, `Expected lifespan of the tier. Full points at ${DURABILITY_FULL_YEARS} years or more.`],
    ['Cost of ownership', WEIGHTS.cost, 'Yearly cost = price ÷ lifespan + running costs − 12 × estimated monthly savings. Full points at ₹100 a year or less, half at ₹1,000, none at ₹10,000 or more (log scale).'],
  ]
  return (
    <article className="animate-rise max-w-3xl">
      <p className="eyebrow text-muted">Method</p>
      <h1 className="display mt-2 text-[2.25rem] text-ink sm:text-[2.75rem]">How the scores work</h1>
      <p className="pretty mt-3 text-ink-2">
        Every item gets a score from 0 to 100 for how much it would improve your life right now. The formula is fixed and fully visible: no hidden weights, and price can only ever lower a score.
      </p>

      <h2 className="display mt-12 text-[1.5rem] text-ink">1. Base score</h2>
      <p className="mt-2 text-sm text-ink-2">Six factors, worth 100 points together. The first four describe the benefit and are multiplied by the tier’s quality (budget tiers usually 0.85–0.95, standard 1, premium 1.02–1.08).</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink text-xs text-muted">
              <th scope="col" className="py-2 pr-4 font-medium">Factor</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Points</th>
              <th scope="col" className="py-2 font-medium">How it’s measured</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([f, p, how]) => (
              <tr key={f} className="border-b border-line align-top">
                <td className="py-3 pr-4 font-medium whitespace-nowrap text-ink">{f}</td>
                <td className="num py-3 pr-4 text-right text-ink">{p}</td>
                <td className="py-3 text-ink-2">{how}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="display mt-12 text-[1.5rem] text-ink">2. Modifiers</h2>
      <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-2">
        <li>
          <b className="font-medium text-ink">× {MODIFIERS.covered}</b> when you own something that does the same job (an alternative in the catalog, or you said you have one).
        </li>
        <li>
          <b className="font-medium text-ink">× {MODIFIERS.missingRequirement}</b> when it needs another purchase you don’t have yet. The planner always buys the two together.
        </li>
        <li>
          <b className="font-medium text-ink">× {MODIFIERS.missingFoundation}</b> when it builds on something you don’t have yet.
        </li>
        <li>
          <b className="font-medium text-ink">× {MODIFIERS.unconfirmedSituation}</b> for situational items until you confirm the situation applies to you.
        </li>
        <li>
          <b className="font-medium text-ink">
            {LEARNING_MIN} to +{LEARNING_MAX} points
          </b>{' '}
          learned from your ratings of past purchases in the same category. Satisfaction = {SATISFACTION_WEIGHTS.usefulness} × usefulness + {SATISFACTION_WEIGHTS.usage} × how often it’s used + {SATISFACTION_WEIGHTS.solved} × whether it solved the problem + {SATISFACTION_WEIGHTS.buyAgain} × would buy again. Averages above {NEUTRAL_SATISFACTION * 100}% lift the category, below it pull it down, scaled back while there are few ratings.
        </li>
        <li>
          <b className="font-medium text-ink">Manual priority</b> pins the score into a band:{' '}
          {PRIORITY_TIERS.map((p) => `${PRIORITY_META[p].label} ${MANUAL_BANDS[p].min}–${MANUAL_BANDS[p].max}`).join(', ')}.
        </li>
      </ul>

      <h2 className="display mt-12 text-[1.5rem] text-ink">3. Priority and verdict</h2>
      <p className="mt-2 text-sm text-ink-2">
        Priority: {PRIORITY_TIERS.map((p) => `${PRIORITY_META[p].label} from ${PRIORITY_META[p].min}`).join(', ')}. Verdicts: buy now at 75+, buy if the condition holds at 60+, wait at 45+, skip below. Anything you own, set aside, or already cover is labelled as such.
      </p>

      <h2 className="display mt-12 text-[1.5rem] text-ink">4. Value per rupee and diminishing returns</h2>
      <p className="mt-2 text-sm text-ink-2">
        Value index = score per ₹1,000 of yearly cost, on a log scale (10 points per ₹1k a year → 0, 1,000 → 100). Items whose estimated savings exceed their cost “pay for themselves.” Standard is the
        curated best-value tier. A premium tier is flagged as diminishing returns when it adds less than {UPGRADE_POINTS_PER_K} score points per extra ₹1,000 spent.
      </p>

      <h2 className="display mt-12 text-[1.5rem] text-ink">5. The budget planner</h2>
      <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-2">
        <li>
          Each purchase captures value = (score − {VALUE_BASELINE})<sup>{VALUE_EXPONENT}</sup>. The exponent makes one big fix count for more than several small wins.
        </li>
        <li>
          <b className="font-medium text-ink">Balanced</b> finds the exact highest-value combination within the budget (a group knapsack), choosing each item’s tier from budget up to standard, and only among items at or above your value bar.
        </li>
        <li>
          <b className="font-medium text-ink">Minimum viable</b> takes essentials scoring {MINIMUM_SCORE}+ at their cheapest tier, in priority order.
        </li>
        <li>
          <b className="font-medium text-ink">Premium</b> takes the top tier of everything within {PREMIUM_SLACK} points of your bar, in priority order, and flags each diminishing upgrade.
        </li>
        <li>Hard dependencies are always bought together, dependency first. Owned, unneeded, deferred and already-covered items never get money.</li>
        <li>Unspent budget is reported as money kept, never as something to fill.</li>
      </ul>

      <h2 className="display mt-12 text-[1.5rem] text-ink">6. Prices</h2>
      <p className="mt-2 text-sm text-ink-2">
        Catalog prices are illustrative ranges for the Indian market, written without live price checks, and always marked “est.” A price only shows as verified when you (or an integration you configured) record
        where it came from and when it was checked. Shortlisted verified prices replace estimates in your plans.
      </p>
    </article>
  )
}

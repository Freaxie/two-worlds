/* The experiment: one week, seven ordinary worries. Three are real, four are
   burnt toast. Each day you either take the worry seriously (the turbulent
   response) or let it pass (the assertive one). The facts on each card carry
   the cues; the two voices only carry the volume. */

import type { Who } from '../lib/ui'

export type Day = {
  day: string
  facts: string
  voice: Record<Who, string>
  real: boolean
  truth: string
  ifIgnored?: string
}

export const DAYS: Day[] = [
  {
    day: 'Mon',
    facts: 'Your car grinds when you brake. It has been getting louder all week.',
    voice: { tu: 'The brakes are going. Picture the motorway at 70.', as: 'Cars make noises. It will probably settle.' },
    real: true,
    truth: 'Brake pads worn to the metal. Fixed today: $180.',
    ifIgnored: 'Two weeks later the rotors are scored too: $900, and one frightening stop.',
  },
  {
    day: 'Tue',
    facts: 'A friend hasn’t replied in a day. They mentioned they had a busy week.',
    voice: { tu: 'They’re upset with you. Re-read what you sent.', as: 'They said they were busy.' },
    real: false,
    truth: 'They were busy. They reply on Wednesday with a meme.',
  },
  {
    day: 'Wed',
    facts: 'Your bank texts: a $1.00 charge from a merchant you don’t recognise.',
    voice: { tu: 'Someone has your identity. Check every account tonight.', as: 'It’s a dollar.' },
    real: true,
    truth: 'Card testing: thieves try a tiny charge before a big one. Card frozen.',
    ifIgnored: 'On Friday a $640 charge goes through. The dispute takes three weeks.',
  },
  {
    day: 'Thu',
    facts: 'Rumours of layoffs on another team. Your team just beat its targets.',
    voice: { tu: 'You’re next. Update your CV tonight.', as: 'Not your team, not your problem.' },
    real: false,
    truth: 'The restructure never reaches your team.',
  },
  {
    day: 'Fri',
    facts: 'Fourteen comments on your code review, every one of them labelled “nit”.',
    voice: { tu: 'Fourteen. They think you can’t do this job.', as: 'Nits. Fix them and merge.' },
    real: false,
    truth: 'Nits are small style notes. Twenty minutes of fixes.',
  },
  {
    day: 'Sat',
    facts: 'A close friend cancels plans for the third time this month. Their messages have got shorter.',
    voice: { tu: 'They’re drifting away from you.', as: 'People get busy.' },
    real: true,
    truth: 'They have been having a hard month and didn’t want to be a burden. Your call helped.',
    ifIgnored: 'You find out in November how bad October was for them.',
  },
  {
    day: 'Sun',
    facts: 'An email from your landlord. Subject: “Quick question about your lease.”',
    voice: { tu: 'You’re being evicted. Start looking at flats.', as: 'Probably the renewal.' },
    real: false,
    truth: 'It is the renewal. Same rent.',
  },
]

export const START_CALM = 10
/* Acting on a real problem takes effort; worrying about a false one takes more,
   because it has nowhere to go; an ignored real problem comes back larger. */
export const COST = { hit: 1, falseAlarm: 2, miss: 3 }

export type Choice = { who: Who; real: boolean }
export type State = { day: number; revealed: boolean; choices: Choice[] }

export const initial: State = { day: 0, revealed: false, choices: [] }

export function tally(s: State) {
  let calm = START_CALM
  let hits = 0
  let falses = 0
  let misses = 0
  for (const c of s.choices) {
    if (c.who === 'tu' && c.real) {
      hits++
      calm -= COST.hit
    } else if (c.who === 'tu') {
      falses++
      calm -= COST.falseAlarm
    } else if (c.real) {
      misses++
      calm -= COST.miss
    }
  }
  return { calm: Math.max(0, calm), hits, falses, misses }
}

export function verdict(s: State) {
  const t = tally(s)
  const tu = s.choices.filter((c) => c.who === 'tu').length
  if (t.hits === 3 && t.falses <= 1)
    return {
      head: 'Calibrated.',
      body: `You spent worry where the facts pointed and nowhere else. ${t.calm}/10 calm left, every real problem caught.`,
    }
  if (tu >= 6)
    return {
      head: 'Safe, and spent.',
      body: `Every real problem caught — and ${t.falses} false alarms paid for in full. ${t.calm}/10 calm left for next week.`,
    }
  if (t.misses >= 2)
    return {
      head: 'Rested, until the week caught up.',
      body: `${t.misses} real problems went quiet and came back louder. Letting things pass saved calm on the day and cost more of it later.`,
    }
  return {
    head: 'Somewhere in between.',
    body: `${t.hits} of 3 real problems caught, ${t.falses} false alarm${t.falses === 1 ? '' : 's'}. Re-read the facts on each card: the cues were there.`,
  }
}

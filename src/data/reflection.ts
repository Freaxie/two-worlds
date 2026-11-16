/* ------------------------------------------------------------------
   SELF-REFLECTION — deliberately NOT a screening instrument.
   Statements are original, plain-language descriptions of everyday
   experience (not items from any validated questionnaire). Answers are
   never scored, never turned into probabilities, never sent anywhere.
------------------------------------------------------------------- */

export type Answer = 'often' | 'sometimes' | 'rarely' | 'na'

export const ANSWERS: { value: Answer; label: string; hint: string }[] = [
  { value: 'often', label: 'Frequently', hint: 'A regular part of life' },
  { value: 'sometimes', label: 'Sometimes', hint: 'Now and then' },
  { value: 'rarely', label: 'Rarely', hint: 'Hardly ever' },
  { value: 'na', label: 'Not applicable', hint: 'Doesn’t fit my life' },
]

export const ANSWER_LABEL: Record<Answer, string> = {
  often: 'Frequently',
  sometimes: 'Sometimes',
  rarely: 'Rarely',
  na: 'Not applicable',
}

export type ThemeId = 'structure' | 'attention' | 'starting' | 'senses' | 'people' | 'time' | 'feeling' | 'self'

export type Theme = {
  id: ThemeId
  label: string
  strong: string
  some: string
  /** where to go next: a toolkit category, or a chapter anchor */
  next: { label: string; toolkit?: string; anchor?: string }
}

export const THEMES: Theme[] = [
  {
    id: 'structure',
    label: 'Structure & novelty',
    strong:
      'Predictability and novelty both came up often. Needing a known frame and craving something new aren’t contradictory needs — many people answer both with structure that has variety built in.',
    some: 'Structure and novelty came up sometimes. It may be worth noticing which situations tip you toward one or the other.',
    next: { label: 'Strategies for routines', toolkit: 'routines' },
  },
  {
    id: 'attention',
    label: 'Attention & interest',
    strong:
      'Your attention seems to follow interest closely: deep absorption when something captures you, real effort when it doesn’t. Many people describe this as attention that is hard to steer rather than absent.',
    some: 'Interest-led attention came up sometimes for you.',
    next: { label: 'Strategies for hyperfocus', toolkit: 'hyperfocus' },
  },
  {
    id: 'starting',
    label: 'Starting & switching',
    strong:
      'You described a frequent gap between intending and starting, and a real cost to switching. From outside that is often misread as procrastination; from inside it can feel like being stuck while wanting to move.',
    some: 'Starting and switching came up sometimes.',
    next: { label: 'Strategies for task initiation', toolkit: 'initiation' },
  },
  {
    id: 'senses',
    label: 'The senses',
    strong:
      'Sensory experience came up strongly: some input overwhelms, some input helps. That combination is common, and usually about control and channel rather than inconsistency.',
    some: 'Sensory experiences came up sometimes.',
    next: { label: 'Strategies for sensory regulation', toolkit: 'sensory' },
  },
  {
    id: 'people',
    label: 'People & energy',
    strong: 'You enjoy people and need real recovery afterwards. Both can be true at once. Planning recovery time is a strategy, not a failure.',
    some: 'Social energy came up sometimes.',
    next: { label: 'Strategies for social energy', toolkit: 'social' },
  },
  {
    id: 'time',
    label: 'Time',
    strong: 'Time came up as unreliable — vanishing or stretching. Making time visible outside your head tends to help more than trying harder to feel it.',
    some: 'An uneven sense of time came up sometimes.',
    next: { label: 'Strategies for time blindness', toolkit: 'time' },
  },
  {
    id: 'feeling',
    label: 'Feeling',
    strong:
      'Feelings may arrive fast and intensely — and sometimes only become clear later. Body-first check-ins can help close that gap.',
    some: 'Fast or hard-to-name feelings came up sometimes.',
    next: { label: 'Strategies for emotional regulation', toolkit: 'emotion' },
  },
  {
    id: 'self',
    label: 'Self & presentation',
    strong:
      'You described adjusting how you come across, and a gap between inside and outside. The masking chapter looks at what that can cost — and why it isn’t the same for everyone.',
    some: 'A gap between inside and outside came up sometimes.',
    next: { label: 'Read about masking', anchor: 'masking' },
  },
]

export const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t])) as Record<ThemeId, Theme>

export type Statement = { id: string; theme: ThemeId; text: string }

export const STATEMENTS: Statement[] = [
  { id: 's1', theme: 'structure', text: 'I feel calmer when I know what’s going to happen.' },
  { id: 's2', theme: 'structure', text: 'I get restless when nothing new is happening.' },
  { id: 's3', theme: 'structure', text: 'Routines help me — until they start to feel like a cage.' },
  { id: 's4', theme: 'attention', text: 'When something captures my interest, hours can disappear.' },
  { id: 's5', theme: 'attention', text: 'Directing my attention to things that don’t interest me takes enormous effort, even when they matter.' },
  { id: 's6', theme: 'attention', text: 'My interests arrive intensely, and sometimes leave just as suddenly.' },
  { id: 's7', theme: 'starting', text: 'There’s a gap between deciding to do something and actually starting it.' },
  { id: 's8', theme: 'starting', text: 'Switching from one activity to another costs me more than it seems to cost other people.' },
  { id: 's9', theme: 'senses', text: 'Some sounds, lights, textures or smells feel genuinely overwhelming.' },
  { id: 's10', theme: 'senses', text: 'I seek out certain sensations — movement, music, textures — to settle or focus.' },
  { id: 's11', theme: 'people', text: 'I enjoy time with people, and I need real time alone to recover afterwards.' },
  { id: 's12', theme: 'self', text: 'I adjust how I come across — rehearsing, copying, or hiding parts of myself — to fit in.' },
  { id: 's13', theme: 'time', text: 'Time either vanishes or stretches; it rarely feels like a steady flow.' },
  { id: 's14', theme: 'feeling', text: 'Emotions arrive in me quickly and intensely.' },
  { id: 's15', theme: 'feeling', text: 'Sometimes I only recognise what I was feeling later.' },
  { id: 's16', theme: 'self', text: 'How others see me doesn’t match what’s happening inside.' },
]

/* pairs of statements that pull in different directions */
export const TENSIONS: { pair: [string, string]; text: string }[] = [
  {
    pair: ['s1', 's2'],
    text: 'You marked both needing to know what’s coming and getting restless without something new. Both can be true at once — it is the first pair in the Contradiction Engine.',
  },
  {
    pair: ['s9', 's10'],
    text: 'You marked both sensory overwhelm and sensory seeking. Many people find these apply to different channels, or to input they don’t control versus input they choose.',
  },
  {
    pair: ['s4', 's5'],
    text: 'You marked both losing hours to interest and struggling to focus without it — attention that follows interest rather than importance.',
  },
]

const WEIGHT: Record<Answer, number | null> = { often: 2, sometimes: 1, rarely: 0, na: null }

export type Resonance = 'strong' | 'some' | 'faint' | 'none'

export function themeResonance(answers: Record<string, Answer>, theme: ThemeId): Resonance {
  const ws = STATEMENTS.filter((s) => s.theme === theme)
    .map((s) => (answers[s.id] ? WEIGHT[answers[s.id]] : null))
    .filter((w): w is number => w !== null)
  if (!ws.length) return 'none'
  const avg = ws.reduce((a, b) => a + b, 0) / ws.length
  if (avg >= 1.5) return 'strong'
  if (avg >= 0.75) return 'some'
  return 'faint'
}

export function detectTensions(answers: Record<string, Answer>) {
  const high = (id: string) => answers[id] === 'often' || answers[id] === 'sometimes'
  const strong = (id: string) => answers[id] === 'often'
  return TENSIONS.filter(({ pair: [x, y] }) => high(x) && high(y) && (strong(x) || strong(y)))
}

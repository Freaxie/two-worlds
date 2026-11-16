import type { EvidenceKind } from './evidence'

/* ------------------------------------------------------------------
   The Contradiction Engine. Each pair is an *illustrative* tension
   between an autism-associated and an ADHD-associated tendency —
   not universal traits, and not mutually exclusive categories.
------------------------------------------------------------------- */

export type Reading = { text: string; evidence: EvidenceKind[]; cite?: string[] }

export type Contradiction = {
  id: string
  num: string
  a: { name: string; dial: string }
  b: { name: string; dial: string }
  start: [number, number]
  aReading: Reading
  bReading: Reading
  coexist: Reading
  example: string
}

export const CONTRADICTIONS: Contradiction[] = [
  {
    id: 'predictability',
    num: '01',
    a: { name: 'Predictability', dial: 'Need for predictability' },
    b: { name: 'Novelty', dial: 'Pull toward novelty' },
    start: [74, 70],
    aReading: {
      text: 'Predictability lowers the load. When you know what comes next, less energy goes into monitoring, guessing and bracing. A strong preference for sameness is part of the diagnostic description of autism.',
      evidence: ['clinical'],
      cite: ['dsm5tr'],
    },
    bReading: {
      text: 'Novelty switches attention on. New things carry a charge that familiar ones lose, and boredom can feel physically uncomfortable. Many ADHDers describe novelty as fuel; research on novelty-seeking in ADHD is mixed.',
      evidence: ['lived', 'emerging'],
    },
    coexist: {
      text: 'They answer different questions. Predictability is about the frame — when, where, what is expected. Novelty is about the content — what is interesting inside it. Many AuDHD people describe needing a stable frame with fresh content: the same café, a new book. When the frame wobbles, anxiety rises. When the content goes stale, attention drains.',
      evidence: ['lived'],
    },
    example: 'Booking the same seat in the same cinema — for a film you know nothing about.',
  },
  {
    id: 'routine',
    num: '02',
    a: { name: 'Routine', dial: 'Reliance on routine' },
    b: { name: 'Spontaneity', dial: 'Urge for spontaneity' },
    start: [66, 74],
    aReading: {
      text: 'A routine is a decision made once instead of every day. It saves energy and protects against the distress of the unexpected.',
      evidence: ['lived', 'practice'],
    },
    bReading: {
      text: 'Impulsivity is part of the ADHD diagnostic criteria, and many describe the urge to break a pattern as a need for stimulation rather than a whim.',
      evidence: ['clinical', 'lived'],
      cite: ['dsm5tr'],
    },
    coexist: {
      text: 'The conflict is often about who decides. Spontaneity you choose can feel energising; change imposed by someone else can feel destabilising. So the same person may love a last-minute trip they invented — and lose a whole day to a meeting that moved by fifteen minutes.',
      evidence: ['lived'],
    },
    example: 'Deciding at 11pm to reorganise the entire kitchen. Being thrown for the whole of the next day when a friend cancels lunch.',
  },
  {
    id: 'sensory',
    num: '03',
    a: { name: 'Sensory avoidance', dial: 'Sensory avoidance' },
    b: { name: 'Sensory seeking', dial: 'Sensory seeking' },
    start: [80, 64],
    aReading: {
      text: 'Some input is simply too much. Hyper-reactivity to sound, light, touch, taste or smell is part of the diagnostic description of autism, and it can make ordinary places exhausting.',
      evidence: ['clinical'],
      cite: ['dsm5tr'],
    },
    bReading: {
      text: 'Some input is needed. Movement, music, chewing or fidgeting can help regulate attention and arousal. Atypical sensory profiles have also been reported in adults with ADHD, independent of autistic traits.',
      evidence: ['research', 'lived'],
      cite: ['bijlenga2017'],
    },
    coexist: {
      text: 'Avoiding and seeking often apply to different channels or different kinds of input. A meta-analysis found autistic people more likely than others to show over-responsivity, under-responsivity and sensation seeking. Many people find that control is the difference: chosen, predictable input regulates; imposed, unpredictable input overwhelms.',
      evidence: ['research', 'lived'],
      cite: ['bensasson2009'],
    },
    example: 'Leaving a party because it is too loud — then driving home with the music turned up.',
  },
  {
    id: 'interests',
    num: '04',
    a: { name: 'Deep specialisation', dial: 'Depth of focus' },
    b: { name: 'Many interests', dial: 'Breadth of interests' },
    start: [70, 76],
    aReading: {
      text: 'Intense, focused interests are part of the diagnostic description of autism — and, for many, a central source of joy, expertise and calm.',
      evidence: ['clinical', 'lived'],
      cite: ['dsm5tr'],
    },
    bReading: {
      text: 'Interest-driven attention follows novelty, and novelty fades. Many people with ADHD describe a trail of half-finished passions behind them.',
      evidence: ['lived'],
    },
    coexist: {
      text: 'The result can be serial depth: diving completely into one subject, then another, each with expert-level intensity and no guarantee of permanence. Some people keep a few lifelong anchor interests underneath the shorter waves.',
      evidence: ['lived'],
    },
    example: 'Six months knowing everything about medieval bookbinding. Then, abruptly, everything about fungi.',
  },
  {
    id: 'consistency',
    num: '05',
    a: { name: 'Need for consistency', dial: 'Need for consistency' },
    b: { name: 'Difficulty maintaining it', dial: 'Difficulty maintaining consistency' },
    start: [82, 70],
    aReading: {
      text: 'Inconsistency — in schedules, rules or other people’s behaviour — can be genuinely distressing. Consistency feels safe, and often feels right.',
      evidence: ['lived'],
    },
    bReading: {
      text: 'Sustaining a habit draws on executive functions such as planning, working memory and self-monitoring, which are on average more effortful with ADHD — though not for everyone.',
      evidence: ['research'],
      cite: ['willcutt2005'],
    },
    coexist: {
      text: 'One of the most painful combinations: wanting a consistent life and struggling to keep producing it. From outside, the gap is easily misread as hypocrisy or lack of effort. External structure — visible systems, cues, other people — can carry some of the consistency so willpower doesn’t have to.',
      evidence: ['lived', 'practice'],
    },
    example: 'Designing a beautiful colour-coded planner. Using it for nine days. Grieving the lost order more sharply than people who never wanted it.',
  },
  {
    id: 'attention',
    num: '06',
    a: { name: 'Absorbed focus', dial: 'Absorbed focus' },
    b: { name: 'Scattered attention', dial: 'Scattered attention' },
    start: [72, 78],
    aReading: {
      text: 'Monotropism — a theory developed by autistic and non-autistic researchers — proposes that autistic attention tends to gather into a few deep channels at a time.',
      evidence: ['emerging'],
      cite: ['murray2005'],
    },
    bReading: {
      text: 'Distractibility is a core ADHD criterion. Yet adults with more ADHD symptoms also report more hyperfocus: intense, absorbing concentration.',
      evidence: ['clinical', 'research'],
      cite: ['dsm5tr', 'hupfeld2019'],
    },
    coexist: {
      text: 'Both describe attention that is hard to steer rather than absent: locked in when interest is high, scattered when it isn’t. Getting into focus can be hard. Getting out of it can be harder.',
      evidence: ['research', 'lived'],
      cite: ['ashinoff2021'],
    },
    example: 'Unable to finish a two-line email. Then six hours gone — and no lunch — rewriting code you only meant to glance at.',
  },
]

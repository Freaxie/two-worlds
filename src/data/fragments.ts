import type { EvidenceKind } from './evidence'

/* ------------------------------------------------------------------
   The inner experience. First-person fragments written to evoke
   commonly described experiences — composites, not quotations from
   real people, and not claims that every AuDHD person feels this.
------------------------------------------------------------------- */

export type Effect = 'battery' | 'repeat' | 'caret' | 'crosscurrent' | 'vanish' | 'scramble' | 'split'

export type Fragment = {
  id: string
  num: string
  title: string
  tension: string
  lines: string[]
  effect: Effect
  aReading: string
  bReading: string
  meet: string
  evidence: EvidenceKind[]
  cite?: string[]
  note?: string
  toolkit?: { label: string; category: string }
}

export const FRAGMENTS: Fragment[] = [
  {
    id: 'social',
    num: '01',
    title: 'The social paradox',
    tension: 'Wanting to socialise. Needing to disappear afterwards.',
    lines: ['I wanted to go.', 'I’m glad I went.', 'I’ll need two days to come back from having gone.'],
    effect: 'battery',
    aReading:
      'Social time can mean sustained, effortful processing — faces, tone, implied meaning, turn-taking — on top of the noise and light of the room. The enjoyment is real. So is the cost.',
    bReading:
      'The pull toward people, novelty and stimulation is real too. In the moment, interest and energy can mask fatigue — until they stop masking it.',
    meet: 'The ADHD-associated pull can say yes; the autism-associated cost arrives afterwards. Wanting connection and needing solitude are both legitimate needs, not a contradiction to resolve.',
    evidence: ['lived', 'research'],
    cite: ['raymaker2020', 'hull2017'],
    note: 'Research on autistic burnout and camouflaging documents the cost of sustained social effort.',
    toolkit: { label: 'Strategies for social energy', category: 'social' },
  },
  {
    id: 'routine',
    num: '02',
    title: 'Routine fatigue',
    tension: 'Needing routine. Being bored by it.',
    lines: ['Same breakfast. Same route. Same playlist.', 'Same breakfast. Same route. Same —', 'I need something new. Not that new.'],
    effect: 'repeat',
    aReading:
      'Predictability reduces uncertainty and the effort of constant decisions. Disrupting a routine can be genuinely distressing, not merely inconvenient.',
    bReading:
      'Repetition can drain the motivation that novelty provides. After a while the routine stops registering at all — and under-stimulation is uncomfortable.',
    meet: 'Where many people land is novelty inside structure: fixed anchors, variable content. Same time, different route. Same route, new podcast.',
    evidence: ['lived'],
    toolkit: { label: 'Strategies for sleep and routines', category: 'routines' },
  },
  {
    id: 'initiation',
    num: '03',
    title: 'The initiation gap',
    tension: 'Wanting to start. Not being able to.',
    lines: ['It’s a ten-minute task.', 'I’ve been about to start it since 9:40.'],
    effect: 'caret',
    aReading:
      'Starting can stall on uncertainty — not knowing exactly how to begin or what “done” looks like — or on the cost of leaving what you were doing. Autistic adults describe “inertia”: difficulty starting, stopping and switching, often outside conscious control.',
    bReading:
      'Getting going relies on activation that may not respond to importance alone. Interest, urgency, novelty and challenge often work where “should” doesn’t.',
    meet: 'From outside, it looks like procrastination or laziness. From inside, it often feels like being frozen while fully wanting to move.',
    evidence: ['research', 'lived'],
    cite: ['buckle2021', 'willcutt2005'],
    toolkit: { label: 'Strategies for task initiation', category: 'initiation' },
  },
  {
    id: 'sensory',
    num: '04',
    title: 'Sensory crosscurrents',
    tension: 'Overwhelmed by input. Seeking more of it.',
    lines: ['The lights are too loud.', 'Can someone put music on?', 'The same song. Again.'],
    effect: 'crosscurrent',
    aReading:
      'Some input registers as too intense, too close, too much. Sensory hyper-reactivity is part of the diagnostic description of autism.',
    bReading: 'Stimulation can help regulate attention and arousal: movement, rhythm, repetition, texture.',
    meet: 'It stops looking contradictory once you separate channels and kinds of input. Unpredictable, imposed input overwhelms; chosen, predictable input regulates. The same song, again, is control.',
    evidence: ['research', 'lived'],
    cite: ['bensasson2009', 'bijlenga2017'],
    toolkit: { label: 'Strategies for sensory regulation', category: 'sensory' },
  },
  {
    id: 'interest',
    num: '05',
    title: 'The vanishing interest',
    tension: 'Total absorption. Sudden disappearance.',
    lines: ['For four months it was everything.', 'Then one Tuesday it simply wasn’t,', 'and I don’t know where it went.'],
    effect: 'vanish',
    aReading: 'Deep, focused interests can be a source of joy, regulation and expertise — and often last for years.',
    bReading: 'Interest-driven attention can surge with novelty and fade when the novelty does, sometimes abruptly.',
    meet: 'Some people describe long-term anchor interests alongside shorter, intense waves. Losing one can bring grief or guilt — unfinished projects, unused equipment. It is a pattern, not a character flaw.',
    evidence: ['lived'],
    note: 'Widely described, but this pattern has very little systematic research.',
    toolkit: { label: 'Strategies for hyperfocus', category: 'hyperfocus' },
  },
  {
    id: 'translation',
    num: '06',
    title: 'The translation problem',
    tension: 'Wanting precision. Losing the words.',
    lines: ['The thought arrives whole, all at once.', 'It leaves my mouth one wrong word at a time.'],
    effect: 'scramble',
    aReading:
      'A strong drive for accuracy — saying exactly what is meant, without ambiguity — can make approximation feel uncomfortable, even untrue.',
    bReading: 'Fast, associative thinking and working-memory load can make thoughts outrun words. Tangents and losing the thread are common.',
    meet: 'Precision and speed compete in real time. Many people find they communicate far better in writing, where they control the pace.',
    evidence: ['lived'],
  },
  {
    id: 'both',
    num: '07',
    title: 'Too much and not enough',
    tension: 'Under-stimulated and overwhelmed at once.',
    lines: ['Too much.', 'Not enough.', 'Both, right now, in the same room.'],
    effect: 'split',
    aReading: 'The environment overloads: open-plan noise, flickering light, people, demands.',
    bReading: 'Meanwhile the task itself under-stimulates — slow, repetitive, unrewarding — and attention goes looking for something, anything, else.',
    meet: 'Overwhelm and boredom are not opposite ends of one dial. They can come from different sources at the same moment: two inputs, one nervous system.',
    evidence: ['lived', 'emerging'],
    toolkit: { label: 'Strategies for executive function', category: 'executive' },
  },
]

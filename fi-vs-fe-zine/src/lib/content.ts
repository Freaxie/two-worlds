/* The words of the zine, kept apart from the layout */

export const FI_TERMS: [string, string, string][] = [
  ['personal values', 'n.', 'A private order of what is worth protecting, built from lived experience rather than consensus.'],
  ['inner alignment', 'n.', 'The felt sense of whether an act matches that order. When it doesn’t, something registers as quietly, stubbornly off.'],
  ['authenticity', 'n.', 'The aim is not to be liked but to be real: to act in a way you can stand inside afterwards.'],
]

export const FE_TERMS: [string, string, string][] = [
  ['shared values', 'n.', 'What a group holds in common: courtesy, fairness, care. Values that live between people, not inside one.'],
  ['interpersonal harmony', 'n.', 'Who is included, who is strained, what would restore the balance. Attention tuned to the relation itself.'],
  ['emotional atmosphere', 'n.', 'A room has a mood. Fe reads it quickly and shapes its own expression to meet it.'],
]

export type Reading = { notice: string; question: string; voice: string; move: string }

export type Scenario = {
  id: string
  title: string
  setup: string
  others: { x: number; y: number; read: string }[]
  values: string[]
  fi: Reading
  fe: Reading
  /* what it sounds like when both drums print */
  both: string
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'message',
    title: 'The unanswered message',
    setup:
      'Two days ago you sent a close friend a long, honest message about something that has been hurting. No reply. This morning they posted photos from a party, smiling.',
    others: [
      { x: 600, y: 140, read: 'overwhelmed?' },
      { x: 650, y: 330, read: 'unsure what to say' },
      { x: 170, y: 360, read: 'mutual friends' },
    ],
    values: ['being met', 'honesty', 'self-respect'],
    fi: {
      notice: 'The gap between what I offered and what came back.',
      question: 'Is this friendship still true to what I need from one?',
      voice: '“I said something real. I won’t pretend it didn’t matter.”',
      move: 'Wait, then say plainly that the silence hurt.',
    },
    fe: {
      notice: 'The friend’s state, the timing, the circle you share.',
      question: 'What might be happening for them, and what does the friendship need now?',
      voice: '“Maybe it landed heavily. A light check-in could open the door.”',
      move: 'Send something warm and easy to answer.',
    },
    both: '“I’ve been missing your reply. It mattered to me. Is everything okay on your side?”',
  },
  {
    id: 'vote',
    title: 'The meeting that moved on',
    setup:
      'Your team votes on a plan you argued against. The room exhales; the mood turns relieved, almost festive. Your manager looks round: “Everyone happy with that?”',
    others: [
      { x: 220, y: 120, read: 'relieved' },
      { x: 400, y: 90, read: 'wants closure' },
      { x: 580, y: 120, read: 'relieved' },
      { x: 650, y: 320, read: 'quietly doubtful' },
      { x: 150, y: 320, read: 'tired' },
    ],
    values: ['integrity', 'candour', 'the work itself'],
    fi: {
      notice: 'A small internal “no” that hasn’t gone away.',
      question: 'Can I say yes here and still recognise myself?',
      voice: '“I can accept the decision. I can’t say I agree with it.”',
      move: 'Name the reservation briefly, then commit.',
    },
    fe: {
      notice: 'Relief in the room, and one colleague who looks unsure.',
      question: 'What keeps this team together as it moves forward?',
      voice: '“The group needs this settled. My doubt can go to the right person later.”',
      move: 'Say yes now; find the doubtful colleague after.',
    },
    both: '“I’m in. One worry for the record, and I’ll put it in writing so it doesn’t slow us down.”',
  },
  {
    id: 'funeral',
    title: 'The borrowed grief',
    setup:
      'At the funeral of a colleague you barely knew, everyone around you is crying. You feel respectful, but calm. Someone takes your hand.',
    others: [
      { x: 240, y: 130, read: 'grieving' },
      { x: 560, y: 120, read: 'grieving' },
      { x: 640, y: 340, read: 'needs to be held' },
      { x: 160, y: 350, read: 'numb' },
    ],
    values: ['sincerity', 'not performing', 'quiet respect'],
    fi: {
      notice: 'The distance between what I feel and what is expected.',
      question: 'Would performing sorrow betray the real, smaller thing I feel?',
      voice: '“My calm is honest. I won’t manufacture tears.”',
      move: 'Stay present, and let quiet be your form of respect.',
    },
    fe: {
      notice: 'Grief moving through the room; a hand reaching for yours.',
      question: 'What do the people here need from me right now?',
      voice: '“This isn’t about my feeling. It’s about holding theirs.”',
      move: 'Hold the hand. Let the room’s grief set the tone.',
    },
    both: 'Hold the hand, without pretending. Steadiness is something you can honestly offer.',
  },
]

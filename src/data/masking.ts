import type { EvidenceKind } from './evidence'

/* inner monologue revealed beneath the mask — composites of commonly described masking work */
export const MONOLOGUE: { text: string; sys: 'a' | 'b' | 'both' }[] = [
  { text: 'eye contact — now — not too long', sys: 'a' },
  { text: 'what did they just say?', sys: 'b' },
  { text: 'laugh a beat after them', sys: 'a' },
  { text: 'nod. work it out from context', sys: 'b' },
  { text: 'hands still', sys: 'a' },
  { text: 'don’t interrupt — hold the thought — hold it', sys: 'b' },
  { text: 'this script worked last time', sys: 'a' },
  { text: 'you’re going to forget their name', sys: 'b' },
  { text: 'the light is buzzing. ignore it', sys: 'a' },
  { text: 'act like you read the email', sys: 'b' },
  { text: 'ask a question back', sys: 'a' },
  { text: 'set three alarms', sys: 'b' },
  { text: 'don’t mention the trains again', sys: 'a' },
  { text: 'sit still', sys: 'b' },
  { text: 'copy her tone', sys: 'a' },
  { text: 'apologise first, just in case', sys: 'b' },
  { text: 'you’re doing fine', sys: 'both' },
  { text: 'are you doing fine?', sys: 'both' },
  { text: 'two hours until home', sys: 'both' },
]

export const LAYERS = [
  {
    n: 'Layer 1',
    title: 'The presentation',
    body: 'What other people see: someone coping. Maybe someone doing well. The surface is real — it just isn’t the whole picture.',
  },
  {
    n: 'Layer 2',
    title: 'The work',
    body: 'Underneath runs a second job: monitoring faces, rehearsing sentences, suppressing movement — and, for many ADHDers, tracking time, hiding the forgetting, compensating for the lateness that hasn’t happened yet.',
  },
  {
    n: 'Layer 3',
    title: 'The cost',
    body: 'Researchers call it camouflaging. Many autistic adults describe it as exhausting, and studies link it to anxiety, depression and burnout.',
    cite: ['hull2017', 'cage2019', 'raymaker2020'],
  },
  {
    n: 'Layer 4',
    title: 'The question',
    body: 'After years of adaptation, some people find it hard to tell which parts are the mask and which are them. Unmasking isn’t one moment, and it isn’t always safe. It can be slow, partial, and chosen — context by context.',
  },
] as const

export const LEDGER = [
  {
    scene: 'The team meeting',
    outside: 'Nods along, takes notes, asks one good question.',
    inside: 'Tracking every face. Holding that question for six minutes so as not to interrupt. The fluorescent hum. Missed the last two points while rehearsing it.',
  },
  {
    scene: 'Arriving',
    outside: 'Always on time.',
    inside: 'Left forty-five minutes early because time can’t be trusted. Waited in the car, rehearsing the first sentence.',
  },
  {
    scene: 'Small talk',
    outside: 'Warm, quick, funny.',
    inside: 'A script refined over years. Laughing a beat after everyone else. The whole evening will go on recovering.',
  },
  {
    scene: 'The desk',
    outside: 'Organised.',
    inside: 'Everything on display, because out of sight is out of existence. Tidied at 2am in a burst that cost the next day.',
  },
  {
    scene: 'The good day',
    outside: 'Seems to have it all together.',
    inside: 'Spending tomorrow’s energy today. Nobody sees the crash, because it happens at home.',
  },
  {
    scene: 'Being asked a favour',
    outside: 'Happy to help!',
    inside: 'Said yes before the brakes engaged. Now quietly underwater, and too embarrassed to say so.',
  },
]

export const MASK_NOTES: { title: string; body: string; evidence: EvidenceKind[]; cite?: string[] }[] = [
  {
    title: 'What researchers mean by camouflaging',
    body: 'Autism research describes three overlapping strategies: compensation (making up for differences, such as scripting conversations), masking (hiding traits, such as suppressing stims) and assimilation (blending in, such as performing to fit a group).',
    evidence: ['research'],
    cite: ['hull2019', 'hull2017'],
  },
  {
    title: 'What it can cost',
    body: 'Camouflaging is associated with exhaustion, anxiety and depression in several studies; camouflaging across many contexts, and switching between them, was linked to poorer mental health. Autistic burnout has been described as chronic exhaustion, loss of skills and reduced tolerance to stimulus.',
    evidence: ['research'],
    cite: ['cage2019', 'raymaker2020'],
  },
  {
    title: 'Not everyone masks the same way',
    body: 'Masking varies with context, safety, culture, gender and support. Some people mask heavily, some barely, some can’t. It can be deliberate or automatic — and for some it is protective, because being visibly different isn’t always safe.',
    evidence: ['research', 'lived'],
    cite: ['cage2019'],
  },
  {
    title: 'ADHD masking',
    body: 'Compensating for ADHD — over-preparing, arriving absurdly early, hypervigilance about forgetting, perfectionism as a safety net — is widely described, but has far less research than autistic camouflaging.',
    evidence: ['emerging', 'lived'],
  },
  {
    title: 'Identity after adaptation',
    body: 'Many late-identified adults describe re-reading their whole history: which preferences were theirs, and which were adaptations. Unmasking, where possible, tends to be gradual — chosen context by context, not a single unveiling.',
    evidence: ['lived'],
  },
]

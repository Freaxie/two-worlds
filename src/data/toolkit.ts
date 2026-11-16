import type { EvidenceKind } from './evidence'

/* ------------------------------------------------------------------
   A PARTIAL MANUAL. Practical strategies, each with the problem it
   addresses, why it might help, how to try it, and where it falls
   short. Evidence labels are honest: many useful strategies have
   little direct research behind them, and say so.
------------------------------------------------------------------- */

export type CategoryId =
  | 'executive'
  | 'sensory'
  | 'routines'
  | 'emotion'
  | 'initiation'
  | 'time'
  | 'social'
  | 'organisation'
  | 'hyperfocus'

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'executive', label: 'Executive function' },
  { id: 'initiation', label: 'Task initiation' },
  { id: 'time', label: 'Time blindness' },
  { id: 'organisation', label: 'Organisation' },
  { id: 'hyperfocus', label: 'Hyperfocus' },
  { id: 'sensory', label: 'Sensory regulation' },
  { id: 'emotion', label: 'Emotional regulation' },
  { id: 'social', label: 'Social energy' },
  { id: 'routines', label: 'Sleep & routines' },
]

export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label])) as Record<CategoryId, string>

export type Strategy = {
  id: string
  title: string
  cats: CategoryId[]
  problem: string
  why: string
  how: string[]
  limits: string
  audhd?: string
  evidence: EvidenceKind[]
  cite?: string[]
}

export const STRATEGIES: Strategy[] = [
  {
    id: 'externalise',
    title: 'Get it out of your head',
    cats: ['executive', 'organisation'],
    problem: 'Working memory overloads easily. Intentions that live only in your head — the email, the prescription, the birthday — quietly disappear.',
    why: 'Offloading information into the environment reduces the load on working memory, a principle well studied in cognitive science. External systems are central to skills-based CBT for adults with ADHD.',
    how: [
      'Choose one trusted capture place — a notebook, one app, one whiteboard. Not five.',
      'Capture the moment something appears; sort it later.',
      'Review it at a fixed daily anchor, such as the first coffee.',
      'Keep it visible: a list you have to open is a list you forget exists.',
    ],
    limits: 'Systems fail when they cost more upkeep than they save. Novelty can turn into endlessly switching apps — choose something boring and durable. Very cluttered displays can overwhelm.',
    audhd: 'One side may want the perfect system; the other may abandon it within a week. Aim for good enough and still in use.',
    evidence: ['research'],
    cite: ['risko2016', 'safren2010'],
  },
  {
    id: 'point',
    title: 'Put the cue where the action happens',
    cats: ['executive', 'organisation', 'time'],
    problem: 'Knowing what to do is rarely the hard part. Remembering it at the right moment is.',
    why: 'Clinicians — notably the ADHD researcher Russell Barkley — describe working at the “point of performance”: cues placed where and when the behaviour needs to happen do the remembering for you.',
    how: [
      'Keys, wallet and bag live in one place by the door.',
      'Medication next to the toothbrush; the gym bag on the doormat.',
      'Stick the reminder on the thing itself — the note on the laptop lid, not in the calendar.',
      'Use location-based phone reminders for “when I get to the shop”.',
    ],
    limits: 'Cues fade into invisible furniture after a while; refresh them with a new colour or spot. Not every action has an obvious place to put a cue.',
    audhd: 'Too many visual cues become clutter. Choose a few high-value ones and give each a consistent home.',
    evidence: ['practice'],
  },
  {
    id: 'defaults',
    title: 'Decide once',
    cats: ['executive', 'routines'],
    problem: 'Every small decision draws on the same limited energy. By evening there may be nothing left for the decisions that matter.',
    why: 'Pre-made decisions — default meals, a work “uniform”, fixed days for chores — remove dozens of daily choices. That suits a preference for sameness and lightens executive load at the same time.',
    how: [
      'Pick three default breakfasts and rotate them.',
      'Build a small wardrobe of clothes that all go together and feel right on your skin.',
      'Give recurring jobs fixed days: laundry on Sunday, bins on Thursday.',
      'Keep a ready-made plan for low-energy days.',
    ],
    limits: 'Defaults go stale — schedule a monthly change. Very rigid defaults can make unavoidable change harder to absorb.',
    audhd: 'Defaults feed the need for predictability; rotating them every few weeks feeds the need for novelty.',
    evidence: ['practice', 'lived'],
  },
  {
    id: 'first-step',
    title: 'Shrink the first step',
    cats: ['initiation'],
    problem: 'Starting takes a burst of activation energy. The vaguer or bigger the first move, the less likely it happens.',
    why: 'Reducing the friction between you and the first action makes starting more likely. Many people find that a concrete, almost trivially small first step slips past the freeze.',
    how: [
      'Name the first visible action: not “do taxes” but “open the folder and find last year’s form”.',
      'Set the first step up in advance — the document open, the shoes by the bed.',
      'Commit only to beginning, with permission to stop after two minutes.',
      'Remove decisions from the start: same place, same tools, same playlist.',
    ],
    limits: 'This doesn’t touch emotional barriers such as fear of failure, perfectionism or rejection — pair it with emotional strategies. Sometimes the step is small but the uncertainty is huge.',
    audhd: 'For many autistic people uncertainty is a bigger block than effort, so make the first step explicit as well as small.',
    evidence: ['practice', 'lived'],
  },
  {
    id: 'visible-steps',
    title: 'Break it into visible steps',
    cats: ['initiation', 'executive'],
    problem: 'A big task is fog. You can’t start a fog.',
    why: 'Breaking tasks into concrete steps is long-standing practice in occupational therapy and education, and skills-based CBT for adult ADHD teaches it directly.',
    how: [
      'Write the steps down, each starting with a verb.',
      'Make the next step visually obvious: highlight it, or keep only it in view.',
      'Cross steps off where you can see the progress.',
      'If breaking things down is the barrier, do it with someone else, or reuse a template you made on a good day.',
    ],
    limits: 'Breaking a task down is itself an executive-function task, so it can be the very thing that’s hard. Lists that are too fine-grained can overwhelm or feel patronising.',
    audhd: 'Precise, numbered steps soothe the need for clarity; ticking them off delivers small, frequent rewards.',
    evidence: ['practice', 'research'],
    cite: ['safren2010'],
  },
  {
    id: 'if-then',
    title: 'If–then plans',
    cats: ['initiation', 'executive'],
    problem: 'Good intentions evaporate at exactly the moment they’re needed.',
    why: 'Implementation intentions — “if situation X, then I will do Y” — had a medium-to-large effect on reaching goals across many studies, and small experiments found benefits for children with ADHD.',
    how: [
      'Tie the action to a reliable cue: “If I’ve finished my coffee, then I open the budget spreadsheet.”',
      'Plan for obstacles too: “If I reach for my phone, then I put it in the other room.”',
      'Keep it to one or two plans at a time.',
      'Write the plan down, or say it out loud.',
    ],
    limits: 'Works best for specific, recurring situations — if the cue doesn’t happen, neither does the plan. Most evidence comes from non-clinical samples.',
    audhd: 'The explicit rule format suits a preference for clarity, and the cue does the remembering.',
    evidence: ['research'],
    cite: ['gollwitzer2006', 'gawrilow2008'],
  },
  {
    id: 'body-double',
    title: 'Body doubling',
    cats: ['initiation', 'social'],
    problem: 'Some tasks that feel impossible alone become possible with someone else in the room.',
    why: 'Another person’s presence can change how we perform — a classic effect in social psychology. Body doubling itself is widely reported in ADHD communities but has barely been studied directly.',
    how: [
      'Work alongside a friend in person, or on a call with a shared start time and goal.',
      'Try online co-working sessions or “work with me” videos.',
      'Keep talk minimal: a two-minute check-in at the start and the end.',
      'Save it for the tasks you avoid most.',
    ],
    limits: 'It depends on other people’s availability, and social presence can drain autistic social energy.',
    audhd: 'Choose low-demand presence — silent, cameras off, or an ambient video — to get the ADHD-associated benefit without the autism-associated social cost.',
    evidence: ['practice', 'lived'],
    cite: ['zajonc1965'],
  },
  {
    id: 'visible-time',
    title: 'Make time visible',
    cats: ['time'],
    problem: 'Time feels abstract: there is “now” and “not now”, and the distance between them is invisible.',
    why: 'Research finds differences in time perception in ADHD, on average. External, visible time does the sensing for you.',
    how: [
      'Put an analogue clock in every room you work in.',
      'Use a visual countdown timer that shows time remaining as a shrinking shape.',
      'Set transition warnings: ten minutes, five minutes, leave.',
      'Plan backwards from fixed points: leaving at 8:40 means shoes on at 8:30.',
    ],
    limits: 'Ticking clocks and loud alarms can be sensory torture, timers can create anxiety for some people, and alarms stop working once you start ignoring them.',
    audhd: 'Pick silent visual timers and gentle signals: support the time difficulty without triggering the sensory one.',
    evidence: ['research', 'practice'],
    cite: ['noreika2013'],
  },
  {
    id: 'estimate',
    title: 'Estimate, then measure',
    cats: ['time', 'executive'],
    problem: 'Tasks take longer than expected — even familiar ones — and the whole schedule collapses.',
    why: 'Comparing guesses with reality builds a personal correction factor. Planning with realistic durations is a standard part of skills-based CBT for adult ADHD.',
    how: [
      'For one week, guess how long five regular tasks will take, then time them.',
      'Find your multiplier — many people discover it is somewhere around 1.5 to 2.',
      'Schedule with corrected durations, plus a buffer.',
      'Re-check every few months.',
    ],
    limits: 'Logging is tedious and the novelty fades fast, so keep it brief. Durations still vary with energy and mood.',
    evidence: ['practice'],
    cite: ['safren2010'],
  },
  {
    id: 'buffers',
    title: 'Transition buffers',
    cats: ['time', 'routines', 'hyperfocus'],
    problem: 'Switching between activities or places costs more than it seems to cost other people.',
    why: 'Autistic adults describe difficulty starting, stopping and switching; prompts and supportive environments help. Hyperfocus makes stopping harder still. Buffers give the switch somewhere to happen.',
    how: [
      'Leave 10–15 minutes between commitments.',
      'Use a warning cue before a transition, not only at it.',
      'Write a short parking note about where you stopped, so you can let go.',
      'Create a brief landing routine for arriving home or at work.',
    ],
    limits: 'Rigid workplaces may not allow buffers, and hyperfocus can swallow them unless they have their own cue.',
    audhd: 'Both systems benefit: the transition cost on one side, the difficulty stopping on the other.',
    evidence: ['research', 'practice'],
    cite: ['buckle2021'],
  },
  {
    id: 'anchors',
    title: 'Anchors and a menu',
    cats: ['routines'],
    problem: 'A rigid routine becomes boring. No routine becomes chaos.',
    why: 'A few fixed anchors give predictability where it matters; a menu of options gives novelty without starting from scratch. Many AuDHD people describe this as the version of routine that actually lasts.',
    how: [
      'Choose three to five anchors that don’t move: wake time, medication, main meal.',
      'For everything else, keep a menu: three breakfasts, four kinds of exercise, two walking routes.',
      'Vary content inside a fixed frame: same time, different place — or same place, new podcast.',
      'Define a “minimum viable day” for when everything slips.',
    ],
    limits: 'Menus need planning on a good day. Some days even the anchors will slip — that’s information, not failure.',
    audhd: 'This is the two-dials idea applied to a week: structure for one system, variety for the other.',
    evidence: ['lived', 'practice'],
  },
  {
    id: 'sleep',
    title: 'Anchor the morning, soften the evening',
    cats: ['routines'],
    problem: 'Sleep problems are common in both autism and ADHD: late body clocks, racing thoughts, sensory discomfort.',
    why: 'A steady wake time and morning light help anchor the body clock. For chronic insomnia in adults, cognitive behavioural therapy for insomnia (CBT-I) is the recommended first-line treatment.',
    how: [
      'Keep your wake time steady, even at weekends — it anchors more than bedtime does.',
      'Get daylight soon after waking.',
      'Make the bedroom sensory-friendly: blackout, comfortable fabrics, steady sound or silence.',
      'Give your phone a bedtime outside the bedroom.',
    ],
    limits: 'Persistent sleep problems deserve medical attention — sleep apnoea, restless legs and medication effects (including stimulants) all matter. Talk to a clinician before trying supplements such as melatonin.',
    audhd: 'Late-evening hyperfocus and a real need for wind-down time can collide, so treat the wind-down as an anchor, not an afterthought.',
    evidence: ['clinical', 'research'],
    cite: ['qaseem2016', 'lai2019'],
  },
  {
    id: 'audit',
    title: 'Run a sensory audit',
    cats: ['sensory'],
    problem: 'Sensory load builds up unnoticed until it tips into overload.',
    why: 'Sensory differences are part of the autism criteria and are reported in adult ADHD too. Identifying specific triggers lets you change the environment instead of enduring it.',
    how: [
      'For a week, note when you feel drained or settled — and where you were.',
      'Look for specifics: flickering light, background chatter, scratchy labels, strong smells.',
      'Change what you can: warm indirect light, earplugs or noise-cancelling headphones, seamless clothing.',
      'Ask for adjustments at work or college; many cost little or nothing.',
    ],
    limits: 'Not every environment can change, accommodations sometimes require disclosure, and sensitivity shifts with stress, sleep and hormones.',
    audhd: 'You may need to reduce input on one channel while adding it on another. That’s precision, not contradiction.',
    evidence: ['clinical', 'research'],
    cite: ['bensasson2009', 'bijlenga2017'],
  },
  {
    id: 'menu',
    title: 'Build a regulation menu',
    cats: ['sensory', 'emotion'],
    problem: 'In the moment of overload — or deadening boredom — it’s hard to think of what helps.',
    why: 'Occupational therapists often build personalised sensory plans. Evidence for formal “sensory diets” is limited, but many people find a written menu of what calms them and what wakes them up genuinely useful.',
    how: [
      'Make two lists: things that calm you (deep pressure, dim light, rocking, humming, a familiar song) and things that alert you (movement, cold water, crunchy food, upbeat music).',
      'Keep a small kit: earplugs, a fidget, sunglasses, a snack.',
      'Use the menu early, before you hit the wall.',
      'Notice which inputs you need together.',
    ],
    limits: 'Evidence for structured sensory programmes is mixed, and some strategies are hard to use discreetly at work.',
    audhd: 'Wearing ear defenders while fidgeting isn’t inconsistent. It’s accurate.',
    evidence: ['practice', 'lived'],
  },
  {
    id: 'move',
    title: 'Let yourself move',
    cats: ['sensory', 'emotion'],
    problem: 'Suppressing movement — stims, fidgets, pacing — costs energy and can raise distress.',
    why: 'Autistic adults describe stimming as self-regulation and self-expression, and many oppose efforts to stop it. Movement helps many ADHDers focus, too.',
    how: [
      'Find forms you can use anywhere: textured rings, putty, a silent click pen.',
      'Build movement into work: a standing desk, walking calls, a wobble cushion.',
      'Notice which movements help in which states.',
      'Protect at least one space where you don’t have to suppress anything.',
    ],
    limits: 'Some stims attract stigma; you get to choose where and when. If a stim causes injury, it’s worth exploring alternatives with support.',
    evidence: ['research', 'lived'],
    cite: ['kapp2019'],
  },
  {
    id: 'body-first',
    title: 'Check in from the body up',
    cats: ['emotion'],
    problem: 'Feelings can arrive fast and huge, or stay unnamed until later. Either way, by the time you notice, it’s big.',
    why: 'Putting feelings into words was linked to reduced amygdala response in lab studies. For people who find emotion words hard — alexithymia is more common in autistic adults — starting with body signals is often easier, and early trials of interoceptive training are promising.',
    how: [
      'Set two or three tiny daily check-ins attached to anchors, such as after lunch.',
      'Ask body questions first: energy 1–5? Hungry? Thirsty? Too hot? Tense where?',
      'Then name the feeling if you can — or just “pleasant or unpleasant, high or low energy”.',
      'Look for patterns over a few weeks.',
    ],
    limits: 'Check-ins can become a chore, so keep them tiny. Naming feelings doesn’t cure intense emotion, and when words are genuinely hard the body route is enough.',
    audhd: 'Fast feelings and hard-to-name feelings can coexist; the body is a common language for both.',
    evidence: ['research', 'emerging'],
    cite: ['lieberman2007', 'kinnaird2019', 'quadt2021'],
  },
  {
    id: 'overwhelm',
    title: 'Write an overwhelm plan',
    cats: ['emotion', 'sensory'],
    problem: 'During a meltdown or shutdown, reasoning goes offline. That is not the moment to make a plan.',
    why: 'Meltdowns and shutdowns are responses to overwhelm, not choices. A plan written in calm times — and shared with people around you — turns a crisis into a sequence of known steps.',
    how: [
      'List your early warning signs: noise feels louder, words get hard, your jaw clenches.',
      'Prepare an exit line: “I need ten minutes. I’ll be back.”',
      'Know your recovery place and your kit.',
      'Tell trusted people what helps — and what doesn’t, such as questions, touch or being followed.',
    ],
    limits: 'Exits aren’t always possible, and plans need rehearsal to be usable under stress. If overwhelm is frequent, professional support is worth seeking.',
    evidence: ['practice', 'lived'],
  },
  {
    id: 'energy',
    title: 'Keep an energy budget',
    cats: ['social', 'routines'],
    problem: 'Some activities cost far more than they appear to — including ones you enjoy. Overspend for a week and the crash arrives without warning.',
    why: 'Treating energy as a budget makes invisible costs visible. Community frameworks such as “spoon theory” and energy accounting describe this; research on autistic burnout documents what happens when the account runs dry.',
    how: [
      'List common activities and rate what each costs and what it gives back.',
      'Notice that enjoyable things can still be expensive.',
      'Schedule recovery before big events, not just after.',
      'Watch for early signs of a deficit: lost skills, lower tolerance, irritability.',
    ],
    limits: 'Energy is hard to quantify and changes daily, and tracking can become yet another demand — keep it rough.',
    audhd: 'One side says yes to everything; the other is billed later. A budget lets both be heard.',
    evidence: ['lived', 'research'],
    cite: ['raymaker2020'],
  },
  {
    id: 'scripts',
    title: 'Scripts you choose',
    cats: ['social'],
    problem: 'Some social moments — declining, leaving, asking for clarity — drain energy because they have to be improvised every time.',
    why: 'Prepared phrases lower the processing load of common situations. Chosen freely they are a tool; used to hide yourself all day, they become masking.',
    how: [
      'Write a few go-to lines: “Let me check and get back to you.” “I’m going to head off — this was lovely.”',
      'Ask for clarity directly: “Do you mean X or Y?”',
      'Prepare an opening and a closing for phone calls.',
      'Keep your scripts in your notes app.',
    ],
    limits: 'Scripts can tip into masking when they hide rather than help, and unexpected turns can still derail them.',
    evidence: ['practice', 'lived'],
  },
  {
    id: 'low-demand',
    title: 'Low-demand company',
    cats: ['social'],
    problem: 'Wanting company and having no energy for conversation can both be true at once.',
    why: 'Spending time with people without the pressure to talk — sometimes called “parallel play” in neurodivergent communities — offers connection at a lower cost.',
    how: [
      'Invite a friend to work, read or game side by side.',
      'Walk together, where silence feels natural.',
      'Join activity-based groups, where the activity carries the interaction.',
      'Tell people plainly that quiet company is what you’d like.',
    ],
    limits: 'Not everyone understands the format at first, and it doesn’t replace deeper connection for those who want it.',
    evidence: ['lived'],
  },
  {
    id: 'storage',
    title: 'Visible, but calm, storage',
    cats: ['organisation'],
    problem: 'Out of sight is out of mind — and yet visual clutter is overwhelming. Both can be true in the same room.',
    why: 'Open storage keeps things findable when hidden objects stop existing; consistent categories and labels keep the view calm when clutter overwhelms.',
    how: [
      'Use clear boxes or open shelves, one category per container, labelled.',
      'Give everything a home, and give the front door a landing zone for keys, bags and post.',
      'Cut steps: no lids, no folders inside folders.',
      'Hide only the things you rarely use.',
    ],
    limits: 'It takes setup energy, and every system drifts — a short weekly reset beats waiting for a big clear-out.',
    audhd: 'The visible-versus-calm tension, solved with categories rather than doors.',
    evidence: ['practice', 'lived'],
  },
  {
    id: 'exit-ramps',
    title: 'Build exit ramps for hyperfocus',
    cats: ['hyperfocus'],
    problem: 'Hyperfocus can override hunger, sleep and appointments — and stopping abruptly feels like being pulled out of deep water.',
    why: 'Adults with more ADHD traits report more hyperfocus, and autistic writers describe deep, hard-to-leave attention. Exits planned in advance work better than willpower mid-flow.',
    how: [
      'Before starting, set a stop cue that makes you move — an alarm across the room, or a person.',
      'Keep water and a snack within reach.',
      'Stop at natural breakpoints and leave a parking note about where you were.',
      'Agree a signal with the people you live with.',
    ],
    limits: 'Alarms are easy to dismiss mid-flow, and not every deadline lines up with a natural breakpoint.',
    audhd: 'Getting in can be hard and getting out harder. Plan both ends.',
    evidence: ['research', 'practice'],
    cite: ['hupfeld2019', 'murray2005'],
  },
  {
    id: 'interest',
    title: 'Borrow from interest',
    cats: ['hyperfocus', 'initiation'],
    problem: 'Important-but-dull tasks don’t switch focus on. Interesting ones switch on too much.',
    why: 'Many ADHDers describe motivation that responds to interest, novelty, challenge and urgency more than to importance. Deliberately adding those ingredients can make dull tasks startable.',
    how: [
      'Schedule demanding work for when you naturally focus best.',
      'Add novelty: a new location, a new tool, a different order.',
      'Add challenge: race a timer, make it a game.',
      'Pair a dull task with something you love, such as one particular playlist.',
    ],
    limits: 'Not everything can be made interesting, and relying on urgency creates stressful last-minute cycles.',
    evidence: ['lived', 'emerging'],
  },
]

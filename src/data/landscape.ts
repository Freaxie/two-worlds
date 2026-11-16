import type { EvidenceKind } from './evidence'
import type { Sys } from '../components/ui/SysMark'

/* ------------------------------------------------------------------
   Fig. 01 — a map of overlap. Positions are illustrative: they show
   where traits are most often described in clinical and research
   literature, never how they show up in any one person.
   Offsets are in map units relative to the trait's anchor:
   u runs along the axis between the two peaks (negative = toward the
   autism-associated side), v runs across it.
------------------------------------------------------------------- */

export type Trait = {
  id: string
  label: string
  sys: Sys
  at: [number, number]
  detail: string
  evidence: EvidenceKind[]
  cite?: string[]
}

export const TRAITS: Trait[] = [
  /* autism-associated */
  {
    id: 'sameness',
    label: 'Preference for sameness',
    sys: 'a',
    at: [-150, -120],
    detail:
      'A strong preference for predictability and routine, and real distress at unexpected change. Insistence on sameness is part of the diagnostic description of autism.',
    evidence: ['clinical'],
    cite: ['dsm5tr'],
  },
  {
    id: 'interests',
    label: 'Intense interests',
    sys: 'a',
    at: [-175, 140],
    detail:
      'Interests that are unusually intense or focused. Part of the diagnostic criteria — and, for many autistic people, a major source of joy, expertise and regulation.',
    evidence: ['clinical', 'lived'],
    cite: ['dsm5tr'],
  },
  {
    id: 'social',
    label: 'Social communication differences',
    sys: 'a',
    at: [-200, -30],
    detail:
      'Differences in social communication are central to an autism diagnosis. The double empathy account argues that misunderstanding between autistic and non-autistic people runs both ways.',
    evidence: ['clinical', 'emerging'],
    cite: ['dsm5tr', 'milton2012', 'crompton2020'],
  },
  {
    id: 'stimming',
    label: 'Stimming',
    sys: 'a',
    at: [40, -175],
    detail:
      'Repetitive movements or sounds, which autistic adults describe as self-regulation and self-expression. ADHD fidgeting can look similar, which is why this sits toward the middle.',
    evidence: ['clinical', 'research'],
    cite: ['kapp2019'],
  },
  {
    id: 'naming',
    label: 'Hard-to-name feelings',
    sys: 'a',
    at: [-120, 60],
    detail:
      'Alexithymia — difficulty identifying and describing one’s own emotions — is substantially more common in autistic adults, though far from universal.',
    evidence: ['research'],
    cite: ['kinnaird2019'],
  },

  /* ADHD-associated */
  {
    id: 'distract',
    label: 'Distractibility',
    sys: 'b',
    at: [130, -120],
    detail:
      'Difficulty sustaining attention on things that don’t hold interest, and being pulled away by whatever does. A core ADHD criterion.',
    evidence: ['clinical'],
    cite: ['dsm5tr'],
  },
  {
    id: 'restless',
    label: 'Restlessness',
    sys: 'b',
    at: [200, -30],
    detail:
      'Physical or inner restlessness. In adults it is often felt more than seen: a motor that won’t idle.',
    evidence: ['clinical', 'lived'],
    cite: ['dsm5tr'],
  },
  {
    id: 'impulsive',
    label: 'Impulsivity',
    sys: 'b',
    at: [170, 140],
    detail:
      'Acting or speaking before the brakes engage. Part of the hyperactive–impulsive presentation of ADHD.',
    evidence: ['clinical'],
    cite: ['dsm5tr'],
  },
  {
    id: 'novelty',
    label: 'Novelty seeking',
    sys: 'b',
    at: [-40, -175],
    detail:
      'A strong pull toward new, stimulating experiences, and discomfort with boredom. Linked with ADHD in some studies, though findings vary between samples and measures.',
    evidence: ['emerging', 'lived'],
  },
  {
    id: 'time',
    label: 'Time blindness',
    sys: 'b',
    at: [135, 75],
    detail:
      'Difficulty sensing and estimating time. Research finds timing differences in ADHD on average; “time blindness” is the community’s name for living with it.',
    evidence: ['research', 'lived'],
    cite: ['noreika2013'],
  },

  /* shared ground */
  {
    id: 'ef',
    label: 'Executive function differences',
    sys: 'both',
    at: [-10, -75],
    detail:
      'Planning, working memory, task-switching and inhibition differ on average in both conditions — though not in everyone, and not in the same ways.',
    evidence: ['research'],
    cite: ['willcutt2005', 'demetriou2018'],
  },
  {
    id: 'sensory',
    label: 'Sensory differences',
    sys: 'both',
    at: [0, 30],
    detail:
      'Sensory hyper- or hypo-reactivity is part of the autism criteria. Atypical sensory profiles are also reported in adult ADHD, independent of autistic traits.',
    evidence: ['clinical', 'research'],
    cite: ['bensasson2009', 'bijlenga2017'],
  },
  {
    id: 'hyperfocus',
    label: 'Hyperfocus',
    sys: 'both',
    at: [0, -245],
    detail:
      'Absorbed, hard-to-break focus. Studied mostly in ADHD; autistic writers describe something related as monotropic attention. How the two relate is an open question.',
    evidence: ['research', 'emerging'],
    cite: ['hupfeld2019', 'murray2005', 'ashinoff2021'],
  },
  {
    id: 'emotion',
    label: 'Emotion regulation',
    sys: 'both',
    at: [0, 120],
    detail:
      'Feelings that arrive fast and are hard to steer are common in ADHD and in autism, for overlapping but not identical reasons.',
    evidence: ['research'],
    cite: ['shaw2014', 'mazefsky2013'],
  },
  {
    id: 'sleep',
    label: 'Sleep differences',
    sys: 'both',
    at: [150, 225],
    detail:
      'Sleep problems are common in both. In a large meta-analysis, sleep–wake disorders were among the most frequent co-occurring diagnoses in autism.',
    evidence: ['research'],
    cite: ['lai2019'],
  },
  {
    id: 'masking',
    label: 'Masking',
    sys: 'both',
    at: [-150, 225],
    detail:
      'Camouflaging is well documented in autism. ADHD masking — hiding lateness, forgetting or restlessness — is widely described but barely researched.',
    evidence: ['research', 'emerging'],
    cite: ['hull2017', 'hull2019'],
  },
  {
    id: 'burnout',
    label: 'Exhaustion & burnout',
    sys: 'both',
    at: [-5, 262],
    detail:
      'Autistic burnout has been defined in community-based research. Many ADHD adults describe similar cycles of overextension and crash; that pattern is less studied.',
    evidence: ['research', 'lived'],
    cite: ['raymaker2020'],
  },
]

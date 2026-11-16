import { FlaskConical, Quote, Sprout, Stethoscope, Wrench, type LucideIcon } from 'lucide-react'

/* ------------------------------------------------------------------
   Every substantive claim on this site carries one of these labels,
   so readers can tell what is diagnostic convention, what is research,
   what is still a hypothesis, and what is lived experience.
------------------------------------------------------------------- */

export type EvidenceKind = 'clinical' | 'research' | 'emerging' | 'practice' | 'lived'

export const EVIDENCE: Record<EvidenceKind, { label: string; description: string; icon: LucideIcon }> = {
  clinical: {
    label: 'Clinical',
    description: 'What diagnostic manuals (DSM-5-TR, ICD-11) and clinical guidelines state.',
    icon: Stethoscope,
  },
  research: {
    label: 'Research',
    description: 'Supported by peer-reviewed studies — with the caveats every study carries: samples, methods, averages that hide individuals.',
    icon: FlaskConical,
  },
  emerging: {
    label: 'Emerging',
    description: 'A hypothesis, model or early finding. Plausible and actively studied, but debated or not yet well tested.',
    icon: Sprout,
  },
  practice: {
    label: 'Practice',
    description: 'Used in clinical or community practice. Little direct research on this specific strategy; reasonable to try, not proven.',
    icon: Wrench,
  },
  lived: {
    label: 'Lived experience',
    description: 'Widely described by autistic and ADHD people themselves. Real and important — but not systematically measured, and not universal.',
    icon: Quote,
  },
}

export const EVIDENCE_ORDER: EvidenceKind[] = ['clinical', 'research', 'emerging', 'practice', 'lived']

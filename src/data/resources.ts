import type { EvidenceKind } from './evidence'

/* ------------------------------------------------------------------
   Further reading, sorted by how sure we are.
------------------------------------------------------------------- */

export type Claim = { text: string; cite?: string[]; kind: EvidenceKind }

export const KNOWLEDGE: { id: string; title: string; blurb: string; claims: Claim[] }[] = [
  {
    id: 'established',
    title: 'Well established',
    blurb: 'Supported by diagnostic consensus or consistent, replicated research.',
    claims: [
      { kind: 'clinical', text: 'Autism and ADHD are separate diagnoses that can be given together — allowed since DSM-5 in 2013.', cite: ['dsm5tr', 'icd11'] },
      { kind: 'research', text: 'They co-occur far more often than chance: meta-analyses estimate roughly a quarter to two-fifths of autistic people also have ADHD.', cite: ['lai2019', 'rong2021'] },
      { kind: 'research', text: 'Both are highly heritable and share part of their genetic influences.', cite: ['ronald2008', 'ghirardi2018', 'faraone2021'] },
      { kind: 'research', text: 'Both are lifelong neurodevelopmental conditions whose presentation changes with age, context and support.', cite: ['lord2020', 'posner2020'] },
      { kind: 'research', text: 'Executive-function, sensory, sleep and emotion-regulation differences are common in both — on average, not universally.', cite: ['willcutt2005', 'demetriou2018', 'bensasson2009', 'shaw2014'] },
      { kind: 'research', text: 'Many autistic adults camouflage, and camouflaging is associated with exhaustion and poorer mental health.', cite: ['hull2017', 'cage2019'] },
      { kind: 'research', text: 'When ADHD is diagnosed first, autism tends to be recognised later.', cite: ['kentrou2019', 'miodovnik2015'] },
    ],
  },
  {
    id: 'emerging',
    title: 'Emerging or debated',
    blurb: 'Plausible, actively studied, not settled. Hold these more loosely.',
    claims: [
      { kind: 'emerging', text: 'Whether AuDHD is a distinct profile — more than autism plus ADHD — rather than simply both at once.' },
      { kind: 'emerging', text: 'Monotropism as an account of autistic attention, and how it relates to ADHD hyperfocus.', cite: ['murray2005', 'ashinoff2021'] },
      { kind: 'emerging', text: 'The double empathy problem: communication breakdowns as a two-way mismatch rather than a one-sided deficit.', cite: ['milton2012', 'crompton2020'] },
      { kind: 'emerging', text: 'Reward- and motivation-based models of ADHD, such as delay aversion.', cite: ['sonugabarke2003'] },
      { kind: 'emerging', text: 'ADHD masking and compensation, which has far less research than autistic camouflaging.' },
      { kind: 'emerging', text: 'Autistic burnout as a state distinct from depression or occupational burnout.', cite: ['raymaker2020'] },
    ],
  },
  {
    id: 'community',
    title: 'Reported by the community',
    blurb: 'Lived experience, widely described. Real and valuable — not systematically measured, not universal.',
    claims: [
      { kind: 'lived', text: 'Feeling internally contradictory: needing routine and novelty, quiet and stimulation, often at once.' },
      { kind: 'lived', text: 'The two conditions masking each other — structure hiding disorganisation, impulsivity hiding social difference.' },
      { kind: 'lived', text: 'An “interest-based” motivation system that responds to interest, novelty, challenge and urgency more than importance.' },
      { kind: 'lived', text: 'Body doubling making hard tasks startable.' },
      { kind: 'lived', text: 'Cycles of intense engagement followed by crashes.' },
      { kind: 'lived', text: 'Late identification prompting a re-reading of one’s whole history.' },
    ],
  },
]

export type Book = { title: string; author: string; year: string; note: string; lens: string }

export const BOOKS: Book[] = [
  {
    title: 'Unmasking Autism: Discovering the New Faces of Neurodiversity',
    author: 'Devon Price',
    year: '2022',
    lens: 'Lived experience · masking',
    note: 'An autistic social psychologist on masking, late identification and building a life that fits.',
  },
  {
    title: 'How to ADHD: An Insider’s Guide to Working with Your Brain (Not Against It)',
    author: 'Jessica McCabe',
    year: '2024',
    lens: 'Practical · ADHD',
    note: 'Strategies from the creator of the How to ADHD channel, combining research with lived experience.',
  },
  {
    title: 'Is This Autism? A Guide for Clinicians and Everyone Else',
    author: 'Donna Henderson, Sarah Wayland & Jamell White',
    year: '2023',
    lens: 'Assessment · recognition',
    note: 'How autism can look in people who were missed — useful for clinicians and for those wondering about themselves.',
  },
  {
    title: 'The Adult Autism Assessment Handbook: A Neurodiversity Affirmative Approach',
    author: 'Davida Hartman, Tara O’Donnell-Killen, Jessica K. Doyle, Maeve Kavanagh, Anna Day & Juliana Azevedo',
    year: '2023',
    lens: 'Clinical · assessment',
    note: 'A clinicians’ guide to adult assessment, including international guidelines and neuro-affirmative practice.',
  },
  {
    title: 'Taking Charge of Adult ADHD (2nd edition)',
    author: 'Russell A. Barkley',
    year: '2021',
    lens: 'Clinical · self-help',
    note: 'A research-grounded self-help guide from a leading ADHD researcher, built around executive function.',
  },
  {
    title: 'Mastering Your Adult ADHD: A Cognitive-Behavioral Treatment Program — Client Workbook (2nd edition)',
    author: 'Steven A. Safren, Susan E. Sprich, Carol A. Perlman & Michael W. Otto',
    year: '2017',
    lens: 'Evidence-based workbook',
    note: 'The workbook behind the skills-based CBT programme tested in clinical trials.',
  },
  {
    title: 'Self-Care for Autistic People: 100+ Ways to Recharge, De-Stress, and Unmask!',
    author: 'Megan Anna Neff',
    year: '2024',
    lens: 'Practical · lived experience',
    note: 'Concrete self-care from a clinical psychologist who writes openly about being AuDHD.',
  },
  {
    title: 'NeuroTribes: The Legacy of Autism and the Future of Neurodiversity',
    author: 'Steve Silberman',
    year: '2015',
    lens: 'History',
    note: 'How autism came to be understood, misunderstood and redefined over the last century.',
  },
  {
    title: 'Divergent Mind: Thriving in a World That Wasn’t Designed for You',
    author: 'Jenara Nerenberg',
    year: '2020',
    lens: 'Lived experience · women',
    note: 'On neurodivergent women who were overlooked, including the overlap of autism, ADHD and sensitivity.',
  },
  {
    title: 'Neuroqueer Heresies',
    author: 'Nick Walker',
    year: '2021',
    lens: 'Theory · neurodiversity',
    note: 'Essays that define much of the vocabulary of the neurodiversity paradigm.',
  },
]

export type Org = { name: string; url: string; where: string; note: string }

export const ORGS: Org[] = [
  { name: 'Autistic Self Advocacy Network (ASAN)', url: 'https://autisticadvocacy.org', where: 'US', note: 'Autistic-run advocacy and plain-language resources.' },
  { name: 'National Autistic Society', url: 'https://www.autism.org.uk', where: 'UK', note: 'Information, advice and support services.' },
  { name: 'Autistica', url: 'https://www.autistica.org.uk', where: 'UK', note: 'Autism research charity with accessible research summaries.' },
  { name: 'AANE', url: 'https://www.aane.org', where: 'US', note: 'Support and community for autistic adults and families.' },
  { name: 'Reframing Autism', url: 'https://reframingautism.org.au', where: 'Australia', note: 'Autistic-led organisation focused on acceptance and education.' },
  { name: 'Autism CRC', url: 'https://www.autismcrc.com.au', where: 'Australia', note: 'Research centre co-producing research with autistic people.' },
  { name: 'CHADD', url: 'https://chadd.org', where: 'US', note: 'Children and Adults with ADHD: education, advocacy and support.' },
  { name: 'ADDA', url: 'https://add.org', where: 'US / international', note: 'Attention Deficit Disorder Association, focused on adults.' },
  { name: 'ADHD UK', url: 'https://adhduk.co.uk', where: 'UK', note: 'Information, community and advocacy for people with ADHD.' },
  { name: 'ADHD Foundation', url: 'https://www.adhdfoundation.org.uk', where: 'UK', note: 'Neurodiversity charity for ADHD, autism and related conditions.' },
  { name: 'CADDAC', url: 'https://caddac.ca', where: 'Canada', note: 'Centre for ADHD Awareness Canada.' },
  { name: 'AASPIRE', url: 'https://aaspire.org', where: 'US', note: 'Community-based participatory research partnership with autistic adults.' },
]

export const LEARN: Org[] = [
  {
    name: 'AASPIRE Healthcare Toolkit',
    url: 'https://autismandhealth.org',
    where: 'Free online',
    note: 'Tools for autistic adults and their doctors, including a personalised healthcare accommodations report.',
  },
  { name: 'NIMH: Autism spectrum disorder', url: 'https://www.nimh.nih.gov/health/topics/autism-spectrum-disorders-asd', where: 'US government', note: 'Plain-language overview from the US National Institute of Mental Health.' },
  { name: 'NIMH: ADHD', url: 'https://www.nimh.nih.gov/health/topics/attention-deficit-hyperactivity-disorder-adhd', where: 'US government', note: 'Overview of ADHD symptoms, diagnosis and treatment.' },
  { name: 'NHS: Autism', url: 'https://www.nhs.uk/conditions/autism/', where: 'UK health service', note: 'Signs, assessment routes and support in the UK.' },
  { name: 'NHS: ADHD', url: 'https://www.nhs.uk/conditions/attention-deficit-hyperactivity-disorder-adhd/', where: 'UK health service', note: 'Symptoms, diagnosis and treatment in the UK.' },
  { name: 'How to ADHD', url: 'https://howtoadhd.com', where: 'Video · community', note: 'Long-running educational channel blending research and lived experience.' },
  { name: 'Neurodivergent Insights', url: 'https://neurodivergentinsights.com', where: 'Clinician-led · community', note: 'Dr. Megan Anna Neff’s illustrated resources, including on AuDHD.' },
  { name: 'monotropism.org', url: 'https://monotropism.org', where: 'Theory resource', note: 'An introduction to monotropism and the archive of Dinah Murray’s work.' },
]

export const SUPPORT: Org[] = [
  { name: 'Find A Helpline', url: 'https://findahelpline.com', where: 'International', note: 'Directory of free, confidential crisis lines by country.' },
  { name: '988 Suicide & Crisis Lifeline', url: 'https://988lifeline.org', where: 'US — call or text 988', note: 'Free, confidential support, 24/7.' },
  { name: 'Samaritans', url: 'https://www.samaritans.org', where: 'UK & Ireland — call 116 123', note: 'Free, confidential listening support, 24/7.' },
]

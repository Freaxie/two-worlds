import type { ReactNode } from 'react'
import { ChapterHeader } from '../components/ui/ChapterHeader'
import { Cite } from '../components/ui/Cite'
import { EvidenceBadge, EvidenceLegend } from '../components/ui/Evidence'
import { Reveal } from '../components/ui/Reveal'
import { CognitiveLandscape } from '../components/visuals/CognitiveLandscape'
import type { EvidenceKind } from '../data/evidence'

type Fact = { kind: EvidenceKind; title: string; body: ReactNode }

const FACTS: Fact[] = [
  {
    kind: 'clinical',
    title: 'Two diagnoses, one person',
    body: (
      <>
        In the DSM-5-TR and ICD-11, autism and ADHD are separate neurodevelopmental diagnoses that can be given together.
        That is recent: DSM-IV did not allow ADHD to be diagnosed alongside autism, and the exclusion was only removed in
        2013 <Cite ids={['dsm5tr', 'icd11']} />.
      </>
    ),
  },
  {
    kind: 'lived',
    title: '“AuDHD” is a community word',
    body: (
      <>
        It isn’t a clinical term. Autistic ADHDers coined it to name an experience that felt like more than a list of two
        diagnoses — and found each other through it.
      </>
    ),
  },
  {
    kind: 'research',
    title: 'Shared roots, separate conditions',
    body: (
      <>
        Twin and family studies suggest autism and ADHD share part of their genetic influences, while remaining distinct
        enough to diagnose separately <Cite ids={['ronald2008', 'ghirardi2018', 'antshel2019']} />.
      </>
    ),
  },
  {
    kind: 'research',
    title: 'One can hide the other',
    body: (
      <>
        When ADHD is diagnosed first, autism tends to be recognised later — by about 1.8 years on average in one Dutch study{' '}
        <Cite ids={['kentrou2019', 'miodovnik2015']} />. Many adults only find the second piece decades on.
      </>
    ),
  },
  {
    kind: 'emerging',
    title: 'More than the sum of its parts?',
    body: (
      <>
        Whether AuDHD forms a distinct profile — rather than simply autism plus ADHD — is an open research question. Much of
        what is written about it, including on this site, comes from lived experience rather than controlled studies.
      </>
    ),
  },
]

const STATS = [
  {
    n: '28%',
    text: 'of autistic people also had ADHD in a 2019 meta-analysis of 96 studies',
    cite: 'lai2019',
  },
  {
    n: '38%',
    text: 'in a 2021 meta-analysis — estimates moved with age, setting and diagnostic criteria',
    cite: 'rong2021',
  },
  {
    n: '21%',
    text: 'of children and adolescents with ADHD met the threshold for autism, across 22 studies',
    cite: 'hollingdale2020',
  },
]

export function Orientation() {
  return (
    <section id="orientation" aria-labelledby="orientation-title" className="relative py-[clamp(6rem,12vw,11rem)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60rem] bg-[radial-gradient(50%_40%_at_15%_20%,rgb(169_156_245/0.07),transparent_70%)]"
      />
      <div className="wrap">
        <ChapterHeader
          id="orientation"
          num="01"
          kicker="Orientation"
          title={
            <>
              Not a third condition.
              <br />
              <em>A particular overlap.</em>
            </>
          }
          dek={
            <p>
              AuDHD means being both autistic and ADHD. The two can pull in opposite directions, borrow each other’s
              disguises, and fill each other’s gaps — which is why the combination can be hard to recognise from the outside,
              and sometimes from the inside too.
            </p>
          }
        />

        {/* how often */}
        <div className="mt-[clamp(4rem,8vw,7rem)] grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="eyebrow text-ink-3">How often they travel together</p>
            <p className="mt-4 max-w-sm text-[0.9375rem] leading-relaxed text-ink-2">
              Different samples, methods and definitions give different numbers. What is consistent: the overlap is far larger
              than chance would predict.
            </p>
            <EvidenceBadge kind="research" className="mt-5" />
          </Reveal>
          <ul className="grid gap-8 sm:grid-cols-3 lg:col-span-8">
            {STATS.map((s, i) => (
              <Reveal as="li" key={s.n} delay={0.08 * i} className="border-t border-line-2 pt-5">
                <p className="display text-[clamp(3.5rem,2.5rem+3vw,5.5rem)] leading-none text-ink">
                  <span className="text-[0.45em] align-[0.62em] text-ink-3">≈</span>
                  {s.n}
                </p>
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-2">{s.text}.</p>
                <p className="mt-2 text-[0.8125rem]">
                  <Cite ids={[s.cite]} bare />
                </p>
              </Reveal>
            ))}
          </ul>
        </div>

        {/* what it is / isn't */}
        <div className="mt-[clamp(4rem,8vw,7rem)] grid gap-x-10 gap-y-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="display text-[clamp(1.9rem,1.4rem+1.6vw,2.75rem)] leading-[1.08] text-ink">
              What we know, what we suspect, and <em>what people say.</em>
            </p>
          </Reveal>
          <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:col-span-8">
            {FACTS.map((f, i) => (
              <Reveal key={f.title} delay={0.05 * i} className="border-t border-line pt-5">
                <EvidenceBadge kind={f.kind} />
                <h3 className="mt-4 text-[1.1875rem] font-semibold leading-snug text-ink">{f.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{f.body}</p>
              </Reveal>
            ))}
            <Reveal delay={0.25} className="rounded-2xl border border-line bg-night-2/60 p-5 sm:col-span-2">
              <p className="eyebrow text-amber">A note on language</p>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
                This site mostly uses identity-first language (“autistic person”), which many autistic people prefer{' '}
                <Cite ids={['kenny2016']} />, alongside “ADHDer” and “person with ADHD”. Preferences genuinely differ. Yours
                are valid. It also uses “autism-associated” and “ADHD-associated” for tendencies — because none of them belongs
                exclusively to either condition.
              </p>
            </Reveal>
          </div>
        </div>

        {/* evidence key */}
        <div id="evidence-key" className="mt-[clamp(4rem,8vw,7rem)] scroll-mt-24">
          <Reveal>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <h3 className="display text-[clamp(1.75rem,1.3rem+1.4vw,2.5rem)] text-ink">How to read this site</h3>
              <p className="max-w-md text-[0.9375rem] leading-relaxed text-ink-3">
                Claims carry a label saying what kind of knowledge they are. Citations link to full references at the end.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <EvidenceLegend />
          </Reveal>
        </div>

        {/* landscape */}
        <div className="mt-[clamp(5rem,10vw,9rem)]">
          <Reveal className="mb-10 max-w-2xl">
            <p className="eyebrow text-ink-3">Interactive · Fig. 01</p>
            <h3 className="display mt-4 text-[clamp(2rem,1.4rem+2vw,3.25rem)] leading-[1.05] text-ink">
              The cognitive landscape
            </h3>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-2">
              Textbooks draw autism and ADHD as separate islands. Bring them together and many traits turn out to live on
              shared ground. Select any point on the map to see what it means — and how sure anyone is about it.
            </p>
          </Reveal>
          <CognitiveLandscape />
        </div>
      </div>
    </section>
  )
}

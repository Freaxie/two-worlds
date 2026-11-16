import { useEffect, useState, type ReactNode } from 'react'
import { ArrowUpRight, BookOpen, HeartHandshake, LifeBuoy } from 'lucide-react'
import { ChapterHeader } from '../components/ui/ChapterHeader'
import { Cite } from '../components/ui/Cite'
import { EvidenceBadge } from '../components/ui/Evidence'
import { Reveal } from '../components/ui/Reveal'
import { EVIDENCE } from '../data/evidence'
import { REFERENCES, refHref, type RefTopic } from '../data/references'
import { BOOKS, KNOWLEDGE, LEARN, ORGS, SUPPORT, type Org } from '../data/resources'

const TOPICS: { id: RefTopic | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'both', label: 'Co-occurrence' },
  { id: 'autism', label: 'Autism' },
  { id: 'adhd', label: 'ADHD' },
  { id: 'strategies', label: 'Strategies' },
  { id: 'clinical', label: 'Clinical frameworks' },
]

function ExtLink({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`link inline-flex items-center gap-1 ${className}`}>
      {children}
      <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  )
}

function OrgList({ items }: { items: Org[] }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((o) => (
        <li key={o.url} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
          <div>
            <ExtLink href={o.url} className="font-semibold text-ink">
              {o.name}
            </ExtLink>
            <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-2">{o.note}</p>
          </div>
          <p className="font-mono text-[0.75rem] uppercase tracking-[0.08em] text-ink-3 sm:pt-1 sm:text-right">{o.where}</p>
        </li>
      ))}
    </ul>
  )
}

const ASSESSMENT = [
  {
    title: 'Who assesses',
    body: 'Depending on where you live: psychiatrists, clinical psychologists, neuropsychologists or specialist multidisciplinary teams. In many public systems the route starts with a GP or primary-care doctor. Autism and ADHD are often assessed separately, sometimes by different services.',
  },
  {
    title: 'What usually happens',
    body: 'A detailed interview about your life now and your development as a child; standardised questionnaires and observational tools; where possible, information from someone who knew you young (school reports help); and careful consideration of other explanations and co-occurring conditions — anxiety, depression, trauma, sleep, learning differences, physical health.',
  },
  {
    title: 'How to prepare',
    body: 'Write down concrete examples from work, home, relationships and the senses. Note what you’ve already tried. Gather any childhood records you can. Bring your questions — and, if useful, the notes from the reflection chapter.',
  },
  {
    title: 'About online screeners',
    body: 'Questionnaires such as the AQ (Autism-Spectrum Quotient) or the ASRS (Adult ADHD Self-Report Scale) can prompt reflection, but they cannot diagnose: they miss some people and flag others who don’t meet criteria.',
  },
  {
    title: 'Why people do — or don’t — pursue diagnosis',
    body: 'A formal diagnosis can open the door to treatment (such as ADHD medication), formal adjustments at work or school, and validation. Waiting lists and costs are real barriers, and many people find self-understanding valuable in the meantime. Only a clinician can rule other explanations in or out.',
  },
]

export function Resources() {
  const [topic, setTopic] = useState<RefTopic | 'all'>('all')

  // following an inline citation always reveals its reference
  useEffect(() => {
    const on = () => {
      if (!location.hash.startsWith('#ref-')) return
      setTopic('all')
      requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'center' }))
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  const refs = REFERENCES.filter((r) => topic === 'all' || r.topic === topic)

  return (
    <section id="resources" aria-labelledby="resources-title" className="relative border-t border-line bg-charcoal py-[clamp(6rem,12vw,11rem)]">
      <div className="wrap">
        <ChapterHeader
          id="resources"
          num="07"
          kicker="Resources & further reading"
          title={
            <>
              Sorted by
              <br />
              <em>how sure we are.</em>
            </>
          }
          dek={
            <p>
              What is established, what is still a hypothesis, and what comes from lived experience are different kinds of
              knowledge. All three matter. They shouldn’t be confused with one another.
            </p>
          }
        />

        {/* the knowledge map */}
        <div className="mt-[clamp(3rem,6vw,5rem)] grid gap-4 lg:grid-cols-3">
          {KNOWLEDGE.map((col, ci) => (
            <Reveal key={col.id} delay={0.06 * ci} className="rounded-[1.5rem] border border-line bg-charcoal-2/70 p-6">
              <h3 className="font-display text-[1.75rem] leading-tight text-ink">{col.title}</h3>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-3">{col.blurb}</p>
              <ul className="mt-6 space-y-4">
                {col.claims.map((c) => {
                  const Icon = EVIDENCE[c.kind].icon
                  return (
                    <li key={c.text} className="grid grid-cols-[1.25rem_1fr] gap-3 border-t border-line pt-4">
                      <Icon className={`mt-1 size-4 ${c.kind === 'lived' ? 'text-amber' : c.kind === 'emerging' ? 'text-violet' : c.kind === 'research' ? 'text-cyan' : 'text-ink'}`} aria-hidden="true" />
                      <p className="text-[0.9375rem] leading-relaxed text-ink-2">
                        <span className="sr-only">{EVIDENCE[c.kind].label}: </span>
                        {c.text} {c.cite && <Cite ids={c.cite} />}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </Reveal>
          ))}
        </div>

        {/* assessment */}
        <div id="assessment" className="mt-[clamp(5rem,9vw,8rem)] grid scroll-mt-24 gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <BookOpen className="size-6 text-cyan" aria-hidden="true" />
            <h3 className="display mt-4 text-[clamp(1.9rem,1.4rem+1.6vw,2.8rem)] leading-[1.05] text-ink">
              If you’re considering an assessment
            </h3>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-2">
              Processes differ by country and service. UK guidance for adults is set out by NICE <Cite ids={['nice142', 'nice87']} />.
            </p>
            <EvidenceBadge kind="clinical" className="mt-5" />
          </Reveal>
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:col-span-8">
            {ASSESSMENT.map((a, i) => (
              <Reveal key={a.title} delay={0.04 * i} className="border-t border-line pt-5">
                <h4 className="text-[1.0625rem] font-semibold text-ink">{a.title}</h4>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{a.body}</p>
              </Reveal>
            ))}
          </div>
        </div>

        {/* books */}
        <div className="mt-[clamp(5rem,9vw,8rem)]">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <h3 className="display text-[clamp(1.9rem,1.4rem+1.6vw,2.8rem)] text-ink">Books</h3>
            <p className="max-w-md text-[0.875rem] leading-relaxed text-ink-3">
              A mix of research-grounded, clinical and first-person perspectives — each labelled with its lens.
            </p>
          </Reveal>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {BOOKS.map((b, i) => (
              <Reveal as="li" key={b.title} delay={0.03 * (i % 2)} className="flex flex-col rounded-[1.25rem] border border-line bg-charcoal-2/60 p-5">
                <p className="font-mono text-[0.75rem] uppercase tracking-[0.08em] text-amber">{b.lens}</p>
                <p className="mt-3 font-display text-[1.3rem] leading-snug text-ink">{b.title}</p>
                <p className="mt-1 text-[0.875rem] text-ink-3">
                  {b.author} · {b.year}
                </p>
                <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-ink-2">{b.note}</p>
                <ExtLink href={`https://openlibrary.org/search?q=${encodeURIComponent(b.title.split(':')[0] + ' ' + b.author.split(/,|&/)[0])}`} className="mt-4 text-[0.875rem] text-ink-2">
                  Find it in a library catalogue
                </ExtLink>
              </Reveal>
            ))}
          </ul>
        </div>

        {/* organisations & learning */}
        <div className="mt-[clamp(5rem,9vw,8rem)] grid gap-14 lg:grid-cols-2">
          <Reveal>
            <h3 className="flex items-center gap-3 font-display text-[1.9rem] text-ink">
              <HeartHandshake className="size-6 text-violet" aria-hidden="true" /> Organisations
            </h3>
            <p className="mb-6 mt-2 text-[0.875rem] text-ink-3">Advocacy, support and research — several are autistic- or ADHD-led.</p>
            <OrgList items={ORGS} />
          </Reveal>
          <Reveal delay={0.08}>
            <h3 className="flex items-center gap-3 font-display text-[1.9rem] text-ink">
              <BookOpen className="size-6 text-cyan" aria-hidden="true" /> Learn more
            </h3>
            <p className="mb-6 mt-2 text-[0.875rem] text-ink-3">Public-health overviews, clinical tools and well-regarded community educators.</p>
            <OrgList items={LEARN} />
          </Reveal>
        </div>

        {/* support */}
        <Reveal className="mt-14">
          <div id="support" className="scroll-mt-24 rounded-[1.5rem] border border-amber/40 bg-amber-deep/25 p-6 sm:p-8">
            <h3 className="flex items-center gap-3 font-display text-[1.75rem] text-ink">
              <LifeBuoy className="size-6 text-amber" aria-hidden="true" /> If things feel unmanageable right now
            </h3>
            <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
              Burnout, overwhelm and long years of masking can take a heavy toll. If you’re in crisis, contact local emergency
              services, or a free, confidential line:
            </p>
            <div className="mt-6">
              <OrgList items={SUPPORT} />
            </div>
          </div>
        </Reveal>

        {/* reference library */}
        <div id="references" className="mt-[clamp(5rem,9vw,8rem)] scroll-mt-24">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="display text-[clamp(1.9rem,1.4rem+1.6vw,2.8rem)] text-ink">Reference library</h3>
              <p className="mt-3 max-w-xl text-[0.875rem] leading-relaxed text-ink-3">
                Every source cited on this site. Links open the official page or a scholarly search for the exact title.
              </p>
            </div>
          </Reveal>
          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter references by topic">
            {TOPICS.map((t) => (
              <button key={t.id} type="button" className="chip" aria-pressed={topic === t.id} onClick={() => setTopic(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <ol className="mt-8 grid gap-x-10 md:grid-cols-2">
            {refs.map((r) => (
              <li
                key={r.id}
                id={`ref-${r.id}`}
                className="scroll-mt-28 border-t border-line py-5 transition-colors duration-700 target:rounded-xl target:border-transparent target:bg-amber/10 target:px-4 target:outline target:outline-1 target:outline-amber/60"
              >
                <p className="text-[0.875rem] text-ink-3">
                  {r.authors} ({r.year})
                </p>
                <p className="mt-1 text-[0.9375rem] font-semibold leading-snug text-ink">{r.title}</p>
                <p className="mt-1 text-[0.875rem] italic text-ink-2">{r.source}</p>
                <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-2">{r.note}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <EvidenceBadge kind={r.kind} />
                  <ExtLink href={refHref(r)} className="text-[0.8125rem] text-ink-2">
                    {r.url ? 'Official page' : 'Find this paper'}
                  </ExtLink>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import { contours } from 'd3-contour'
import { TRAITS, type Trait } from '../../data/landscape'
import { useInView, useMedia } from '../../lib/hooks'
import { useSettings } from '../../lib/settings'
import { Cite } from '../ui/Cite'
import { EvidenceRow } from '../ui/Evidence'
import { SYS_LABEL, SysMark, SysTag, type Sys } from '../ui/SysMark'

/* map units: u runs between the two peaks (0..1000), v across (0..620) */
const U = 1000
const V = 620
const V0 = V / 2
const SEP_APART = 560
const SEP_TOGETHER = 170
const SEP_DEFAULT = 300
const STEP = 8
const THRESHOLDS = Array.from({ length: 13 }, (_, i) => 0.1 + i * 0.1)

const SU = 150
const SV = 128
const gauss = (du: number, dv: number) => Math.exp(-((du * du) / (2 * SU * SU) + (dv * dv) / (2 * SV * SV)))
const noise = (u: number, v: number) =>
  0.045 * (Math.sin(u * 0.011 + 1.3) * Math.cos(v * 0.014 - 0.4) + 0.6 * Math.sin(u * 0.023 - v * 0.017 + 2.1))

function ringPath(mp: number[][][][], k: number) {
  let d = ''
  for (const poly of mp)
    for (const ring of poly) {
      for (let i = 0; i < ring.length; i++) d += (i ? 'L' : 'M') + (ring[i][0] * k).toFixed(1) + ',' + (ring[i][1] * k).toFixed(1)
      d += 'Z'
    }
  return d
}

const overlapPct = (sep: number) => Math.round(((SEP_APART - sep) / (SEP_APART - SEP_TOGETHER)) * 100)

function describe(sep: number) {
  const o = overlapPct(sep)
  if (o < 15) return 'two separate islands — the way textbooks describe the two conditions'
  if (o < 55) return 'two territories meeting, with shared ground between them'
  if (o < 85) return 'one landscape with two summits — how many people describe living with both'
  return 'almost a single hill: the systems are hard to tell apart'
}

export function CognitiveLandscape() {
  const vertical = useMedia('(max-width: 640px)')
  const { calm } = useSettings()
  const [sep, setSep] = useState(SEP_APART)
  const [selected, setSelected] = useState<string>('ef')
  const [hover, setHover] = useState<string | null>(null)
  const [hidden, setHidden] = useState<Sys[]>([])
  const wrapRef = useRef<HTMLDivElement>(null)
  const inView = useInView(wrapRef, '-25% 0px')
  const played = useRef(false)

  // first time the map is seen, the two islands drift together
  useEffect(() => {
    if (!inView || played.current) return
    played.current = true
    if (calm) {
      setSep(SEP_DEFAULT)
      return
    }
    const ctl = animate(SEP_APART, SEP_DEFAULT, { duration: 2.8, ease: [0.65, 0, 0.35, 1], delay: 0.3, onUpdate: setSep })
    return () => ctl.stop()
  }, [inView, calm])

  const W = vertical ? V : U
  const H = vertical ? U : V
  const aU = U / 2 - sep / 2
  const bU = U / 2 + sep / 2

  const paths = useMemo(() => {
    const nx = Math.floor(W / STEP) + 1
    const ny = Math.floor(H / STEP) + 1
    const values = new Float64Array(nx * ny)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const sx = i * STEP
        const sy = j * STEP
        const u = vertical ? sy : sx
        const v = vertical ? sx : sy
        values[j * nx + i] = gauss(u - aU, v - V0) + gauss(u - bU, v - V0) + noise(u, v)
      }
    return contours()
      .size([nx, ny])
      .thresholds(THRESHOLDS)(Array.from(values))
      .map((c, i) => ({ d: ringPath(c.coordinates as unknown as number[][][][], STEP), i, value: c.value }))
  }, [W, H, vertical, aU, bU])

  const toScreen = (u: number, v: number): [number, number] => (vertical ? [v, u] : [u, v])
  const anchor = (t: Trait) => (t.sys === 'a' ? aU : t.sys === 'b' ? bU : U / 2)
  const pos = (t: Trait) => toScreen(anchor(t) + t.at[0], V0 + t.at[1])

  const current = TRAITS.find((t) => t.id === selected) ?? TRAITS[0]
  const focusId = hover ?? selected

  const toggle = (s: Sys) => setHidden((h) => (h.includes(s) ? h.filter((x) => x !== s) : [...h, s]))

  const gradEnd = vertical ? { x2: 0, y2: H } : { x2: W, y2: 0 }
  const stopA = (aU / U) * 100
  const stopB = (bU / U) * 100

  return (
    <div ref={wrapRef} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-12">
      <div>
        {/* filters */}
        <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="Show or hide traits on the map">
          <span className="mr-1 text-[0.8125rem] text-ink-3">Show:</span>
          {(['a', 'b', 'both'] as Sys[]).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={!hidden.includes(s)}
              onClick={() => toggle(s)}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line-2 px-3.5 py-2 text-[0.875rem] leading-none text-ink transition-colors hover:border-ink-3 aria-[pressed=false]:border-dashed aria-[pressed=false]:text-ink-3"
            >
              <span className="relative grid place-items-center">
                <SysMark sys={s} size={10} className={hidden.includes(s) ? 'opacity-30' : ''} />
              </span>
              <span className={hidden.includes(s) ? 'line-through decoration-ink-3' : ''}>{SYS_LABEL[s]}</span>
              <span className="sr-only">{hidden.includes(s) ? '(hidden)' : '(shown)'}</span>
            </button>
          ))}
        </div>

        {/* the map */}
        <figure className="relative">
          <div
            className="relative w-full rounded-[1.75rem] border border-line bg-[radial-gradient(80%_70%_at_50%_45%,rgb(23_28_56/0.65),transparent_75%)]"
            style={{ aspectRatio: `${W} / ${H}` }}
          >
            {/* soft light under each summit (CSS gradients: SVG gradient fills rasterise unreliably in tiles) */}
            {([['a', aU], ['b', bU]] as const).map(([k, u]) => {
              const [cx, cy] = toScreen(u, V0)
              return (
                <span
                  key={k}
                  aria-hidden="true"
                  className="pointer-events-none absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    left: `${(cx / W) * 100}%`,
                    top: `${(cy / H) * 100}%`,
                    width: `${(460 / W) * 100}%`,
                    background:
                      k === 'a'
                        ? 'radial-gradient(closest-side, rgb(169 156 245 / 0.16), rgb(169 156 245 / 0.05) 55%, transparent)'
                        : 'radial-gradient(closest-side, rgb(98 227 238 / 0.13), rgb(98 227 238 / 0.04) 55%, transparent)',
                  }}
                />
              )
            })}
            <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
              <defs>
                <linearGradient id="land-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" {...gradEnd}>
                  <stop offset={`${Math.max(0, stopA - 6)}%`} stopColor="var(--color-violet)" />
                  <stop offset="50%" stopColor="var(--color-amber)" />
                  <stop offset={`${Math.min(100, stopB + 6)}%`} stopColor="var(--color-cyan)" />
                </linearGradient>
              </defs>
              {paths.map((p) => (
                <path
                  key={p.i}
                  d={p.d}
                  fill="none"
                  stroke="url(#land-grad)"
                  strokeOpacity={0.22 + 0.62 * (p.i / THRESHOLDS.length)}
                  strokeWidth={p.value >= 1 ? 1.6 : 1}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {/* corner furniture */}
              <g stroke="var(--color-line-2)" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none">
                <path d={`M24,44 V24 H44 M${W - 44},24 H${W - 24} V44 M24,${H - 44} V${H - 24} H44 M${W - 44},${H - 24} H${W - 24} V${H - 44}`} />
              </g>
            </svg>

            {/* territory labels */}
            {(
              [
                ['a', aU - 120, -240],
                ['b', bU + 120, -240],
              ] as [Sys, number, number][]
            ).map(([s, u, dv]) => {
              const [x, y] = toScreen(u, V0 + dv)
              return (
                <span
                  key={s}
                  aria-hidden="true"
                  className={`pointer-events-none absolute hidden -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[0.6875rem] uppercase tracking-[0.16em] sm:block ${s === 'a' ? 'text-violet' : 'text-cyan'}`}
                  style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, opacity: hidden.includes(s) ? 0.25 : 0.9 }}
                >
                  {s === 'a' ? 'Autism-associated' : 'ADHD-associated'}
                </span>
              )
            })}

            {/* trait markers */}
            {TRAITS.map((t) => {
              const [x, y] = pos(t)
              const off = hidden.includes(t.sys)
              const on = focusId === t.id
              const flip = x / W > 0.68
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelected(t.id)}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(t.id)}
                  onPointerLeave={() => setHover(null)}
                  // pointer convenience: keyboard and screen-reader users use the trait list beside the map
                  aria-hidden="true"
                  tabIndex={-1}
                  className={`group absolute flex items-center gap-2 rounded-full p-2 transition-opacity duration-500 focus-visible:outline-offset-0 ${
                    flip ? 'flex-row-reverse' : ''
                  } ${off ? 'pointer-events-none opacity-10' : 'opacity-100'}`}
                  style={{
                    left: `${(x / W) * 100}%`,
                    top: `${(y / H) * 100}%`,
                    transform: flip ? 'translate(calc(-100% + 15px), -50%)' : 'translate(-15px, -50%)',
                  }}
                >
                  <span className="relative grid size-3.5 place-items-center">
                    <span
                      className={`absolute inset-[-7px] rounded-full border transition-all duration-300 ${
                        on ? 'scale-100 border-ink/70 opacity-100' : 'scale-50 border-transparent opacity-0'
                      }`}
                    />
                    <SysMark sys={t.sys} size={13} />
                  </span>
                  <span
                    className={`hidden whitespace-nowrap text-[0.8125rem] leading-none transition-colors duration-300 sm:block ${
                      on ? 'text-ink' : 'text-ink-2 group-hover:text-ink'
                    } ${on ? 'font-semibold' : ''}`}
                  >
                    <span className="rounded bg-night/70 px-1 py-0.5">{t.label}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <figcaption className="mt-4 flex flex-col gap-1 text-[0.8125rem] leading-relaxed text-ink-3 sm:flex-row sm:justify-between sm:gap-6">
            <span>
              <span className="eyebrow mr-2 text-ink-2">Fig. 01</span>A map of overlap. Contours rise where traits cluster.
            </span>
            <span>The map is not the territory: positions are illustrative, not measurements.</span>
          </figcaption>
        </figure>

        {/* the control */}
        <div className="mt-8 rounded-2xl border border-line p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label htmlFor="overlap" className="text-[0.9375rem] font-semibold text-ink">
              Distance between the two systems
            </label>
            <output htmlFor="overlap" className="font-mono text-[0.8125rem] text-amber">
              Overlap {overlapPct(sep)}%
            </output>
          </div>
          <input
            id="overlap"
            type="range"
            min={0}
            max={100}
            step={1}
            value={overlapPct(sep)}
            onChange={(e) => {
              played.current = true
              setSep(SEP_APART - (Number(e.target.value) / 100) * (SEP_APART - SEP_TOGETHER))
            }}
            aria-valuetext={`Overlap ${overlapPct(sep)} percent: ${describe(sep)}`}
            style={{ ['--fill' as string]: `${overlapPct(sep)}%`, ['--track' as string]: 'var(--color-amber)' }}
            className="mt-2"
          />
          <div className="flex justify-between gap-6 text-[0.8125rem] leading-snug text-ink-3">
            <span>Apart: as textbooks describe them</span>
            <span className="text-right">Together: as lived in one person</span>
          </div>
          <p className="mt-4 border-t border-line pt-4 text-[0.9375rem] leading-relaxed text-ink-2" aria-live="polite">
            Now showing {describe(sep)}.
            {overlapPct(sep) > 40 && ' Notice the new summit contours: the overlap creates terrain neither system has alone.'}
          </p>
        </div>
      </div>

      {/* detail panel */}
      <aside aria-live="polite" aria-label="Selected trait" className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-line bg-night-2/60 p-6">
          <SysTag sys={current.sys} />
          <h3 className="mt-4 font-display text-[1.75rem] leading-tight text-ink">{current.label}</h3>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-2">{current.detail}</p>
          <EvidenceRow kinds={current.evidence} className="mt-5" />
          {current.cite && (
            <p className="mt-4 text-[0.8125rem] leading-relaxed text-ink-3">
              Sources: <Cite ids={current.cite} bare />
            </p>
          )}
        </div>

        {/* every trait as a plain list — the accessible, small-screen way in */}
        <div className="mt-6">
          <p className="eyebrow mb-3 text-ink-3">All traits on the map</p>
          <ul className="flex flex-wrap gap-2">
            {TRAITS.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="chip"
                  aria-pressed={selected === t.id}
                  onClick={() => setSelected(t.id)}
                >
                  <SysMark sys={t.sys} size={9} />
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}

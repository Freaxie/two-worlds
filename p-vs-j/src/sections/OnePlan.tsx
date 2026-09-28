import { useMemo, useRef } from 'react'
import { SectionHead, seg, useDiagramProgress, useFrameValue, useMedia } from '../components/common'
import { ease, smooth } from '../components/tree'
import './OnePlan.css'

/*
  One situation, two ways through it, scrubbed by scroll.
  P: a map of options; a route is drawn on the ground, detouring for things discovered on the way.
  J: an itinerary; the calendar fills slot by slot and each slot is booked before anyone leaves.
*/

const SITUATION = 'Three days in a city you have never visited.'

/* ---------- P: the map ---------- */

type Opt = { text: string; x: number; y: number; visit?: number; found?: boolean }

const OPTS: Opt[] = [
  { text: 'the old market', x: 440, y: 120, visit: 1 },
  { text: 'a record shop', x: 300, y: 70 },
  { text: 'the river', x: 360, y: 230, visit: 2 },
  { text: 'the big museum', x: 150, y: 110 },
  { text: 'a bakery a local mentioned', x: 250, y: 330, visit: 3, found: true },
  { text: 'a day trip', x: 90, y: 250 },
  { text: 'sunset viewpoint', x: 140, y: 420, visit: 5 },
  { text: 'a street festival', x: 330, y: 470, visit: 4, found: true },
  { text: 'free concert?', x: 480, y: 420 },
  { text: 'the botanical garden', x: 470, y: 540 },
]

const P_ARRIVE: [number, number] = [590, 300]

function PStage({ t }: { t: number }) {
  const appear = seg(t, 0.02, 0.3)
  const walk = seg(t, 0.28, 0.9)
  const route = useMemo(() => {
    const stops = OPTS.filter((o) => o.visit).sort((a, b) => a.visit! - b.visit!)
    const pts: [number, number][] = [P_ARRIVE, [520, 250]]
    stops.forEach((s, i) => {
      pts.push([s.x, s.y])
      if (i < stops.length - 1) pts.push([(s.x + stops[i + 1].x) / 2 + (i % 2 ? 40 : -40), (s.y + stops[i + 1].y) / 2])
    })
    return smooth(pts)
  }, [])
  const visits = OPTS.filter((o) => o.visit).length
  const visited = Math.round(visits * walk)
  const open = OPTS.length - visited - OPTS.filter((o) => o.found && walk < (o.visit! - 0.8) / visits).length

  return (
    <svg viewBox="0 0 600 600" className="op__svg" role="img" aria-labelledby="op-p-desc">
      <desc id="op-p-desc">
        P: a map of options around the arrival point. A winding route visits the market, the river, a bakery a local mentioned, a street festival
        found on the way, and the sunset viewpoint. The rest stay open.
      </desc>
      <path d={route} className="op__route-ghost" />
      <path d={route} className="op__route" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - walk} />
      {OPTS.map((o, i) => {
        /* options discovered on the way appear only when the walk gets near them */
        const a = o.found ? seg(walk, (o.visit! - 1.6) / visits, (o.visit! - 1) / visits) : seg(appear, i / OPTS.length, i / OPTS.length + 0.4)
        const isVisited = o.visit !== undefined && walk >= (o.visit - 0.35) / visits
        return (
          <g key={o.text} style={{ opacity: a, transform: `translateY(${(1 - ease(a)) * 8}px)` }}>
            <circle cx={o.x} cy={o.y} r={isVisited ? 8 : 7} className={isVisited ? 'op__p-visited' : 'op__p-option'} />
            {!isVisited && <circle cx={o.x} cy={o.y} r={15} className="op__p-halo" />}
            <text x={o.x} y={o.y - 16} textAnchor="middle" className={`op__lab ${isVisited ? '' : 'op__lab--open'}`}>
              {o.text}
            </text>
            {o.found && (
              <text x={o.x} y={o.y + 26} textAnchor="middle" className="op__found">
                FOUND ON THE WAY
              </text>
            )}
          </g>
        )
      })}
      <circle cx={P_ARRIVE[0]} cy={P_ARRIVE[1]} r={7} className="op__arrive" />
      <text x={12} y={590} className="op__count">
        VISITED {visited} · STILL OPEN {Math.max(0, open)}
      </text>
    </svg>
  )
}

/* ---------- J: the itinerary ---------- */

type Block = { day: number; start: number; end: number; text: string }

const BLOCKS: Block[] = [
  { day: 0, start: 9, end: 11.5, text: 'Museum · 09:00 tickets' },
  { day: 0, start: 12, end: 13.5, text: 'Lunch · booked' },
  { day: 0, start: 14, end: 17, text: 'Old town walking tour' },
  { day: 0, start: 19.5, end: 21.5, text: 'Dinner · 19:30' },
  { day: 1, start: 8.5, end: 16, text: 'Day trip · train 08:42' },
  { day: 1, start: 18, end: 20.5, text: 'Concert · row F' },
  { day: 2, start: 9, end: 11, text: 'Market' },
  { day: 2, start: 11.5, end: 12.5, text: 'Check out' },
  { day: 2, start: 13, end: 14, text: 'Taxi · 13:00' },
]

const DAYS = ['FRI', 'SAT', 'SUN']
const HX = 64
const COLW = 172
const TOP = 60
const HOUR = 36 /* px per hour, 08:00–22:00 */

function JStage({ t }: { t: number }) {
  const fill = seg(t, 0.06, 0.82)
  const check = seg(t, 0.2, 0.95)
  const booked = BLOCKS.filter((_, i) => check >= (i + 1) / BLOCKS.length).length

  return (
    <svg viewBox="0 0 600 600" className="op__svg" role="img" aria-labelledby="op-j-desc">
      <desc id="op-j-desc">
        J: a three-day itinerary fills in hour by hour: museum, lunch, walking tour, dinner on Friday; a day trip and a concert on Saturday; market,
        check-out and taxi on Sunday. Each block is booked before departure.
      </desc>
      {DAYS.map((d, i) => (
        <text key={d} x={HX + i * COLW + 6} y={TOP - 14} className="op__day">
          {d}
        </text>
      ))}
      {Array.from({ length: 15 }, (_, h) => (
        <g key={h}>
          <line x1={HX} x2={HX + COLW * 3} y1={TOP + h * HOUR} y2={TOP + h * HOUR} className={h % 2 ? 'op__hour op__hour--minor' : 'op__hour'} />
          {h % 2 === 0 && (
            <text x={HX - 10} y={TOP + h * HOUR + 4} textAnchor="end" className="op__time">
              {String(8 + h).padStart(2, '0')}
            </text>
          )}
        </g>
      ))}
      {[0, 1, 2, 3].map((c) => (
        <line key={c} x1={HX + c * COLW} x2={HX + c * COLW} y1={TOP} y2={TOP + 14 * HOUR} className="op__hour" />
      ))}
      {BLOCKS.map((b, i) => {
        const a = ease(seg(fill, i / BLOCKS.length, (i + 1) / BLOCKS.length))
        const isBooked = check >= (i + 1) / BLOCKS.length
        const x = HX + b.day * COLW + 4
        const y = TOP + (b.start - 8) * HOUR + 2
        const h = (b.end - b.start) * HOUR - 4
        return (
          <g key={i} style={{ opacity: a }}>
            <rect x={x} y={y - (1 - a) * 18} width={COLW - 8} height={h} className={isBooked ? 'op__block op__block--booked' : 'op__block'} />
            <text x={x + 8} y={y - (1 - a) * 18 + 16} className={isBooked ? 'op__block-text op__block-text--booked' : 'op__block-text'}>
              {b.text}
            </text>
            {isBooked && <path d={`M${x + COLW - 26},${y + 10} l4,4 l8,-9`} className="op__tick" />}
          </g>
        )
      })}
      <text x={588} y={590} className="op__count" textAnchor="end">
        BOOKED {booked}/{BLOCKS.length}
        {booked === BLOCKS.length ? ' · NOTHING LEFT TO DECIDE' : ''}
      </text>
    </svg>
  )
}

/* ---------- Room ---------- */

export function OnePlan() {
  const wide = useMedia('(min-width: 961px)')
  const trackRef = useRef<HTMLDivElement>(null)
  const pRef = useRef<HTMLDivElement>(null)
  const jRef = useRef<HTMLDivElement>(null)

  const pTrack = useDiagramProgress(trackRef, wide, ['start start', 'end end'])
  const pP = useDiagramProgress(pRef, false, undefined, 5)
  const pJ = useDiagramProgress(jRef, false, undefined, 5)
  const tTrack = useFrameValue(pTrack)
  const tP = useFrameValue(pP)
  const tJ = useFrameValue(pJ)

  return (
    <section className="op" id="one-plan" aria-labelledby="op-title">
      <div className="wrap section op__head">
        <SectionHead
          index="02"
          name="One trip, two minds"
          title={
            <span id="op-title">
              Give them the same <em>three days.</em>
            </span>
          }
          lede="Watch where each one does its deciding. One decides on the ground, one morning at a time. The other decides at home, weeks before the train."
        />
      </div>

      <div className={wide ? 'op__track' : 'op__flow'} ref={trackRef}>
        <div className="op__sticky">
          <div className="op__stage wrap">
            <div className="op__col op__col--p" ref={pRef}>
              <div className="op__col-head">
                <span className="chip label">
                  <span className="chip__mark chip__mark--p" aria-hidden="true" />P improvises
                </span>
                <span className="label label--muted">Decides on arrival. Keeps options warm.</span>
              </div>
              <PStage t={wide ? tTrack : tP} />
            </div>

            <div className="op__obs">
              <div className="op__cal" aria-hidden="true">
                {['F', 'S', 'S'].map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
              <p className="label label--muted">Situation</p>
              <p className="op__obs-text serif">{SITUATION}</p>
              <div className="op__meter" aria-hidden="true">
                <span style={{ transform: `scaleX(${wide ? tTrack : 1})` }} />
              </div>
            </div>

            <div className="op__col op__col--j" ref={jRef}>
              <div className="op__col-head">
                <span className="chip label">
                  <span className="chip__mark chip__mark--j" aria-hidden="true" />J schedules
                </span>
                <span className="label label--muted">Decides in advance. Protects the plan.</span>
              </div>
              <JStage t={wide ? tTrack : tJ} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

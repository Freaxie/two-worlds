import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { motion, useMotionValue, useMotionValueEvent, useTransform, type MotionValue } from 'framer-motion'
import { Head, Reveal, Spread, Tape } from '../components/print'
import './Overprint.css'

const EXCHANGES = [
  { from: 'fi', head: 'Conviction gives care a spine.', body: 'Without an inner line, harmony becomes agreement with whoever is loudest. A peace worth keeping has to include the truth.' },
  { from: 'fe', head: 'Awareness gives conviction a place to land.', body: 'A value no one can hear is only half expressed. Reading the room is how a personal truth finds a form others can receive.' },
  { from: 'fi', head: 'Fi asks Fe: is this harmony honest?', body: 'It notices when a group’s warmth is covering something no one will say.' },
  { from: 'fe', head: 'Fe asks Fi: is this truth kind enough to be heard?', body: 'It notices when being right is costing the relationship it was meant to protect.' },
]

/* Two inks you can push around. Where they overlap, the multiply blend prints the third colour. */
function Mixer() {
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0, d: 0 })
  const ax = useMotionValue(0)
  const ay = useMotionValue(0)
  const bx = useMotionValue(0)
  const by = useMotionValue(0)

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const place = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      const d = Math.min(w * 0.5, h * 0.74)
      setSize({ w, h, d })
      // Start overlapping a little, so the third colour is visible at rest
      ax.set(w * 0.5 - d * 0.88)
      ay.set(h * 0.5 - d * 0.56)
      bx.set(w * 0.5 - d * 0.12)
      by.set(h * 0.5 - d * 0.44)
    }
    place()
    const ro = new ResizeObserver(place)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ax, ay, bx, by])

  const r = size.d / 2

  // Arrow keys nudge a focused disc, so the mixer works without a pointer
  const nudge = (x: MotionValue<number>, y: MotionValue<number>) => (e: KeyboardEvent) => {
    const step = e.shiftKey ? 40 : 12
    const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
    const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
    if (!dx && !dy) return
    e.preventDefault()
    x.set(Math.min(size.w - size.d, Math.max(0, x.get() + dx)))
    y.set(Math.min(size.h - size.d, Math.max(0, y.get() + dy)))
  }

  const dist = useTransform([ax, ay, bx, by] as MotionValue<number>[], ([a, b, c, d]: number[]) => Math.hypot(c - a, d - b))
  const midX = useTransform([ax, bx] as MotionValue<number>[], ([a, b]: number[]) => (a + b) / 2 + r)
  const midY = useTransform([ay, by] as MotionValue<number>[], ([a, b]: number[]) => (a + b) / 2 + r)
  const [overlap, setOverlap] = useState(true)
  useMotionValueEvent(dist, 'change', (v) => setOverlap(v < size.d * 0.92))

  return (
    <div className="mixer">
      <div ref={box} className="mixer__box" role="group" aria-label="Drag the blue disc, conviction, and the pink disc, care. Where they overlap, a third colour appears.">
        <motion.div
          className="mixer__disc mixer__disc--fi"
          style={{ x: ax, y: ay, width: size.d, height: size.d }}
          drag
          dragConstraints={box}
          dragElastic={0.08}
          dragMomentum={false}
          whileDrag={{ scale: 1.02 }}
          tabIndex={0}
          onKeyDown={nudge(ax, ay)}
          aria-label="Conviction, blue ink. Drag or use the arrow keys to move."
        >
          <span className="mixer__name">conviction</span>
        </motion.div>
        <motion.div
          className="mixer__disc mixer__disc--fe"
          style={{ x: bx, y: by, width: size.d, height: size.d }}
          drag
          dragConstraints={box}
          dragElastic={0.08}
          dragMomentum={false}
          whileDrag={{ scale: 1.02 }}
          tabIndex={0}
          onKeyDown={nudge(bx, by)}
          aria-label="Care, pink ink. Drag or use the arrow keys to move."
        >
          <span className="mixer__name">care</span>
        </motion.div>
        <motion.span className="mixer__label type" style={{ left: midX, top: midY }} animate={{ opacity: overlap ? 1 : 0 }}>
          a colour neither drum
          <br />
          can print alone
        </motion.span>
        <span className="mixer__hint type">{overlap ? 'drag either ink' : 'push them together'}</span>
      </div>
    </div>
  )
}

export function Overprint() {
  return (
    <Spread
      id="overprint"
      label="Pages 14 and 15: not opposites"
      folios={[14, 15]}
      left={
        <>
          <Head pp="14–15" title="Not opposites" />
          <h2 className="op__title poster rough">
            <span className="ink-blue">Over</span>
            <span className="ink-pink op__print">print</span>
          </h2>
          <p className="op__lede">
            Personal conviction and collective awareness are not rivals for the same ground. Overlap them and you get something neither makes
            alone.
          </p>
          <Mixer />
        </>
      }
      right={
        <div className="op__right">
          <div className="op__notes">
            {EXCHANGES.map((e, i) => (
              <Reveal key={e.head} className={`op__note slip op__note--${e.from}`} delay={(i % 2) * 0.08}>
                <Tape style={{ top: -12, left: i % 2 ? 'auto' : 18, right: i % 2 ? 18 : 'auto', transform: `rotate(${i % 2 ? 4 : -3}deg)` }} />
                <span className="caps">
                  <span className={`mark mark--${e.from === 'fi' ? 'blue' : 'pink'}`}>{e.from === 'fi' ? 'Fi → Fe' : 'Fe → Fi'}</span>
                </span>
                <h3>{e.head}</h3>
                <p>{e.body}</p>
              </Reveal>
            ))}
          </div>

          <figure className="op__dinner">
            <p className="caps">Back at the dinner table</p>
            <blockquote className="op__bubble">
              “I love that you’re brave enough to do this. Can I tell you my worries over coffee this week?”
            </blockquote>
            <figcaption className="op__cap">
              <span className="mark mark--blue">true within</span> and <span className="mark mark--pink">resonant between</span>
            </figcaption>
          </figure>
        </div>
      }
    />
  )
}

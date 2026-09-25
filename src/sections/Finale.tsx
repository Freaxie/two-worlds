import { Lines, Reveal, useLens, type Lens } from '../components/common'
import './Finale.css'

export function Finale() {
  const { lens, setLens } = useLens()

  const explore = (l: Lens) => {
    setLens(lens === l ? 'none' : l)
    document.getElementById('divide')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  return (
    <>
      <section id="finale" className="fin" aria-labelledby="finale-title">
        <div className="wrap">
          <h2 id="finale-title" className="fin__title display">
            <Lines lines={['The argument', 'continues.']} stagger={0.14} />
          </h2>

          <div className="fin__body grid">
            <div className="fin__text">
              <Reveal as="p" className="fin__p fin__p--plato">
                Plato asks us to look beyond the world of appearances.
              </Reveal>
              <Reveal as="p" className="fin__p fin__p--aris" delay={0.25}>
                Aristotle asks us to look more carefully at the world before us.
              </Reveal>
              <Reveal as="p" className="fin__p fin__p--both" delay={0.5}>
                Between them lies one of the central arguments in the history of philosophy.
              </Reveal>
            </div>

            <Reveal className="fin__again" delay={0.3}>
              <p className="label">Explore again</p>
              <p className="fin__againnote">Walk the rooms once more with one tradition in focus and the other dimmed.</p>
              <div className="fin__btns">
                <button className={`fin__btn fin__btn--plato${lens === 'plato' ? ' is-on' : ''}`} aria-pressed={lens === 'plato'} onClick={() => explore('plato')}>
                  <span className="fin__btn-mark" aria-hidden="true" />
                  Plato
                </button>
                <button className={`fin__btn fin__btn--aris${lens === 'aris' ? ' is-on' : ''}`} aria-pressed={lens === 'aris'} onClick={() => explore('aris')}>
                  <span className="fin__btn-mark" aria-hidden="true" />
                  Aristotle
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <footer className="colophon">
        <div className="wrap grid">
          <div className="colophon__mark">
            <span className="display">The Two Worlds</span>
            <span className="mono">An exhibition in ten rooms</span>
          </div>
          <div className="colophon__col">
            <p className="label">On quotations</p>
            <p>
              Direct quotations are identified by work, standard reference and translator: Plato after B. Jowett; Aristotle's{' '}
              <em>Metaphysics</em> and <em>Nicomachean Ethics</em> after W. D. Ross, <em>Politics</em> after B. Jowett,{' '}
              <em>De Anima</em> after J. A. Smith. Everything else is paraphrase. The two theses in the opening room are summaries,
              not quotations.
            </p>
          </div>
          <div className="colophon__col">
            <p className="label">On references</p>
            <p>
              Plato is cited by Stephanus pages (e.g. <em>Republic</em> 509b), Aristotle by Bekker pages (e.g. 1098a18). Where
              the exhibition speaks of later Platonism or Aristotelianism, it says so. Where scholars disagree, it tries to say
              that too.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}

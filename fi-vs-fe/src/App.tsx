import { MotionConfig } from 'framer-motion'
import { Nav } from './components/Nav'
import { Hero } from './sections/Hero'
import { Difference } from './sections/Difference'
import { Situation } from './sections/Situation'
import { Questions } from './sections/Questions'
import { Individual } from './sections/Individual'
import { Experiment } from './sections/Experiment'
import { Failure } from './sections/Failure'
import { NotOpposites } from './sections/NotOpposites'
import { Coda } from './sections/Coda'

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#difference">
        Skip to the first room
      </a>
      <Nav />
      <main>
        <Hero />
        <Difference />
        <Situation />
        <Questions />
        <Individual />
        <Experiment />
        <Failure />
        <NotOpposites />
        <Coda />
      </main>
    </MotionConfig>
  )
}

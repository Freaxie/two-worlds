import { MotionConfig } from 'framer-motion'
import { Nav } from './components/Nav'
import { Hero } from './sections/Hero'
import { Difference } from './sections/Difference'
import { Moment } from './sections/Moment'
import { Questions } from './sections/Questions'
import { Memory } from './sections/Memory'
import { Experiment } from './sections/Experiment'
import { Modes } from './sections/Modes'
import { Together } from './sections/Together'
import { Finale } from './sections/Finale'

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#difference">
        Skip to the first room
      </a>
      <Nav />
      <Hero />
      <main>
        <Difference />
        <Moment />
        <Questions />
        <Memory />
        <Experiment />
        <Modes />
        <Together />
        <Finale />
      </main>
    </MotionConfig>
  )
}

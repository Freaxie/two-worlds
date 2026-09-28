import { MotionConfig } from 'framer-motion'
import { Hero } from './components/Hero'
import { Nav } from './components/Nav'
import { Difference } from './sections/Difference'
import { OneIdea } from './sections/OneIdea'
import { Questions } from './sections/Questions'
import { Time } from './sections/Time'
import { Experiment } from './sections/Experiment'
import { Failure } from './sections/Failure'
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
        <OneIdea />
        <Questions />
        <Time />
        <Experiment />
        <Failure />
        <Together />
        <Finale />
      </main>
    </MotionConfig>
  )
}

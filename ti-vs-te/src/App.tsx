import { MotionConfig } from 'framer-motion'
import { Nav } from './sections/Nav'
import { Hero } from './sections/Hero'
import { Difference } from './sections/Difference'
import { Problem } from './sections/Problem'
import { Questions } from './sections/Questions'
import { Failure } from './sections/Failure'
import { Experiment } from './sections/Experiment'
import { Together } from './sections/Together'
import { Final } from './sections/Final'

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#difference">
        Skip to the exhibition
      </a>
      <Nav />
      <Hero />
      <main>
        <Difference />
        <Problem />
        <Questions />
        <Failure />
        <Experiment />
        <Together />
        <Final />
      </main>
    </MotionConfig>
  )
}

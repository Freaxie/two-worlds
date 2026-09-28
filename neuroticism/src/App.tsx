import { MotionConfig } from 'framer-motion'
import { Nav } from './sections/Nav'
import { Hero } from './sections/Hero'
import { Difference } from './sections/Difference'
import { Evening } from './sections/Evening'
import { Voices } from './sections/Voices'
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
        <Evening />
        <Voices />
        <Failure />
        <Experiment />
        <Together />
        <Final />
      </main>
    </MotionConfig>
  )
}

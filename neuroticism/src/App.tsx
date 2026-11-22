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
import { Cursor, Intro, Marquee, Seismo } from './lib/fx'

/* Each part is separated by a strip of recorder paper: the pen writes across it as you scroll */
const Divider = () => (
  <div className="wrap">
    <Seismo />
  </div>
)

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#difference">
        Skip to the exhibition
      </a>
      <Intro />
      <Cursor />
      <Nav />
      <Hero />
      <main>
        <Marquee />
        <Difference />
        <Divider />
        <Evening />
        <Divider />
        <Voices />
        <Marquee />
        <Failure />
        <Divider />
        <Experiment />
        <Divider />
        <Together />
        <Final />
      </main>
    </MotionConfig>
  )
}

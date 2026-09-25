import { MotionConfig } from 'framer-motion'
import { LensProvider } from './components/common'
import { Hero } from './components/Hero'
import { Nav } from './components/Nav'
import { Divide } from './sections/Divide'
import { Ontology } from './sections/Ontology'
import { Knowledge } from './sections/Knowledge'
import { FormMatter } from './sections/FormMatter'
import { Causality } from './sections/Causality'
import { Soul } from './sections/Soul'
import { Ethics } from './sections/Ethics'
import { Politics } from './sections/Politics'
import { Questions } from './sections/Questions'
import { Synthesis } from './sections/Synthesis'
import { Finale } from './sections/Finale'

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LensProvider>
        <a className="skip-link" href="#divide">
          Skip to the first room
        </a>
        <Hero />
        <Nav />
        <main>
          <Divide />
          <Ontology />
          <Knowledge />
          <FormMatter />
          <Causality />
          <Soul />
          <Ethics />
          <Politics />
          <Questions />
          <Synthesis />
          <Finale />
        </main>
      </LensProvider>
    </MotionConfig>
  )
}

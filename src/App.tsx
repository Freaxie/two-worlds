import { SettingsProvider } from './lib/settings'
import { Nav } from './components/layout/Nav'
import { ChapterRail } from './components/layout/ChapterRail'
import { AmbientGlow } from './components/layout/AmbientGlow'
import { Hero } from './sections/Hero'
import { Orientation } from './sections/Orientation'
import { ContradictionEngine } from './sections/ContradictionEngine'
import { InnerExperience } from './sections/InnerExperience'
import { Reflection } from './sections/Reflection'
import { Masking } from './sections/Masking'
import { Toolkit } from './sections/Toolkit'
import { Resources } from './sections/Resources'
import { Coda } from './sections/Coda'

export function App() {
  return (
    <SettingsProvider>
      <a
        href="#main"
        className="sr-only-focusable fixed left-4 top-4 z-[100] rounded-full bg-ink px-5 py-3 text-[0.875rem] font-semibold text-night no-underline"
      >
        Skip to content
      </a>
      <Nav />
      <ChapterRail />
      <AmbientGlow />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Orientation />
        <ContradictionEngine />
        <InnerExperience />
        <Reflection />
        <Masking />
        <Toolkit />
        <Resources />
        <Coda />
      </main>
    </SettingsProvider>
  )
}

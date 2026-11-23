import { MotionConfig } from 'framer-motion'
import { PrintDefs } from './components/print'
import { Contents } from './components/Contents'
import { Cover } from './sections/Cover'
import { Difference } from './sections/Difference'
import { Strip } from './sections/Strip'
import { Stamps } from './sections/Stamps'
import { Plates } from './sections/Plates'
import { PrintShop } from './sections/PrintShop'
import { Errors } from './sections/Errors'
import { Overprint } from './sections/Overprint'
import { BackCover } from './sections/BackCover'

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <PrintDefs />
      <a className="skip-link" href="#difference">
        Skip to page 2
      </a>
      <Contents />
      <main>
        <Cover />
        <Difference />
        <Strip />
        <Stamps />
        <Plates />
        <PrintShop />
        <Errors />
        <Overprint />
        <BackCover />
      </main>
    </MotionConfig>
  )
}

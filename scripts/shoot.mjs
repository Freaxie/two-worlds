// Local visual check: renders the single-file build in headless Chrome and captures
// each room. Usage: node scripts/shoot.mjs <outDir> <width> <height> [target...]
// A target is a section id, optionally with a scroll offset in viewport heights: "knowledge+1.5"
import puppeteer from 'puppeteer-core'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const [outDir, w = '1440', h = '900', ...targets] = process.argv.slice(2)
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--hide-scrollbars'],
})
const page = await browser.newPage()
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 })
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message))
page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text()))
await page.goto(pathToFileURL(resolve('dist-single/index.html')).href, { waitUntil: 'networkidle0' })
await page.evaluate(() => document.fonts.ready)
await new Promise((r) => setTimeout(r, 2600))

for (const t of targets.length ? targets : ['top']) {
  const [id, off = '0'] = t.split('+')
  const [name, action] = id.split(':')
  await page.evaluate(
    (name, off) => {
      document.documentElement.style.scrollBehavior = 'auto'
      const el = document.getElementById(name)
      const y = el ? el.getBoundingClientRect().top + window.scrollY : 0
      window.scrollTo(0, y + parseFloat(off) * window.innerHeight)
    },
    name,
    off
  )
  if (action?.startsWith('range')) {
    // e.g. "form:range60" drags the Form & Matter slider to 60
    await page.evaluate((v) => {
      const el = document.getElementById('fm-range')
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
      set.call(el, v)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }, action.slice(5))
  } else if (action?.startsWith('click')) {
    // e.g. "causality:clickHouse" clicks the first button whose text contains "House"
    await page.evaluate((txt) => {
      const b = [...document.querySelectorAll('button, [role=button]')].find((x) => (x.textContent || x.getAttribute('aria-label') || '').includes(txt))
      b?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    }, action.slice(5))
  }
  await new Promise((r) => setTimeout(r, 1900))
  const file = `${outDir}/${w}-${t.replace(/[^a-z0-9.+-]/gi, '_').slice(0, 40)}.png`
  await page.screenshot({ path: file })
  console.log(file)
}
await browser.close()

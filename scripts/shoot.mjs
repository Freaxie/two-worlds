// Local visual check: renders the single-file build (npm run build:single) in headless Chrome and
// captures each chapter. Usage: node scripts/shoot.mjs <outDir> <width> <height> [target...]
// A target is a section id, optionally with a scroll offset in viewport heights: "engine+1.5",
// and optionally an action: "toolkit+1:clickOpen" or "orientation+3:range80:overlap".
// Set CHROME_PATH if Chrome is not in the default location for your platform.
import puppeteer from 'puppeteer-core'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { mkdirSync } from 'node:fs'

const CHROME =
  process.env.CHROME_PATH ??
  {
    win32: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  }[process.platform] ??
  '/usr/bin/google-chrome'

const [outDir, w = '1440', h = '900', ...targets] = process.argv.slice(2)
mkdirSync(outDir, { recursive: true })
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--no-sandbox', '--disable-background-networking'],
})
const page = await browser.newPage()
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 })
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message))
page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text()))
await page.goto(pathToFileURL(resolve('dist-single/index.html')).href, { waitUntil: 'load' })
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
    // e.g. "engine+1:range90:dial-0" sets the range input with that id (default: the overlap slider)
    const [v, rangeId = 'overlap'] = [action.slice(5), id.split(':')[2]]
    await page.evaluate((v, rangeId) => {
      const el = document.getElementById(rangeId)
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
      set.call(el, v)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }, v, rangeId)
  } else if (action?.startsWith('click')) {
    // e.g. "toolkit+1:clickOpen" clicks the first button whose text contains "Open"
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

// Renders the Blue Hour reel to an MP4, frame by frame, from the single-file build.
// Usage: npm run build:dream && node scripts/record.mjs [out.mp4] [size] [fps] [loops]
// Needs Chrome (set CHROME to its path) and ffmpeg on PATH (or set FFMPEG).
import puppeteer from 'puppeteer-core'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const [out = 'blue-hour.mp4', size = '1080', fps = '30', loops = '1'] = process.argv.slice(2)
const frames = resolve('dist-dream/frames')
rmSync(frames, { recursive: true, force: true })
mkdirSync(frames, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--no-sandbox', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
  protocolTimeout: 0,
})
const page = await browser.newPage()
await page.setViewport({ width: +size, height: +size, deviceScaleFactor: 1 })
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message))
await page.goto(pathToFileURL(resolve('dist-dream/dream.html')).href + '?record', { timeout: 0 })
await page.waitForFunction('window.renderAt', { timeout: 0 })

const total = Math.round((await page.evaluate('window.loopLength')) * +fps * +loops)
const t0 = Date.now()
for (let i = 0; i < total; i++) {
  const url = await page.evaluate((t) => window.renderAt(t), i / +fps)
  writeFileSync(`${frames}/f${String(i).padStart(5, '0')}.jpg`, Buffer.from(url.split(',')[1], 'base64'))
  if (i % 10 === 0) console.log(`frame ${i + 1}/${total}  ${((Date.now() - t0) / 1000 / (i + 1)).toFixed(1)} s/frame`)
}
await browser.close()

const ff = spawnSync(
  process.env.FFMPEG ?? 'ffmpeg',
  ['-y', '-framerate', fps, '-i', `${frames}/f%05d.jpg`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', out],
  { stdio: 'inherit' }
)
if (ff.status === 0) console.log(`wrote ${out}`)

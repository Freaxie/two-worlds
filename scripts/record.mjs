// Renders the Blue Hour reel to an MP4 with its score, frame by frame, from the single-file build.
// Usage: npm run build:dream && node scripts/record.mjs [out.mp4] [size] [fps] [loops]
// Needs Chrome (set CHROME to its path) and ffmpeg on PATH (or set FFMPEG).
// MSAA=0 speeds up software-GL renders; CRF sets the H.264 quality (lower is better).
import puppeteer from 'puppeteer-core'
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { resolve, extname, join } from 'node:path'

const [out = 'blue-hour.mp4', size = '1080', fps = '30', loops = '1'] = process.argv.slice(2)
const frames = resolve('dist-dream/frames')
rmSync(frames, { recursive: true, force: true })
mkdirSync(frames, { recursive: true })

// the page fetches its skies, models and score, so serve the build over http
const root = resolve('dist-dream')
const types = { '.html': 'text/html', '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.hdr': 'application/octet-stream', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' }
const server = createServer((req, res) => {
  const path = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!path.startsWith(root) || !existsSync(path)) return res.writeHead(404).end()
  res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' }).end(readFileSync(path))
}).listen(0)
const port = server.address().port

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--no-sandbox', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
  protocolTimeout: 0,
})
const page = await browser.newPage()
await page.setViewport({ width: +size, height: +size, deviceScaleFactor: 1 })
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message))
await page.goto(`http://localhost:${port}/dream.html?record&msaa=${process.env.MSAA ?? 4}`, { timeout: 0 })
await page.waitForFunction('window.renderAt', { timeout: 0 })

const total = Math.round((await page.evaluate('window.loopLength')) * +fps * +loops)
const t0 = Date.now()
for (let i = 0; i < total; i++) {
  const url = await page.evaluate((t) => window.renderAt(t), i / +fps)
  writeFileSync(`${frames}/f${String(i).padStart(5, '0')}.jpg`, Buffer.from(url.split(',')[1], 'base64'))
  if (i % 10 === 0) console.log(`frame ${i + 1}/${total}  ${((Date.now() - t0) / 1000 / (i + 1)).toFixed(1)} s/frame`)
}
await browser.close()
server.close()

// picture plus the score, looped to the picture's length
const ff = spawnSync(
  process.env.FFMPEG ?? 'ffmpeg',
  ['-y', '-framerate', fps, '-i', `${frames}/f%05d.jpg`, '-stream_loop', '-1', '-i', join(root, 'dream-assets/score.mp3'),
    '-map', '0:v', '-map', '1:a', '-shortest', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', process.env.CRF ?? '20', '-preset', 'slow',
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out],
  { stdio: 'inherit' }
)
if (ff.status === 0) console.log(`wrote ${out}`)

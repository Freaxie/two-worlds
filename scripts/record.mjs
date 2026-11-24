// Renders a reel to an MP4 with its score, frame by frame, from its single-file build.
// Usage: npm run build:dream && node scripts/record.mjs [out.mp4] [size] [fps] [loops]
//        PAGE=neon npm run build:neon && PAGE=neon node scripts/record.mjs out.mp4 1080x1920 24
// size is one number for a square frame, or WIDTHxHEIGHT.
// Needs Chrome (set CHROME to its path) and ffmpeg on PATH (or set FFMPEG).
// MSAA=0 speeds up software-GL renders; CRF sets the H.264 quality (lower is better).
// Frames already on disk are kept, so a stopped render resumes where it left off; FRESH=1 starts over.
// MAX_FRAMES=n renders at most n new frames and stops before encoding, for long renders done in chunks.
import puppeteer from 'puppeteer-core'
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { resolve, extname, join } from 'node:path'

const [out = 'blue-hour.mp4', size = '1080', fps = '30', loops = '1'] = process.argv.slice(2)
const page = process.env.PAGE ?? 'dream'
const score = { dream: 'score.mp3', neon: 'neon-score.mp3' }[page]
const [width, height = width] = size.split('x').map(Number)
const frames = resolve(`dist-${page}/frames`)
if (process.env.FRESH) rmSync(frames, { recursive: true, force: true })
mkdirSync(frames, { recursive: true })
const frameFile = (i) => `${frames}/f${String(i).padStart(5, '0')}.jpg`

// the page fetches its skies, models and score, so serve the build over http
const root = resolve(`dist-${page}`)
const types = { '.woff2': 'font/woff2', '.html': 'text/html', '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.hdr': 'application/octet-stream', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' }
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
const tab = await browser.newPage()
await tab.setViewport({ width, height, deviceScaleFactor: 1 })
tab.on('pageerror', (e) => console.log('PAGE ERROR', e.message))
await tab.goto(`http://localhost:${port}/${page}.html?record&msaa=${process.env.MSAA ?? 4}`, { timeout: 0 })
await tab.waitForFunction('window.renderAt', { timeout: 0 })

const total = Math.round((await tab.evaluate('window.loopLength')) * +fps * +loops)
const budget = Number(process.env.MAX_FRAMES) || Infinity
const t0 = Date.now()
let rendered = 0
let primed = false
for (let i = 0; i < total && rendered < budget; i++) {
  if (existsSync(frameFile(i))) continue
  // motion blur needs the previous frame's camera, so warm up on it after a gap
  if (!primed && i > 0) await tab.evaluate((t) => window.renderAt(t), (i - 1) / +fps)
  primed = true
  const url = await tab.evaluate((t) => window.renderAt(t), i / +fps)
  writeFileSync(frameFile(i), Buffer.from(url.split(',')[1], 'base64'))
  rendered++
  if (i % 10 === 0) console.log(`frame ${i + 1}/${total}  ${((Date.now() - t0) / 1000 / rendered).toFixed(1)} s/frame`)
}
await browser.close()
server.close()

const missing = Array.from({ length: total }, (_, i) => i).filter((i) => !existsSync(frameFile(i))).length
if (missing) {
  console.log(`paused with ${missing} of ${total} frames still to render; run again to continue`)
  process.exit(0)
}

// picture plus the score, looped to the picture's length
const ff = spawnSync(
  process.env.FFMPEG ?? 'ffmpeg',
  ['-y', '-framerate', fps, '-i', `${frames}/f%05d.jpg`, '-stream_loop', '-1', '-i', join(root, 'dream-assets', score),
    '-map', '0:v', '-map', '1:a', '-shortest', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', process.env.CRF ?? '20', '-preset', 'slow',
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out],
  { stdio: 'inherit' }
)
if (ff.status === 0) console.log(`wrote ${out}`)

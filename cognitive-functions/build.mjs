// Assembles The Cognitive Functions into dist/ as a static site:
//   dist/index.html      the lobby (served at /)
//   dist/hub.html        the lobby as a page fragment, for hosting as a claude.ai Artifact
//   dist/<pair>.html     each exhibition, byte-for-byte, plus one inline <script> for navigation
// The four exhibitions in exhibitions/ are never modified; they are compiled single-file builds.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const at = (p) => new URL(p, import.meta.url)
const read = (p) => readFileSync(at(p), 'utf8')

const pairs = JSON.parse(read('src/pairs.json'))
const pairsJs = JSON.stringify(pairs)
mkdirSync(at('dist/'), { recursive: true })

const hub = read('src/hub.html').replaceAll('__PAIRS__', pairsJs)
writeFileSync(at('dist/hub.html'), hub)
writeFileSync(
  at('dist/index.html'),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="description" content="An interactive exhibition in four rooms on the eight cognitive functions." />
<meta name="theme-color" content="#eeede8" />
</head>
<body>
${hub}
</body>
</html>
`,
)

const nav = read('src/exhibit-nav.js').replaceAll('__PAIRS__', pairsJs)
if (/<\/script/i.test(nav)) throw new Error('exhibit-nav.js must not contain a closing script tag')

for (const { key } of pairs) {
  const html = read(`exhibitions/${key}.html`)
  // the first tag after <head>: the nav script runs before any of the exhibition's own markup
  const anchor = html.match(/<head>(<meta charset=[^>]*>)?/i)
  if (!anchor) throw new Error(`${key}: no <head> to attach navigation to`)
  const at_ = anchor.index + anchor[0].length
  const out = html.slice(0, at_) + `<script data-cf-pair="${key}">${nav}</script>` + html.slice(at_)
  writeFileSync(at(`dist/${key}.html`), out)
}

console.log(`built lobby + ${pairs.length} exhibitions into cognitive-functions/dist/`)

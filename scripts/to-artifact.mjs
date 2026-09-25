// Converts the single-file build into a page fragment for hosting as a claude.ai Artifact:
// the host supplies <!doctype>, <html>, <head> and <body>, so we keep only the title, the
// font links, the inlined styles and the body contents (including the inlined script).
import { readFileSync, writeFileSync } from 'node:fs'

const src = readFileSync(new URL('../dist-single/index.html', import.meta.url), 'utf8')
const head = src.match(/<head>([\s\S]*?)<\/head>/i)[1]
const body = src.match(/<body>([\s\S]*?)<\/body>/i)[1]

const title = head.match(/<title>[\s\S]*?<\/title>/i)[0]
const links = head.match(/<link[^>]+fonts\.(googleapis|gstatic)[^>]*>/gi) ?? []
const styles = head.match(/<style[\s\S]*?<\/style>/gi) ?? []
const scripts = head.match(/<script[\s\S]*?<\/script>/gi) ?? []

// module scripts are deferred, so they can safely sit after the #root element
const out = [title, ...links, ...styles, body.trim(), ...scripts].join('\n')
writeFileSync(new URL('../dist-single/artifact.html', import.meta.url), out)
console.log(`artifact.html: ${(out.length / 1024).toFixed(0)} kB`)

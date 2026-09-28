/* The Cognitive Functions: persistent navigation + room transitions for each exhibition.
 * Injected by build.mjs as one inline <script data-cf-pair="…"> at the top of <head>.
 * Everything renders inside a shadow root, so no style leaks into or out of the exhibition. */
;(function () {
  var PAIRS = __PAIRS__
  var script = document.currentScript
  var here = script && script.getAttribute('data-cf-pair')
  var pair = PAIRS.filter(function (p) { return p.key === here })[0]
  if (!pair || document.querySelector('[data-cf-nav]')) return

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches
  var hubHref = location.protocol === 'file:' ? 'index.html' : './'
  var store = {
    get: function (k) { try { return sessionStorage.getItem(k) } catch (e) { return null } },
    set: function (k, v) { try { sessionStorage.setItem(k, v) } catch (e) {} },
    del: function (k) { try { sessionStorage.removeItem(k) } catch (e) {} },
  }

  // Archivo carries the variable width axis the transition names use; three rooms already load it.
  if (!document.querySelector('link[href*="family=Archivo"]')) {
    var font = document.createElement('link')
    font.rel = 'stylesheet'
    font.href = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,800&display=swap'
    document.head.appendChild(font)
  }

  var CSS = [
    '*{box-sizing:border-box}',
    '.veil{position:fixed;inset:0;display:flex;pointer-events:auto;z-index:2}',
    '.veil[hidden]{display:none}',
    '.half{flex:1 1 50%;display:flex;align-items:center;justify-content:center;overflow:hidden;transition:transform .9s cubic-bezier(.7,0,.2,1)}',
    '.half--a{background:var(--a);color:var(--aOn)}',
    '.half--b{background:var(--b);color:var(--bOn)}',
    '.vn{font:800 clamp(6rem,24vw,26rem)/.8 Archivo,"Inter Tight","Helvetica Neue",Arial,sans-serif;letter-spacing:-.05em;transition:transform .9s cubic-bezier(.7,0,.2,1),opacity .6s}',
    '.half--a .vn{font-variation-settings:"wdth" 62}',
    '.half--b .vn{font-variation-settings:"wdth" 125}',
    '.cap{position:absolute;left:0;right:0;bottom:calc(28px + env(safe-area-inset-bottom,0px));width:max-content;max-width:calc(100% - 32px);margin:0 auto;padding:8px 12px;text-align:center;font:500 11px/1.4 "JetBrains Mono",ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;background:#0d0d0c;color:#eeede8;transition:opacity .4s}',
    '.veil.is-open .half--a{transform:translateX(-101%)}',
    '.veil.is-open .half--b{transform:translateX(101%)}',
    '.veil.is-open .vn{opacity:.4}',
    '.veil.is-open .cap{opacity:0}',
    '.veil.is-closing .half--a{transform:translateX(-101%)}',
    '.veil.is-closing .half--b{transform:translateX(101%)}',
    '.home-veil{position:fixed;inset:0;background:#0d0d0c;color:#eeede8;display:flex;align-items:center;justify-content:center;pointer-events:auto;z-index:2;transform:translateY(100%);transition:transform .7s cubic-bezier(.7,0,.2,1)}',
    '.home-veil[hidden]{display:none}',
    '.home-veil.is-in{transform:none}',
    '.home-veil span{font:800 clamp(2.4rem,9vw,9rem)/.86 Archivo,"Inter Tight","Helvetica Neue",Arial,sans-serif;letter-spacing:-.045em;text-transform:uppercase;text-align:center;font-variation-settings:"wdth" 88}',
    'nav{position:fixed;left:max(16px,env(safe-area-inset-left,0px));bottom:calc(18px + env(safe-area-inset-bottom,0px));pointer-events:auto;display:flex;align-items:stretch;height:40px;background:#0d0d0c;color:#eeede8;box-shadow:0 0 0 1px rgba(238,237,232,.16),0 10px 30px -12px rgba(0,0,0,.45);font:500 11px/1 "JetBrains Mono",ui-monospace,Menlo,Consolas,monospace;letter-spacing:.08em;text-transform:uppercase;-webkit-font-smoothing:antialiased;z-index:1}',
    'nav{transition:transform .5s cubic-bezier(.2,.7,.1,1),opacity .4s}',
    'nav.is-tucked{transform:translateY(calc(100% + 28px));opacity:0}',
    'a{color:inherit;text-decoration:none;outline:none}',
    'a:focus-visible{box-shadow:inset 0 0 0 1.5px #eeede8}',
    '.home{display:flex;align-items:center;gap:0;padding:0 14px;white-space:nowrap}',
    '.arrow{display:inline-block;transition:transform .35s cubic-bezier(.2,.7,.1,1)}',
    '.home:hover .arrow{transform:translateX(-3px)}',
    '.more{display:inline-block;max-width:0;overflow:hidden;opacity:0;vertical-align:bottom;transition:max-width .5s cubic-bezier(.2,.7,.1,1),opacity .3s,margin .5s cubic-bezier(.2,.7,.1,1)}',
    '.sep{width:1px;background:rgba(238,237,232,.18)}',
    'ul{display:flex;margin:0;padding:0 4px;list-style:none}',
    'li{display:flex}',
    '.room{display:flex;align-items:center;gap:0;padding:0 8px;color:rgba(238,237,232,.55);text-transform:none;letter-spacing:.02em;font-size:12px;transition:color .3s}',
    '.room:hover,.room[aria-current]{color:#eeede8}',
    '.dot{width:10px;height:10px;flex:none;background:linear-gradient(90deg,var(--a) 50%,var(--b) 50%);transition:transform .3s cubic-bezier(.2,.7,.1,1)}',
    '.room:hover .dot{transform:scale(1.25)}',
    '.room[aria-current] .dot{box-shadow:0 0 0 2px #0d0d0c,0 0 0 3px #eeede8}',
    'nav:hover .more,nav:focus-within .more{max-width:12em;opacity:1;margin-left:10px}',
    '@media (hover:none){.room{padding:0 11px}}',
    '@media (prefers-reduced-motion:reduce){.half,.vn,.home-veil,.more,.arrow,.dot{transition:none}}',
  ].join('')

  function vars(p) {
    return '--a:' + p.a + ';--b:' + p.b + ';--aOn:' + p.aOn + ';--bOn:' + p.bOn
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] })
  }

  var rooms = PAIRS.map(function (p) {
    var current = p.key === pair.key
    return (
      '<li><a class="room" href="' + p.key + '.html" data-key="' + p.key + '" style="' + vars(p) + '"' +
      (current ? ' aria-current="page"' : '') +
      ' aria-label="' + esc(p.i + ' / ' + p.e + ' — ' + p.iWord + ' × ' + p.eWord) + '" title="' + esc(p.i + ' / ' + p.e) + '">' +
      '<span class="dot"></span><span class="more">' + esc(p.i + '/' + p.e) + '</span></a></li>'
    )
  }).join('')

  var host = document.createElement('div')
  host.setAttribute('data-cf-nav', '')
  host.style.cssText = 'all:initial;position:fixed;inset:0;pointer-events:none;z-index:2147483000'
  var root = host.attachShadow({ mode: 'open' })
  root.innerHTML =
    '<style>' + CSS + '</style>' +
    '<div class="veil" hidden aria-hidden="true"><div class="half half--a"><span class="vn"></span></div>' +
    '<div class="half half--b"><span class="vn"></span></div><p class="cap"></p></div>' +
    '<div class="home-veil" hidden aria-hidden="true"><span>The Cognitive Functions</span></div>' +
    '<nav aria-label="The Cognitive Functions">' +
    '<a class="home" href="' + hubHref + '" aria-label="Back to The Cognitive Functions"><span class="arrow">←</span><span class="more">All Functions</span></a>' +
    '<span class="sep" aria-hidden="true"></span><ul>' + rooms + '</ul></nav>'
  // Appended before <body> is parsed so the arrival veil paints on the very first frame.
  document.documentElement.appendChild(host)

  var veil = root.querySelector('.veil')
  var homeVeil = root.querySelector('.home-veil')

  function dress(p) {
    veil.setAttribute('style', vars(p))
    var names = veil.querySelectorAll('.vn')
    names[0].textContent = p.i
    names[1].textContent = p.e
    veil.querySelector('.cap').textContent = 'Room ' + p.room + ' · ' + p.iWord + ' × ' + p.eWord
  }
  function hideAll() {
    veil.hidden = true
    veil.className = 'veil'
    homeVeil.hidden = true
    homeVeil.className = 'home-veil'
  }

  // Arrival: the room's two colours part like doors.
  var arrival = null
  try { arrival = JSON.parse(store.get('cf:arrive') || 'null') } catch (e) {}
  if (arrival && arrival.to === pair.key) {
    store.del('cf:arrive')
    if (!reduce && Date.now() - arrival.t < 8000) {
      dress(pair)
      veil.hidden = false
      var open = function () {
        setTimeout(function () {
          requestAnimationFrame(function () { veil.classList.add('is-open') })
        }, 260)
        setTimeout(hideAll, 1500)
      }
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', open, { once: true })
      else open()
    }
  }

  function leave(href, arrive, show) {
    store.set('cf:arrive', JSON.stringify({ to: arrive, from: pair.key, t: Date.now() }))
    if (reduce) { location.href = href; return }
    show()
    setTimeout(function () { location.href = href }, 700)
  }

  root.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a')
    if (!a || ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return
    var key = a.getAttribute('data-key')
    if (key === pair.key) { ev.preventDefault(); window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); return }
    ev.preventDefault()
    var href = a.getAttribute('href')
    if (a.classList.contains('home')) {
      leave(href, 'hub', function () {
        homeVeil.hidden = false
        homeVeil.getBoundingClientRect()
        homeVeil.classList.add('is-in')
      })
      return
    }
    var next = PAIRS.filter(function (p) { return p.key === key })[0]
    leave(href, key, function () {
      dress(next)
      veil.className = 'veil is-closing'
      veil.hidden = false
      veil.getBoundingClientRect()
      veil.className = 'veil'
    })
  })

  // Out of the way while reading down the page; back as soon as the visitor scrolls up or reaches for it.
  var navEl = root.querySelector('nav')
  var lastY = window.scrollY
  var tuck = false
  window.addEventListener('scroll', function () {
    var y = window.scrollY
    var next = y > lastY + 4 && y > innerHeight * 0.6 ? true : y < lastY - 4 ? false : tuck
    lastY = y
    if (next !== tuck && !navEl.matches(':focus-within')) { tuck = next; navEl.classList.toggle('is-tucked', tuck) }
  }, { passive: true })
  window.addEventListener('pointermove', function (e) {
    if (tuck && e.clientY > innerHeight - 90 && e.clientX < 320) { tuck = false; navEl.classList.remove('is-tucked') }
  }, { passive: true })

  // Returning through the back/forward cache must not leave a curtain drawn.
  window.addEventListener('pageshow', function (ev) { if (ev.persisted) hideAll() })
})()

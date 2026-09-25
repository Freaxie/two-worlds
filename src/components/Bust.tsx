/* Marble herm portraits, drawn in profile.
   Plato: full, long beard, hair bound with a fillet (after the Silanion type).
   Aristotle: close-trimmed beard, receding hair (after the Lysippan type).
   Both are drawn facing right; Aristotle is mirrored so the two face each other. */

type Props = { who: 'plato' | 'aris'; className?: string; ground: 'night' | 'paper' }

const PLATO_OUTLINE =
  'M190 52 C236 44 282 62 298 100 C305 118 307 140 306 158 C309 164 312 168 312 172 ' +
  'C309 178 310 182 314 188 C322 200 332 212 338 224 C341 231 333 237 322 236 ' +
  'C323 244 327 251 324 258 C334 280 339 318 331 350 C324 378 312 400 300 418 ' +
  'L334 424 L334 560 L106 560 L106 422 C124 410 140 392 146 362 ' +
  'C150 332 136 302 124 272 C104 234 92 190 98 140 C104 92 140 56 190 52 Z'

const ARIS_OUTLINE =
  'M196 60 C242 52 284 72 298 110 C304 128 306 146 305 162 C308 168 311 172 311 176 ' +
  'C308 182 309 186 313 192 C320 204 329 215 334 226 C336 233 329 238 320 237 ' +
  'C321 244 324 250 322 256 C330 272 332 296 324 316 C316 334 298 344 276 346 ' +
  'C270 362 272 392 282 420 L332 426 L332 560 L110 560 L110 424 C130 414 150 398 162 372 ' +
  'C168 346 150 318 136 292 C112 250 100 206 104 158 C108 104 146 66 196 60 Z'

const PLATO_HAIR =
  'M296 104 C284 62 236 44 190 52 C140 56 104 92 98 140 C92 190 104 234 124 272 ' +
  'C138 262 150 250 156 236 C150 212 148 190 160 176 C184 146 236 116 296 110 Z'
const PLATO_BEARD =
  'M194 236 C214 264 238 272 262 262 C282 256 302 248 322 254 C336 280 339 318 331 350 ' +
  'C324 378 312 400 300 418 C270 426 236 420 212 402 C198 378 192 330 194 290 Z'
const ARIS_HAIR =
  'M258 100 C248 72 226 60 196 60 C146 66 108 104 104 158 C100 206 112 250 136 292 ' +
  'C150 282 160 262 164 244 C156 216 156 192 170 176 C194 150 230 128 262 120 Z'
const ARIS_BEARD =
  'M198 236 C216 262 236 270 258 264 C280 258 300 250 322 254 C330 272 332 296 324 316 ' +
  'C316 334 298 344 276 346 C246 346 214 330 204 300 Z'

/* carved texture: wavy locks for Plato, short combed strokes for Aristotle */
function locks(isPlato: boolean) {
  const out: string[] = []
  if (isPlato) {
    /* long wavy strands swept back from the brow */
    for (let y = 40; y < 300; y += 8) {
      let d = `M300 ${y}`
      for (let x = 300; x > 80; x -= 16) d += ` q-8 ${((x / 16) % 2 ? 1 : -1) * 3} -16 0`
      out.push(d)
    }
    /* beard falling in vertical locks */
    for (let x = 192; x < 344; x += 8) {
      let d = `M${x} 240`
      for (let y = 240; y < 430; y += 14) d += ` q${((y / 14) % 2 ? 1 : -1) * 3} 7 0 14`
      out.push(d)
    }
  } else {
    for (let y = 56; y < 300; y += 10)
      for (let x = 96; x < 270; x += 14) {
        const o = ((y / 10) % 2) * 7
        out.push(`M${x + o} ${y} l9 -3`)
      }
    for (let y = 250; y < 350; y += 11)
      for (let x = 198; x < 334; x += 11) {
        const o = ((y / 11) % 2) * 5
        out.push(`M${x + o} ${y} q4 4 1 8`)
      }
  }
  return out
}

export function Bust({ who, className, ground }: Props) {
  const id = `${who}-${ground}`
  const isPlato = who === 'plato'
  const light = ground === 'night' ? ['#f1ede4', '#cfc8ba', '#6d6a64'] : ['#f6f2ea', '#d6cfc1', '#8d8577']
  const lineCol = ground === 'night' ? 'rgba(40,38,34,0.55)' : 'rgba(60,52,40,0.5)'
  const outline = isPlato ? PLATO_OUTLINE : ARIS_OUTLINE

  return (
    <svg
      className={className}
      viewBox="60 30 320 540"
      role="img"
      aria-label={isPlato ? 'Marble herm of Plato in profile' : 'Marble herm of Aristotle in profile'}
      style={isPlato ? undefined : { transform: 'scaleX(-1)' }}
    >
      <defs>
        {/* light falls from the centre of the composition, i.e. from the face side */}
        <linearGradient id={`${id}-marble`} x1="1" y1="0.2" x2="0" y2="0.6">
          <stop offset="0" stopColor={light[0]} />
          <stop offset="0.45" stopColor={light[1]} />
          <stop offset="1" stopColor={light[2]} />
        </linearGradient>
        <radialGradient id={`${id}-sheen`} cx="0.78" cy="0.28" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.72" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-mask`}>
          <rect x="0" y="0" width="440" height="600" fill={`url(#${id}-fade)`} />
        </mask>
        <filter id={`${id}-stone`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={isPlato ? 3 : 8} result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.28  0 0 0 0 0.25  0 0 0 0.35 0" result="g" />
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.035" numOctaves="3" seed={isPlato ? 11 : 5} result="vein" />
          <feColorMatrix in="vein" type="matrix" values="0 0 0 0 0.4  0 0 0 0 0.38  0 0 0 0 0.35  0 0 0 -1.1 0.62" result="v" />
          <feMerge>
            <feMergeNode in="v" />
            <feMergeNode in="g" />
          </feMerge>
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <clipPath id={`${id}-clip`}>
          <path d={outline} />
        </clipPath>
      </defs>

      <g mask={`url(#${id}-mask)`}>
        {/* body of stone */}
        <path d={outline} fill={`url(#${id}-marble)`} />
        <g clipPath={`url(#${id}-clip)`}>
          <rect x="60" y="30" width="320" height="540" fill={`url(#${id}-sheen)`} />
          <rect x="60" y="30" width="320" height="540" filter={`url(#${id}-stone)`} fill="#000" />
          {/* hair and beard: carved masses, slightly darker and textured with locks */}
          <clipPath id={`${id}-hair`}>
            <path d={isPlato ? PLATO_HAIR : ARIS_HAIR} />
            <path d={isPlato ? PLATO_BEARD : ARIS_BEARD} />
          </clipPath>
          <g clipPath={`url(#${id}-hair)`}>
            <rect x="60" y="30" width="320" height="540" fill="#3a352e" opacity="0.14" />
            <g fill="none" stroke={lineCol} strokeWidth="0.9" strokeLinecap="round">
              {locks(isPlato).map((d, i) => (
                <path key={i} d={d} opacity={0.5} />
              ))}
            </g>
          </g>
          {/* shadow on the back of the skull and under the jaw */}
          <ellipse cx="140" cy="200" rx="70" ry="150" fill="#2a2724" opacity="0.18" />
          <ellipse cx="240" cy={isPlato ? 440 : 420} rx="140" ry="30" fill="#2a2724" opacity="0.14" />
          {/* modelling of the face: socket under the brow, the cheek's turn, light on brow and nose */}
          <ellipse cx="288" cy="184" rx="20" ry="11" fill="#2a2724" opacity="0.13" />
          <ellipse cx="258" cy="226" rx="34" ry="22" fill="#2a2724" opacity="0.08" />
          <ellipse cx="200" cy="170" rx="42" ry="80" fill="#2a2724" opacity="0.07" />
          <ellipse cx="298" cy="136" rx="9" ry="30" fill="#fff" opacity="0.22" />
          <ellipse cx="326" cy="212" rx="5" ry="14" fill="#fff" opacity="0.2" transform="rotate(-30 326 212)" />
        </g>

        {/* carved detail */}
        <g fill="none" stroke={lineCol} strokeLinecap="round" strokeWidth="1.3">
          {/* brow + eye */}
          <path d="M268 166 Q290 154 310 166" />
          <path d="M280 182 Q291 175 301 182 Q291 187 280 182 Z" strokeWidth="1.1" />
          <path d="M283 190 Q292 194 300 190" opacity="0.5" />
          {/* nostril and cheek */}
          <path d="M318 226 Q324 230 322 234" opacity="0.7" />
          <path d="M270 206 Q284 222 300 230" opacity="0.28" />
          {/* ear */}
          <path d="M176 188 C160 190 158 214 164 228 C168 238 180 236 184 226" />
          <path d="M174 200 C168 206 170 218 176 220" opacity="0.6" />

          {isPlato ? (
            <>
              {/* fillet binding the hair */}
              <path d="M112 148 C160 112 230 92 294 98" strokeWidth="2" />
              <path d="M110 158 C160 122 232 102 297 108" strokeWidth="1" opacity="0.7" />
              {/* hair above the fillet */}
              <path d="M150 88 C186 76 230 74 266 84" opacity="0.55" />
              <path d="M128 112 C170 92 220 86 280 94" opacity="0.45" />
              {/* hair below the fillet, falling to the nape */}
              <path d="M120 176 C132 206 128 240 140 268" opacity="0.5" />
              <path d="M140 170 C150 200 146 236 156 262" opacity="0.4" />
              <path d="M104 190 C112 222 114 250 126 276" opacity="0.5" />
              {/* moustache */}
              <path d="M300 240 C310 244 318 248 322 258" />
              <path d="M298 250 C306 262 300 270 296 278" opacity="0.6" />
              {/* beard: long, in carved locks */}
              <path d="M196 238 C214 264 238 272 262 262" opacity="0.5" />
            </>
          ) : (
            <>
              {/* receding hairline, short hair combed forward */}
              <path d="M226 72 C250 76 270 90 280 106" opacity="0.5" />
              <path d="M150 110 C170 96 200 92 222 98 C236 104 246 112 252 124" opacity="0.55" />
              <path d="M130 144 C150 128 176 124 198 130" opacity="0.45" />
              <path d="M124 180 C140 168 162 166 180 172" opacity="0.4" />
              <path d="M268 132 C276 138 284 140 294 138" opacity="0.35" />
              {/* forehead lines */}
              <path d="M270 128 Q284 124 298 130" opacity="0.28" />
              <path d="M272 140 Q285 137 300 142" opacity="0.22" />
              {/* moustache */}
              <path d="M300 240 C308 243 316 248 320 256" />
              {/* short beard following the jaw */}
              <path d="M200 238 C216 262 236 270 258 264" opacity="0.5" />
              <path d="M276 346 C272 366 272 392 282 420" opacity="0.4" />
            </>
          )}

          {/* herm shoulders: chisel edge */}
          <path d={isPlato ? 'M106 424 L334 424' : 'M110 426 L332 426'} opacity="0.35" />
        </g>

        {/* inscription on the herm shaft */}
        <text
          x={isPlato ? 220 : 221}
          y={isPlato ? 492 : 494}
          textAnchor="middle"
          fontFamily="'GFS Didot', serif"
          fontSize={isPlato ? 22 : 17}
          letterSpacing={isPlato ? 5 : 3}
          fill="rgba(60,55,48,0.55)"
          transform={isPlato ? undefined : 'translate(442 0) scale(-1 1)'}
        >
          {isPlato ? 'ΠΛΑΤΩΝ' : 'ΑΡΙΣΤΟΤΕΛΗΣ'}
        </text>
      </g>
    </svg>
  )
}

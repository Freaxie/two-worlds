import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'
import { readJSON, writeJSON } from './storage'
import { useMedia } from './hooks'

/* ------------------------------------------------------------------
   Sensory settings. The site is about sensory differences, so the
   reader gets direct control over its sensory load — independent of
   (but defaulting to) the operating system's reduced-motion setting.
------------------------------------------------------------------- */

export type MotionPref = 'system' | 'full' | 'reduced'
export type TextSize = 'base' | 'lg' | 'xl'

export type Settings = {
  motion: MotionPref
  ambient: boolean
  text: TextSize
  contrast: 'standard' | 'high'
}

const KEY = 'nim:settings:v1'
const DEFAULTS: Settings = { motion: 'system', ambient: true, text: 'base', contrast: 'standard' }

type Ctx = {
  settings: Settings
  set: (patch: Partial<Settings>) => void
  reset: () => void
  /** true when movement should be minimised */
  calm: boolean
  /** true when continuous ambient animation (shaders, glow, drift) may run */
  ambientOn: boolean
  /** coarse pointer / small screen: lighter rendering budget */
  lite: boolean
}

const SettingsCtx = createContext<Ctx | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => readJSON(KEY, DEFAULTS))
  const osReduce = useMedia('(prefers-reduced-motion: reduce)')
  const coarse = useMedia('(pointer: coarse)')
  const narrow = useMedia('(max-width: 767px)')

  const calm = settings.motion === 'reduced' || (settings.motion === 'system' && osReduce)
  const ambientOn = settings.ambient && !calm
  const lite = coarse || narrow

  useEffect(() => {
    writeJSON(KEY, settings)
  }, [settings])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.motion = calm ? 'reduced' : 'full'
    root.dataset.ambient = ambientOn ? 'on' : 'off'
    root.dataset.text = settings.text
    root.dataset.contrast = settings.contrast
  }, [calm, ambientOn, settings.text, settings.contrast])

  const value = useMemo<Ctx>(
    () => ({
      settings,
      set: (patch) => setSettings((s) => ({ ...s, ...patch })),
      reset: () => setSettings(DEFAULTS),
      calm,
      ambientOn,
      lite,
    }),
    [settings, calm, ambientOn, lite]
  )

  return (
    <SettingsCtx.Provider value={value}>
      <MotionConfig reducedMotion={calm ? 'always' : 'never'}>{children}</MotionConfig>
    </SettingsCtx.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsCtx)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}

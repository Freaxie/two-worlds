import { lazy, Suspense } from 'react'
import { AlertTriangle, FlaskConical, LayoutDashboard, LayoutGrid, Monitor, MoonStar, Settings as SettingsIcon, Sun, Wallet, X, Gauge } from 'lucide-react'
import type { ThemePref } from './domain/types'
import { cx, inr } from './lib/format'
import { useTheme } from './lib/hooks'
import { href, navigate, useRoute, type View } from './lib/router'
import { dispatch, ModelProvider, store, useAppState, useModel, useStorageIssue } from './state/store'
import { PurchaseDialog } from './components/item'
import { Toaster } from './components/overlay'
import { IconButton } from './components/ui'
import { Overview } from './views/Overview'
import { Catalog } from './views/Catalog'
import { ItemDrawer } from './views/ItemDrawer'
import { useKey } from './lib/hooks'

const Planner = lazy(() => import('./views/Planner').then((m) => ({ default: m.Planner })))
const Research = lazy(() => import('./views/Research').then((m) => ({ default: m.Research })))
const Impact = lazy(() => import('./views/Impact').then((m) => ({ default: m.Impact })))
const Settings = lazy(() => import('./views/Settings').then((m) => ({ default: m.Settings })))
const Method = lazy(() => import('./views/Method').then((m) => ({ default: m.Method })))
const Triage = lazy(() => import('./views/Triage').then((m) => ({ default: m.Triage })))

const NAV: { view: View; label: string; icon: typeof LayoutGrid }[] = [
  { view: 'overview', label: 'Overview', icon: LayoutDashboard },
  { view: 'catalog', label: 'Catalog', icon: LayoutGrid },
  { view: 'plan', label: 'Plan', icon: Wallet },
  { view: 'research', label: 'Research', icon: FlaskConical },
  { view: 'impact', label: 'Impact', icon: Gauge },
]

const THEME_NEXT: Record<ThemePref, ThemePref> = { system: 'light', light: 'dark', dark: 'system' }
const THEME_ICON = { system: Monitor, light: Sun, dark: MoonStar }

export function App() {
  return (
    <ModelProvider>
      <Shell />
    </ModelProvider>
  )
}

function Shell() {
  const state = useAppState()
  const route = useRoute()
  useTheme(state.settings.theme)
  useKey('/', (e) => {
    e.preventDefault()
    if (route.view !== 'catalog') navigate('catalog', { focus: '1' })
    else document.getElementById('catalog-search')?.focus()
  })
  const itemId = route.params.get('item')
  const theme = state.settings.theme
  const active = route.view === 'method' || route.view === 'triage' ? null : route.view

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-[8px] focus:bg-ink focus:px-3 focus:py-2 focus:text-on-ink">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/75">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-4 px-4 sm:px-6 lg:px-10">
          <a href={href('overview')} className="flex items-baseline gap-1.5 whitespace-nowrap text-ink" aria-label="Essential Life Upgrade, overview">
            <span className="display text-[1.3125rem] italic">Essential</span>
            <span className="eyebrow text-muted">Life Upgrade</span>
          </a>
          <nav aria-label="Main" className="ml-4 hidden items-center gap-0.5 md:flex">
            {NAV.map((n) => (
              <a
                key={n.view}
                href={href(n.view)}
                aria-current={active === n.view ? 'page' : undefined}
                className={cx(
                  'rounded-[9px] px-3 py-1.5 text-sm transition-colors',
                  active === n.view ? 'bg-ink text-on-ink' : 'text-ink-2 hover:bg-inset hover:text-ink',
                )}
              >
                {n.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <BudgetChip />
            <IconButton
              icon={THEME_ICON[theme]}
              label={`Theme: ${theme}. Switch to ${THEME_NEXT[theme]}`}
              onClick={() => dispatch({ type: 'settings/patch', patch: { theme: THEME_NEXT[theme] } })}
            />
            <a
              href={href('settings')}
              aria-label="Settings"
              aria-current={active === 'settings' ? 'page' : undefined}
              title="Settings"
              className={cx('inline-grid size-10 place-items-center rounded-[10px] text-ink-2 hover:bg-inset hover:text-ink', active === 'settings' && 'bg-inset text-ink')}
            >
              <SettingsIcon aria-hidden className="size-[18px]" strokeWidth={1.75} />
            </a>
          </div>
        </div>
      </header>

      <StorageBanner />

      <main id="main" className="mx-auto max-w-[1240px] px-4 pt-6 pb-28 sm:px-6 md:pb-16 lg:px-10 lg:pt-10">
        <Suspense fallback={<div className="h-[60vh]" />}>
          {route.view === 'overview' && <Overview />}
          {route.view === 'catalog' && <Catalog />}
          {route.view === 'plan' && <Planner />}
          {route.view === 'research' && <Research />}
          {route.view === 'impact' && <Impact />}
          {route.view === 'settings' && <Settings />}
          {route.view === 'method' && <Method />}
          {route.view === 'triage' && <Triage />}
        </Suspense>
        <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs text-muted">
          <p>Prices marked “est.” are illustrative ranges for the Indian market, not live prices. Verify before buying.</p>
          <a href={href('method')} className="underline-offset-2 hover:text-ink hover:underline">
            How the scores work
          </a>
        </footer>
      </main>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {NAV.map((n) => (
            <li key={n.view}>
              <a
                href={href(n.view)}
                aria-current={active === n.view ? 'page' : undefined}
                className={cx('flex h-15 flex-col items-center justify-center gap-1 text-[0.6875rem]', active === n.view ? 'text-ink' : 'text-muted')}
              >
                <n.icon aria-hidden className="size-5" strokeWidth={active === n.view ? 2 : 1.6} />
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <ItemDrawer id={itemId} />
      <PurchaseDialog />
      <Toaster />
    </div>
  )
}

function BudgetChip() {
  const { budget } = useModel()
  const over = budget.remaining < 0
  return (
    <a
      href={href('plan')}
      className="mr-1 hidden h-8 items-center gap-2 rounded-full border border-line bg-surface px-3 text-[0.8125rem] text-ink-2 hover:border-line-strong lg:inline-flex"
      title="Budget remaining"
    >
      <span className={cx('size-1.5 rounded-full', over ? 'bg-bad' : 'bg-accent')} aria-hidden />
      <span className="num font-medium text-ink">{inr(budget.remaining)}</span> left
    </a>
  )
}

function StorageBanner() {
  const issue = useStorageIssue()
  if (!issue) return null
  const text = {
    unavailable: 'This browser is blocking local storage, so changes will be lost when you close the tab. Export your data from Settings to keep it.',
    recovered: 'Your saved data couldn’t be read, so the app started fresh. The unreadable copy was kept in this browser’s storage.',
    'write-failed': 'The latest change couldn’t be saved (storage may be full). Export your data from Settings to keep it safe.',
  }[issue]
  return (
    <div role="alert" className="border-b border-warn/30 bg-warn/10">
      <div className="mx-auto flex max-w-[1240px] items-start gap-3 px-4 py-2.5 text-[0.8125rem] text-ink sm:px-6 lg:px-10">
        <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-warn" />
        <p className="flex-1">{text}</p>
        <IconButton icon={X} label="Dismiss" size="sm" onClick={() => store.dismissIssue()} />
      </div>
    </div>
  )
}

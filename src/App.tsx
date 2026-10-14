import { BarChart3, LayoutGrid, Menu, Search, type LucideIcon } from 'lucide-react'
import { Suspense, lazy, useEffect, useMemo, useRef, useState, type ComponentProps, type TouchEvent } from 'react'
import { Catalog, type Scope } from './components/Catalog'
import { SESSION_META, sessionIcon } from './components/meta'
import { LoginScreen } from './components/LoginScreen'
import type { SettingsSheet as SettingsSheetType } from './components/SettingsSheet'
import { TimerBar } from './components/TimerBar'
import type { FocusTag, Session } from './data/program'
import { hasValidSession } from './lib/auth'
import { useAutoBackup } from './lib/backup'
import { useProgram } from './lib/custom'
import { firebaseEnabled } from './lib/firebaseConfig'
import { inSandbox } from './lib/sandbox'
import { today, updateProfile, useData } from './lib/storage'

const CloudApp = lazy(() => import('./CloudApp'))
// Écrans secondaires chargés à la demande (démarrage plus léger ; précachés pour le hors-ligne).
const SettingsSheet = lazy(() => import('./components/SettingsSheet').then((m) => ({ default: m.SettingsSheet })))
const StatsView = lazy(() => import('./components/StatsView').then((m) => ({ default: m.StatsView })))
const GuidedTour = lazy(() => import('./components/GuidedTour').then((m) => ({ default: m.GuidedTour })))
const SandboxApp = lazy(() => import('./SandboxApp'))

export type View = Scope | 'stats'

type Tab = { id: View; label: string; short: string; icon: LucideIcon }

/** Onglets : dossiers colorés en haut (desktop) / dock en bas (mobile), d'après le programme du compte. */
function tabsOf(program: Session[]): Tab[] {
  return [
    { id: 'all', label: 'Tout', short: 'Tout', icon: LayoutGrid },
    // L'Activation est intégrée en tête de chaque séance : pas d'onglet dédié.
    ...program
      .filter((s) => s.id !== 'activation' && s.exercises.length > 0)
      .map((s) => ({
        id: s.id as View,
        label: s.short,
        short: s.short.length > 9 ? SESSION_META[s.id].short : s.short,
        icon: sessionIcon(s.id, s.short),
      })),
    { id: 'stats', label: 'Progression', short: 'Stats', icon: BarChart3 },
  ]
}

const VIEW_KEY = 'trailstrong:view'

export default function App() {
  if (inSandbox)
    return (
      <Suspense fallback={null}>
        <SandboxApp />
      </Suspense>
    )
  if (firebaseEnabled)
    return (
      <Suspense fallback={null}>
        <CloudApp />
      </Suspense>
    )
  return <LocalApp />
}

/** Mode local historique : un seul utilisateur, données sur l'appareil. */
function LocalApp() {
  const [auth, setAuth] = useState<'checking' | 'locked' | 'open'>('checking')
  useEffect(() => {
    void hasValidSession().then((ok) => setAuth(ok ? 'open' : 'locked'))
  }, [])
  if (auth === 'checking') return null
  if (auth === 'locked') return <LoginScreen onUnlock={() => setAuth('open')} />
  return <Shell onLock={() => setAuth('locked')} />
}

export function Shell({ onLock, cloud }: { onLock: () => void; cloud?: ComponentProps<typeof SettingsSheetType>['cloud'] }) {
  useAutoBackup()
  const program = useProgram()
  const { profile } = useData()
  // Visite guidée : automatique pour un nouveau compte, puis depuis le Menu.
  const [tour, setTour] = useState(false)
  useEffect(() => {
    if (!profile.tourPending) return
    const id = window.setTimeout(() => setTour(true), 700)
    return () => window.clearTimeout(id)
  }, [profile.tourPending])
  const endTour = () => {
    setTour(false)
    if (profile.tourPending || !profile.tourDone) updateProfile({ tourPending: false, tourDone: true })
  }
  const TABS = useMemo(() => tabsOf(program), [program])
  const [view, setViewState] = useState<View>(() => (localStorage.getItem(VIEW_KEY) as View | null) ?? 'seanceA')
  // Vue mémorisée qui n'existe plus dans ce programme → première séance.
  useEffect(() => {
    if (!TABS.some((t) => t.id === view)) setViewState(TABS[1]?.id ?? 'all')
  }, [TABS, view])
  const [focus, setFocus] = useState<FocusTag | null>(null)
  const [query, setQuery] = useState('')
  const [date, setDate] = useState(today())
  const [menu, setMenu] = useState(false)
  const [testsOpen, setTestsOpen] = useState(false)
  const openTests = () => {
    setView('stats')
    setTestsOpen(true)
  }
  const touch = useRef<{ x: number; y: number; ok: boolean } | null>(null)

  const setView = (v: View) => {
    setViewState(v)
    setFocus(null)
    localStorage.setItem(VIEW_KEY, v)
    window.scrollTo({ top: 0 })
  }

  const focusSearch = () => {
    if (view === 'stats') setView('all')
    window.setTimeout(() => {
      const el = document.getElementById('search')
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el?.focus({ preventScroll: true })
    }, 60)
  }

  // Balayage horizontal entre onglets.
  const onTouchStart = (e: TouchEvent) => {
    const el = e.target as HTMLElement
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, ok: !el.closest('input, textarea, select, svg, [data-noswipe], [role=toolbar]') }
  }
  const onTouchEnd = (e: TouchEvent) => {
    const t0 = touch.current
    touch.current = null
    if (!t0?.ok) return
    const dx = e.changedTouches[0].clientX - t0.x
    const dy = e.changedTouches[0].clientY - t0.y
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.8) return
    const i = TABS.findIndex((t) => t.id === view)
    const j = i + (dx < 0 ? 1 : -1)
    if (j >= 0 && j < TABS.length) {
      navigator.vibrate?.(8)
      setView(TABS[j].id)
    }
  }

  // Passage de minuit, app restée ouverte : si on était sur « aujourd'hui », on suit.
  const lastToday = useRef(today())
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = today()
      if (t === lastToday.current) return
      if (date === lastToday.current) setDate(t)
      lastToday.current = t
    }, 60_000)
    return () => window.clearInterval(id)
  }, [date])

  return (
    <div className="min-h-dvh" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* ── En-tête : logo + sous-titre à gauche, accès rapides compacts à droite ── */}
      <header className="pt-safe">
        <div className="mx-auto flex max-w-6xl items-center gap-2 border-b border-line px-5 pb-4 pt-5 md:border-b-0 md:px-6">
          <button type="button" onClick={() => setView('all')} className="logo-patch" aria-label="Accueil">
            <span className="text-[24px] min-[400px]:text-[26px]">TrailStrong</span>
            <span className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted">Séances &amp; préparation</span>
          </button>
          <button
            type="button"
            onClick={focusSearch}
            aria-label="Rechercher"
            className="ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cream/45 text-cream transition-colors duration-150 hover:border-cream"
          >
            <Search className="h-[17px] w-[17px]" strokeWidth={2.4} />
          </button>
          <button type="button" onClick={() => setMenu(true)} data-tour="menu" className="pill pill-amber h-10 shrink-0 gap-1.5 px-4 text-[12px] uppercase">
            <Menu className="h-4 w-4" strokeWidth={2.8} /> Menu
          </button>
        </div>

        {/* Onglets (desktop) : barre à filet, onglet actif souligné ambre */}
        <nav className="mx-auto hidden max-w-6xl px-6 md:block" aria-label="Onglets" data-tour="tabs">
          <ul className="flex border-b border-line">
            {TABS.map((t, i) => {
              const active = t.id === view
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setView(t.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`-mb-px flex h-11 items-center gap-2 border-b-2 px-4 text-[12px] font-bold uppercase tracking-[0.14em] transition-colors duration-150 ${
                      active ? 'border-sun text-ink' : 'border-transparent text-muted hover:text-ink'
                    }`}
                  >
                    <span className="tabular-nums text-[10px] text-muted">{String(i).padStart(2, '0')}</span>
                    {t.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-3 pb-44 md:px-6 md:pb-28">
        {view === 'stats' ? (
          <Suspense fallback={null}>
            <StatsView testsOpen={testsOpen} setTestsOpen={setTestsOpen} />
          </Suspense>
        ) : (
          <Catalog program={program} scope={view} focus={focus} setFocus={setFocus} query={query} setQuery={setQuery} date={date} setDate={setDate} onTests={openTests} />
        )}
      </main>

      <TimerBar />

      {/* ── Dock flottant en verre dépoli (mobile) : onglet actif en bulle corail ── */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 px-3 md:hidden" aria-label="Onglets" data-noswipe data-tour="tabs">
        <ul className="alpine-glass mb-3 flex h-14 items-center justify-around rounded-full px-1.5 shadow-2xl">
          {TABS.map((t) => {
            const active = t.id === view
            const Icon = t.icon
            return (
              <li key={t.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => setView(t.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-full px-2.5 text-[10px] transition-colors duration-150 min-[400px]:px-3.5 ${
                    active ? 'bg-flame/90 font-extrabold text-on' : 'font-bold text-cream/75'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                  <span className="truncate uppercase">{t.short}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <Suspense fallback={null}>
        {menu && (
          <SettingsSheet
            onClose={() => setMenu(false)}
            onLock={onLock}
            cloud={cloud}
            onTour={() => {
              setMenu(false)
              setView(TABS[1]?.id ?? 'all')
              window.setTimeout(() => setTour(true), 400)
            }}
            onNavigate={(v, f) => {
              setView(v)
              if (f) setFocus(f)
              setMenu(false)
            }}
            onTests={() => {
              setMenu(false)
              openTests()
            }}
          />
        )}
        {tour && <GuidedTour onClose={endTour} />}
      </Suspense>
    </div>
  )
}

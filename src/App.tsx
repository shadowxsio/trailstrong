import { BarChart3, CircleHelp, Dumbbell, LayoutGrid, Menu, type LucideIcon } from 'lucide-react'
import { Suspense, lazy, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react'
import { Catalog, type Scope } from './components/Catalog'
import { SESSION_META, sessionIcon } from './components/meta'
import { LoginScreen } from './components/LoginScreen'
import type { CloudInfo } from './components/ProfileView'
import { TimerBar } from './components/TimerBar'
import type { FocusTag, Session } from './data/program'
import { hasValidSession } from './lib/auth'
import { useAutoBackup } from './lib/backup'
import { useProgram } from './lib/custom'
import { firebaseEnabled } from './lib/firebaseConfig'
import { inSandbox } from './lib/sandbox'
import { today, updateProfile, useData } from './lib/storage'
import { TAGLINE, avatarOf } from './lib/suite'

const CloudApp = lazy(() => import('./CloudApp'))
// Écrans secondaires chargés à la demande (démarrage plus léger ; précachés pour le hors-ligne).
const MenuSheet = lazy(() => import('./components/MenuSheet').then((m) => ({ default: m.MenuSheet })))
const StatsView = lazy(() => import('./components/StatsView').then((m) => ({ default: m.StatsView })))
const GuidedTour = lazy(() => import('./components/GuidedTour').then((m) => ({ default: m.GuidedTour })))
const SandboxApp = lazy(() => import('./SandboxApp'))
const HelpView = lazy(() => import('./components/HelpView').then((m) => ({ default: m.HelpView })))
const ProfileView = lazy(() => import('./components/ProfileView').then((m) => ({ default: m.ProfileView })))

export type View = Scope | 'stats' | 'help' | 'profile'

type Tab = { id: View; label: string; short: string; icon: LucideIcon }

/** Séances du programme du compte (sélecteur en haut de l'onglet Séances). */
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
  ]
}

/** Sur-titre de la page (le nom de l'onglet est déjà dans le dock : pas de grand titre en double). */
const VIEW_TITLE: Partial<Record<View, string>> = { stats: 'Ta progression', help: 'Guide & aide · FAQ, tuto, contact', profile: 'Ton perso, tes paramètres, ton compte' }

const isScope = (v: View) => v !== 'stats' && v !== 'help' && v !== 'profile'

const VIEW_KEY = 'trailstrong:view'
const SCOPE_KEY = 'trailstrong:scope'

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

export function Shell({ onLock, cloud }: { onLock: () => void; cloud?: CloudInfo }) {
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
    if (isScope(view) && !TABS.some((t) => t.id === view)) setViewState(TABS[1]?.id ?? 'all')
  }, [TABS, view])
  // Dernière séance ouverte : l'onglet « Séances » et le logo y ramènent.
  const [scope, setScope] = useState<View>(() => {
    const v = (localStorage.getItem(SCOPE_KEY) as View | null) ?? (isScope(view) ? view : 'seanceA')
    return isScope(v) ? v : 'seanceA'
  })
  const home = TABS.some((t) => t.id === scope) ? scope : (TABS[1]?.id ?? 'all')
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
  const avatar = avatarOf(profile.avatar)

  const setView = (v: View) => {
    setViewState(v)
    setFocus(null)
    localStorage.setItem(VIEW_KEY, v)
    if (isScope(v)) {
      setScope(v)
      localStorage.setItem(SCOPE_KEY, v)
    }
    window.scrollTo({ top: 0 })
  }
  const startTour = () => {
    setMenu(false)
    setView(home)
    window.setTimeout(() => setTour(true), 400)
  }

  // Balayage horizontal entre onglets.
  const onTouchStart = (e: TouchEvent) => {
    const el = e.target as HTMLElement
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, ok: !el.closest('input, textarea, select, svg, [data-noswipe], [role=toolbar]') }
  }
  const onTouchEnd = (e: TouchEvent) => {
    const t0 = touch.current
    touch.current = null
    if (!t0?.ok || !isScope(view)) return
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
      {/* ── En-tête de la suite Trail : logo (accueil) + accroche à gauche, perso à droite ── */}
      <header className="pt-safe">
        <div className="mx-auto flex max-w-6xl items-center gap-3 border-b border-line px-5 pb-3 pt-5 md:px-6">
          <button type="button" onClick={() => setView(home)} className="logo-patch min-w-0" aria-label="Accueil">
            <span className="text-[26px]" aria-label="TrailStrong">Trail<span className="logo-strong">Strong</span></span>
            <span className="mt-1 truncate text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted">{TAGLINE}</span>
          </button>
          <button
            type="button"
            onClick={() => setView('profile')}
            aria-label="Mon profil"
            data-testid="header-avatar"
            className="ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-full border-[1.5px] border-flame bg-paper text-[22px] leading-none"
          >
            {avatar}
          </button>
        </div>
        {!isScope(view) && (
          <p className="kicker mx-auto max-w-6xl px-5 pt-3 md:px-6" data-testid="page-kicker">
            {VIEW_TITLE[view]}
          </p>
        )}
        {isScope(view) && (
          <nav className="mx-auto max-w-6xl px-3 pt-2 md:px-6" aria-label="Séances" data-noswipe data-tour="tabs">
            <ul className="flex gap-2 overflow-x-auto px-2 pb-1 md:px-0">
              {TABS.map((t) => {
                const active = t.id === view
                const Icon = t.icon
                return (
                  <li key={t.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setView(t.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[12px] font-bold uppercase tracking-[0.08em] transition-colors duration-150 ${
                        active ? 'border-flame bg-flame text-on' : 'border-line text-cream/80 hover:border-cream'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2.6} />
                      {t.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-3 pb-44 md:px-6">
        <Suspense fallback={null}>
          {view === 'stats' ? (
            <StatsView testsOpen={testsOpen} setTestsOpen={setTestsOpen} />
          ) : view === 'help' ? (
            <HelpView onTour={startTour} />
          ) : view === 'profile' ? (
            <ProfileView cloud={cloud} onLock={onLock} onTests={openTests} />
          ) : (
            <Catalog program={program} scope={view} focus={focus} setFocus={setFocus} query={query} setQuery={setQuery} date={date} setDate={setDate} onTests={openTests} />
          )}
        </Suspense>
      </main>

      <TimerBar />

      {/* ── Dock de la suite Trail : 2 onglets, Menu au centre, Aide et Profil ── */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 px-3" aria-label="Onglets" data-noswipe>
        <ul className="alpine-glass mx-auto mb-3 grid h-16 max-w-md grid-cols-5 items-center rounded-full px-1.5 shadow-2xl">
          {(
            [
              { id: 'seances', label: 'Séances', icon: <Dumbbell className="h-[18px] w-[18px]" strokeWidth={2.4} />, active: isScope(view), go: () => setView(home) },
              { id: 'stats', label: 'Stats', icon: <BarChart3 className="h-[18px] w-[18px]" strokeWidth={2.4} />, active: view === 'stats', go: () => setView('stats') },
              null,
              { id: 'help', label: 'Aide', icon: <CircleHelp className="h-[18px] w-[18px]" strokeWidth={2.4} />, active: view === 'help', go: () => setView('help') },
              { id: 'profile', label: 'Profil', icon: <span className="text-[18px] leading-none">{avatar}</span>, active: view === 'profile', go: () => setView('profile') },
            ] as const
          ).map((t) =>
            t === null ? (
              <li key="menu" className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setMenu(true)}
                  data-tour="menu"
                  aria-label="Menu"
                  className="-mt-7 flex h-[62px] w-[62px] flex-col items-center justify-center gap-0.5 rounded-full border-4 border-paper-2 bg-flame text-on shadow-xl transition-transform active:scale-95"
                >
                  <Menu className="h-5 w-5" strokeWidth={3} />
                  <span className="text-[9px] font-extrabold uppercase tracking-wide">Menu</span>
                </button>
              </li>
            ) : (
              <li key={t.id} className="flex min-w-0 justify-center">
                <button
                  type="button"
                  onClick={t.go}
                  data-tour={`tab-${t.id}`}
                  aria-current={t.active ? 'page' : undefined}
                  className={`flex h-12 w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] uppercase transition-colors duration-150 ${
                    t.active ? 'bg-flame/90 font-extrabold text-on' : 'font-bold text-cream/75'
                  }`}
                >
                  {t.icon}
                  <span className="truncate">{t.label}</span>
                </button>
              </li>
            ),
          )}
        </ul>
      </nav>

      <Suspense fallback={null}>
        {menu && (
          <MenuSheet
            onClose={() => setMenu(false)}
            onTour={startTour}
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

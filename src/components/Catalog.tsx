import { CalendarDays, Plus, Search, Stethoscope, X } from 'lucide-react'
import { Suspense, lazy, useCallback, useEffect, useState, type ReactNode } from 'react'
import type { Exercise, FocusTag, Session, SessionId } from '../data/program'
import { routineOf, routineSeconds } from '../data/cooldown'
import { today, updateSessionLog, useData } from '../lib/storage'
import { useUserProgram } from '../lib/userProgram'
import { ExerciseDrawer } from './ExerciseDrawer'
import { ExerciseTile } from './ExerciseTile'
import { ExerciseDiagram } from './ExerciseDiagram'
import { TAG_META } from './meta'
import { PainCheckin } from './PainCheckin'
import { nextTestIn } from '../lib/tests'

// Écrans ouverts à la demande : chargés au premier usage (précachés pour le hors-ligne).
const CooldownCoach = lazy(() => import('./CooldownCoach').then((m) => ({ default: m.CooldownCoach })))
const SessionRecap = lazy(() => import('./SessionRecap').then((m) => ({ default: m.SessionRecap })))
const AddExerciseSheet = lazy(() => import('./AddExerciseSheet').then((m) => ({ default: m.AddExerciseSheet })))

export type Scope = 'all' | SessionId

const FOCUS: (FocusTag | null)[] = [null, 'knee', 'ankle', 'glutes']

/** Recherche tolérante aux accents et à la casse. */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

const haystack = (ex: Exercise, s: Session) =>
  norm([ex.name, ex.target, ex.equipment, ex.badge ?? '', s.short, s.title, ...ex.tags.map((t) => TAG_META[t].label)].join(' '))

const longDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })

export function Catalog({
  program,
  scope,
  focus,
  setFocus,
  query,
  setQuery,
  date,
  setDate,
  onTests,
}: {
  program: Session[]
  scope: Scope
  focus: FocusTag | null
  setFocus: (f: FocusTag | null) => void
  query: string
  setQuery: (q: string) => void
  date: string
  setDate: (d: string) => void
  onTests: () => void
}) {
  const data = useData()
  const day = data.logs[date] ?? {}
  const [openEx, setOpenEx] = useState<{ ex: Exercise; sessionId: SessionId } | null>(null)
  const openTile = useCallback((ex: Exercise, sessionId: SessionId) => setOpenEx({ ex, sessionId }), [])
  const [adding, setAdding] = useState<Session | null>(null)
  const [recap, setRecap] = useState<Session | null>(null)
  const generated = useUserProgram() !== null
  const [cooldown, setCooldown] = useState<Session | null>(null)

  // Séance du jour terminée à 100 % → bilan automatique (une seule fois), après la fanfare du coach.
  const doneKey = program.map((s) => s.exercises.every((e) => day[e.id]?.done) && s.exercises.length > 0).join()
  useEffect(() => {
    if (date !== today()) return
    const finished = program.find(
      (s) => s.id !== 'activation' && s.exercises.length > 0 && s.exercises.every((e) => day[e.id]?.done) && !data.sessions[date]?.[s.id]?.recapAt,
    )
    if (!finished) return
    const id = window.setTimeout(() => {
      updateSessionLog(date, finished.id, { recapAt: Date.now() })
      setRecap(withWarmup(finished))
    }, 1800)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneKey, date])
  const startedIn = (s: Session) => s.exercises.some((e) => day[e.id]?.sets.some((x) => x.done) || day[e.id]?.done)

  // Une séance = 1. Activation (échauffement) → 2. ses exercices → 3. mobilité.
  const activation = program.find((s) => s.id === 'activation')!
  const withWarmup = (s: Session): Session => (s.id === 'activation' ? s : { ...s, exercises: [...activation.exercises, ...s.exercises] })
  const inScope = scope === 'all' ? program : scope === 'activation' ? [activation] : [activation, program.find((s) => s.id === scope)!]
  const count = (f: FocusTag | null) => inScope.reduce((n, s) => n + s.exercises.filter((e) => !f || e.tags.includes(f)).length, 0)

  const q = norm(query.trim())
  const groups = inScope
    .map((s) => ({
      session: s,
      items: s.exercises.map((ex, i) => ({ ex, i })).filter(({ ex }) => (!focus || ex.tags.includes(focus)) && (!q || haystack(ex, s).includes(q))),
    }))
    .filter((g) => g.items.length || (scope !== 'all' && !q && !focus))

  const visible = groups.flatMap((g) => g.items.map((x) => x.ex))
  const doneCount = visible.filter((e) => day[e.id]?.done).length
  const pct = visible.length ? Math.round((doneCount / visible.length) * 100) : 0
  const current = scope !== 'all' ? program.find((s) => s.id === scope)! : null
  const routine = current ? routineOf(current) : []
  const showMobility = !!current && routine.length > 0 && !q && !focus
  const finishedAt = current ? data.sessions[date]?.[current.id]?.recapAt : undefined
  const step = (s: Session) => (scope === 'all' ? null : s.id === 'activation' ? 1 : 2)
  const headline = q
    ? `${visible.length} résultat${visible.length > 1 ? 's' : ''}`
    : current
      ? current.title.split('—')[1]?.trim() || current.short
      : `${visible.length} exercices`
  const canAdd = !q && !focus

  return (
    <>
      {/* ── Tableau de bord : grille asymétrique (titre 7/12, indicateurs 5/12) ── */}
      <section className="hero mt-2 grid overflow-hidden md:grid-cols-12">
        <div className="px-4 pb-5 pt-4 md:col-span-7 md:border-r md:border-line md:px-6 md:pb-6 md:pt-5">
          <p className="kicker">{current ? current.subtitle : 'Programme complet'}</p>
          <h1 className={`display mt-3 text-[40px] sm:text-[54px] ${current ? 'text-ink' : 'text-sun'}`}>{headline}</h1>
          {current && <p className="mt-3 max-w-prose text-[15px] font-semibold leading-snug text-ink">{current.goal}</p>}
          {current && generated && (
            <p className="mt-3 flex max-w-prose items-start gap-2 text-[12px] font-semibold leading-snug text-muted">
              <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-flame" strokeWidth={2.2} />
              Programme généré automatiquement à partir de tes réponses : fais-le valider par un physio ou un coach, surtout en cas de douleur.
            </p>
          )}
        </div>

        {/* Indicateurs du jour */}
        <div className="grid grid-cols-2 border-t border-line md:col-span-5 md:grid-cols-1 md:border-t-0">
          <div className="border-r border-line px-4 py-4 md:border-r-0 md:border-b md:px-6">
            <p className="kicker">Progression</p>
            <p className="mt-2 flex items-baseline gap-1 text-[44px] font-extrabold leading-none tracking-tight tabular-nums">
              {pct}
              <span className="text-[18px] text-muted">%</span>
            </p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className={`h-full transition-all duration-500 ${pct === 100 ? 'bg-mint' : 'bg-sun'}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="px-4 py-4 md:px-6">
            <p className="kicker">Validés</p>
            <p className="mt-2 text-[28px] font-extrabold leading-none tabular-nums">
              {doneCount}
              <span className="text-[16px] text-muted"> / {visible.length}</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <label className={`relative cursor-pointer ${date === today() ? 'pill pill-amber' : 'pill'}`} title="Changer la date">
                <CalendarDays className="h-3.5 w-3.5" strokeWidth={2.2} />
                {date === today() ? 'Aujourd’hui' : longDate(date)}
                <input
                  type="date"
                  value={date}
                  max={today()}
                  onChange={(e) => e.target.value && setDate(e.target.value)}
                  aria-label="Date de la séance"
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
              {date !== today() && (
                <button type="button" onClick={() => setDate(today())} className="text-[11px] font-bold uppercase tracking-[0.12em] text-sun underline underline-offset-2">
                  Revenir à aujourd’hui
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filtres + actions, sur toute la largeur */}
        <div className="border-t border-line px-4 py-4 md:col-span-12 md:px-6">
          <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label="Filtres">
            {FOCUS.map((f) => {
              const active = f === focus
              return (
                <button
                  key={f ?? 'all'}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFocus(f)}
                  className={`pill h-9 px-3.5 text-[12px] transition-colors duration-150 ${active ? 'pill-amber' : 'hover:border-cream'}`}
                >
                  {f ? TAG_META[f].label : 'Tous'}
                  <span className={`tabular-nums ${active ? '' : 'text-muted'}`}>{count(f)}</span>
                </button>
              )
            })}
          </div>

          {current && current.id !== 'activation' && (
            <button
              type="button"
              data-tour="finish"
              onClick={() => {
                if (!finishedAt) updateSessionLog(date, current.id, { recapAt: Date.now() })
                setRecap(withWarmup(current))
              }}
              className={`mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md text-[12px] font-extrabold uppercase tracking-[0.14em] transition-colors duration-150 ${
                finishedAt ? 'border border-mint text-ocean' : 'bg-flame text-on'
              }`}
            >
              {finishedAt ? '✓ Séance terminée · bilan & récup' : 'Terminer la séance · bilan & récup'}
            </button>
          )}

          <PainCheckin date={date} />
          {nextTestIn(data, today()) <= 0 && (
            <button type="button" onClick={onTests} className="b-btn mt-3 flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-[12px]">
              <span className="medal h-6 w-6 text-[12px]">🧪</span>
              <span className="uppercase tracking-[0.12em]">Test mensuel à faire</span>
              <span className="ml-auto text-[11px] font-bold text-muted">4 tests · 15 min →</span>
            </button>
          )}
        </div>
      </section>

      {/* ── Recherche ── */}
      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" strokeWidth={2.2} />
        <input
          id="search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Exercice, muscle ou équipement"
          className="b-input h-12 w-full pl-11 pr-12 text-[16px] placeholder:text-muted"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="Effacer la recherche" className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center">
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* ── Grille ── */}
      <div className="space-y-10 pt-8">
        {visible.length === 0 && (q || focus) && (
          <p className="b-box p-4 text-center text-[14px] font-bold">
            Aucun exercice ne correspond.{' '}
            <button
              type="button"
              className="underline decoration-2"
              onClick={() => {
                setQuery('')
                setFocus(null)
              }}
            >
              Tout afficher
            </button>
          </p>
        )}
        {groups.map((g) => (
          <section key={g.session.id} className="grid gap-4 lg:grid-cols-12 lg:gap-6">
            <SectionHeader
              tour={step(g.session) === 1 ? 'warmup' : undefined}
              n={step(g.session)}
              title={step(g.session) === 1 ? 'Activation' : g.session.short}
              sub={step(g.session) === 1 ? `Échauffement · ${g.session.duration}` : g.session.duration}
              done={g.items.filter(({ ex }) => day[ex.id]?.done).length}
              total={g.items.length}
              action={
                scope === 'all' && g.session.id !== 'activation' && startedIn(g.session) ? (
                  <button type="button" onClick={() => setRecap(withWarmup(g.session))} className="pill h-8 px-3 text-[11px] uppercase tracking-[0.12em] hover:border-cream">
                    Bilan
                  </button>
                ) : null
              }
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:col-span-9">
              {g.items.map(({ ex, i }) => (
                <ExerciseTile
                  key={`${date}-${ex.id}`}
                  ex={ex}
                  sessionId={g.session.id}
                  index={i}
                  date={date}
                  tour={step(g.session) === 2 && ex.id === g.items[0]?.ex.id}
                  onOpen={openTile}
                />
              ))}
              {canAdd && (
                <button
                  type="button"
                  data-tour={step(g.session) === 2 ? 'add' : undefined}
                  onClick={() => setAdding(g.session)}
                  className="flex min-h-[72px] items-center justify-center gap-2 rounded-xl border border-dashed border-line px-3 text-[12px] font-bold uppercase tracking-[0.14em] text-muted transition-colors duration-150 hover:border-sun hover:text-ink active:border-sun"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.4} /> Ajouter un exercice à cette séance
                </button>
              )}
            </div>
          </section>
        ))}

        {showMobility && current && (
          <section className="grid gap-4 lg:grid-cols-12 lg:gap-6">
            <SectionHeader
              tour="mobility"
              n={3}
              title="Mobilité"
              sub={`Étirements · ≈ ${Math.round(routineSeconds(routine) / 60)} min`}
              done={data.sessions[date]?.[current.id]?.cooldownAt ? routine.length : 0}
              total={routine.length}
            />
            <div className="lg:col-span-9">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {routine.map((st) => (
                <button key={st.id} type="button" onClick={() => setCooldown(current)} className="b-card overflow-hidden text-left active:translate-y-px">
                  <div className="diagram-bg aspect-[5/4] border-b border-line !border-t-0">
                    <ExerciseDiagram id={st.diagram} />
                  </div>
                  <p className="px-2 pt-1.5 text-[10px] font-extrabold uppercase text-ink/60">{st.target}</p>
                  <p className="px-2 text-[13px] font-black leading-tight">{st.name}</p>
                  <p className="px-2 pb-2 pt-0.5 text-[11px] font-bold">
                    {st.hold} s{st.perSide ? ' / côté' : ''}
                  </p>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setCooldown(current)}
              className={`pill-check mt-4 flex h-11 w-full justify-center text-[12px] ${data.sessions[date]?.[current.id]?.cooldownAt ? 'is-done' : ''}`}
            >
              {data.sessions[date]?.[current.id]?.cooldownAt ? '✓ Étirements faits · refaire' : '▶ Lancer le retour au calme guidé'}
            </button>
            </div>
          </section>
        )}
      </div>

      {openEx && (
        <ExerciseDrawer
          key={openEx.ex.id}
          ex={program.find((s) => s.id === openEx.sessionId)?.exercises.find((e) => e.id === openEx.ex.id) ?? openEx.ex}
          sessionId={openEx.sessionId}
          date={date}
          onClose={() => setOpenEx(null)}
        />
      )}
      <Suspense fallback={null}>
        {recap && (
          <SessionRecap
            session={recap}
            date={date}
            onClose={() => setRecap(null)}
            onCooldown={() => {
              setCooldown(program.find((p) => p.id === recap.id) ?? recap)
              setRecap(null)
            }}
          />
        )}
        {cooldown && <CooldownCoach session={cooldown} date={date} onClose={() => setCooldown(null)} />}
        {adding && (
          <AddExerciseSheet
            session={adding}
            onClose={() => setAdding(null)}
            onAdded={(id) => {
              setAdding(null)
              window.setTimeout(() => document.getElementById(`check-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60)
            }}
          />
        )}
      </Suspense>
    </>
  )
}

/** En-tête de section (colonne gauche de la grille) : grand numéro d'étape, titre, compteur. */
function SectionHeader({ n, title, sub, done, total, action, tour }: { n: number | null; title: string; sub: string; done: number; total: number; action?: ReactNode; tour?: string }) {
  const complete = total > 0 && done === total
  return (
    <div data-tour={tour} className="self-start border-t-2 border-sun pt-3 lg:sticky lg:top-4 lg:col-span-3">
      <div className="flex items-start gap-3 lg:block">
        {n && <span className="text-[40px] font-extrabold leading-none tracking-tight text-sun tabular-nums lg:text-[56px]">{String(n).padStart(2, '0')}</span>}
        <div className="min-w-0 flex-1 lg:mt-3">
          <h2 className="text-[20px] font-extrabold uppercase leading-tight tracking-[0.04em]">{title}</h2>
          <p className="kicker mt-1">{sub}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className={`pill tabular-nums ${complete ? 'pill-medal pl-2.5' : ''}`}>
          {done}/{total} {complete ? '✓' : ''}
        </span>
        {action}
      </div>
    </div>
  )
}

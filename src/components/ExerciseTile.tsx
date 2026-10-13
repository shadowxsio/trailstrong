import { Check, Shield, ShieldCheck } from 'lucide-react'
import { memo } from 'react'
import type { Exercise, SessionId } from '../data/program'
import { useExerciseLog } from '../lib/useExerciseLog'
import { Medal, Pill, SESSION_META, categoryOf, iconOf, restLabel } from './meta'

/**
 * Fiche d'entraînement (grille Swiss Alpine) : numérotation et catégorie intégrées en haut
 * (« 01 / SÉANCE A »), titre, brève description, pilules alignées, puis pied de carte avec
 * pastilles de série et pilule « ✓ Valider » (contour crème → pleine menthe une fois validée).
 */
export const ExerciseTile = memo(function ExerciseTile({
  ex,
  sessionId,
  index,
  date,
  onOpen,
  tour,
}: {
  ex: Exercise
  sessionId: SessionId
  index: number
  date: string
  /** Callback stable (la carte est mémoïsée). */
  onOpen: (ex: Exercise, sessionId: SessionId) => void
  /** Carte présentée par la visite guidée. */
  tour?: boolean
}) {
  const { done, toggleDone, doneSets, sets, prev, maxToday, suggestion } = useExerciseLog(ex, date)
  const Icon = iconOf(ex)
  const s = SESSION_META[sessionId]
  const tid = ex.trackId ?? ex.id
  const kneeFocus = ex.tags.includes('knee')
  const num = String(index + 1).padStart(2, '0')

  return (
    <article className="fade-up" data-tour={tour ? 'exercise' : undefined}>
      <div className={`b-card flex h-full flex-col transition-colors duration-150 ${done ? '!border-mint/60' : ''}`}>
        <button type="button" onClick={() => onOpen(ex, sessionId)} className="block w-full flex-1 px-4 pb-4 pt-3 text-left" aria-label={`Ouvrir ${ex.name}`}>
          {/* Numérotation + catégorie intégrées */}
          <div className="flex items-center gap-2 border-b border-line pb-2.5">
            <span className="text-[11px] font-extrabold tabular-nums tracking-[0.18em] text-sun">{num}</span>
            <span className="text-[11px] font-bold text-muted">/</span>
            <span className="min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{s.label}</span>
            {done && <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ocean">Validé</span>}
          </div>

          <div className="mt-3 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-[18px] font-extrabold leading-tight tracking-[-0.01em] text-ink">{ex.name}</h3>
              {ex.cue && <p className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-snug text-muted">{ex.cue}</p>}
            </div>
            {prev && (
              <div className="shrink-0 border-l border-line pl-3 text-right">
                <p className="text-[26px] font-extrabold leading-none tracking-tight text-ink tabular-nums">{prev.value.replace('.', ',')}</p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-muted">{prev.unit} · préc.</p>
                {suggestion?.kind === 'up' && !done && (
                  <p className="pill pill-medal mt-1.5 h-5 px-1.5 text-[10px]" title={suggestion.text}>
                    ↑ {String(suggestion.weight).replace('.', ',')}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            <Pill tone="amber">{ex.sets > 1 ? `${ex.sets} séries` : '1 bloc'}</Pill>
            <Pill>{ex.reps}</Pill>
            {ex.rest > 0 && <Pill>Repos {restLabel(ex.rest)}</Pill>}
            {ex.equipment && <Pill>{ex.equipment}</Pill>}
            <Medal icon={Icon}>{categoryOf(ex)}</Medal>
            <span
              className="inline-grid h-6 w-6 place-items-center rounded-full border border-mint/45 text-ocean"
              title={kneeFocus ? 'Cible la protection du genou' : 'Sans risque pour le genou'}
              aria-label={kneeFocus ? 'Cible la protection du genou' : 'Sans risque pour le genou'}
              role="img"
            >
              {kneeFocus ? <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.4} /> : <Shield className="h-3.5 w-3.5" strokeWidth={2.4} />}
            </span>
            {ex.source === 'catalog' && <Pill tone="sky">Fiche simplifiée</Pill>}
          </div>
        </button>

        <div className="flex items-center gap-2 border-t border-line px-4 py-2.5">
          <span className="pill h-8 min-w-0 gap-1.5 px-2.5">
            {ex.mode !== 'treadmill' &&
              sets.map((x, i) => <span key={i} aria-hidden className={`set-dot shrink-0 ${x.done ? 'is-done' : x.L?.done || x.R?.done ? 'is-half' : ''}`} />)}
            <span className="ml-0.5 truncate text-[11px] font-bold text-muted">
              {done ? `Complété${maxToday ? ` · ${maxToday} lbs` : ''}` : ex.mode === 'treadmill' ? 'À faire' : `${doneSets.length}/${sets.length} séries`}
            </span>
          </span>
          <button
            type="button"
            id={`check-${tid}`}
            data-tour={tour ? 'validate' : undefined}
            onClick={toggleDone}
            aria-pressed={done}
            className={`pill-check ml-auto h-8 shrink-0 px-3.5 text-[11px] ${done ? 'pop' : ''}`}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
            {done ? 'Validé' : 'Valider'}
          </button>
        </div>
      </div>
    </article>
  )
})

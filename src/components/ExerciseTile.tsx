import { Check } from 'lucide-react'
import { memo } from 'react'
import type { Exercise, SessionId } from '../data/program'
import { useExerciseLog } from '../lib/useExerciseLog'
import { Pill, SESSION_META, categoryOf, iconOf, restLabel } from './meta'

/**
 * Fiche d'exercice « Swiss Alpine Night Trail » (maquette TrailStrong du kit) :
 * en-tête intérieur à filet (bulle ambre « ACTIVATION • 02 » + muscle ciblé en menthe),
 * médaillon menthe à gauche du titre, consigne, petites bulles, puis pastilles de série
 * et bouton « ✓ Valider » à contour crème (plein menthe une fois validé).
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
    <article className="fade-up h-full" data-tour={tour ? 'exercise' : undefined}>
      <div className={`b-card flex h-full flex-col transition-colors duration-150 ${done ? '!border-mint' : ''}`}>
        <button type="button" onClick={() => onOpen(ex, sessionId)} className="block w-full flex-1 space-y-3 p-4 pb-3 text-left" aria-label={`Ouvrir ${ex.name}`}>
          {/* En-tête intérieur : catégorie numérotée + muscle ciblé */}
          <div className="flex items-center justify-between gap-2 border-b border-cream/15 pb-2.5">
            <span className="pill pill-amber h-5 px-3 text-[10px] uppercase tracking-wider">
              {s.label} • {num}
            </span>
            <span
              className="truncate text-[11px] font-bold text-ocean"
              title={kneeFocus ? 'Cible la protection du genou' : 'Sans risque pour le genou'}
            >
              {categoryOf(ex)} <span aria-hidden>●</span>
            </span>
          </div>

          {/* Médaillon menthe + titre */}
          <div className="flex items-center gap-3.5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-cream bg-mint text-on" aria-hidden>
              <Icon className="h-5 w-5" strokeWidth={2.6} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[18px] font-extrabold leading-tight text-ink">{ex.name}</h3>
              <p className="mt-0.5 line-clamp-1 text-[12px] text-muted">{ex.target}</p>
            </div>
            {prev && (
              <div className="shrink-0 text-right">
                <p className="text-[24px] font-extrabold leading-none tracking-tight tabular-nums text-ink">{prev.value.replace('.', ',')}</p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted">{prev.unit} · préc.</p>
                {suggestion?.kind === 'up' && !done && (
                  <p className="pill pill-mint mt-1 h-5 px-1.5 text-[10px]" title={suggestion.text}>
                    ↑ {String(suggestion.weight).replace('.', ',')}
                  </p>
                )}
              </div>
            )}
          </div>

          {ex.cue && <p className="line-clamp-2 text-[14px] leading-relaxed text-cream/90">{ex.cue}</p>}

          {/* Petites bulles */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Pill tone="amber">{ex.sets > 1 ? `${ex.sets} séries` : '1 bloc'}</Pill>
            <Pill>{ex.reps}</Pill>
            {ex.rest > 0 && <Pill>Repos {restLabel(ex.rest)}</Pill>}
            {ex.equipment && <Pill>{ex.equipment}</Pill>}
            {ex.source === 'catalog' && <Pill tone="sky">Fiche simplifiée</Pill>}
          </div>
        </button>

        {/* Pied : pastilles de série + validation */}
        <div className="mx-4 flex items-center justify-between gap-2 border-t border-cream/15 py-3">
          <div className={`flex min-w-0 items-center gap-2 text-[12px] font-bold ${done ? 'text-ocean' : 'text-muted'}`}>
            {ex.mode !== 'treadmill' &&
              sets.map((x, i) => <span key={i} aria-hidden className={`set-dot shrink-0 ${x.done ? 'is-done' : x.L?.done || x.R?.done ? 'is-half' : ''}`} />)}
            <span className="ml-1 truncate">
              {done ? `Complété${maxToday ? ` · ${maxToday} lbs` : ''}` : ex.mode === 'treadmill' ? 'À faire' : `${doneSets.length}/${sets.length} séries`}
            </span>
          </div>
          <button
            type="button"
            id={`check-${tid}`}
            data-tour={tour ? 'validate' : undefined}
            onClick={toggleDone}
            aria-pressed={done}
            className={`pill-check h-8 shrink-0 px-4 text-[12px] ${done ? 'pop' : ''}`}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
            {done ? 'Validé' : 'Valider'}
          </button>
        </div>
      </div>
    </article>
  )
})

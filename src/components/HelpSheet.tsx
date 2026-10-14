/**
 * Guide & aide (Menu → Guide & aide) : sommaire, recherche et une section dépliable par thème.
 * Même organisation que le guide de TrailJourney (suite Trail).
 */
import { ArrowLeft, X } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { HELP, searchHelp } from '../data/help'

export function HelpSheet({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const sections = searchHelp(query)

  return createPortal(
    <div className="fade-in fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 md:items-stretch md:justify-end" onClick={onClose}>
      <div
        className="sheet pb-safe max-h-[92dvh] w-full max-w-xl overflow-y-auto border border-b-0 border-line bg-paper-2 px-4 pt-4 md:max-h-none md:w-[460px] md:border-b md:border-r-0 rounded-t-2xl md:rounded-none md:rounded-l-[26px]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Guide & aide"
        data-noswipe
      >
        <div className="mb-3 flex items-center gap-2">
          <button type="button" onClick={onClose} className="b-btn grid h-11 w-11 place-items-center rounded-full" aria-label="Retour au Menu">
            <ArrowLeft className="h-5 w-5" strokeWidth={3} />
          </button>
          <div className="min-w-0">
            <p className="kicker">Guide & aide</p>
            <h2 className="headline text-[26px]">Tout comprendre</h2>
          </div>
          <button type="button" onClick={onClose} className="b-btn ml-auto grid h-11 w-11 place-items-center rounded-full" aria-label="Fermer le guide">
            <X className="h-5 w-5" strokeWidth={3} />
          </button>
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher (ex : chrono, coach, catalogue)"
          aria-label="Rechercher dans l’aide"
          className="b-input mb-4 h-12 w-full px-3 text-[15px]"
        />

        {!query && (
          <nav aria-label="Sommaire" className="mb-4 grid grid-cols-2 gap-2">
            {HELP.map((s) => (
              <button key={s.id} type="button" onClick={() => setOpen(s.id)} className="b-btn p-2.5 text-left text-[13px]">
                {s.icon} {s.title}
              </button>
            ))}
          </nav>
        )}

        <div className="mb-8 flex flex-col gap-3" data-testid="help-sections">
          {sections.length === 0 && <p className="text-[14px] font-semibold text-muted">Aucun résultat. Essaie un autre mot.</p>}
          {sections.map((s) => (
            <details
              key={s.id}
              id={`aide-${s.id}`}
              open={!!query || open === s.id}
              onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && setOpen(s.id)}
              className="b-card p-4"
            >
              <summary className="cursor-pointer text-[15px] font-extrabold">
                <span aria-hidden="true">{s.icon}</span> {s.title}
              </summary>
              <dl className="mt-3 flex flex-col gap-3">
                {s.entries.map((e) => (
                  <div key={e.q}>
                    <dt className="text-[14px] font-extrabold text-ocean">{e.q}</dt>
                    <dd className="mt-0.5 text-[14px] font-semibold leading-snug text-ink/85">{e.a}</dd>
                  </div>
                ))}
              </dl>
            </details>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}

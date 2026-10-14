/**
 * Onglet Aide (dock) : FAQ avec sommaire et recherche, visite guidée à refaire, contact.
 * Même organisation que l'onglet Aide de TrailJourney (suite Trail).
 */
import { Mail, PlayCircle } from 'lucide-react'
import { useState } from 'react'
import { HELP, searchHelp } from '../data/help'
import { contactHref } from '../lib/suite'

export function HelpView({ onTour }: { onTour: () => void }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const sections = searchHelp(query)

  return (
    <section className="mx-auto mt-2 flex max-w-xl flex-col gap-4" aria-label="Guide & aide">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onTour} className="b-btn flex h-12 items-center justify-center gap-2 text-[13px] uppercase tracking-wide">
          <PlayCircle className="h-4 w-4" strokeWidth={2.4} /> Refaire le tuto
        </button>
        <a href={contactHref('TrailStrong')} className="b-btn flex h-12 items-center justify-center gap-2 text-[13px] uppercase tracking-wide no-underline">
          <Mail className="h-4 w-4" strokeWidth={2.4} /> Nous écrire
        </a>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher (ex : chrono, coach, catalogue)"
        aria-label="Rechercher dans l’aide"
        className="b-input h-12 w-full px-3 text-[15px]"
      />

      {!query && (
        <nav aria-label="Sommaire" className="grid grid-cols-2 gap-2">
          {HELP.map((s) => (
            <button key={s.id} type="button" onClick={() => setOpen(s.id)} className="b-btn p-2.5 text-left text-[13px]">
              {s.icon} {s.title}
            </button>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-3" data-testid="help-sections">
        {sections.length === 0 && <p className="text-[14px] font-semibold text-muted">Aucun résultat. Essaie un autre mot, ou écris-nous.</p>}
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

      <p className="text-center text-[12px] font-semibold text-muted">
        Une question, un bug, une idée ? <a href={contactHref('TrailStrong')} className="text-ocean underline">Écris-nous</a>, on répond vite.
      </p>
    </section>
  )
}

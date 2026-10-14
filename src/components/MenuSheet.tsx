/**
 * Menu (bouton central du dock) : navigation seulement, même présentation que le Menu de
 * TrailJourney (suite Trail). Les réglages (son du coach, sauvegardes, mode admin) sont dans
 * l'onglet Profil → Paramètres.
 */
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { FocusTag } from '../data/program'
import type { View } from '../App'

interface MenuItem {
  icon: string
  /** Petit sur-titre : ce que contient l'entrée. */
  over: string
  label: string
  onClick: () => void
}

export function MenuSheet({
  onClose,
  onNavigate,
  onTests,
  onTour,
}: {
  onClose: () => void
  onNavigate: (view: View, focus?: FocusTag) => void
  onTests: () => void
  onTour: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const items: MenuItem[] = [
    { icon: '📋', over: 'Toutes les séances', label: 'Tout le programme', onClick: () => onNavigate('all') },
    { icon: '🦵', over: 'Rotule, freinage, valgus', label: 'Focus genou', onClick: () => onNavigate('all', 'knee') },
    { icon: '🦶', over: 'Proprioception & propulsion', label: 'Focus cheville', onClick: () => onNavigate('all', 'ankle') },
    { icon: '🍑', over: 'Grand & moyen fessier', label: 'Fessiers', onClick: () => onNavigate('all', 'glutes') },
    { icon: '📏', over: 'Toutes les 4 semaines, G / D', label: 'Tests mensuels', onClick: onTests },
    { icon: '🎬', over: '1 minute, pas à pas', label: 'Visite guidée', onClick: onTour },
  ]

  return createPortal(
    <div className="fade-in fixed inset-0 z-[60] flex items-end justify-center bg-ink/40" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Menu"
        data-noswipe
        onClick={(e) => e.stopPropagation()}
        className="sheet pb-safe max-h-[88dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-b-0 border-line bg-paper-2 px-4 pt-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="kicker">Tout le reste</p>
            <h2 className="display text-[30px] leading-normal">Menu</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="grid h-11 w-11 place-items-center rounded-full border border-line text-ink">
            <X className="h-5 w-5" strokeWidth={3} />
          </button>
        </div>

        <nav className="mb-5 flex flex-col overflow-hidden rounded-xl border border-line bg-paper">
          {items.map((it, i) => (
            <button
              key={it.label}
              type="button"
              onClick={it.onClick}
              className={`flex min-h-[57px] items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-ink/5 ${i ? 'border-t border-line' : ''}`}
            >
              <span className="text-xl" aria-hidden="true">
                {it.icon}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted">{it.over}</span>
                <span className="text-[17px] font-black uppercase leading-tight tracking-wide text-ink">{it.label}</span>
              </span>
            </button>
          ))}
        </nav>

        <p className="kicker mb-2">La suite Trail</p>
        <a
          href="https://journey.trailsuite.app/"
          target="_blank"
          rel="noopener"
          data-testid="suite-link"
          className="mb-6 flex items-center gap-3 rounded-2xl border border-line bg-paper p-3 no-underline transition-colors hover:border-cream/60"
        >
          <span
            aria-hidden="true"
            className="display grid h-11 w-11 shrink-0 place-items-center rounded-[11px] border-2 border-[#7fb8e6] bg-paper-2 pb-0.5 text-[21px]"
          >
            <span>
              <span className="text-cream">T</span>
              <span className="text-[#7fb8e6]">j</span>
            </span>
          </span>
          <span className="flex min-w-0 flex-col items-start">
            <span className="display text-[20px] leading-normal" aria-label="TrailJourney">
              <span className="text-cream">Trail</span>
              <span className="text-[#7fb8e6]">Journey</span>
            </span>
            <span className="text-[11px] font-semibold text-muted">Cours, ils te suivent · ouvrir ↗</span>
          </span>
        </a>
      </div>
    </div>,
    document.body,
  )
}

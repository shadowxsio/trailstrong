import {
  Activity,
  Anchor,
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpFromLine,
  ArrowUpRight,
  Dumbbell,
  Footprints,
  Mountain,
  MoveHorizontal,
  MoveVertical,
  CircleDot,
  BrickWall,
  Flame,
  Scale,
  Repeat,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { Direction, Exercise, FocusTag, IconName, SessionId, Zone } from '../data/program'

export const TAG_META: Record<FocusTag, { label: string; emoji: string }> = {
  knee: { label: 'Genou', emoji: '🩹' },
  ankle: { label: 'Cheville', emoji: '⚓' },
  glutes: { label: 'Fessiers', emoji: '🍑' },
}

/** Identité de chaque séance : libellés, pictogramme (onglets, dock) et couleur d'accent. */
export const SESSION_META: Record<SessionId, { label: string; short: string; emoji: string; bg: string; icon: LucideIcon }> = {
  activation: { label: 'Activation', short: 'Activ.', emoji: '🔥', bg: 'bg-sun', icon: Flame },
  seanceA: { label: 'Séance A', short: 'Séance A', emoji: '🦵', bg: 'bg-peach', icon: Footprints },
  seanceB: { label: 'Séance B', short: 'Séance B', emoji: '⚖️', bg: 'bg-mint', icon: Scale },
  tapis: { label: 'Tapis D+', short: 'Tapis', emoji: '⛰️', bg: 'bg-lilac', icon: Mountain },
}

/** Pictogramme d'une séance (l'emplacement « tapis » peut accueillir une Séance C de gainage). */
export const sessionIcon = (id: SessionId, short: string): LucideIcon => (id === 'tapis' && !/tapis/i.test(short) ? BrickWall : SESSION_META[id].icon)

const ICONS: Record<IconName, LucideIcon> = {
  Footprints,
  ArrowUpFromLine,
  MoveVertical,
  MoveHorizontal,
  Anchor,
  Dumbbell,
  Repeat,
  ArrowDownToLine,
  ArrowUpRight,
  Activity,
  Mountain,
}

export const iconOf = (ex: Exercise): LucideIcon => (ex.icon ? ICONS[ex.icon] : Sparkles)

/** Catégorie lisible (badge de carte) : badge perso, sinon groupe ciblé principal. */
export function categoryOf(ex: Exercise) {
  if (ex.badge) return ex.badge
  const t = ex.target.split('·')[0].trim()
  return t.length > 22 ? (ex.tags[0] ? TAG_META[ex.tags[0]].label : 'Perso') : t
}

export const restLabel = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m${s % 60 ? String(s % 60).padStart(2, '0') : ''}` : `${s}s`)

export const ZONE_META: Record<Zone, { label: string; cls: string }> = {
  hanche: { label: 'Hanche', cls: 'bg-peach' },
  genou: { label: 'Genou', cls: 'bg-sky' },
  cheville: { label: 'Cheville', cls: 'bg-lilac' },
  pied: { label: 'Pied', cls: 'bg-mint' },
  tronc: { label: 'Tronc', cls: 'bg-sun' },
}

export const DIR_META: Record<Direction, { icon: LucideIcon; label: string }> = {
  up: { icon: ArrowUp, label: 'monte' },
  down: { icon: ArrowDown, label: 'descend' },
  back: { icon: ArrowLeft, label: 'recule' },
  forward: { icon: ArrowRight, label: 'avance' },
  out: { icon: MoveHorizontal, label: 'écarte' },
  hold: { icon: CircleDot, label: 'stable' },
}

/**
 * Pilule de métadonnée :
 * - `amber` : remplie ocre, texte sombre (tags actifs : « 2 séries », « Aujourd'hui ») ;
 * - `neutral` : contour fin crème (« 20 reps », « Repos 30s », « Mur »).
 * (Les anciens tons `sun` / `sky` / `paper` restent acceptés.)
 */
export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'amber' | 'paper' | 'sun' | 'sky' }) {
  const cls = tone === 'amber' || tone === 'sun' ? 'pill pill-amber' : tone === 'sky' ? 'pill pill-medal pl-2.5' : 'pill'
  return <span className={cls}>{children}</span>
}

/** Médaillon : pastille ronde menthe + icône, pour le type d'exercice ou le muscle ciblé. */
export function Medal({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="pill pill-medal">
      <span className="medal" aria-hidden>
        <Icon className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
      {children}
    </span>
  )
}

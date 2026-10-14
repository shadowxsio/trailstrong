/**
 * Éléments partagés de la suite Trail (mêmes valeurs dans TrailJourney) : accroche, perso, contact.
 */

/** Accroche sous le logo. TrailJourney : « Cours, ils te suivent ». */
export const TAGLINE = 'Forge tes jambes de trailer'

/** Le petit perso du profil (en-tête, dock, carte TrailJourney). */
export const AVATARS = ['🏃', '🏃‍♀️', '🦊', '🐐', '🦌', '🐺', '🦅', '🐻', '⛰️', '⚡'] as const
export const DEFAULT_AVATAR = AVATARS[0]

export const avatarOf = (a?: string): string => (a && (AVATARS as readonly string[]).includes(a) ? a : DEFAULT_AVATAR)

/** Contact (Aide → « Une question ? »). */
export const CONTACT_EMAIL = 'mgom79@gmail.com'
export const contactHref = (app: string) => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`[${app}] Question ou suggestion`)}`

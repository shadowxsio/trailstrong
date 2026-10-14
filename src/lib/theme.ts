/**
 * Thème : sombre uniquement (thème commun de la suite Trail). Le type et les fonctions restent pour la
 * synchro des réglages d'un ancien compte (un « clair » enregistré est ignoré).
 */
import { useEffect, useState } from 'react'
import { scoped } from './account'

export type Theme = 'dark' | 'light'
const KEY = scoped('trailstrong:theme')
const listeners = new Set<(t: Theme) => void>()

export function currentTheme(): Theme {
  return 'dark'
}

export function applyTheme(_requested: Theme, notify = true) {
  const t: Theme = 'dark'
  document.documentElement.dataset.theme = t
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', '#141122')
  try {
    localStorage.setItem(KEY, t)
  } catch {
    /* navigation privée */
  }
  if (notify) listeners.forEach((l) => l(t))
}

/** Changement de thème (synchro du compte). */
export function onThemeChange(l: (t: Theme) => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useTheme() {
  const [theme, set] = useState<Theme>(currentTheme)
  useEffect(() => {
    const l = (t: Theme) => set(t)
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  return [theme, (t: Theme) => applyTheme(t)] as const
}

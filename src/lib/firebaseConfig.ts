/** Config Firebase du build (séparée pour ne pas charger le SDK en mode local). */
const env = import.meta.env

/**
 * Config web publique du projet trailstrong-646d0 (pas un secret : elle est visible dans
 * le bundle ; la sécurité repose sur firestore.rules, App Check et la restriction de clé).
 * Utilisée seulement pour le vrai site : le dev local et les aperçus de PR restent en mode
 * local et ne touchent jamais à Firestore. Les variables VITE_FIREBASE_* la remplacent.
 */
const DEFAULTS = import.meta.env.PROD && !__PREVIEW__
  ? {
      apiKey: 'AIzaSyD5v6YQvQO9uuFzvI7apKnWU6DpZc7Nbc4',
      authDomain: 'trailstrong-646d0.firebaseapp.com',
      projectId: 'trailstrong-646d0',
      appId: '1:212412313063:web:f18a96fa6b30ee72216142',
    }
  : { apiKey: '', authDomain: '', projectId: '', appId: '' }

const pick = (v: unknown, fallback: string) => (v as string | undefined)?.trim() || fallback || undefined

export const config = {
  apiKey: pick(env.VITE_FIREBASE_API_KEY, DEFAULTS.apiKey),
  authDomain: pick(env.VITE_FIREBASE_AUTH_DOMAIN, DEFAULTS.authDomain),
  projectId: pick(env.VITE_FIREBASE_PROJECT_ID, DEFAULTS.projectId),
  appId: pick(env.VITE_FIREBASE_APP_ID, DEFAULTS.appId),
}

export const firebaseEnabled = !!(config.apiKey && config.projectId && config.appId)

/** Clé de site reCAPTCHA Enterprise pour App Check (anti-bots), optionnelle. */
export const recaptchaSiteKey = (env.VITE_RECAPTCHA_SITE_KEY as string | undefined)?.trim() ?? ''

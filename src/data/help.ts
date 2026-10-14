/**
 * Guide & aide de TrailStrong (onglet Aide du dock). Une section = un thème ; chaque entrée = une
 * question et sa réponse. Même structure que le guide de TrailJourney (suite Trail).
 */
export interface HelpEntry {
  q: string
  a: string
}

export interface HelpSection {
  id: string
  icon: string
  title: string
  entries: HelpEntry[]
}

export const HELP: HelpSection[] = [
  {
    id: 'demarrer',
    icon: '🚀',
    title: 'Démarrer',
    entries: [
      { q: 'À quoi sert TrailStrong ?', a: 'À faire ton renforcement de coureur de trail : séances guidées (échauffement, exercices, mobilité), chrono de repos, coach sonore et suivi de ta progression.' },
      { q: 'Mon programme', a: 'À la première connexion, un court questionnaire (objectifs, zones sensibles, matériel, niveau, rythme) génère ton programme. Tu peux le refaire quand tu veux : onglet Profil → Refaire mon programme.' },
      { q: 'Installer l’app sur mon téléphone', a: 'Dans ton navigateur : Partager → « Sur l’écran d’accueil » (iPhone) ou menu ⋮ → « Installer l’application » (Android). Elle s’ouvre alors comme une vraie app, même hors-ligne.' },
      { q: 'Se repérer', a: 'Le dock en bas : Séances et Stats à gauche, le Menu au centre, Aide et Profil à droite. Le logo TrailStrong en haut ramène toujours à ta séance.' },
      { q: 'Revoir la visite guidée', a: 'Onglet Aide → « Refaire le tuto » : un tour d’une minute des écrans principaux.' },
      { q: 'Choisir mon perso', a: 'Onglet Profil → Ton perso : 10 emojis au choix. Il s’affiche en haut à droite et dans le dock.' },
      { q: 'Poser une question', a: 'Onglet Aide → « Nous écrire » : ton appli mail s’ouvre avec le sujet déjà rempli.' }
    ]
  },
  {
    id: 'seance',
    icon: '🏋️',
    title: 'Faire une séance',
    entries: [
      { q: 'Choisir la séance', a: 'Onglet Séances, puis le sélecteur en haut : Tout, Séance A, Séance B, Tapis… Commence toujours par 1 · Activation (l’échauffement).' },
      { q: 'Ouvrir un exercice', a: 'Touche la carte : schéma, photos de départ et d’arrivée, consignes et conseils genou / cheville.' },
      { q: 'Valider une série', a: 'Touche « ✓ Valider » après chaque série : la pastille se remplit et le chrono de repos démarre tout seul.' },
      { q: 'Le chrono de repos', a: 'Il bipe à la fin. 60 s, 90 s ou +30 s pour l’ajuster, ▶ pour le lancer à la main, pause pour l’arrêter.' },
      { q: 'Le coach sonore', a: 'Bouton « Coach » dans la fiche : décompte 3-2-1, tempo de chaque répétition (descends, monte), stop et repos. Réglage du son : onglet Profil → Paramètres.' },
      { q: 'Exercices sur une jambe', a: 'Les exercices unilatéraux se font côté gauche puis côté droit : l’app te dit quand changer de jambe et compte chaque côté.' }
    ]
  },
  {
    id: 'exercices',
    icon: '➕',
    title: 'Ajouter ou retirer des exercices',
    entries: [
      { q: 'Ajouter un exercice', a: 'En bas de chaque séance : « Ajouter un exercice ». Bibliothèque : fiches complètes comme ton programme. Catalogue : environ 800 exercices en fiche simplifiée. Manuel : ta propre saisie.' },
      { q: 'Retirer un exercice', a: 'Ouvre sa fiche puis « Retirer ». Il disparaît de la séance (ton historique est conservé).' }
    ]
  },
  {
    id: 'fin',
    icon: '🏁',
    title: 'Fin de séance & récupération',
    entries: [
      { q: 'Le bilan', a: 'À 100 % de la séance (ou bouton « Bilan & récup ») : volume, records, écart gauche / droite, difficulté ressentie et douleur après la séance.' },
      { q: 'Retour au calme', a: 'Des étirements et de la mobilité choisis pour la séance, enchaînés par le coach avec un schéma.' },
      { q: 'Conseils de récup', a: 'Protéines, eau et reprise de la course, dosés selon le poids indiqué dans l’onglet Profil.' }
    ]
  },
  {
    id: 'progression',
    icon: '📈',
    title: 'Progression & tests',
    entries: [
      { q: 'Les statistiques', a: 'Onglet Stats : tes charges, ton volume et ton D+ semaine après semaine.' },
      { q: 'Les tests mensuels', a: 'Onglet Profil → Tests mensuels, toutes les 4 semaines : tests gauche / droite pour suivre tes progrès et repérer un déséquilibre.' },
      { q: 'Douleur genou ou cheville', a: 'Le check-in douleur ajuste la charge proposée. En cas de douleur qui persiste, arrête l’exercice et consulte un physio.' }
    ]
  },
  {
    id: 'donnees',
    icon: '☁️',
    title: 'Compte & données',
    entries: [
      { q: 'Où sont mes données ?', a: 'Avec un compte Google, elles sont synchronisées entre tes appareils. L’app marche aussi hors-ligne : tout se synchronise au retour du réseau.' },
      { q: 'Changer de téléphone', a: 'Connecte-toi avec le même compte Google : ton programme et ton historique te suivent.' }
    ]
  },
  {
    id: 'sante',
    icon: '🩺',
    title: 'Santé',
    entries: [
      { q: 'Est-ce un avis médical ?', a: 'Non. Le programme est un repère d’entraînement. Fais-le valider par un physio ou un coach, surtout en cas de douleur, de blessure récente ou de reprise après une pause.' }
    ]
  },
  {
    id: 'suite',
    icon: '🧭',
    title: 'La suite Trail',
    entries: [
      { q: 'TrailJourney', a: 'L’app sœur pour partager ta course en direct : position, heures de passage aux ravitos, alertes pour tes proches. Même compte Google. Lien dans le Menu (bouton central du dock) → La suite Trail.' }
    ]
  }
]

/** Recherche simple (sans accents ni majuscules) dans les questions et réponses. */
export function searchHelp(query: string, sections: HelpSection[] = HELP): HelpSection[] {
  const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const words = norm(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return sections
  return sections
    .map((s) => ({ ...s, entries: s.entries.filter((e) => words.every((w) => norm(`${s.title} ${e.q} ${e.a}`).includes(w))) }))
    .filter((s) => s.entries.length > 0)
}

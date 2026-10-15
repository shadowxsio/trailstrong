# 🏔️ TrailStrong 2026
> **📦 Dépôt archivé.** TrailStrong vit désormais dans le monorepo privé **`shadowxsio/trail-suite`**
> (dossier `apps/strong`, historique Git conservé) et est publié sur **https://strong.trailsuite.app**.
> L'ancienne adresse GitHub Pages ne sert plus que la page de déménagement (`moved/`).


PWA de renforcement pour coureurs de trail.


Application privée (connexion Google sans serveur + PIN admin) pour les séances à l'ÉconoFitness Beaubien : Activation, Séance A, Séance B, Tapis D+ et Stats.
Vite + React + TypeScript + Tailwind + Lucide, publiée sur **https://strong.trailsuite.app** (redirige pour l'instant vers https://shadowxsio.github.io/trailstrong/, en attendant la migration dans `shadowxsio/trail-suite`).

- **Déploiement** : à chaque push sur `main`, le workflow `Deploy` (`.github/workflows/deploy.yml`) build l'app dans `dist/` et la publie sur GitHub Pages (aucun build à committer).
- **Accès** : connexion **Google sans serveur** — le jeton Google est vérifié dans l'app (signature via les clés publiques Google, audience, expiration, email vérifié) et l'email doit figurer dans la liste autorisée, publiée uniquement sous forme d'empreinte SHA-256. L'appareil reste autorisé 30 jours (utilisable hors-ligne). À configurer dans *Settings → Secrets and variables → Actions* :
  - `GOOGLE_CLIENT_ID` (variable ou secret) : client OAuth « Application Web » avec l'origine JavaScript autorisée `https://shadowxsio.github.io` ;
  - secret `ALLOWED_GOOGLE_EMAIL` : ton email Gmail (plusieurs possibles, séparés par des virgules).
  Sans ces deux valeurs, l'app fonctionne en accès PIN uniquement.
- **PIN = mode admin** : déverrouille les Réglages (sauvegardes, Gist, PIN) pendant 10 min et sert d'accès de secours si Google est indisponible. Blocage après 5 PIN faux (30 s → 2 min → 10 min). Définir le secret de dépôt `APP_PASSWORD_HASH` = SHA-256 hex du PIN :
  ```bash
  printf '123456' | sha256sum | cut -d' ' -f1
  ```
  Sans secret, le PIN par défaut est `2026`.
  ⚠️ Le site est statique : le contrôle d'accès protège l'interface, pas le code (public sur GitHub Pages). Les données restent sur l'appareil.
- **Sécurité** : Content-Security-Policy stricte injectée au build, anti-clickjacking (`theme.js`), `noindex` pour les moteurs de recherche, Dependabot (npm + actions), audit `npm audit` hebdomadaire (`security.yml`), analyse CodeQL (`codeql.yml`). En mode comptes : App Check (reCAPTCHA Enterprise, variable `RECAPTCHA_SITE_KEY`) et règles Firestore strictes (`firestore.rules` : propriétaire uniquement, formes de documents et tailles contrôlées, tout le reste refusé).
- **Données** : 100 % `localStorage` sur l'appareil. Export/Import JSON, et backup optionnel chiffré (AES-256, clé de récupération propre à l'appareil, à noter) vers un Gist secret — token GitHub avec le seul scope `gist`.
- **Hors-ligne & rapidité** : service worker généré au build — précache de tous les fichiers avec une révision par fichier (une mise à jour ne retélécharge que ce qui a changé), ouverture depuis le cache même avec un réseau faible, bandeau « Nouvelle version prête » ; polices embarquées (`src/assets/fonts`, aucun appel à Google) ; écrans secondaires chargés à la demande ; manifest → « Ajouter à l'écran d'accueil ».
- **Dev local** :
  ```bash
  npm install && npm run dev   # http://localhost:5173 (la connexion Google ne marche que sur shadowxsio.github.io : utilise le PIN en local ; /#schemas : planche des 62 schémas)
  ```
- **Photos de démo** : `public/demos/` — paires départ/fin issues de [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (domaine public, Unlicense), converties en WebP 480 px.
- **Ajout / retrait d'exercices** (bouton « Ajouter un exercice à cette séance » ; « Retirer » dans la fiche d'un exercice) :
  - *Bibliothèque* : les 55 exercices à fiche complète (programme de base + `src/data/extras.ts`) — schéma dédié, photos, consignes en français, tempo du coach, conseils genou / cheville ; l'ajout modifie le programme du compte (`src/lib/userProgram.ts`) ;
  - *Catalogue* : `public/catalog.json` (~800 exercices free-exercise-db en fiche simplifiée, régénérable avec `node scripts/build-catalog.mjs`) ; les 100 plus utiles sont traduits (`scripts/catalog-fr.json` : nom + consignes en français), les autres restent en anglais ; un exercice qui existe en fiche complète renvoie vers la bibliothèque ; les 2 photos sont copiées dans l'exercice (JPEG réduit) pour le hors-ligne ;
  - *Manuel* : saisie libre ; schéma choisi automatiquement parmi les modèles (modifiable).
- **Fin de séance** : bilan automatique quand la séance est à 100 % (ou bouton « Bilan & récup ») — volume, records, écart G/D, difficulté ressentie, douleur après, repères de récupération dosés selon le poids de l'onglet Profil. « Retour au calme » : étirements et mobilité propres à chaque séance (`src/data/cooldown.ts`), enchaînés par le coach avec schéma.
- **Comptes multi-utilisateurs (Firebase)** : activés dès que les variables `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID` existent (sinon : mode local historique, inchangé).
  - Connexion Google (bouton GIS → `signInWithCredential`), inscription ouverte ; données par compte dans Firestore (`users/{uid}`, `days/{date}`, `custom/{id}`), cache hors-ligne, synchro entre appareils.
  - Règles : `firestore.rules` (chaque compte n'accède qu'à ses données) — à coller dans la console Firestore.
  - Firebase Auth → Google activé ; si le client OAuth (`GOOGLE_CLIENT_ID`) vient d'un autre projet, l'ajouter aux « ID client de projets externes ». Domaine autorisé : `shadowxsio.github.io`.
  - Premier lancement : migration des données locales de l'appareil, ou questionnaire (sport, objectifs, zones sensibles, matériel, niveau, rythme) → programme généré (`src/data/generator.ts`) à partir du programme de base et de la bibliothèque (`src/data/extras.ts`).
- **Profil de test** (Profil → Paramètres → mode admin en local, ou compte propriétaire en mode comptes) : profil temporaire local pour essayer le questionnaire et la génération de programme ; rien n'est synchronisé et tout est effacé à la sortie (`src/lib/sandbox.ts`).
- **Tests e2e & aperçus de PR** : `e2e/` (Playwright, iPhone 13 émulé) — `npm run build:preview && npm run test:e2e`. Sur chaque PR, `pr.yml` construit un aperçu (sans secrets, stockage `localStorage` préfixé `preview:` et sans service worker pour ne jamais toucher les données du vrai site), lance les tests et prépare un résumé ; `deploy.yml` (via `workflow_run`) publie l'aperçu sur `…/trailstrong/preview/pr-N/` avec le rapport Playwright et commente la PR (tableau des tests, 🆕 nouveaux tests, captures). L'aperçu est remplacé au déploiement suivant. Pour une nouvelle fonctionnalité : ajouter son test dans `e2e/` (avec `shot('…')` pour les captures).
- **Navigation de la suite Trail** (identique à TrailJourney) : en-tête avec le logo (retour à la dernière séance), l'accroche « Forge tes jambes de trailer » et ton perso à droite ; dock en bas sur tous les écrans — Séances (sélecteur Tout / Séance A / B / Tapis en haut), Stats, gros bouton **Menu** au centre, Aide et Profil.
- **Menu** (même présentation que celui de TrailJourney) : navigation seulement — tout le programme, focus genou / cheville / fessiers, tests mensuels, visite guidée et lien vers TrailJourney (« La suite Trail »). Aucun réglage dedans (`src/components/MenuSheet.tsx`).
- **Profil** (onglet du dock) : ton perso parmi 10 emojis (`src/lib/suite.ts`), poids, refaire le programme, tests mensuels, **Paramètres** (son du coach, sauvegarde locale, mode admin : backup Gist, PIN, profil de test — `src/components/SettingsPanel.tsx`), déconnexion.
- **Aide** (onglet du dock) : FAQ avec sommaire, recherche sans accents et réponses par thème (démarrer, séance, exercices, fin de séance, progression, compte, santé, suite Trail), « Refaire le tuto » et « Nous écrire » (lien e-mail) — contenu dans `src/data/help.ts` ; même organisation que l'onglet Aide de TrailJourney. Visite guidée au premier lancement.
- **Identité de la suite Trail** (commune avec TrailJourney) : logo en Shrikhand, « Trail » en crème et « Strong » en **orange vif `#FF6B2C`** (TrailJourney : « Journey » en bleu glacier `#7FB8E6`), icône d'app « Ts », thème sombre uniquement, et un lien vers TrailJourney dans le Menu (« La suite Trail »).
- **Design « Swiss Alpine Night Trail »** : fond indigo nuit `#141122`, cartes ardoise `#211D35` à filet crème unique 1,5 px et coins 14 px. Fiche d'exercice : bulle ambre « ACTIVATION • 02 » et muscle ciblé en bleu glacier dans l'en-tête intérieur, médaillon rond bleu glacier à gauche du titre, consigne, petites bulles (ambre pleine pour les séries, contour crème pour reps / repos / matériel), pastilles de série et « ✓ Valider » à contour crème qui devient bleu glacier. Logo et chronos en Shrikhand, le reste en Karla. Chrono de repos et dock flottant en verre dépoli (onglet actif en bulle orange vif). Tableau de bord en grille asymétrique, fiches en bento 2 colonnes sur tablette/ordinateur (`src/index.css`).

- **Mise en place Firebase / sécurité (sur PC)** : [`docs/setup-pc.md`](docs/setup-pc.md).
- **Instructions pour les agents** : [`CLAUDE.md`](CLAUDE.md).
- Historique : projet né dans le dépôt `web_hosting` (dossier `trailstrong-src/`), migré ici avec tout son historique Git.

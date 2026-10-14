import { expect, test } from './fixtures'

test.describe('Accueil', () => {
  test('Connexion par code PIN', async ({ app, page, shot }) => {
    await app({ logged: false })
    for (const d of '2026') await page.getByRole('button', { name: d, exact: true }).click()
    await expect(page.getByRole('navigation', { name: 'Onglets' }).last()).toBeVisible()
    await shot('Programme affiché après le PIN')
  })

  test('Navigation : Tout, Séance A, Séance B, Tapis, Stats', async ({ app, page, shot }) => {
    await app()
    const seances = page.getByRole('navigation', { name: 'Séances' })
    for (const tab of ['Tout', 'Séance A', 'Séance B', 'Tapis']) {
      await seances.getByRole('button', { name: new RegExp(tab) }).first().click()
      await expect(seances.getByRole('button', { name: new RegExp(tab) }).first()).toHaveAttribute('aria-current', 'page')
    }
    await page.getByRole('navigation', { name: 'Onglets' }).getByRole('button', { name: /Stats/ }).click()
    await expect(seances).toHaveCount(0)
    await shot('Vue Stats')
  })

  test('Dock de la suite Trail : Séances, Stats, Menu au centre, Aide, Profil', async ({ app, page, shot }) => {
    await app({ view: 'seanceB' })
    const dock = page.getByRole('navigation', { name: 'Onglets' })
    await expect(dock.getByRole('button')).toHaveText([/Séances/, /Stats/, /Menu/, /Aide/, /Profil/])
    await expect(page.getByText('Forge tes jambes de trailer')).toBeVisible()
    await shot('En-tête et dock')
    // Le perso choisi dans le Profil s'affiche en haut à droite et dans le dock.
    await page.getByTestId('header-avatar').click()
    await expect(dock.getByRole('button', { name: /Profil/ })).toHaveAttribute('aria-current', 'page')
    await page.getByRole('radio', { name: 'Perso 🦊' }).click()
    await expect(page.getByTestId('header-avatar')).toHaveText('🦊')
    await expect(dock.getByRole('button', { name: /Profil/ })).toContainText('🦊')
    await shot('Choix du perso')
    // Le logo ramène à la dernière séance ouverte.
    await page.getByRole('button', { name: 'Accueil' }).click()
    await expect(page.getByRole('navigation', { name: 'Séances' }).getByRole('button', { name: /Séance B/ })).toHaveAttribute('aria-current', 'page')
  })
})

test('Aperçu : données isolées du vrai site', async ({ app, page, context }) => {
  await app()
  await page.getByLabel('Ouvrir RDL aux haltères').click()
  await page.getByRole('dialog', { name: 'RDL aux haltères' }).getByRole('button', { name: /Valider la série 1/ }).click()
  const state = await context.storageState()
  const keys = state.origins.flatMap((o) => o.localStorage.map((x) => x.name))
  // Seules les clés préfixées « preview: » sont écrites par l'app (les autres viennent de la préparation du test).
  const written = keys.filter((k) => k.startsWith('preview:'))
  expect(written.length).toBeGreaterThan(0)
  expect(keys.filter((k) => !k.startsWith('preview:')).every((k) => ['trailstrong:view', 'trailstrong:v1'].includes(k))).toBe(true)
})

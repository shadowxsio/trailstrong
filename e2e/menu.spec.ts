import { expect, test } from './fixtures'

test.describe('Menu', () => {
  test('Suite Trail : thème sombre, logo TrailStrong et lien vers TrailJourney', async ({ app, page, shot }) => {
    await app()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    const strong = page.locator('.logo-strong').first()
    await expect(strong).toHaveText('Strong')
    await expect(strong).toHaveCSS('color', 'rgb(255, 107, 44)')
    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(page.getByRole('radio', { name: /Clair/ })).toHaveCount(0)
    const suite = page.getByTestId('suite-link')
    await expect(suite).toHaveAttribute('href', 'https://journey.trailsuite.app/')
    await expect(suite).toContainText('TrailJourney')
    await shot('La suite Trail dans le Menu')
  })

  test('Onglet Aide : FAQ, recherche, tuto à refaire et contact', async ({ app, page, shot }) => {
    await app()
    await page.getByRole('navigation', { name: 'Onglets' }).getByRole('button', { name: /Aide/ }).click()
    const help = page.getByRole('region', { name: 'Guide & aide' })
    await expect(help.getByRole('navigation', { name: 'Sommaire' }).getByRole('button')).toHaveCount(8)
    await help.getByRole('button', { name: /Faire une séance/ }).click()
    await expect(help.locator('#aide-seance')).toHaveAttribute('open', '')
    await expect(help.getByRole('link', { name: /Nous écrire/ })).toHaveAttribute('href', /^mailto:.+subject=/)
    await shot('Onglet Aide')
    await help.getByLabel('Rechercher dans l’aide').fill('tempo répétition')
    await expect(help.getByTestId('help-sections').locator('details')).toHaveCount(1)
    await expect(help.getByTestId('help-sections')).toContainText('Le coach sonore')
    await help.getByRole('button', { name: /Refaire le tuto/ }).click()
    await expect(page.getByRole('dialog', { name: /Visite guidée/ })).toBeVisible()
  })

  test('Menu : navigation seule, comme celui de TrailJourney', async ({ app, page, shot }) => {
    await app()
    await page.getByRole('button', { name: 'Menu' }).click()
    const menu = page.getByRole('dialog', { name: 'Menu' })
    await expect(menu.getByRole('heading', { name: 'Menu' })).toBeVisible()
    await expect(menu.getByRole('navigation').getByRole('button')).toHaveText([
      /Tout le programme/,
      /Focus genou/,
      /Focus cheville/,
      /Fessiers/,
      /Tests mensuels/,
      /Visite guidée/,
    ])
    // Aucun réglage dans le Menu : ni choix, ni champ de saisie.
    await expect(menu.getByRole('radio')).toHaveCount(0)
    await expect(menu.getByRole('textbox')).toHaveCount(0)
    await expect(menu.getByText(/Son du coach|Sauvegarde|PIN/)).toHaveCount(0)
    await shot('Menu de navigation')
    // Une entrée du Menu mène à la bonne vue et referme le Menu.
    await menu.getByRole('button', { name: /Focus genou/ }).click()
    await expect(menu).toHaveCount(0)
    await expect(page.getByRole('toolbar', { name: 'Filtres' }).getByRole('button', { name: /Genou/ })).toHaveAttribute('aria-pressed', 'true')
  })

  test('Profil → Paramètres : son du coach et mode admin', async ({ app, page, shot }) => {
    await app()
    await page.getByRole('navigation', { name: 'Onglets' }).getByRole('button', { name: /Profil/ }).click()
    const settings = page.getByTestId('settings')
    const son = settings.getByRole('radiogroup', { name: 'Son', exact: true })
    await expect(son).toBeVisible()
    await son.getByRole('radio', { name: /Bips/ }).click()
    await expect(son.getByRole('radio', { name: /Bips/ })).toHaveAttribute('aria-checked', 'true')
    await expect(settings.getByRole('button', { name: /Tester le son/ })).toBeVisible()
    // Sauvegardes, backup et PIN : derrière le PIN admin, eux aussi dans les paramètres.
    await expect(settings.getByRole('button', { name: /Saisir le PIN admin/ })).toBeVisible()
    await expect(page.getByText(/Gemini|Assistant IA/)).toHaveCount(0)
    await son.scrollIntoViewIfNeeded()
    await shot('Paramètres dans le Profil')
  })

  test('Visite guidée pas à pas', async ({ app, page, shot }) => {
    await app()
    await page.getByRole('button', { name: 'Menu' }).click()
    await page.getByRole('dialog', { name: 'Menu' }).getByRole('button', { name: /Visite guidée/ }).click()
    const tour = page.getByRole('dialog', { name: /Visite guidée/ })
    await expect(tour).toBeVisible()
    const seen: string[] = []
    for (let i = 0; i < 15; i++) {
      seen.push((await tour.getAttribute('aria-label')) ?? '')
      const next = tour.getByRole('button', { name: /Suivant|Compris/ })
      if ((await next.textContent())?.includes('Compris')) break
      if (seen.at(-1)?.includes('Ajouter un exercice')) await shot('Étape « Ajouter un exercice »')
      await next.click()
    }
    expect(seen.join(' | ')).toContain('Ajouter un exercice')
  })

  test('Profil de test : questionnaire puis programme généré', async ({ app, page, shot }) => {
    await app()
    await page.getByRole('navigation', { name: 'Onglets' }).getByRole('button', { name: /Profil/ }).click()
    await page.getByRole('button', { name: /Saisir le PIN admin/ }).click()
    for (const d of '2026') await page.getByRole('button', { name: d, exact: true }).click()
    await page.getByRole('button', { name: /Ouvrir le profil de test/ }).click()
    await page.getByRole('button', { name: /Créer mon programme/ }).click()
    const next = () => page.getByRole('button', { name: /Suivant|Voir mon programme/ }).click()
    await next()
    await next()
    await page.getByRole('checkbox', { name: /Genoux/ }).click()
    for (let i = 0; i < 5; i++) await next()
    await expect(page.getByRole('button', { name: /C’est parti/ })).toBeVisible()
    await shot('Programme proposé')
    await page.getByRole('button', { name: /C’est parti/ }).click()
    await expect(page.getByRole('navigation', { name: 'Onglets' }).last()).toBeVisible()
  })
})

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
    await expect(suite).toHaveAttribute('href', 'https://trailstrong-646d0.web.app/')
    await expect(suite).toContainText('TrailJourney')
    await shot('La suite Trail dans le Menu')
  })

  test('Guide & aide : sommaire, recherche et réponses', async ({ app, page, shot }) => {
    await app()
    await page.getByRole('button', { name: 'Menu' }).click()
    await page.getByRole('button', { name: /Guide & aide/ }).click()
    const help = page.getByRole('dialog', { name: 'Guide & aide' })
    await expect(help.getByRole('navigation', { name: 'Sommaire' }).getByRole('button')).toHaveCount(8)
    await help.getByRole('button', { name: /Faire une séance/ }).click()
    await expect(help.locator('#aide-seance')).toHaveAttribute('open', '')
    await shot('Guide & aide')
    await help.getByLabel('Rechercher dans l’aide').fill('tempo répétition')
    await expect(help.getByTestId('help-sections').locator('details')).toHaveCount(1)
    await expect(help.getByTestId('help-sections')).toContainText('Le coach sonore')
    await help.getByRole('button', { name: 'Retour au Menu' }).click()
    await expect(help).toHaveCount(0)
    await expect(page.getByRole('dialog', { name: 'Réglages' })).toBeVisible()
  })

  test('Pas d’assistant IA dans les réglages', async ({ app, page }) => {
    await app()
    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(page.getByText(/Gemini|Assistant IA/)).toHaveCount(0)
  })

  test('Visite guidée pas à pas', async ({ app, page, shot }) => {
    await app()
    await page.getByRole('button', { name: 'Menu' }).click()
    await page.getByRole('button', { name: /Visite guidée/ }).click()
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
    await page.getByRole('button', { name: 'Menu' }).click()
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

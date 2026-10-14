import { expect, test } from './fixtures'

test.describe('Parcours complet', () => {
  test('Séance chargée, séries validées avec chrono de repos, puis exercice validé', async ({ app, page, shot }) => {
    await app({ view: 'seanceA' })

    // 1. Chargement de la séance : en-tête, indicateurs et fiches numérotées.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('progressbar').first()).toHaveAttribute('aria-valuenow', '0')
    const card = page.getByRole('article').filter({ has: page.getByLabel('Ouvrir RDL aux haltères') })
    await expect(card.getByText(/Séance A • \d{2}/)).toBeVisible()
    await expect(card.getByText('4 séries', { exact: true })).toBeVisible()
    await expect(card.getByText('0/4 séries')).toBeVisible()
    await shot('Séance A chargée : fiches numérotées et pilules')

    // 2. Complétion des séries dans la fiche ; le chrono de repos démarre après chaque série.
    await page.getByLabel('Ouvrir RDL aux haltères').click()
    const drawer = page.getByRole('dialog', { name: 'RDL aux haltères' })
    for (let i = 1; i <= 4; i++) {
      await drawer.getByRole('button', { name: `Valider la série ${i}/4` }).click()
      if (i === 1) {
        await expect(page.getByRole('button', { name: 'Pause' }).first()).toBeVisible()
        await expect(page.getByRole('timer').first()).not.toHaveText('00:00')
        await shot('Série 1 validée : chrono de repos lancé')
      }
    }
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()

    // 3. Toutes les séries faites → l'exercice est validé (pilule pleine menthe).
    const check = card.getByRole('button', { name: /Valid/ })
    await expect(check).toHaveAttribute('aria-pressed', 'true')
    await expect(check).toHaveText(/Validé/)
    await expect(page.getByRole('progressbar').first()).not.toHaveAttribute('aria-valuenow', '0')

    // 4. « ✓ Valider » directement sur une autre fiche, puis annulation.
    const other = page.getByRole('article').nth(1).getByRole('button', { name: /^Valider$/ })
    await other.click()
    await expect(page.getByRole('article').nth(1).getByRole('button', { name: /Validé/ })).toHaveAttribute('aria-pressed', 'true')
    await shot('Exercices validés : pilules menthe')
    await page.getByRole('article').nth(1).getByRole('button', { name: /Validé/ }).click()
    await expect(page.getByRole('article').nth(1).getByRole('button', { name: /^Valider$/ })).toHaveAttribute('aria-pressed', 'false')
  })

  test('Filtre par séance (dock) et par zone (Genou, Cheville, Fessiers)', async ({ app, page, shot }) => {
    await app({ view: 'seanceA' })
    const dock = page.getByRole('navigation', { name: 'Séances' })
    // Séance B : ses exercices remplacent ceux de la Séance A.
    await dock.getByRole('button', { name: /Séance B/ }).click()
    await expect(dock.getByRole('button', { name: /Séance B/ })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByLabel('Ouvrir RDL aux haltères')).toHaveCount(0)
    await expect(page.getByText(/Séance B • 01/)).toBeVisible()
    // Retour Séance A, puis filtre « Cheville » : seules les fiches taguées cheville restent.
    await dock.getByRole('button', { name: /Séance A/ }).click()
    const filters = page.getByRole('toolbar', { name: 'Filtres' })
    const all = await page.getByRole('article').count()
    await filters.getByRole('button', { name: /Cheville/ }).click()
    await expect(filters.getByRole('button', { name: /Cheville/ })).toHaveAttribute('aria-pressed', 'true')
    const ankle = Number((await filters.getByRole('button', { name: /Cheville/ }).textContent())?.match(/\d+/)?.[0])
    await expect(page.getByRole('article')).toHaveCount(ankle)
    expect(ankle).toBeLessThan(all)
    await shot('Filtre Cheville actif')
    await filters.getByRole('button', { name: /Tous/ }).click()
    await expect(page.getByRole('article')).toHaveCount(all)
  })

  test('Chronomètre de repos : pause, reprise et préréglages', async ({ app, page }) => {
    await app({ view: 'seanceA' })
    const timer = page.getByRole('timer').first()
    await page.getByRole('button', { name: '60s' }).click()
    await expect(timer).toHaveText(/01:00|00:5\d/)
    await page.getByRole('button', { name: 'Pause' }).click()
    const paused = await timer.textContent()
    await page.waitForTimeout(1200)
    await expect(timer).toHaveText(paused ?? '')
    await page.getByRole('button', { name: '+30s' }).click()
    await page.getByRole('button', { name: 'Démarrer' }).click()
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
    await page.getByRole('button', { name: 'Réinitialiser le chrono' }).click()
  })
})

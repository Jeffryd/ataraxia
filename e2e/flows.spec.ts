import { test as base, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import {
  emptyDatabase,
  metadata,
  seedDemoData,
} from '../packages/shared/src/index';
const test = base.extend({
  page: async ({ page }, use) => {
    const apiRequests: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.startsWith('/api/'))
        apiRequests.push(request.url());
    });
    await use(page);
    if (test.info().config.metadata.staticDeployment)
      expect(apiRequests).toEqual([]);
  },
});
async function goToRoute(page: Page, route: string) {
  return page.goto(
    test.info().config.metadata.staticDeployment ? `./#${route}` : route,
  );
}
async function startAssessment(page: Page) {
  await goToRoute(page, '/evaluacion');
  await page.getByRole('checkbox', { name: /Entiendo estas/ }).check();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page
    .getByLabel('Facultad', { exact: true })
    .selectOption('engineering');
  await page.getByLabel('Semestre', { exact: true }).fill('4');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page
    .getByRole('radio', { name: 'Algunas veces', exact: true })
    .nth(0)
    .check();
  await page
    .getByRole('radio', { name: 'Algunas veces', exact: true })
    .nth(1)
    .check();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('radio', { name: 'Nunca', exact: true }).nth(0).check();
  await page.getByRole('radio', { name: 'Nunca', exact: true }).nth(1).check();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
}
test('assessment preserves answers, creates a plan and persists progress', async ({
  page,
}) => {
  await startAssessment(page);
  await page.getByRole('button', { name: 'Atrás', exact: true }).click();
  await expect(
    page.getByRole('radio', { name: 'Nunca', exact: true }).first(),
  ).toBeChecked();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('radio', { name: 'No', exact: true }).check();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page
    .getByRole('button', { name: 'Continuar sin más registros' })
    .click();
  await page.getByRole('button', { name: 'Ver mi orientación' }).click();
  await expect(
    page.getByRole('heading', { name: 'Autocuidado cotidiano', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Crear o ver mi plan' }).click();
  await page.getByRole('checkbox', { name: 'Una prioridad para hoy' }).check();
  await page.reload();
  await expect(
    page.getByRole('checkbox', { name: 'Una prioridad para hoy' }),
  ).toBeChecked();
  await page
    .getByRole('checkbox', { name: 'Una prioridad para hoy' })
    .uncheck();
  await page
    .getByLabel('¿Qué pequeño paso quieres dar?')
    .fill('Caminar por el campus');
  await page.getByRole('button', { name: 'Añadir meta' }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Caminar por el campus' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Editar meta', exact: true }).click();
  await page
    .getByLabel('¿Qué pequeño paso quieres dar?')
    .fill('Leer en el campus');
  await page.getByRole('button', { name: 'Guardar meta', exact: true }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Leer en el campus' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Eliminar meta', exact: true })
    .click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Leer en el campus' }),
  ).toHaveCount(0);
});
test('urgent answers interrupt the flow without creating a plan or appointment', async ({
  page,
}) => {
  await startAssessment(page);
  await page.getByRole('button', { name: 'Sí, necesito apoyo ahora' }).click();
  await expect(
    page.getByRole('heading', { name: 'Busca apoyo inmediato', exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .getByText(
        'ATARAXIA no monitorea esta sesión y no ha contactado automáticamente a nadie.',
      ),
  ).toBeVisible();
  const database = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ataraxia.database') ?? '{}'),
  );
  expect(database.plans).toHaveLength(0);
  expect(database.appointments).toHaveLength(0);
});
test('vital signs can be created edited and deleted with confirmation', async ({
  page,
}) => {
  await goToRoute(page, '/signos-vitales');
  await page
    .getByLabel('Frecuencia cardíaca (latidos/min)', { exact: true })
    .fill('72');
  await page
    .getByLabel('Contexto o desencadenante (opcional)')
    .fill('Después de estudiar');
  await page
    .getByRole('button', { name: 'Guardar registro', exact: true })
    .click();
  await expect(
    page.getByText('Después de estudiar', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await page
    .getByLabel('Frecuencia cardíaca (latidos/min)', { exact: true })
    .fill('75');
  await page
    .getByRole('button', { name: 'Guardar cambios', exact: true })
    .click();
  await expect(page.getByText('75', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Aún no hay registros' }),
  ).toBeVisible();
});
test('simulated appointments can be edited and cancelled', async ({ page }) => {
  await goToRoute(page, '/atencion');
  await page.getByLabel('Fecha preferida').fill('2027-12-01');
  await page.getByLabel('Hora preferida').fill('10:30');
  await page
    .getByLabel('Motivo general')
    .fill('Orientación para organizar estudios');
  await page
    .getByRole('button', { name: 'Guardar solicitud simulada' })
    .click();
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await page.getByLabel('Estado simulado').selectOption('confirmed');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(
    page.getByText('Confirmada (simulación local)', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar solicitud' }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByText('Cancelada', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await page.getByLabel('Estado simulado').selectOption('completed');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(
    page.getByText('Completada (simulación)', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Aún no hay solicitudes' }),
  ).toBeVisible();
});
test('exports valid JSON and downloads a backup before replace', async ({
  page,
}) => {
  await goToRoute(page, '/datos');
  await page.getByRole('button', { name: 'Exportar mis datos' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /^ataraxia-backup-\d{4}-\d{2}-\d{2}\.json$/,
  );
  const path = await download.path();
  expect(path).toBeTruthy();
  await page.getByLabel('Archivo de respaldo').setInputFiles({
    name: download.suggestedFilename(),
    mimeType: 'application/json',
    buffer: await readFile(path!),
  });
  await expect(
    page.getByRole('heading', { name: 'Vista previa validada' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Reemplazar', exact: true }).click();
  const backupPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  expect((await backupPromise).suggestedFilename()).toContain('before-replace');
  await expect(page.getByText(/Datos reemplazados/)).toBeVisible();
});
test('mobile navigation, dialogs and responsive layout work', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await goToRoute(page, '/');
  const menu = page.getByRole('button', { name: /Menú/ });
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('navigation', { name: 'Navegación móvil' }),
  ).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await page.getByRole('button', { name: '♡ Necesito apoyo' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: '♡ Necesito apoyo' }),
  ).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/home-mobile.png',
    fullPage: true,
  });
});
test('all routes render and direct refresh works', async ({ page }) => {
  for (const route of [
    '/',
    '/recursos',
    '/recursos/sleep',
    '/recursos/missing',
    '/evaluacion',
    '/evaluacion/resultado/missing',
    '/signos-vitales',
    '/mi-plan',
    '/atencion',
    '/institucional',
    '/datos',
    '/privacidad',
    '/accesibilidad',
    '/ayuda',
    '/missing',
  ]) {
    await goToRoute(page, route);
    await page.reload();
    await expect(page.locator('h1,h2').first()).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'No pudimos mostrar esta página' }),
    ).toHaveCount(0);
  }
  await goToRoute(page, '/');
  await page.screenshot({
    path: 'test-results/home-desktop.png',
    fullPage: true,
  });
});
test('dashboard filters demonstration records and removes them', async ({
  page,
}) => {
  await goToRoute(page, '/institucional');
  await page
    .getByRole('button', {
      name: 'Activar vista institucional de demostración',
    })
    .click();
  await page.getByRole('button', { name: 'Cargar ejemplos' }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByLabel('Origen', { exact: true }).selectOption('user');
  await expect(
    page.getByRole('heading', { name: 'Aún no hay datos para mostrar' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Restablecer filtros' }).click();
  await page.getByRole('button', { name: 'Quitar ejemplos' }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Aún no hay datos para mostrar' }),
  ).toBeVisible();
});
test('API failure leaves resources and support usable', async ({ page }) => {
  await page.route('**/api/**', (route) => route.abort());
  await goToRoute(page, '/recursos');
  await expect(
    page.getByRole('link', { name: 'Un cierre tranquilo para tu día' }),
  ).toBeVisible();
  await expect(
    page.getByText(/El catálogo en línea no está disponible/),
  ).toBeVisible({
    timeout: 15000,
    visible: !test.info().config.metadata.staticDeployment,
  });
  await page.getByRole('button', { name: '♡ Necesito apoyo' }).click();
  await expect(page.getByText(/Configuración local de respaldo/)).toBeVisible();
});
test('saved assessment resumes after reload with earlier answers intact', async ({
  page,
}) => {
  await startAssessment(page);
  await page
    .getByRole('button', { name: 'Guardar y salir', exact: true })
    .click();
  await goToRoute(page, '/evaluacion');
  await expect(
    page.getByRole('heading', { name: 'Tu cuerpo y tu seguridad' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Atrás', exact: true }).click();
  await expect(
    page.getByRole('radio', { name: 'Nunca', exact: true }).first(),
  ).toBeChecked();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Tu cuerpo y tu seguridad' }),
  ).toBeVisible();
});
test('corrupted storage is preserved and raw recovery is downloadable', async ({
  page,
}) => {
  await goToRoute(page, '/');
  await page.evaluate(() =>
    localStorage.setItem('ataraxia.database', '{broken'),
  );
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Protejamos tus datos locales' }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem('ataraxia.database')),
  ).toBe('{broken');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar original' }).click();
  const recovery = await downloadPromise;
  expect(await readFile((await recovery.path())!, 'utf8')).toBe('{broken');
  page.once('dialog', (dialog) => dialog.accept());
  await page
    .getByRole('button', { name: 'Restablecer datos', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: /Encuentra tu calma/ }),
  ).toBeVisible();
});
test('invalid API responses use safe local content and all normal viewports fit', async ({
  page,
}) => {
  await page.route('**/api/resources', (route) =>
    route.fulfill({ json: { invalid: true } }),
  );
  await goToRoute(page, '/recursos');
  await expect(
    page.getByText(/El catálogo en línea no está disponible/),
  ).toBeVisible({
    timeout: 15000,
    visible: !test.info().config.metadata.staticDeployment,
  });
  await expect(
    page.getByRole('link', { name: 'Respira sin prisa' }),
  ).toBeVisible();
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await goToRoute(page, '/');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
test('import restores business records and merge resolves newer revisions', async ({
  page,
}) => {
  const appointment = {
    ...metadata(),
    modality: 'virtual' as const,
    preferredDate: '2027-12-01',
    preferredTime: '10:30',
    reason: 'Solicitud importada',
    notes: 'Nota privada que no aparece en el panel',
    status: 'requested' as const,
    updatedAt: '2026-01-01T00:00:00Z',
  };
  const database = {
    ...seedDemoData(emptyDatabase()),
    appointments: [appointment],
  };
  await goToRoute(page, '/datos');
  const upload = async (value: unknown) =>
    page.getByLabel('Archivo de respaldo').setInputFiles({
      name: 'backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(value)),
    });
  await upload(database);
  await page.getByRole('button', { name: 'Combinar', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await goToRoute(page, '/atencion');
  await expect(
    page.getByText('Solicitud importada', { exact: true }),
  ).toBeVisible();
  await goToRoute(page, '/datos');
  await upload({
    ...database,
    appointments: [
      {
        ...appointment,
        reason: 'Revisión más reciente',
        updatedAt: '2026-02-01T00:00:00Z',
      },
    ],
  });
  await page.getByRole('button', { name: 'Combinar', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ataraxia.database') ?? '{}'),
  );
  expect(stored.appointments).toHaveLength(1);
  expect(stored.appointments[0].reason).toBe('Revisión más reciente');
  await goToRoute(page, '/institucional');
  await page
    .getByRole('button', {
      name: 'Activar vista institucional de demostración',
    })
    .click();
  await expect(page.getByRole('main')).not.toContainText(appointment.notes);
});
test('invalid imports cannot overwrite local records', async ({ page }) => {
  await goToRoute(page, '/datos');
  const initial = await page.evaluate(() =>
    localStorage.getItem('ataraxia.database'),
  );
  for (const buffer of [
    '{bad',
    JSON.stringify({ schemaVersion: 2 }),
    JSON.stringify({ schemaVersion: 1 }),
  ]) {
    await page.getByLabel('Archivo de respaldo').setInputFiles({
      name: 'invalid.json',
      mimeType: 'application/json',
      buffer: Buffer.from(buffer),
    });
    await expect(page.getByRole('alert')).toBeVisible();
    expect(
      await page.evaluate(() => localStorage.getItem('ataraxia.database')),
    ).toBe(initial);
  }
});

test('navigation preserves routes through skip links and browser history', async ({
  page,
}) => {
  await goToRoute(page, '/');
  await page.locator('nav a[href$="/recursos"]').first().click();
  await expect(
    page.locator('a[href$="/recursos/sleep"]').first(),
  ).toBeVisible();
  const catalogUrl = page.url();
  const heading = await page.locator('h1').textContent();
  await page.locator('a[href="#main"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  expect(page.url()).toBe(catalogUrl);
  await page.locator('a[href$="/recursos/sleep"]').first().click();
  await expect(page.locator('article h1')).toBeVisible();
  const detailUrl = page.url();
  await page.reload();
  await expect(page.locator('article h1')).toBeVisible();
  await page.goBack();
  await expect(page.locator('h1')).toHaveText(heading!);
  await page.goForward();
  await expect(page).toHaveURL(detailUrl);
  await expect(page.locator('article h1')).toBeVisible();
});

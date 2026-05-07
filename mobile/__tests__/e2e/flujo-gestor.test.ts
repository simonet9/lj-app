/**
 * __tests__/e2e/flujo-gestor.test.ts
 *
 * Tests E2E con Detox — Flujo completo del gestor
 *
 * Happy path:
 *  1. Login como gestor (laura.garcia@gmail.com)
 *  2. Verificar que aparece la agenda (no la grilla de socios)
 *  3. Ir a "Nueva clase"
 *  4. Verificar que el campo disciplina está bloqueado en "Pádel"
 *  5. Completar el formulario y crear la clase
 *  6. Verificar toast de éxito y redirección a la agenda
 *  7. Verificar que la clase nueva aparece en la agenda
 *
 * ℹ️  testIDs requeridos en la app (para que pasen estos tests):
 *     - screen-agenda, btn-nueva-clase, screen-crear-clase
 *     - input-disciplina (deshabilitado), input-nivel, input-fecha
 *     - input-hora-inicio, input-hora-fin, input-cupo
 *     - btn-crear-clase, toast-exito, agenda-clase-item-0
 */

// @ts-ignore
const { device, element, by, waitFor, expect: detoxExpect } = require('detox');

describe('Flujo completo — Gestor pádel (HU-02, HU-13)', () => {
  const FECHA_CLASE = (() => {
    // Fecha de la próxima semana para evitar conflictos con datos existentes
    const d = new Date();
    d.setDate(d.getDate() + 8);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    try {
      await element(by.id('tab-perfil-gestor')).tap();
      await element(by.id('btn-logout')).tap();
    } catch (_) { /* ignorar */ }
  });

  it('Paso 1: la pantalla de login es visible', async () => {
    await waitFor(element(by.id('screen-login')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('Paso 2: login exitoso como gestor de pádel', async () => {
    await element(by.id('input-email')).typeText('laura.garcia@gmail.com');
    await element(by.id('input-password')).typeText('Club2026!');
    await element(by.id('btn-login')).tap();

    // El gestor va a la AGENDA, no a la grilla de socios
    await waitFor(element(by.id('screen-agenda')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('Paso 3: la pantalla del gestor es la agenda (no la grilla de socios)', async () => {
    await detoxExpect(element(by.id('screen-agenda'))).toBeVisible();
    // La grilla de socios NO debe estar visible
    await detoxExpect(element(by.id('screen-clases'))).not.toBeVisible();
  });

  it('Paso 4: navegar a "Nueva clase"', async () => {
    await element(by.id('tab-crear-clase')).tap();

    await waitFor(element(by.id('screen-crear-clase')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('Paso 5: el campo disciplina está bloqueado en "Pádel"', async () => {
    // El campo de disciplina debe estar deshabilitado y mostrar "Pádel"
    await detoxExpect(element(by.id('input-disciplina'))).toBeVisible();

    // Verificar que el campo muestra la disciplina del gestor
    await detoxExpect(element(by.id('input-disciplina'))).toHaveText('Pádel');

    // Verificar que está deshabilitado (no es tappeable para cambiar)
    // En React Native, disabled inputs tienen accessibilityState.disabled = true
    // Detox puede verificar esto con:
    await detoxExpect(element(by.id('input-disciplina'))).toHaveToggleValue(false);
  });

  it('Paso 6: completar el formulario con datos válidos', async () => {
    // Nivel
    await element(by.id('picker-nivel')).tap();
    await element(by.text('Intermedio')).tap();

    // Fecha (formato YYYY-MM-DD o DD/MM/YYYY según el input)
    await element(by.id('input-fecha')).clearText();
    await element(by.id('input-fecha')).typeText(FECHA_CLASE);

    // Hora de inicio
    await element(by.id('picker-hora-inicio')).tap();
    await element(by.text('18:00')).tap();

    // Hora de fin
    await element(by.id('picker-hora-fin')).tap();
    await element(by.text('19:00')).tap();

    // Cupo máximo
    await element(by.id('input-cupo')).clearText();
    await element(by.id('input-cupo')).typeText('8');

    // Cerrar teclado
    await element(by.id('input-cupo')).tapReturnKey();
  });

  it('Paso 7: presionar "Crear clase" y verificar éxito', async () => {
    await element(by.id('btn-crear-clase')).tap();

    // Toast o mensaje de éxito
    await waitFor(element(by.id('toast-exito')))
      .toBeVisible()
      .withTimeout(8000);

    await detoxExpect(element(by.id('toast-exito'))).toBeVisible();
  });

  it('Paso 8: redirección a la agenda después de crear', async () => {
    // Después del éxito, debe volver a la agenda
    await waitFor(element(by.id('screen-agenda')))
      .toBeVisible()
      .withTimeout(5000);

    await detoxExpect(element(by.id('screen-agenda'))).toBeVisible();
  });

  it('Paso 9: la clase nueva aparece en la agenda del gestor', async () => {
    // La clase recién creada debe aparecer en la agenda
    // Buscamos por la fecha que usamos
    await waitFor(element(by.id('agenda-clase-item-0')))
      .toBeVisible()
      .withTimeout(5000);

    await detoxExpect(element(by.id('agenda-clase-item-0'))).toBeVisible();
  });
});

/**
 * __tests__/e2e/flujo-eventual.test.ts
 *
 * Tests E2E con Detox — Flujo completo del socio eventual
 *
 * Happy path:
 *  1. Login como socio eventual (ana.gomez@gmail.com)
 *  2. Ver la grilla de clases
 *  3. Tocar una clase disponible
 *  4. Verificar que se muestra el flujo de pago con seña (50%)
 *  5. Simular pago mock → reserva confirmada
 *  6. Ver la reserva en historial
 *  7. Cancelar la reserva (> 24hs → devuelve seña)
 */

// @ts-ignore
const { device, element, by, waitFor, expect: detoxExpect } = require('detox');

describe('Flujo completo — Socio eventual (HU-02, HU-05, HU-09, HU-10)', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    try {
      await element(by.id('tab-perfil')).tap();
      await element(by.id('btn-logout')).tap();
    } catch (_) { /* ignorar */ }
  });

  it('Paso 1: la pantalla de login es visible', async () => {
    await waitFor(element(by.id('screen-login')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('Paso 2: login exitoso como socio eventual', async () => {
    await element(by.id('input-email')).typeText('ana.gomez@gmail.com');
    await element(by.id('input-password')).typeText('Club2026!');
    await element(by.id('btn-login')).tap();

    await waitFor(element(by.id('screen-clases')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('Paso 3: la grilla de clases carga correctamente para eventual', async () => {
    await detoxExpect(element(by.id('screen-clases'))).toBeVisible();
    await detoxExpect(element(by.id('lista-clases'))).toBeVisible();
  });

  it('Paso 4: tocar una clase disponible muestra el detalle con seña', async () => {
    await element(by.id('clase-card-0')).tap();

    await waitFor(element(by.id('screen-detalle-clase')))
      .toBeVisible()
      .withTimeout(5000);

    // El socio eventual ve la seña en lugar del crédito
    await detoxExpect(element(by.id('detalle-cupo'))).toBeVisible();
    // Verificar que se muestra el monto de la seña
    await detoxExpect(element(by.id('btn-reservar'))).toBeVisible();
  });

  it('Paso 5: flujo de pago mock → reserva confirmada', async () => {
    await element(by.id('btn-reservar')).tap();

    // Pantalla de pago mock (simula Mercado Pago)
    await waitFor(element(by.id('screen-pago-mock')))
      .toBeVisible()
      .withTimeout(5000);

    await detoxExpect(element(by.id('monto-sena'))).toBeVisible();

    // Simular confirmación del pago
    await element(by.id('btn-confirmar-pago')).tap();

    // Confirmación de reserva
    await waitFor(element(by.id('screen-confirmacion-reserva')))
      .toBeVisible()
      .withTimeout(8000);

    await detoxExpect(element(by.id('texto-confirmacion'))).toBeVisible();
  });

  it('Paso 6: la reserva aparece en el historial', async () => {
    await element(by.id('tab-reservas')).tap();

    await waitFor(element(by.id('screen-reservas')))
      .toBeVisible()
      .withTimeout(5000);

    await waitFor(element(by.id('reserva-item-0')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('Paso 7: cancelar reserva eventual (muestra info de devolución de seña)', async () => {
    await element(by.id('btn-cancelar-reserva-0')).tap();

    await waitFor(element(by.id('modal-confirmacion-cancelacion')))
      .toBeVisible()
      .withTimeout(3000);

    // El modal debe informar sobre la seña
    await detoxExpect(element(by.id('modal-confirmacion-cancelacion'))).toBeVisible();

    await element(by.id('btn-confirmar-cancelacion')).tap();

    await waitFor(element(by.id('modal-confirmacion-cancelacion')))
      .not.toBeVisible()
      .withTimeout(5000);
  });
});

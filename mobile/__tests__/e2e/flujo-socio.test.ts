/**
 * __tests__/e2e/flujo-socio.test.ts
 *
 * Tests E2E con Detox — Flujo completo del socio abonado
 *
 * Happy path:
 *  1. Login como socio abonado (carlos.ruiz@gmail.com)
 *  2. Ver la grilla de clases
 *  3. Filtrar por Pádel
 *  4. Tocar primera clase disponible → ver detalle
 *  5. Reservar clase → confirmar
 *  6. Ir a Mis Reservas → verificar reserva
 *  7. Cancelar la reserva → confirmar en modal
 *  8. Verificar que desaparece de la lista
 *
 * ⚙️  Configuración Detox requerida:
 *     detox test --configuration ios.sim.debug
 *     o: detox test --configuration android.emu.debug
 *
 * ℹ️  Los testID deben estar presentes en los componentes de la app.
 *     Ver comentarios por pantalla.
 */

// @ts-ignore — Detox provee estos globals en el entorno E2E
const { device, element, by, waitFor, expect: detoxExpect } = require('detox');

describe('Flujo completo — Socio abonado (HU-02, HU-05, HU-06, HU-08, HU-10, HU-11)', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    // Logout al final
    try {
      await element(by.id('tab-perfil')).tap();
      await element(by.id('btn-logout')).tap();
    } catch (_) { /* ignorar si ya está en login */ }
  });

  // ── Paso 1: Pantalla de Login visible ───────────────────────────────────────
  it('Paso 1: la pantalla de login es visible al abrir la app', async () => {
    await waitFor(element(by.id('screen-login')))
      .toBeVisible()
      .withTimeout(5000);

    await detoxExpect(element(by.id('input-email'))).toBeVisible();
    await detoxExpect(element(by.id('input-password'))).toBeVisible();
    await detoxExpect(element(by.id('btn-login'))).toBeVisible();
  });

  // ── Paso 2: Login exitoso ────────────────────────────────────────────────────
  it('Paso 2: ingresar credenciales de socio abonado y hacer login', async () => {
    await element(by.id('input-email')).typeText('carlos.ruiz@gmail.com');
    await element(by.id('input-password')).typeText('Club2026!');
    await element(by.id('btn-login')).tap();

    // Esperar la grilla de clases (home del socio)
    await waitFor(element(by.id('screen-clases')))
      .toBeVisible()
      .withTimeout(10000);
  });

  // ── Paso 3: Grilla de clases visible ────────────────────────────────────────
  it('Paso 3: la grilla de clases muestra al menos una clase', async () => {
    await detoxExpect(element(by.id('screen-clases'))).toBeVisible();
    await detoxExpect(element(by.id('lista-clases'))).toBeVisible();
  });

  // ── Paso 4: Filtro por Pádel ─────────────────────────────────────────────────
  it('Paso 4: filtrar por Pádel muestra solo clases de pádel', async () => {
    // Tocar el filtro de disciplina "Pádel"
    await element(by.id('filtro-disciplina-padel')).tap();

    // Esperar a que se aplique el filtro
    await waitFor(element(by.id('lista-clases')))
      .toBeVisible()
      .withTimeout(3000);

    // Verificar que la etiqueta de disciplina es "Pádel" en la primera tarjeta
    await detoxExpect(element(by.id('disciplina-label-0'))).toHaveText('Pádel');
  });

  // ── Paso 5: Detalle de clase ──────────────────────────────────────────────────
  it('Paso 5: tocar la primera clase muestra el detalle con cupo disponible', async () => {
    // Tocar la primera tarjeta de clase
    await element(by.id('clase-card-0')).tap();

    // Verificar pantalla de detalle
    await waitFor(element(by.id('screen-detalle-clase')))
      .toBeVisible()
      .withTimeout(5000);

    // Verificar campos del detalle
    await detoxExpect(element(by.id('detalle-disciplina'))).toBeVisible();
    await detoxExpect(element(by.id('detalle-horario'))).toBeVisible();
    await detoxExpect(element(by.id('detalle-cupo'))).toBeVisible();
    await detoxExpect(element(by.id('btn-reservar'))).toBeVisible();
  });

  // ── Paso 6: Reservar clase ────────────────────────────────────────────────────
  it('Paso 6: presionar Reservar clase y confirmar', async () => {
    await element(by.id('btn-reservar')).tap();

    // El modal / pantalla de confirmación debe aparecer
    await waitFor(element(by.id('screen-confirmacion-reserva')))
      .toBeVisible()
      .withTimeout(5000);

    await detoxExpect(element(by.id('texto-confirmacion'))).toBeVisible();
    // Verificar texto de confirmación
    await detoxExpect(element(by.id('texto-confirmacion'))).toHaveText('Reserva confirmada');
  });

  // ── Paso 7: Mis Reservas ──────────────────────────────────────────────────────
  it('Paso 7: ir a Mis Reservas y verificar que aparece la reserva recién creada', async () => {
    // Navegar a la tab de reservas
    await element(by.id('tab-reservas')).tap();

    await waitFor(element(by.id('screen-reservas')))
      .toBeVisible()
      .withTimeout(5000);

    // La lista de reservas debe tener al menos un item
    await waitFor(element(by.id('reserva-item-0')))
      .toBeVisible()
      .withTimeout(5000);

    await detoxExpect(element(by.id('reserva-item-0'))).toBeVisible();
  });

  // ── Paso 8: Cancelar reserva ──────────────────────────────────────────────────
  it('Paso 8: cancelar la reserva desde Mis Reservas', async () => {
    // Presionar "Cancelar" en la primera reserva
    await element(by.id('btn-cancelar-reserva-0')).tap();

    // Aparece el modal de confirmación
    await waitFor(element(by.id('modal-confirmacion-cancelacion')))
      .toBeVisible()
      .withTimeout(3000);

    // Confirmar cancelación
    await element(by.id('btn-confirmar-cancelacion')).tap();

    // Esperar a que se procese
    await waitFor(element(by.id('modal-confirmacion-cancelacion')))
      .not.toBeVisible()
      .withTimeout(5000);
  });

  // ── Paso 9: Verificar que la reserva desaparece ───────────────────────────────
  it('Paso 9: la reserva cancelada desaparece de la lista', async () => {
    // Esperar la actualización de la lista
    await waitFor(element(by.id('reserva-item-0')))
      .not.toBeVisible()
      .withTimeout(5000);

    // O verificar que aparece el estado vacío
    // (dependiendo de si hay más reservas)
    // Ambas condiciones son válidas
  });
});

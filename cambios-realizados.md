# Cambios realizados — Sprint 1

## Estado general

| # | Historia de usuario | Cambio | Estado |
|---|---|---|---|
| 1 | HU-38 Crear clase | Horarios solo en :00 (17:00 a 23:00) | ✅ Completado |
| 2 | HU-25 Reservar pack | Escenario pago fallido | ✅ Completado |
| 3 | Notificaciones | Revisión y corrección de navegación | ✅ Completado |
| 4 | HU-38 Crear clase | Cupo mínimo reducido a 1 (clase individual) | ✅ Completado |
| 5 | Gestor — agenda | Filtro explícito por disciplina del gestor | ✅ Completado |

---

## Cambio 1 — HU-38: Horarios solo en horas exactas

**Archivo:** `mobile/src/utils/fechas.ts`

**Problema:** `generarHorariosDisponibles()` generaba slots cada 30 minutos
(`17:00`, `17:30`, `18:00`, `18:30`, …, `23:00`).
El criterio de aceptación de la HU exige que las clases solo puedan crearse
en horas exactas (:00): `17:00`, `18:00`, …, `23:00`.

**Cambio:**
- Se eliminaron los slots intermedios `:30`.
- La función ahora devuelve 7 opciones: `['17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00']`.
- Se actualizó el JSDoc del la función.

**Tests afectados:** Ninguno — `generarHorariosDisponibles` no tiene test directo.
Los tests de `calcularHoraFin('22:30')` y `calcularHoraFin('23:30')` en
`reserva.test.ts` siguen pasando porque testean la función de cálculo, no los slots de UI.

**Estado:** ✅ Completado

---

## Cambio 2 — HU-25: Pago fallido en checkout de packs

**Archivo:** `mobile/app/(socio)/pago-packs.tsx`

**Problema:** El simulador de pago del pack no tenía el escenario de pago fallido.
El criterio de aceptación (Escenario 2) requiere:
- El sistema NO registra ninguna reserva.
- Muestra "El pago no pudo ser procesado. Por favor, intentá de nuevo."
- Redirige a la sección de packs disponibles.

**Cambio:**
- Se agregó estado `intentoFallido` para mostrar el banner de error inline.
- Se agregó función `handlePagoFallido` que simula el rechazo de pago.
- Se agregó banner de error rojo cuando `intentoFallido === true`.
- Se agregó botón "Simular Pago Fallido" debajo del botón principal (mismo
  patrón que `pago-mock.tsx`).

**Tests afectados:** Ninguno directo — no hay test unitario para esta pantalla.

**Estado:** ✅ Completado

---

## Cambio 3 — Notificaciones: navegación al tocar notificaciones

**Archivo:** `mobile/src/hooks/usePushNotifications.ts`

**Problema detectado:** La función `handleNotificationNavigation` no tenía
handlers para los tipos `bienvenida` y `recordatorio`. Cuando el usuario
tocaba esas notificaciones, caía en el `default` y no navegaba a ningún lado.

**Tipos sin handler:**
- `bienvenida` → debía navegar a `/(socio)/clases`
- `recordatorio` → debía navegar a `/(socio)/clase/${claseId}`

**Cambio:**
- Se agregó `case 'bienvenida'` → `router.push('/(socio)/clases')`
- Se agregó `case 'recordatorio'` → `router.push('/(socio)/clase/${claseId}')` si hay `claseId`

**Infraestructura verificada (sin cambios necesarios):**
- `NotificationService.ts` — correctamente configura permisos, canal Android, token
- `usePushNotifications.ts` — registrado en `_layout.tsx`, cubre foreground, tap y cold start
- Edge Function `send-push-notification` — válida y funcional
- `test-notificaciones.tsx` — pantalla de prueba manual disponible en dev

**Estado:** ✅ Completado

---

---

## Cambio 4 — HU-38: Cupo mínimo 1 (clase individual)

**Archivos:** `mobile/src/hooks/useCrearClase.ts` · `mobile/app/(gestor)/crear-clase.tsx`

**Problema:** `CUPO_MIN` estaba en 4, impidiendo crear clases individuales.
El spec original (user-histories.md) indica que el cupo puede ir de 1 a 20.

**Cambio:**
- `CUPO_MIN = 4` → `CUPO_MIN = 1` en el hook.
- Condiciones del stepper en la UI actualizadas: `form.cupo <= 4` → `form.cupo <= 1`.
- Hint actualizado: "Mínimo 4 · Máximo 20" → "Mínimo 1 · Máximo 20".
- Mensaje de error de BD actualizado: "entre 4 y 20" → "entre 1 y 20".

> **Nota:** Si el constraint de BD (`cupo_coherente`) sigue requiriendo mínimo 4,
> habría que aplicar una migración SQL para actualizar el check. La UI ya acepta 1.

**Estado:** ✅ Completado

---

## Cambio 5 — Gestor agenda: filtro explícito por disciplina

**Archivo:** `mobile/app/(gestor)/agenda.tsx`

**Problema:**
1. La query solo filtraba por `gestor_id`. Si hubiera inconsistencia de datos en BD,
   un gestor podría ver clases de otra disciplina.
2. El label de disciplina en el header se infería desde la primera clase cargada,
   por lo que mostraba "Gestor" cuando la agenda estaba vacía.

**Cambio:**
- Se agrega `.eq('disciplina', usuario.disciplina)` a la query cuando el gestor
  tiene disciplina asignada (filtro defensivo + coherente con la regla de negocio).
- `disciplinaLabel` y `disciplinaEmojiInferred` ahora leen `usuario.disciplina`
  directamente desde el perfil autenticado, no desde las clases cargadas.
- Se elimina el import de `useMemo` que quedó sin uso.

**Estado:** ✅ Completado

---

*Última actualización: 2026-05-19*

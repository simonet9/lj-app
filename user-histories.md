# Historias de Usuario — Sprint 1

---

## ID: Registrar usuario

**Referencia:** 17
**Estado:** Done
**Sprint:** Primer sprint
**Puntos:** 5

**Título:** Como usuario no registrado, quiero registrarme en el sistema para poder acceder a las funcionalidades del centro deportivo.

### Reglas de negocio

* El correo electrónico no puede repetirse en el sistema.
* El DNI no puede repetirse en el sistema.
* El nombre y el apellido son obligatorios.

### Criterios de aceptación

#### Escenario 1: Registro exitoso

* **Dado** que no existe ningún usuario con correo "ana.gomez@gmail.com" ni con DNI 38111222 en el sistema.
* **Cuando** ingresa nombre "Ana", apellido "Gómez", el correo "ana.gomez@gmail.com", el DNI 38111222, la contraseña "Club2026!" y la repetición de contraseña "Club2026!".
* **Entonces** el sistema crea la cuenta con nombre "Ana", apellido "Gómez", correo "ana.gomez@gmail.com", DNI 38111222 y **0 créditos disponibles**.

#### Escenario 2: Correo ya registrado

* **Dado** que existe un usuario con correo "ana.gomez@gmail.com" en el sistema.
* **Cuando** intenta registrarse con el correo "ana.gomez@gmail.com", el DNI 38111222, la contraseña "Club2026!" y la repetición de contraseña "Club2026!".
* **Entonces** el sistema no crea ninguna cuenta y muestra el mensaje "El correo electrónico ya se encuentra registrado".

#### Escenario 3: DNI ya registrado

* **Dado** que existe un usuario con DNI 38111222 en el sistema.
* **Cuando** intenta registrarse con el correo "nuevo@gmail.com", DNI 38111222, contraseña y la repetición de contraseña "Club2026!".
* **Entonces** el sistema no crea ninguna cuenta y muestra el mensaje "El DNI ingresado ya se encuentra registrado".

#### Escenario 4: Repetición de contraseña

* **Dado** que no existe ningún usuario con correo "ana.gomez@gmail.com" ni con DNI 3811.
* **Cuando** intenta registrarse con el correo "ana.gomez@gmail.com", DNI 3811, contraseña "Club2026!" y la repetición de contraseña "Club2020!".
* **Entonces** el sistema no crea ninguna cuenta y muestra el mensaje "Las contraseñas ingresadas no coinciden".

---

## ID: Iniciar sesión

**Referencia:** 18
**Estado:** Done
**Sprint:** Primer sprint
**Puntos:** 3

**Título:** Como socio registrado, quiero iniciar sesión con mi correo y contraseña para acceder al sistema.

### Reglas de negocio

* Ninguna.

### Criterios de aceptación

#### Escenario 1: Inicio de sesión exitoso

* **Dado** que existe un socio con correo "ana.gomez@gmail.com" y contraseña "Club2026!".
* **Cuando** ingresa el correo "ana.gomez@gmail.com" y la contraseña "Club2026!".
* **Entonces** el sistema genera una sesión activa para "ana.gomez@gmail.com" y redirige a la pantalla principal de la aplicación.

#### Escenario 2: Contraseña incorrecta

* **Dado** que existe un socio con correo "ana.gomez@gmail.com" cuya contraseña es "Club2026!".
* **Cuando** ingresa el correo "ana.gomez@gmail.com" y la contraseña "otraclave99".
* **Entonces** el sistema no genera ninguna sesión y muestra el mensaje "Credenciales incorrectas".

#### Escenario 3: Correo no registrado

* **Dado** que no existe ningún usuario con correo "fantasma@gmail.com" en el sistema.
* **Cuando** ingresa el correo "fantasma@gmail.com" y la contraseña "cualquiera123".
* **Entonces** el sistema no genera ninguna sesión y muestra el mensaje "Credenciales incorrectas".

---

## ID: Cerrar sesión

**Referencia:** 20
**Estado:** Done
**Sprint:** Primer sprint
**Puntos:** 1

**Título:** Como socio quiero cerrar sesión para que nadie acceda a mi cuenta desde el dispositivo.

### Reglas de negocio

* Ninguna.

### Criterios de aceptación

#### Escenario 1: Cierre de sesión exitoso

* **Dado** que existe una sesión activa para el socio con correo "ana.gomez@gmail.com".
* **Cuando** selecciona la opción "Cerrar sesión".
* **Entonces** el sistema invalida el token de sesión de "ana.gomez@gmail.com" y redirige a la pantalla de inicio de la aplicación.

---

## ID: Ver perfil

**Referencia:** 21
**Estado:** Done
**Sprint:** Primer sprint
**Puntos:** 2

**Título:** Como socio registrado, quiero ver mis datos personales para conocer el estado de mi cuenta.

### Reglas de negocio

* Ninguna.

### Criterios de aceptación

#### Escenario 1: Visualización de perfil con créditos

* **Dado** que existe un socio con nombre "Ana", apellido "Gómez", correo "ana.gomez@gmail.com", DNI 38111222 y tiene 2 créditos.
* **Cuando** accede a la sección de perfil.
* **Entonces** el sistema muestra el nombre "Ana Gómez", el correo "ana.gomez@gmail.com", el DNI 38111222 y sus 2 créditos.

#### Escenario 2: Visualización de perfil sin créditos

* **Dado** que existe un socio con nombre "Carlos", apellido "Ruiz", correo "carlos.ruiz@gmail.com", DNI 25334455 y no tiene créditos.
* **Cuando** accede a la sección de perfil.
* **Entonces** el sistema muestra el nombre "Carlos Ruiz", el correo "carlos.ruiz@gmail.com" y el DNI 25334455 (sin mostrar sección de créditos).

---

## ID: Ver grilla clases

**Referencia:** 23
**Estado:** Done
**Sprint:** Primer sprint
**Puntos:** 3

**Título:** Como socio registrado, quiero ver el catálogo de clases disponibles para conocer la oferta del centro deportivo.

### Reglas de negocio

* Se muestran clases en estado `disponible` y `completa`. Las clases `suspendidas` no aparecen en el listado.

### Criterios de aceptación

#### Escenario 1: Listado con clases disponibles

* **Dado** que existen clases programadas de distintas disciplinas.
* **Cuando** el socio accede a la sección "Clases".
* **Entonces** el sistema muestra todas las clases disponibles ordenadas por fecha y horario, mostrando para cada una: disciplina, nivel, fecha, horario y cupo disponible.

#### Escenario 2: Sin clases disponibles

* **Dado** que no hay clases programadas para el período actual.
* **Cuando** el socio accede a la sección "Clases".
* **Entonces** el sistema muestra el mensaje "No hay clases disponibles".

---

## ID: Filtrar clases

**Referencia:** 24
**Estado:** Done
**Sprint:** Primer sprint
**Puntos:** 2

**Título:** Como socio registrado, quiero filtrar las clases por disciplina y nivel para encontrar rápidamente la clase que me interesa.

### Reglas de negocio

* El filtro por nivel solo está disponible cuando hay una disciplina seleccionada.
* Al volver a "todas las disciplinas", el filtro de nivel se resetea.

### Criterios de aceptación

#### Escenario 1: Filtro por disciplina

* **Dado** que el socio está en el listado de clases con clases de distintas disciplinas.
* **Cuando** selecciona el filtro "Pádel".
* **Entonces** el sistema muestra únicamente las clases de pádel y oculta las demás.

#### Escenario 2: Filtro por disciplina y nivel

* **Dado** que el socio tiene seleccionado el filtro "Pádel".
* **Cuando** selecciona el nivel "Principiante".
* **Entonces** el sistema muestra únicamente las clases de pádel nivel principiante.

#### Escenario 3: Limpiar filtros

* **Dado** que el socio tiene filtros activos.
* **Cuando** selecciona "Todas" en el filtro de disciplina.
* **Entonces** el sistema muestra todas las clases y el filtro de nivel desaparece.

---

## Ver detalle de clase

**Referencia:** 47
**Estado:** Done
**Sprint:** Primer sprint
**Puntos:** 2

**Título:** Como socio registrado, quiero ver el detalle de una clase para conocer su información completa antes de reservar.

### Reglas de negocio

* Se muestra el porcentaje de ocupación (inscriptos / cupo máximo).
* Si la clase está completa, se oculta el botón de reserva y se muestra la opción de lista de espera.
* Si la clase está suspendida, no se muestra ninguna opción de acción.

### Criterios de aceptación

#### Escenario 1: Clase disponible

* **Dado** que existe una clase de pádel con 3 de 10 cupos ocupados.
* **Cuando** el socio accede al detalle de esa clase.
* **Entonces** el sistema muestra: disciplina, nivel, fecha, horario, porcentaje de ocupación (30%), cupos disponibles y los botones de reserva.

#### Escenario 2: Clase completa

* **Dado** que existe una clase con todos sus cupos ocupados.
* **Cuando** el socio accede al detalle de esa clase.
* **Entonces** el sistema muestra "Clase completa" y ofrece el botón "Anotarse en lista de espera" en lugar de los botones de reserva.

#### Escenario 3: Clase suspendida

* **Dado** que existe una clase con estado "suspendida".
* **Cuando** el socio accede al detalle de esa clase.
* **Entonces** el sistema muestra el badge "Clase suspendida" y no presenta ninguna opción de acción.

#### Escenario 4: Ya inscripto

* **Dado** que el socio ya tiene una reserva confirmada para esa clase.
* **Cuando** accede al detalle de la clase.
* **Entonces** el sistema muestra "Ya estás inscripto en esta clase" sin botones de reserva.

---

## ID: Reservar clase

**Referencia:** 26
**Estado:** Done
**Sprint:** Primer sprint
**Puntos:** 5

**Título:** Como socio, quiero reservar una clase eligiendo entre usar un crédito o pagar una seña, para asegurar mi lugar de la forma que más me convenga.

### Reglas de negocio

* Un socio no puede reservar dos clases en el mismo día y horario (conflicto de horario).
* Un socio no puede reservar la misma clase dos veces.
* Reserva con crédito: descuenta 1 crédito atómicamente. El botón solo es visible si el socio tiene créditos disponibles (creditos > 0).
* Reserva con seña: requiere pago del 50% del valor de la clase via Mercado Pago (mock en MVP).

### Criterios de aceptación

#### Escenario 1: Reserva con crédito exitosa

* **Dado** que el socio "ana.gomez@gmail.com" tiene 3 créditos y la clase tiene cupo disponible.
* **Cuando** presiona "Reservar con crédito (tenés 3)".
* **Entonces** el sistema descuenta 1 crédito (quedando 2), crea la reserva confirmada y muestra la pantalla de confirmación.

#### Escenario 2: Reserva con seña exitosa

* **Dado** que la clase tiene cupo disponible y el socio completa el pago mock.
* **Cuando** presiona "Pagar con dinero (seña 50%)" y confirma el pago en la pasarela.
* **Entonces** el sistema crea la reserva confirmada y muestra la pantalla de confirmación.

#### Escenario 3: Sin créditos disponibles

* **Dado** que el socio no tiene créditos.
* **Cuando** accede al detalle de una clase disponible.
* **Entonces** el sistema muestra únicamente el botón "Pagar con dinero (seña 50%)", sin mostrar la opción de crédito.

#### Escenario 4: Conflicto de horario

* **Dado** que el socio ya tiene una reserva confirmada el mismo día y horario.
* **Cuando** accede al detalle de otra clase en ese mismo horario.
* **Entonces** el sistema muestra "Ya tenés una clase agendada en este horario" y no permite reservar.

---

## ID: Ver mis reservas

**Referencia:** 27
**Estado:** Done
**Sprint:** Primer sprint
**Puntos:** 2

**Título:** Como socio, quiero ver mis reservas activas para conocer mis clases próximas.

### Reglas de negocio

* Solo se muestran reservas con estado `confirmada`.
* Solo se muestran reservas con fecha igual o posterior a hoy.

### Criterios de aceptación

#### Escenario 1: Socio con reservas activas

* **Dado** que el socio tiene reservas confirmadas para clases futuras.
* **Cuando** accede a la sección "Mis reservas".
* **Entonces** el sistema muestra cada reserva con: disciplina, nivel, fecha, horario y estado "Confirmada".

#### Escenario 2: Socio sin reservas activas

* **Dado** que el socio no tiene reservas confirmadas futuras.
* **Cuando** accede a la sección "Mis reservas".
* **Entonces** el sistema muestra el mensaje "No tenés reservas activas" con un botón para explorar clases.

---

## ID: Cancelar reserva

**Referencia:** 29
**Estado:** Done
**Sprint:** Primer sprint
**Puntos:** 5

**Título:** Como socio, quiero cancelar una reserva y recibir información clara sobre si recuperaré el crédito o se reembolsará la seña.

### Reglas de negocio

* Solo se pueden cancelar clases con fecha igual o posterior a hoy.
* Cancelación con crédito: devuelve 1 crédito si anticipación > 48hs Y < 3 devoluciones en el mes.
* Cancelación con seña: inicia reembolso (flag `reembolso_pendiente`) si anticipación > 24hs.
* Si se supera la 4ta cancelación mensual, el sistema registra la penalización en `cancelaciones_mensuales`.

### Criterios de aceptación

#### Escenario 1: Cancelación con devolución de crédito

* **Dado** que el socio tiene una reserva pagada con crédito a más de 48hs y menos de 3 devoluciones en el mes.
* **Cuando** presiona "Cancelar reserva" y confirma en el modal.
* **Entonces** el sistema cancela la reserva, devuelve 1 crédito y muestra "Cancelación realizada. Se reintegró 1 crédito".

#### Escenario 2: Cancelación sin devolución (menos de 48hs)

* **Dado** que el socio tiene una reserva con crédito y faltan menos de 48hs para la clase.
* **Cuando** presiona "Cancelar reserva".
* **Entonces** el sistema muestra "Faltan X horas para la clase. El crédito no se reintegrará" y cancela al confirmar.

#### Escenario 3: Cancelación con reembolso de seña

* **Dado** que el socio tiene una reserva pagada con seña y faltan más de 24hs para la clase.
* **Cuando** presiona "Cancelar reserva" y confirma.
* **Entonces** el sistema cancela la reserva e inicia el proceso de reembolso de la seña.

#### Escenario 4: Cancelación de clase pasada

* **Dado** que la fecha de la clase ya pasó.
* **Cuando** el socio accede a sus reservas.
* **Entonces** el sistema no muestra el botón "Cancelar" para esa reserva.

---

## ID: Anotarse a lista espera

**Referencia:** 44
**Estado:** Done
**Sprint:** Primer sprint
**Puntos:** 3

**Título:** Como socio, quiero inscribirme en la lista de espera de una clase completa para tener la posibilidad de reservar si se libera un lugar.

### Reglas de negocio

* La lista de espera es FIFO (primero en llegar, primero en ser notificado).
* Si se libera un lugar, el primer socio en la lista tiene 15 minutos para confirmar.
* Un socio no puede inscribirse dos veces en la misma lista.

### Criterios de aceptación

#### Escenario 1: Inscripción exitosa

* **Dado** que la clase está completa y el socio no está en la lista de espera.
* **Cuando** presiona "Anotarse en lista de espera".
* **Entonces** el sistema registra al socio y muestra "Quedaste en la posición X de la lista de espera. Te avisaremos si se libera un lugar.".

#### Escenario 2: Ya inscripto en la lista

* **Dado** que el socio ya está en la lista de espera de esa clase.
* **Cuando** accede al detalle de la clase.
* **Entonces** el sistema muestra "Estás en posición X de la lista de espera" sin botón de inscripción.

#### Escenario 3: Intento de doble inscripción

* **Dado** que el socio ya está en la lista de espera.
* **Cuando** intenta inscribirse nuevamente (por error de UI o concurrencia).
* **Entonces** el sistema no crea una entrada duplicada y muestra "Ya estás en la lista de espera de esta clase".

---

## ID: Notificar lugar disponible

**Referencia:** 34
**Estado:** Done
**Sprint:** Primer sprint
**Puntos:** 3

**Título:** Como socio en lista de espera, quiero recibir una notificación cuando se libere un lugar en la clase para poder confirmar mi reserva a tiempo.

### Reglas de negocio

* La notificación se genera automáticamente cuando se cancela una reserva en una clase con lista de espera.
* La notificación se envía al primer socio de la lista (FIFO).
* El socio tiene 15 minutos desde la notificación para confirmar la reserva.
* La notificación es de tipo `espera` e incluye el `clase_id` como referencia.

### Criterios de aceptación

#### Escenario 1: Socio notificado al liberarse un lugar

* **Dado** que el socio "carlos.ruiz@gmail.com" está en posición 1 de la lista de espera de una clase completa.
* **Cuando** otro socio cancela su reserva en esa clase.
* **Entonces** el sistema crea una notificación para "carlos.ruiz@gmail.com" con el título "Lugar disponible" y el mensaje correspondiente.

#### Escenario 2: Visualización de notificación no leída

* **Dado** que el socio tiene una notificación de lugar disponible sin leer.
* **Cuando** accede a la aplicación.
* **Entonces** el sistema muestra la notificación resaltada (no leída) con la información de la clase disponible.

#### Escenario 3: Marcar notificación como leída

* **Dado** que el socio tiene notificaciones no leídas.
* **Cuando** visualiza la notificación.
* **Entonces** el sistema la marca como leída y deja de mostrarla como nueva.

---

## ID: Reservar pack de clases

**Referencia:** 25
**Estado:** Done
**Sprint:** Primer sprint
**Puntos:** 5

**Título:** Como socio, quiero ver los packs de 4 clases disponibles y comprar uno para obtener mis clases de un mes completo reservadas de una vez.

### Reglas de negocio

* Un pack agrupa 4 clases de igual disciplina, nivel y horario, una por semana durante 4 semanas.
* Solo se muestran packs con cupo disponible en las 4 fechas.
* No se muestran packs que solapen con reservas existentes del socio.
* No se muestran packs ya comprados por el socio (activos).
* La compra crea las 4 reservas de forma atómica (todo o nada). Si una clase falla, ninguna se reserva.

### Criterios de aceptación

#### Escenario 1: Compra exitosa

* **Dado** que el socio selecciona un pack disponible sin solapamientos y completa el pago mock.
* **Cuando** confirma la compra.
* **Entonces** el sistema crea las 4 reservas atómicamente, registra la compra y muestra la confirmación con las 4 fechas reservadas.

#### Escenario 2: Pack ya comprado

* **Dado** que el socio ya tiene un pack activo para ese horario y disciplina.
* **Cuando** accede al catálogo de packs.
* **Entonces** el pack aparece deshabilitado con el indicador "Ya compraste este pack".

#### Escenario 3: Pack con solapamiento de horario

* **Dado** que el socio tiene una reserva en el mismo horario que alguna clase del pack.
* **Cuando** accede al catálogo de packs.
* **Entonces** el pack aparece deshabilitado con el indicador "Solapa con tu reserva".

---

## Ver Packs Disponibles

**Referencia:** 48
**Estado:** Done
**Sprint:** Primer sprint
**Puntos:** 2

**Título:** Como socio, quiero ver el catálogo de packs disponibles para conocer las opciones de compra mensual.

### Reglas de negocio

* Se aplica triple filtro automático: cupo en las 4 fechas + sin solapamiento de horario + no comprado previamente.
* Los packs con solapamiento o ya comprados se muestran deshabilitados (no se ocultan), para que el socio entienda por qué no los puede comprar.

### Criterios de aceptación

#### Escenario 1: Listado con packs disponibles

* **Dado** que existen packs programados compatibles con el horario del socio.
* **Cuando** el socio accede a la sección "Packs".
* **Entonces** el sistema muestra cada pack con: disciplina, nivel, día de la semana, horario, 4 fechas, cupo mínimo disponible y precio.

#### Escenario 2: Sin packs disponibles

* **Dado** que no hay packs que cumplan el triple filtro para ese socio.
* **Cuando** el socio accede a la sección "Packs".
* **Entonces** el sistema muestra "No hay packs disponibles. Por ahora no hay packs que se ajusten a tus horarios libres. Revisá más tarde."

---

## ID: Crear clase

**Referencia:** 38
**Estado:** Done
**Sprint:** Primer sprint
**Puntos:** 3

**Título:** Como gestor, quiero crear una clase de mi disciplina asignada para que los socios puedan reservarla.

### Reglas de negocio

* El gestor solo puede crear clases de su disciplina asignada (campo `disciplina` en su perfil de usuario).
* La fecha mínima permitida es el día siguiente a hoy (no se pueden crear clases para el día actual).
* El horario debe estar dentro de la franja operativa: 17:00 a 00:00.
* El cupo máximo debe estar entre 1 y 20 socios.
* La duración de las clases es fija: 1 hora.

### Criterios de aceptación

#### Escenario 1: Creación exitosa

* **Dado** que el gestor "laura.garcia@gmail.com" tiene disciplina "pádel" asignada.
* **Cuando** selecciona nivel "Intermedio", fecha mañana, horario "18:00" y cupo 10, y presiona "Crear clase".
* **Entonces** el sistema crea la clase de pádel intermedio con horario 18:00–19:00, cupo 10, estado "disponible" y muestra "La clase fue creada exitosamente".

#### Escenario 2: Fecha inválida (hoy o pasada)

* **Dado** que el gestor intenta seleccionar la fecha de hoy.
* **Cuando** navega al selector de fecha.
* **Entonces** el sistema deshabilita la fecha de hoy y anteriores, impidiendo su selección.

#### Escenario 3: Disciplina fija (no editable)

* **Dado** que el gestor tiene asignada la disciplina "fútbol 5".
* **Cuando** accede a la pantalla "Nueva clase".
* **Entonces** el sistema muestra la disciplina "Fútbol 5" como campo de solo lectura con el candado, sin posibilidad de modificarla.

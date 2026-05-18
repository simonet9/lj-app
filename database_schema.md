## Table `abonos`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `socio_id` | `uuid` |  |
| `mes` | `int4` |  |
| `anio` | `int4` |  |
| `creditos_totales` | `int4` |  |
| `creditos_usados` | `int4` |  |
| `monto_pagado` | `numeric` |  |
| `pagado_at` | `timestamptz` |  |
| `created_at` | `timestamptz` |  |

## Table `cancelaciones`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `reserva_id` | `uuid` |  |
| `socio_id` | `uuid` |  |
| `clase_id` | `uuid` |  |
| `horas_anticipacion` | `numeric` |  |
| `credito_devuelto` | `bool` |  |
| `perdio_descuento` | `bool` |  |
| `created_at` | `timestamptz` |  |
| `via_pago` | `text` |  |
| `reembolso_pendiente` | `bool` |  |

## Table `cancelaciones_mensuales`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `socio_id` | `uuid` |  |
| `mes` | `int4` |  |
| `anio` | `int4` |  |
| `cancelaciones` | `int4` |  |
| `devoluciones` | `int4` |  |
| `pierde_descuento_next_mes` | `bool` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `clases`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `disciplina` | `disciplina` |  |
| `nivel` | `nivel_clase` |  |
| `fecha` | `date` |  |
| `hora_inicio` | `time` |  |
| `hora_fin` | `time` |  |
| `cupo_maximo` | `int4` |  |
| `cupo_disponible` | `int4` |  |
| `estado` | `estado_clase` |  |
| `gestor_id` | `uuid` |  |
| `motivo_suspension` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `compras_pack`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `socio_id` | `uuid` |  |
| `pack_id` | `uuid` |  |
| `monto_pagado` | `numeric` |  |
| `pagado_at` | `timestamptz` |  |
| `estado` | `text` |  |
| `created_at` | `timestamptz` |  |

## Table `lista_espera`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `socio_id` | `uuid` |  |
| `clase_id` | `uuid` |  |
| `posicion` | `int4` |  |
| `notificado_at` | `timestamptz` |  Nullable |
| `expira_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `notificaciones`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `usuario_id` | `uuid` |  |
| `titulo` | `text` |  |
| `cuerpo` | `text` |  |
| `leida` | `bool` |  |
| `tipo` | `text` |  Nullable |
| `referencia_id` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `pack_clases`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `pack_id` | `uuid` |  |
| `clase_id` | `uuid` |  |
| `semana_numero` | `int4` |  |

## Table `packs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `disciplina` | `text` |  |
| `nivel` | `text` |  |
| `dia_semana` | `text` |  |
| `hora_inicio` | `text` |  |
| `hora_fin` | `text` |  |
| `gestor_id` | `uuid` |  Nullable |
| `precio` | `numeric` |  |
| `activo` | `bool` |  |
| `created_at` | `timestamptz` |  |

## Table `reservas`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `socio_id` | `uuid` |  |
| `clase_id` | `uuid` |  |
| `estado` | `estado_reserva` |  |
| `seña_pagada` | `numeric` |  Nullable |
| `credito_usado` | `bool` |  Nullable |
| `cancelada_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `user_push_tokens`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `push_token` | `text` |  |
| `platform` | `text` |  |
| `active` | `bool` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `usuarios`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `email` | `text` |  Unique |
| `dni` | `text` |  Unique |
| `rol` | `user_role` |  |
| `creditos` | `int4` |  |
| `disciplina` | `disciplina` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |


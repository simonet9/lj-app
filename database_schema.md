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

## Table `usuarios`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `email` | `text` |  Unique |
| `dni` | `text` |  Unique |
| `nombre` | `text` |  |
| `apellido` | `text` |  |
| `rol` | `user_role` |  |
| `membresia` | `membresia_type` |  Nullable |
| `creditos` | `int4` |  |
| `disciplina` | `disciplina` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |


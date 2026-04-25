# CLAUDE.md — Centro Deportivo L&J

> **Antigravity:** Lee este archivo completo al inicio de cada sesión.  
> Es la fuente de verdad del proyecto. Antes de generar cualquier código, verificá que respeta los tipos, el theme, las reglas de negocio y la arquitectura de rutas definidos aquí. Si una instrucción del usuario contradice estas reglas, señalarlo antes de proceder.

---

## 1. PROYECTO

| Campo | Valor |
|---|---|
| **Nombre** | App Centro Deportivo L&J |
| **Equipo** | mino.tar (5 personas) |
| **Stack** | Expo SDK 51 · React Native 0.74 · TypeScript strict · Supabase |
| **Objetivo inmediato** | Demo funcional impactante — no código perfecto |
| **Filosofía** | Ship first. Clean later. |

---

## 2. ARQUITECTURA

### Router
Expo Router (file-based routing) — `expo-router ~3.5.0`

### Auth
Supabase Auth + `AuthContext.tsx` (React Context). El estado de sesión se persiste con AsyncStorage.

### Base de datos
Supabase (PostgreSQL) con **RLS habilitado en todas las tablas**. Nunca asumir acceso sin auth.

### Pagos
Mock de Mercado Pago. Sin API real para el MVP.

### Notificaciones
In-app únicamente. Sin FCM/APNS para el MVP.

---

## 3. ESTRUCTURA DE RUTAS

```
mobile/app/
├── _layout.tsx              ← Root: AuthProvider + guard de roles
├── index.tsx                ← Redirección inicial
├── (auth)/
│   ├── login.tsx
│   └── registro.tsx
├── (socio)/
│   ├── _layout.tsx          ← Tabs: clases, reservas, abono, perfil
│   ├── clases.tsx
│   ├── clase/[id].tsx       ← Stack modal sobre las tabs
│   ├── reservas.tsx
│   ├── abono.tsx
│   └── perfil.tsx
├── (gestor)/
│   ├── _layout.tsx          ← Tabs: agenda, crear-clase, perfil
│   ├── agenda.tsx
│   ├── crear-clase.tsx
│   └── perfil.tsx
└── (admin)/
    ├── _layout.tsx          ← Tabs: metricas, perfil
    ├── metricas.tsx
    └── perfil.tsx
```

### Redirección por rol (en `app/_layout.tsx`)
```ts
// Al detectar sesión activa:
socio   → router.replace('/(socio)/clases')
gestor  → router.replace('/(gestor)/agenda')
admin   → router.replace('/(admin)/metricas')
```

---

## 4. ROLES Y PERMISOS

| Rol | Acceso | Restricciones |
|---|---|---|
| `socio` | Reservar, cancelar, abono, historial, QR asistencia | No ve métricas ni gestión |
| `gestor` | Agenda de SU disciplina, crear/suspender clases, lista de asistentes | No puede ver datos de otros gestores |
| `admin` | Panel de métricas read-only, gestión de usuarios | No gestiona reservas individuales |

---

## 5. REGLAS DE NEGOCIO (críticas — nunca violar)

1. **Horario operativo:** 17:00 a 00:00. Ninguna clase puede crearse fuera de esta franja.
2. **Disciplinas válidas:** `futbol5` · `padel` · `voley` · `basquet` (exactamente estos 4 valores, lowercase, sin tildes).
3. **Niveles válidos:** `principiante` · `intermedio` · `avanzado`.
4. **Socio abonado:** Paga mensual. Usa créditos (1 crédito = 1 reserva).
5. **Socio eventual:** Paga seña del 50% vía Mercado Pago (mock) por cada reserva.
6. **Cancelación abonado:** Devuelve crédito si anticipación > 48hs Y < 3 cancelaciones en el mes.
7. **Cancelación eventual:** Devuelve seña si anticipación > 24hs.
8. **Lista de espera:** Orden FIFO. Sin cupo máximo. Ventana de 15 min para reconfirmar al quedar vacante.
9. **Abono mensual:** Compra habilitada entre días 1 y 10 del mes. Otorga 4 créditos con 20% descuento.
10. **Inasistencia:** Se marca automáticamente si no registra QR en la ventana de tolerancia → pérdida de membresía en abonado.

---

## 6. TIPOS TYPESCRIPT (fuente de verdad)

**Todos los tipos viven en `mobile/src/types/index.ts`. NUNCA redefinir tipos inline.**

### Tipos de unión (literales exactos)
```ts
type UserRole        = 'socio' | 'gestor' | 'admin';
type MembresiaType   = 'eventual' | 'abonado';
type Disciplina      = 'futbol5' | 'padel' | 'voley' | 'basquet';
type NivelClase      = 'principiante' | 'intermedio' | 'avanzado';
type EstadoClase     = 'disponible' | 'completa' | 'suspendida';
type EstadoReserva   = 'confirmada' | 'cancelada' | 'asistio' | 'ausente';
```

### Interfaces principales
| Interface | Descripción |
|---|---|
| `Usuario` | Perfil de usuario con rol y créditos |
| `Clase` | Clase deportiva con disciplina, horario, cupo y gestor |
| `Reserva` | Reserva de socio a una clase |
| `ListaEspera` | Entrada FIFO en lista de espera |
| `Abono` | Abono mensual con créditos |
| `MetricaOcupacion` | Métricas de ocupación por disciplina (admin) |
| `MetricaCobrabilidad` | Cobrabilidad mensual (admin) |
| `MetricaAusentismo` | Ausentismo por disciplina (admin) |
| `AuthContextType` | Contrato del contexto de autenticación |
| `SignUpData` | Datos de registro de nuevo socio |

---

## 7. DESIGN TOKENS (fuente de verdad)

**Todos en `mobile/src/constants/theme.ts`. NUNCA hardcodear colores, tamaños ni spacing.**

### Colores
```ts
Colors.primary     = '#1a1a2e'  // Azul marino oscuro (fondos)
Colors.primaryLight= '#16213e'
Colors.accent      = '#e94560'  // Rojo L&J (CTAs, énfasis)
Colors.accentLight = '#ff6b6b'
Colors.background  = '#f8f9fa'
Colors.surface     = '#ffffff'
Colors.border      = '#e2e8f0'
Colors.textPrimary = '#1a202c'
Colors.textSecondary = '#718096'
Colors.textInverse = '#ffffff'
// Disciplinas: futbol5 verde · padel azul · voley naranja · basquet rojo
Colors.futbol5  = '#48bb78'
Colors.padel    = '#4299e1'
Colors.voley    = '#ed8936'
Colors.basquet  = '#f56565'
```

### Espaciado
```ts
Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 }
```

### Bordes
```ts
Radius = { sm: 6, md: 10, lg: 16, xl: 24, full: 9999 }
```

### Tipografía
```ts
Typography.h1      = { fontSize: 28, fontWeight: '700', lineHeight: 36 }
Typography.h2      = { fontSize: 22, fontWeight: '600', lineHeight: 30 }
Typography.h3      = { fontSize: 18, fontWeight: '600', lineHeight: 26 }
Typography.body    = { fontSize: 15, fontWeight: '400', lineHeight: 22 }
Typography.label   = { fontSize: 12, fontWeight: '500', lineHeight: 18 }
```

---

## 8. CONVENCIONES DE CÓDIGO

### Imports (alias configurados en babel + tsconfig)
```
@services   → mobile/src/services/
@context    → mobile/src/context/
@constants  → mobile/src/constants/
@app-types  → mobile/src/types/
@components → mobile/src/components/
@utils      → mobile/src/utils/
```

> ⚠️ No usar `@types/` como alias — reservado por TypeScript para DefinitelyTyped.

### Nomenclatura
- Componentes: `PascalCase`
- Archivos: `kebab-case`
- Queries Supabase: siempre con manejo de error explícito (`if (error) ...`)

### UX obligatorio
- **Loading:** `ActivityIndicator` mientras carga. Nunca pantalla en blanco.
- **Lista vacía:** Siempre mostrar `EmptyState` con mensaje claro.
- **SafeArea:** `paddingTop: 48` mínimo en headers (o `useSafeAreaInsets()`).
- **Táctil:** `TouchableOpacity` con `activeOpacity={0.7}` en todos los elementos presionables. Área mínima 44×44pt.

### Patrón estándar de pantalla
```ts
export default function MiScreen() {
  const [data, setData] = useState<MiTipo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const { data, error } = await supabase.from('tabla').select('*');
    if (!error && data) setData(data as MiTipo[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <ActivityIndicator color={Colors.primary} />;
  return <FlatList data={data} keyExtractor={i => i.id} renderItem={...} />;
}
```

### Estilos
```ts
// ✅ Bien — styles externos con StyleSheet.create
const styles = StyleSheet.create({ item: { padding: Spacing.md } });

// ❌ Mal — objetos inline en renderItem
renderItem={({ item }) => <View style={{ padding: 16 }} />}
```

### TypeScript
```ts
// ✅ Bien — import de tipos
import type { Clase } from '@app-types/index';

// ✅ Bien — query tipada
const { data, error } = await supabase
  .from('clases')
  .select('*, gestor:usuarios(nombre, apellido)')
  .eq('id', id)
  .single();
// Castear: data as Clase

// ❌ Mal — any sin justificación
const result: any = await fetch(...);
```

---

## 9. COMPONENTES UI — GUÍA RÁPIDA

### CTAs (botones de acción principal)
```ts
{
  backgroundColor: Colors.accent,   // #e94560
  borderRadius: Radius.md,          // 10px
  paddingVertical: Spacing.md,      // 16px
  // Texto: Typography.body, color: Colors.textInverse, fontWeight: '600'
  // Deshabilitado: opacity: 0.5
}
```

### Tarjetas de clase
```ts
{
  backgroundColor: Colors.surface,
  borderRadius: Radius.lg,          // 16px
  borderWidth: 1,
  borderColor: Colors.border,
  // Acento lateral de 4px con Colors[disciplina]
}
```

### Librerías permitidas
| Librería | Uso exclusivo |
|---|---|
| `react-native-reanimated` | Transiciones y press effects |
| `victory-native` | **Solo admin** — pantalla de métricas |
| `react-native-qrcode-svg` | QR de asistencia y tickets |
| `@expo/vector-icons` (Ionicons) | Iconografía en toda la app |

---

## 10. SUPABASE — REGLAS

- **Cliente único:** `mobile/src/services/supabase.ts` (singleton con AsyncStorage)
- **RLS activo:** En todas las tablas. Las queries del cliente anon respetan las políticas.
- **Funciones SECURITY DEFINER:** Para lógica que necesita saltear RLS (ej: `get_my_rol()`).
- **Migraciones:** En `backend/supabase/migrations/` — numeradas `001_`, `002_`, etc.
- **Triggers obligatorios:** `updated_at` en tablas mutables, ajuste de `cupo_disponible` en reservas.
- **Convenciones SQL:** `uuid_generate_v4()` para PKs · `timestamptz` para timestamps · `ON DELETE CASCADE` en FKs de usuario.
- **Problema conocido:** `get_my_rol()` debe estar aplicada la migración `002_fix_rls_recursion.sql` en Supabase.

---

## 11. CUENTAS DE DEMO (precargadas en Supabase)

| Email | Contraseña | Rol | Detalle |
|---|---|---|---|
| ana.gomez@gmail.com | Club2026! | socio abonado | 3 créditos disponibles |
| carlos.ruiz@gmail.com | Club2026! | socio eventual | — |
| laura.garcia@gmail.com | Club2026! | gestor | Disciplina: pádel |
| miguel.lopez@gmail.com | Club2026! | gestor | Disciplina: fútbol5 |
| admin@centrolj.com | Admin2026! | admin | — |

---

## 12. ESTADO DEL PROYECTO (Abril 2026)

| Módulo | Estado |
|---|---|
| Auth (login, registro, sesión) | ✅ Completo |
| Navegación por roles | ✅ Completo |
| Clases — lista con filtros | ✅ Completo |
| Clases — detalle | ✅ Completo (mínimo) |
| Reservas — lista | 🔶 Stub |
| Abono | 🔶 Stub |
| Gestor — agenda | 🔶 Stub |
| Gestor — crear clase | 🔶 Stub |
| Admin — métricas | 🔶 Datos hardcodeados |
| RLS Supabase (`get_my_rol`) | ⚠️ Fix pendiente (`002_fix_rls_recursion.sql`) |

---

## 13. SKILLS POR TIPO DE TAREA

| Tarea | Skill |
|---|---|
| Nueva pantalla Expo | `@react-native-skills` |
| Navegación / arquitectura | `@react-native-architecture` |
| Query / RLS / schema SQL | `@supabase-postgres-best-practices` |
| Tipos TypeScript | `@typescript-expert` |
| Diseño visual / layout | `@frontend-design` |
| Planificar feature nueva | `@brainstorming` |
| PR / merge de branch | `@create-pr` |
| Bug sistemático | `@debugging-strategies` |
| Revisar seguridad RLS | `@security-auditor` |

---

## 14. CHECKLIST PRE-CÓDIGO (Antigravity debe verificar)

Antes de generar cualquier código, confirmar que:

- [ ] Los tipos usados existen en `mobile/src/types/index.ts` (no redefinir inline)
- [ ] Los colores/spacing/radios vienen de `mobile/src/constants/theme.ts`
- [ ] La ruta nueva encaja en la estructura de `app/` definida en §3
- [ ] Las reglas de negocio de §5 no son violadas
- [ ] Toda query Supabase tiene manejo de error explícito
- [ ] Toda pantalla muestra `ActivityIndicator` en loading y `EmptyState` en lista vacía
- [ ] Los imports usan alias (`@app-types`, `@services`, etc.) y no rutas relativas largas
- [ ] No se usa `any` sin comentario justificativo

---

*Última actualización: Abril 2026 — equipo mino.tar*

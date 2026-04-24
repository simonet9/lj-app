# Directrices de UI/UX y Diseño — Centro Deportivo L&J

> Documento de referencia para el desarrollo del frontend móvil.  
> Antigravity debe consultar este archivo antes de proponer cualquier cambio en el frontend.

---

## 1. Identidad y Estética

| Atributo | Definición |
|---|---|
| **Concepto** | App deportiva moderna, limpia y de alto rendimiento |
| **Inspiración** | Mobbin (fitness apps) · Dribbble (paneles de reserva Pádel/Fútbol) |
| **Paleta** | `mobile/src/constants/theme.ts` — priorizar contraste alto para legibilidad exterior (luz solar) |

### Tokens clave del tema
```ts
Colors.primary     = '#1a1a2e'  // Azul marino oscuro (fondos)
Colors.accent      = '#e94560'  // Rojo L&J (CTAs, énfasis)
Colors.background  = '#f8f9fa'  // Fondo claro
Colors.surface     = '#ffffff'  // Tarjetas y contenedores
// Disciplinas: futbol5 verde · padel azul · voley naranja · basquet rojo
```

---

## 2. Roles y Flujos de Usuario

### Socio
- **Objetivo:** Fricción cero para reservar
- Lista de clases filtrables por disciplina
- Detalle de clase → reservar con un toque
- Abono: créditos disponibles siempre visibles
- Perfil: historial de reservas y estado de membresía
- QR de asistencia accesible desde reservas confirmadas

### Gestor
- **Objetivo:** Gestión rápida de horarios y asistencia
- Agenda: vista de sus clases por día/semana
- Crear clase: formulario mínimo (disciplina, fecha, hora, cupo)
- Lista de asistentes a cada clase
- Control de estado: disponible / completa / suspendida

### Admin
- **Objetivo:** Dashboard analítico
- KPIs: socios activos, ausentismo, cobrabilidad
- Gráficos de ocupación por disciplina (`victory-native`)
- Cobrabilidad mensual eventuales vs abonados
- Gestión de usuarios y roles

---

## 3. Estándares de Componentes (UI)

### Librería base
React Native StyleSheet nativo (sin librería de UI externa por ahora — mantener bundle liviano).

### Componentes de terceros y su uso
| Librería | Uso exclusivo |
|---|---|
| `react-native-reanimated` | Transiciones entre pantallas, feedback visual en botones (press effects) |
| `victory-native` | **Solo rol Admin** — pantalla de métricas |
| `react-native-svg` + `react-native-qrcode-svg` | Tickets y pases de asistencia QR |
| `@expo/vector-icons` (Ionicons) | Iconografía consistente en toda la app |

### CTAs (botones de acción principal)
- `backgroundColor: Colors.accent` (`#e94560`)
- `borderRadius: Radius.md` (10px)
- `paddingVertical: Spacing.md` (16px)
- Texto: `Typography.body`, `color: Colors.textInverse`, `fontWeight: '600'`
- Estado deshabilitado: `opacity: 0.5`

### Tarjetas
- `backgroundColor: Colors.surface`
- `borderRadius: Radius.lg` (16px)
- `borderWidth: 1`, `borderColor: Colors.border`
- Acento lateral de 4px con color de disciplina

---

## 4. Reglas de Implementación

### Mobile First
- Usar `SafeAreaView` o `paddingTop: 48+` en headers de pantalla
- Áreas táctiles mínimas de 44×44pt (iOS HIG)
- `TouchableOpacity` con `activeOpacity={0.7}` en elementos interactivos

### Navegación (expo-router)
```
app/
├── _layout.tsx           ← Root (AuthProvider + guard de roles)
├── (auth)/               ← login, registro
├── (socio)/              ← Tabs: clases, reservas, abono, perfil
│   └── clase/[id].tsx    ← Stack modal sobre las tabs
├── (gestor)/             ← Tabs: agenda, crear-clase, perfil
└── (admin)/              ← Tabs: metricas, perfil
```
- Las rutas de detalle (modales/stack) se registran en el `_layout.tsx` del grupo con `href: null` y `tabBarStyle: { display: 'none' }`

### Performance
- `FlatList` con `keyExtractor` estable para listas de clases/reservas
- `useCallback` en funciones de fetch pasadas a dependencias de `useEffect`
- Evitar objetos inline en `style` prop dentro de `renderItem`

### Supabase / Tipos
- Todas las queries deben tipar el resultado: `const { data } = await supabase.from('clases').select('*') as { data: Clase[] | null }`
- Los tipos de dominio viven en `mobile/src/types/index.ts` e importan con `@app-types/index`
- RLS activo en todas las tablas — nunca asumir acceso sin auth

### TypeScript
- `strict: true` habilitado
- Interfaces de dominio: `Usuario`, `Clase`, `Reserva`, `Abono`, `ListaEspera`
- Alias configurados: `@services`, `@context`, `@constants`, `@app-types`, `@components`, `@utils`

### PostgreSQL / Migraciones
- Migraciones numeradas: `001_`, `002_`, etc. en `backend/supabase/migrations/`
- Funciones `SECURITY DEFINER` para lógica que necesita saltear RLS (ej: `get_my_rol()`)
- Triggers para: `updated_at`, ajuste de `cupo_disponible` en reservas

---

## 5. Convenciones de Código

```ts
// ✅ Bien — componente de pantalla
export default function ClasesScreen() { ... }

// ✅ Bien — fetch con useCallback
const fetchClases = useCallback(async () => { ... }, [filtro]);

// ✅ Bien — import de tipos
import type { Clase } from '@app-types/index';

// ❌ Mal — styles inline en listas
renderItem={({ item }) => <View style={{ padding: 16 }} />}

// ✅ Bien — styles externos
const styles = StyleSheet.create({ item: { padding: Spacing.md } });
```

---

## 6. Estado del Proyecto (Abril 2026)

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
| RLS Supabase | ⚠️ Fix pendiente de aplicar en Dashboard |

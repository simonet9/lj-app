# Contexto Técnico — lj-app

> Referencia rápida del stack y patrones vigentes.  
> Antigravity debe respetar estas convenciones en todo cambio de código.

---

## Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Runtime | Expo | ~51.0.0 |
| Framework móvil | React Native | 0.74.1 |
| Lenguaje | TypeScript | ^5.3 (strict) |
| Navegación | expo-router | ~3.5.0 |
| Backend / DB | Supabase | ^2.39.0 |
| Animaciones | react-native-reanimated | ~3.10.1 |
| Gráficos (Admin) | victory-native | ^36.9.2 |
| QR | react-native-qrcode-svg | ^6.3.0 |
| Iconos | @expo/vector-icons (Ionicons) | ^14.0.0 |
| Storage auth | AsyncStorage | 1.23.1 |

---

## React Native — Reglas clave

- **StyleSheet:** Siempre definir estilos fuera del componente con `StyleSheet.create({})`. Nunca objetos inline en props `style` dentro de `renderItem`.
- **SafeArea:** Todo header de pantalla debe tener `paddingTop: 48` mínimo (o usar `useSafeAreaInsets()`).
- **Listas:** Usar `FlatList` con `keyExtractor` estable. Para más de 50 items, considerar `FlashList`.
- **Gestos:** `TouchableOpacity` con `activeOpacity={0.7}` en todos los elementos presionables.
- **Evitar re-renders:** `useCallback` en handlers y fetch functions; `useMemo` en cálculos derivados de listas.

```ts
// Patrón estándar de pantalla
export default function MiScreen() {
  const [data, setData] = useState<MiTipo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const { data, error } = await supabase.from('tabla').select('*');
    if (!error && data) setData(data as MiTipo[]);
    setLoading(false);
  }, [/* dependencias */]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <ActivityIndicator color={Colors.primary} />;
  return <FlatList data={data} keyExtractor={i => i.id} renderItem={...} />;
}
```

---

## Expo — Reglas clave

- **expo-router:** File-based routing. Los grupos `(rol)/` usan `Tabs`, las rutas de detalle se agregan con `href: null` en el layout del grupo.
- **Variables de entorno:** Prefijo `EXPO_PUBLIC_` en `.env`. Acceso via `process.env.EXPO_PUBLIC_*`.
- **Assets:** Deben existir físicamente en `assets/images/`: `icon.png`, `splash.png`, `favicon.png`, `adaptive-icon.png`.
- **Alias de paths** (babel + tsconfig):
  ```
  @services   → src/services/
  @context    → src/context/
  @constants  → src/constants/
  @app-types  → src/types/
  @components → src/components/
  @utils      → src/utils/
  ```
- **typedRoutes:** Habilitado en `app.json`. Para rutas dinámicas usar `as any` en `pathname` hasta que prebuild genere los tipos.

---

## Supabase — Reglas clave

- **Cliente:** `mobile/src/services/supabase.ts` exporta `supabase` singleton con AsyncStorage como storage de sesión.
- **Auth:** `AuthContext.tsx` maneja sesión, `fetchUsuario` carga el perfil desde `public.usuarios`.
- **RLS:** Activo en todas las tablas. Las queries del cliente anon respetan las políticas.
- **Tipado de queries:**
  ```ts
  const { data, error } = await supabase
    .from('clases')
    .select('*, gestor:usuarios(nombre, apellido)')
    .eq('id', id)
    .single();
  // Castear: data as Clase
  ```
- **SECURITY DEFINER:** Funciones que necesitan saltear RLS se crean con esta opción y `set search_path = public`.
- **Problema conocido:** `get_my_rol()` debe estar aplicado en Supabase (migración `002_fix_rls_recursion.sql`).

---

## TypeScript — Reglas clave

- `strict: true` — no usar `any` salvo casos documentados (ej: `pathname as any` en expo-router dinámico).
- Tipos de dominio en `src/types/index.ts`, importar con `@app-types/index`.
- **No usar** `@types/` como alias (reservado por TS para DefinitelyTyped).
- Interfaces principales: `Usuario`, `Clase`, `Reserva`, `Abono`, `ListaEspera`, `AuthContextType`.

---

## PostgreSQL / Supabase Migrations — Reglas clave

- Archivo de migración activo: `backend/supabase/migrations/001_initial_schema.sql`
- Fix RLS pendiente: `002_fix_rls_recursion.sql` (ejecutar en Supabase SQL Editor)
- Convenciones:
  - `uuid_generate_v4()` para PKs
  - `timestamptz` para timestamps
  - `on delete cascade` en FKs de usuario
  - Triggers para `updated_at` en tablas mutables
  - Funciones RPC con `SECURITY DEFINER` cuando necesitan ver datos sin RLS

---

## Estructura de directorios

```
lj-app/
├── backend/
│   └── supabase/migrations/    ← SQL migrations
├── docs/
│   ├── GUIDELINES.md           ← UI/UX y diseño
│   └── TECH_CONTEXT.md         ← Este archivo
└── mobile/
    ├── app/                    ← expo-router routes
    │   ├── _layout.tsx
    │   ├── (auth)/
    │   ├── (socio)/clase/[id].tsx
    │   ├── (socio)/
    │   ├── (gestor)/
    │   └── (admin)/
    ├── src/
    │   ├── components/         ← Componentes reutilizables
    │   ├── constants/theme.ts  ← Design tokens
    │   ├── context/AuthContext.tsx
    │   ├── services/supabase.ts
    │   └── types/index.ts      ← Interfaces de dominio
    └── assets/images/          ← icon, splash, favicon, adaptive-icon
```

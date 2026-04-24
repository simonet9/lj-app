# Guía de instalación — Centro Deportivo L&J

## Requisitos previos

| Herramienta | Versión mínima | Instalación |
|-------------|---------------|-------------|
| Node.js     | 18.x          | https://nodejs.org |
| npm         | 9.x           | incluido con Node |
| Git         | 2.x           | https://git-scm.com |
| Expo Go     | última        | App Store / Google Play |

---

## Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/mino-tar/lj-app.git
cd lj-app
```

---

## Paso 2 — Crear el proyecto en Supabase

1. Ir a https://supabase.com y crear una cuenta (gratis)
2. **New Project** → nombre: `lj-app` → contraseña de BD (guardarla)
3. Esperar 2 minutos mientras se provisiona

### Obtener las credenciales
- Settings → API
- Copiar **Project URL** y **anon/public key**

---

## Paso 3 — Configurar la base de datos

### 3a. Ejecutar el schema
1. Supabase Dashboard → **SQL Editor** → New query
2. Pegar el contenido de `backend/supabase/migrations/001_initial_schema.sql`
3. Click **Run**

### 3b. Crear usuarios de demo en Auth
1. Supabase Dashboard → **Authentication** → **Users** → **Add user**
2. Crear los 9 usuarios definidos en `docs/seed-demo.sql` (ver comentarios al inicio del archivo)
3. Copiar los UUIDs generados por cada usuario

### 3c. Ejecutar el seed
1. En `docs/seed-demo.sql`, reemplazar todos los `UUID_XXXXX` con los UUIDs reales
2. SQL Editor → pegar el seed modificado → Run

---

## Paso 4 — Configurar la app móvil

```bash
cd mobile
cp .env.example .env
```

Editar `.env` con las credenciales de Supabase:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```bash
npm install
```

---

## Paso 5 — Levantar en desarrollo

```bash
npx expo start
```

Esto abre el **Metro Bundler**. Opciones:
- `a` → abrir en emulador Android
- `i` → abrir en simulador iOS (solo macOS)
- Escanear el QR con la app **Expo Go** en tu celular (misma red WiFi)

### Cuentas de demo disponibles
| Email | Password | Rol |
|-------|----------|-----|
| ana.gomez@gmail.com | Club2026! | Socio abonado (3 créditos) |
| carlos.ruiz@gmail.com | Club2026! | Socio eventual |
| laura.garcia@gmail.com | Club2026! | Gestor de Pádel |
| admin@centrolj.com | Admin2026! | Administrador |

---

## Estructura de carpetas (mobile)

```
mobile/
├── app/                     # Expo Router — pantallas y layouts
│   ├── _layout.tsx          # Root layout (AuthProvider + routing)
│   ├── (auth)/              # Pantallas sin sesión
│   │   ├── login.tsx
│   │   └── registro.tsx
│   ├── (socio)/             # Tab bar del socio
│   │   ├── clases.tsx       # Grilla de clases ← PANTALLA PRINCIPAL
│   │   ├── reservas.tsx
│   │   ├── abono.tsx
│   │   └── perfil.tsx
│   ├── (gestor)/            # Tab bar del gestor
│   │   ├── agenda.tsx
│   │   ├── crear-clase.tsx
│   │   └── perfil.tsx
│   └── (admin)/             # Tab bar del admin
│       ├── metricas.tsx     # Dashboard con charts
│       └── perfil.tsx
│
└── src/
    ├── components/          # Componentes reutilizables
    ├── context/
    │   └── AuthContext.tsx  # Estado global de autenticación
    ├── services/
    │   └── supabase.ts      # Cliente Supabase
    ├── constants/
    │   └── theme.ts         # Colores, tipografía, espaciado
    └── types/
        └── index.ts         # Tipos TypeScript del dominio
```

---

## Convenciones del equipo

### Git branches
```
main          → producción / demo
develop       → integración
feature/      → features (ej: feature/reserva-clase)
fix/          → bugs (ej: fix/login-error)
```

### Commits
```
feat: agregar pantalla de reserva
fix: corregir validación de DNI
chore: actualizar dependencias
style: ajustar colores del theme
```

### Responsabilidades por archivo
Antes de tocar un archivo que otro está trabajando, avisar en el canal de equipo.

---

## Problemas frecuentes

**`EXPO_PUBLIC_SUPABASE_URL is not defined`**
→ Revisar que el archivo `.env` existe en `mobile/` y tiene las variables con prefijo `EXPO_PUBLIC_`

**`Cannot find module '@context/AuthContext'`**
→ Correr `npx expo start --clear` para limpiar la cache de Metro

**`relation "usuarios" does not exist`**
→ El schema SQL no se ejecutó. Repetir Paso 3a.

**`Invalid login credentials`**
→ Los usuarios de demo no fueron creados en Supabase Auth. Repetir Paso 3b.

**La app no se conecta al escanear el QR**
→ Asegurarse de que el celular y la computadora están en la misma red WiFi

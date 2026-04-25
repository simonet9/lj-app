# Guía de Configuración - Centro Deportivo L&J

Esta guía explica cómo levantar la aplicación móvil en tu entorno local. La base de datos y los usuarios de prueba ya se encuentran configurados.

## Requisitos Previos
* Node.js en su versión 18 o una superior.
* npm en su versión 9 o superior.
* Expo CLI instalado de manera global usando el comando `npm install -g expo-cli`.
* El archivo `.env` con las credenciales de desarrollo (solicítalo por interno para no exponer claves en el repositorio).

## Pasos de Instalación

1.  **Clonar el repositorio:**
    Descarga el código del proyecto a tu máquina local.
    ```bash
    git clone https://github.com/simonet9/lj-app.git
    cd lj-app
    ```
2.  **Instalar dependencias:**
    Ingresa al directorio de la aplicación móvil.
    Instala todas las librerías necesarias para que funcione el entorno.
    ```bash
    cd mobile
    npm install
    ```
3.  **Configurar variables de entorno:**
    Crea tu propio archivo de variables a partir de la plantilla.
    ```bash
    cp .env.example .env
    ```
    *Nota importante: Edita el nuevo archivo `.env` e ingresa las credenciales de Supabase que te fueron proporcionadas.*
4.  **Ejecutar la aplicación en desarrollo:**
    Inicia el servidor local utilizando el script configurado en el proyecto.
    ```bash
    npm run start
    ```
    También puedes inicializarlo directamente mediante la herramienta de línea de comandos de Expo.
    ```bash
    npx expo start
    ```

---

## Uso de la app (roles, usuarios demo y navegación)

La app utiliza **Expo Router** y organiza las pantallas por **rol**. Según el usuario con el que inicies sesión, vas a ver diferentes secciones:

- **Socio**
  - Acceso a las pantallas principales de clases/reservas/abono/perfil.
- **Gestor (Pádel)**
  - Agenda, creación de clases y perfil.
- **Administrador**
  - Métricas/dashboard y perfil.

### Cuentas de demo disponibles

| Email | Password | Rol |
|-------|----------|-----|
| ana.gomez@gmail.com | Club2026! | Socio abonado (3 créditos) |
| carlos.ruiz@gmail.com | Club2026! | Socio eventual |
| laura.garcia@gmail.com | Club2026! | Gestor de Pádel |
| admin@centrolj.com | Admin2026! | Administrador |

> Si te da **`Invalid login credentials`**, generalmente significa que el usuario no existe en **Supabase Auth** del entorno que estás usando.

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
→ El schema SQL no se ejecutó.

**`Invalid login credentials`**
→ Los usuarios de demo no fueron creados en Supabase Auth.

**La app no se conecta al escanear el QR**
→ Asegurarse de que el celular y la computadora están en la misma red WiFi

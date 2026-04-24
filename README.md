# Centro Deportivo L&J — App

Sistema de gestión integral para el Centro Deportivo L&J.

**Organización:** mino.tar  
**Stack:** Expo (React Native) + Supabase  
**Versión:** 1.0.0-alpha  

---

## Estructura del repositorio

```
lj-app/
├── mobile/          # App Expo (React Native)
├── backend/         # API Node/Express (si se necesita lógica extra)
├── docs/            # Documentación técnica
└── .github/         # CI/CD workflows
```

## Inicio rápido

### Requisitos
- Node.js >= 18
- npm >= 9
- Expo CLI: `npm install -g expo-cli`
- Cuenta en [Supabase](https://supabase.com)

### 1. Clonar y configurar
```bash
git clone https://github.com/mino-tar/lj-app.git
cd lj-app
```

### 2. Configurar la app móvil
```bash
cd mobile
npm install
cp .env.example .env
# Completar las variables de entorno con los datos de Supabase
```

### 3. Levantar en desarrollo
```bash
npx expo start
```

### 4. (Opcional) Levantar backend local
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

---

## Roles del sistema

| Rol | Acceso | Descripción |
|-----|--------|-------------|
| `socio` | App móvil — sección socio | Reserva clases, gestiona membresía |
| `gestor` | App móvil — sección gestor | Administra agenda de su disciplina |
| `admin` | App móvil — sección admin | Panel de métricas y decisiones |

## Disciplinas
Fútbol 5 · Pádel · Vóley · Básquet

## Equipo
Castillo Simón · Cuacci Matias · Lavie Ramiro · Ramírez Ludmila · Tobes Agustín

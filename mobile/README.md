# mobile — App Expo

App móvil del Centro Deportivo L&J.

## Stack
- **Expo SDK 51** con Expo Router (file-based routing)
- **React Native 0.74**
- **TypeScript** estricto
- **Supabase** para auth + BD

## Scripts
```bash
npm start          # Metro bundler
npm run android    # Emulador Android
npm run ios        # Simulador iOS
npm run type-check # TypeScript sin emitir
npm run lint       # ESLint
```

## Variables de entorno
Ver `.env.example`. Todas las variables de entorno para Expo deben comenzar con `EXPO_PUBLIC_`.

## Routing
Expo Router usa file-based routing. La estructura de `app/` mapea directamente a las rutas:
- `app/(auth)/login.tsx` → pantalla de login (sin sesión)
- `app/(socio)/clases.tsx` → grilla de clases del socio
- `app/(gestor)/agenda.tsx` → agenda del gestor
- `app/(admin)/metricas.tsx` → dashboard del admin

El redirect por rol ocurre en `app/_layout.tsx` al detectar cambios en la sesión.

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
    git clone [https://github.com/mino-tar/lj-app.git](https://github.com/mino-tar/lj-app.git)
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

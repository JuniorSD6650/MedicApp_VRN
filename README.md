# MedicApp

MedicApp es una plataforma para la gestión inteligente de medicación, compuesta por un backend (API REST) y un frontend (aplicación móvil y web).

## Requisitos previos

- **Node.js**: Versión 16 o superior
- **npm**: Versión 8 o superior
- **MySQL**: Base de datos para el backend
- **Expo CLI**: Para ejecutar el frontend (`npm install -g expo-cli`)

---

## Backend: medicapp-backend

### Instalación

1. Navega al directorio del backend:
   ```bash
   cd medicapp-backend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   - Crea un archivo `.env` en el directorio `medicapp-backend`.
   - Agrega las siguientes variables:
     ```
     DB_HOST=localhost
     DB_USER=tu_usuario
     DB_PASSWORD=tu_contraseña
     DB_NAME=medicapp
     JWT_SECRET=tu_secreto_jwt
     ```

4. Asegúrate de que la base de datos MySQL esté configurada y corriendo.

### Ejecución

- **Modo desarrollo** (con reinicio automático):
  ```bash
  npm run dev
  ```

- **Modo producción**:
  ```bash
  npm start
  ```

El backend estará disponible en `http://localhost:4000`.

---

## Frontend: medicapp-frontend

### Instalación

1. Navega al directorio del frontend:
   ```bash
   cd medicapp-frontend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura el archivo `apiService.js` (si aplica):
   - Asegúrate de que la URL base de la API apunte al backend:
     ```javascript
     const API_BASE_URL = 'http://localhost:4000';
     ```

### Ejecución

- **Modo desarrollo**:
  ```bash
  npm start
  ```
  Esto abrirá el servidor de desarrollo de Expo. Desde aquí puedes:
  - Escanear el código QR con la app de Expo Go en tu dispositivo móvil.
  - Presionar `a` para abrir en un emulador de Android.
  - Presionar `w` para abrir en el navegador web.

- **Ejecutar en Android**:
  ```bash
  npm run android
  ```

- **Ejecutar en iOS** (requiere macOS y Xcode):
  ```bash
  npm run ios
  ```

- **Ejecutar en el navegador web**:
  ```bash
  npm run web
  ```

---

## Notas adicionales

- Asegúrate de que el backend esté corriendo antes de iniciar el frontend.
- Si estás ejecutando el backend y frontend en diferentes máquinas, actualiza la URL base de la API en el frontend para que apunte a la dirección IP del backend.

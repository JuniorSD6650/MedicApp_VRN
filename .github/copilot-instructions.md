# Guía para Agentes de IA en MedicApp

## Visión General del Proyecto
MedicApp es una plataforma para la gestión inteligente de medicación, compuesta por:
- **Backend**: Una API REST construida con Node.js y MySQL.
- **Frontend**: Aplicaciones web y móvil desarrolladas con React y React Native.

El backend y el frontend están diseñados para trabajar juntos, con el backend proporcionando servicios API que el frontend consume.

---

## Estructura del Proyecto
### Backend (`medicapp-backend`)
- **`controllers/`**: Contiene la lógica de negocio para manejar las solicitudes HTTP.
  - Ejemplo: `auth.controller.js` maneja la autenticación de usuarios.
- **`models/`**: Define los modelos de datos y sus relaciones con Sequelize.
  - Ejemplo: `Patient.js` representa la tabla de pacientes en la base de datos.
- **`routes/`**: Define las rutas de la API y las conecta con los controladores.
  - Ejemplo: `auth.routes.js` define las rutas relacionadas con la autenticación.
- **`services/`**: Contiene lógica reutilizable, como procesamiento de CSV o servicios de negocio.
- **`utils/`**: Utilidades generales como `logger.js` para el registro de logs.

### Frontend (`medicapp-frontend` y `medicapp-mobile`)
- **`src/components/`**: Componentes reutilizables de la interfaz de usuario.
  - Ejemplo: `Header.js` es un encabezado común.
- **`src/screens/`**: Pantallas principales de la aplicación.
  - Ejemplo: `LoginScreen.js` maneja la pantalla de inicio de sesión.
- **`src/services/`**: Lógica para interactuar con la API del backend.
  - Ejemplo: `authService.js` maneja las solicitudes relacionadas con la autenticación.

---

## Flujos de Trabajo Clave
### Backend
1. **Instalación**:
   ```bash
   cd medicapp-backend
   npm install
   ```
2. **Ejecución**:
   - Modo desarrollo:
     ```bash
     npm run dev
     ```
   - Modo producción:
     ```bash
     npm start
     ```
3. **Configuración**:
   - Variables de entorno en `.env`.
   - Base de datos MySQL debe estar corriendo.

### Frontend
1. **Instalación**:
   ```bash
   cd medicapp-frontend
   npm install
   ```
2. **Ejecución**:
   ```bash
   npm start
   ```
   - Escanea el código QR con Expo Go o usa un emulador.

---

## Convenciones del Proyecto
- **Logs**: Usa `utils/logger.js` para registrar eventos importantes.
- **Rutas API**: Define rutas RESTful en `routes/` y conéctalas con controladores.
- **Modelos**: Usa Sequelize para definir modelos y relaciones.
- **Servicios**: Centraliza la lógica de negocio en `services/` para mantener los controladores ligeros.
- **Frontend**: Utiliza Context API para manejar el estado global y React Navigation para la navegación.

---

## Dependencias Clave
- **Backend**:
  - `express`: Framework para construir la API REST.
  - `sequelize`: ORM para interactuar con MySQL.
  - `jsonwebtoken`: Manejo de autenticación basada en tokens.
- **Frontend**:
  - `react`: Biblioteca para construir interfaces de usuario.
  - `expo`: Herramienta para desarrollar aplicaciones móviles.
  - `@react-navigation/native`: Navegación en React Native.

---

## Ejemplo de Patrón
### Backend: Controlador y Ruta
Archivo: `auth.controller.js`
```javascript
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !user.validatePassword(password)) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }
  const token = generateToken(user);
  res.json({ token });
};
```
Archivo: `auth.routes.js`
```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/login', authController.login);

module.exports = router;
```

### Frontend: Servicio y Componente
Archivo: `authService.js`
```javascript
import axios from 'axios';

const API_URL = 'http://localhost:4000/auth';

export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/login`, { email, password });
  return response.data;
};
```
Archivo: `LoginScreen.js`
```javascript
import React, { useState } from 'react';
import { login } from '../services/authService';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const data = await login(email, password);
      console.log('Login exitoso:', data);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    }
  };

  return (
    <div>
      {/* Formulario de inicio de sesión */}
    </div>
  );
};

export default LoginScreen;
```

---

## Notas Adicionales
- Asegúrate de que el backend esté corriendo antes de iniciar el frontend.
- Actualiza las URLs base de la API en el frontend según sea necesario.
- Sigue las convenciones de estructura y nomenclatura para mantener la coherencia del proyecto.

---

Para más detalles, consulta los archivos `README.md` en cada subproyecto.
# MedicApp - Aplicación Médica Móvil

Una aplicación móvil completa desarrollada en React Native con Expo para la gestión médica con múltiples roles de usuario.

## 🚀 Características principales

### Roles de Usuario
- **Paciente**: Gestión de medicamentos y recetas
- **Médico**: Búsqueda de pacientes y gestión de recetas
- **Administrador**: Importación de datos CSV y gestión del sistema

### Funcionalidades por Rol

#### 👤 Paciente
- Dashboard con seguimiento de medicamentos diarios
- Lista de recetas con filtros (activas/completadas)
- Detalle completo de recetas con medicamentos
- Navegación por fechas para seguimiento

#### 👨‍⚕️ Médico
- Dashboard con resumen de pacientes y citas
- Búsqueda de pacientes por nombre o DNI
- Vista detallada de pacientes con historial médico
- Gestión de recetas y medicamentos

#### 👨‍💼 Administrador
- Dashboard con estadísticas del sistema
- Importación de datos desde archivos CSV
- Validación y vista previa de datos
- Gestión del sistema y usuarios

## 🛠 Tecnologías utilizadas

- **React Native**: Framework principal
- **Expo**: Plataforma de desarrollo
- **React Navigation**: Navegación (Stack, Tabs, Drawer)
- **AsyncStorage**: Almacenamiento local
- **date-fns**: Manejo de fechas con localización en español

## 📱 Plataformas soportadas

- ✅ Android
- ✅ iOS
- ✅ Web

## 🏗 Estructura del proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Header.js
│   └── PrescriptionItem.js
├── constants/           # Constantes y temas
│   └── theme.js
├── context/            # Context API para estado global
│   └── AuthContext.js
├── navigation/         # Configuración de navegación
│   └── AppNavigator.js
├── screens/           # Pantallas de la aplicación
│   ├── LoginScreen.js
│   ├── RegisterScreen.js
│   ├── ForgotPasswordScreen.js
│   ├── PatientDashboard.js
│   ├── PrescriptionsScreen.js
│   ├── PrescriptionDetailScreen.js
│   ├── DoctorDashboard.js
│   ├── PatientSearchScreen.js
│   ├── PatientDetailScreen.js
│   ├── AdminDashboard.js
│   └── CsvUploadScreen.js
├── services/          # Servicios de datos (mock APIs)
│   ├── api.js
│   ├── authService.js
│   ├── medicationService.js
│   ├── medicationIntakeService.js
│   ├── prescriptionService.js
│   └── patientService.js
└── utils/             # Utilidades
```

## 🚀 Instalación y configuración

### Prerrequisitos
- Node.js (v14 o superior)
- Expo CLI
- Android Studio (para Android) o Xcode (para iOS)

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd medicapp-frontend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar el proyecto**
   ```bash
   npm start
   # o
   expo start
   ```

4. **Ejecutar en dispositivo/emulador**
   - Para Android: `npm run android`
   - Para iOS: `npm run ios`
   - Para Web: `npm run web`

## 📋 Dependencias principales

```json
{
  "@react-navigation/native": "^6.1.18",
  "@react-navigation/stack": "^6.4.1",
  "@react-navigation/bottom-tabs": "^6.6.1",
  "@react-navigation/drawer": "^6.7.2",
  "@react-native-async-storage/async-storage": "1.23.1",
  "date-fns": "^3.6.0",
  "expo": "~53.0.20",
  "react": "18.2.0",
  "react-native": "0.76.5"
}
```

## 🔐 Autenticación

El sistema incluye autenticación completa con:
- Inicio de sesión
- Registro de usuarios
- Recuperación de contraseña
- Persistencia de sesión
- Roles de usuario

### Usuarios de prueba

```javascript
// Paciente
Email: paciente@test.com
Password: 123456

// Médico
Email: doctor@test.com
Password: 123456

// Administrador
Email: admin@test.com
Password: 123456
```

## 🗄 Gestión de datos

El proyecto utiliza servicios mock que simulan APIs reales:

- **authService**: Autenticación y gestión de usuarios
- **patientService**: Gestión de pacientes
- **prescriptionService**: Gestión de recetas médicas
- **medicationService**: Catálogo de medicamentos
- **medicationIntakeService**: Seguimiento de tomas

## 📊 Funcionalidades destacadas

### Sistema de navegación adaptativo
- **Pacientes**: Navegación por pestañas (Tabs)
- **Médicos**: Navegación por menú lateral (Drawer)
- **Administradores**: Navegación por menú lateral (Drawer)

### Importación de datos CSV
- Selección de archivos CSV
- Vista previa del contenido
- Validación de datos
- Procesamiento e importación

### Seguimiento de medicamentos
- Dashboard con medicamentos del día
- Navegación por fechas
- Estados de toma (pendiente/tomado)

## 🎨 Diseño y UI

- Diseño moderno y responsivo
- Paleta de colores consistente
- Iconos emoji para mejor UX
- Soporte para modo claro
- Adaptado para diferentes tamaños de pantalla

## 🚧 Desarrollo futuro

- [ ] Integración con APIs reales
- [ ] Notificaciones push
- [ ] Modo offline
- [ ] Sincronización de datos
- [ ] Reportes avanzados
- [ ] Videollamadas médicas

## 📝 Notas de desarrollo

- Los datos actualmente son simulados (mock)
- El proyecto está configurado para fácil migración a APIs reales
- Incluye validaciones de formularios
- Manejo de errores implementado
- Localización en español

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

Desarrollado con ❤️ para la gestión médica moderna.

---

## 🔧 Scripts disponibles

- `npm start`: Inicia el servidor de desarrollo de Expo
- `npm run android`: Ejecuta en emulador/dispositivo Android
- `npm run ios`: Ejecuta en simulador/dispositivo iOS
- `npm run web`: Ejecuta en navegador web
- `npm run eject`: Eyecta de Expo (no recomendado)

Frontend de la aplicación MedicApp desarrollado con React Native y Expo, compatible con Web, Android e iOS.

## 🚀 Características

- **Multiplataforma**: Funciona en Web, Android e iOS
- **React Native + Expo**: Desarrollo rápido y eficiente
- **Navegación**: React Navigation v6
- **Autenticación**: Context API con AsyncStorage
- **Diseño**: Sistema de diseño personalizado con temas consistentes
- **API**: Integración con backend Node.js/Express

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Header.js
│   └── PrescriptionItem.js
├── constants/           # Constantes de la app
│   └── theme.js        # Colores, fuentes, tamaños
├── context/            # Context providers
│   └── AuthContext.js  # Manejo de autenticación
├── navigation/         # Navegación de la app
│   └── AppNavigator.js # Navegador principal
├── screens/            # Pantallas de la app
│   ├── LoginScreen.js
│   └── PatientDashboard.js
├── services/           # Servicios de API
│   └── api.js         # Cliente HTTP
└── utils/             # Utilidades generales
```

## 🛠️ Instalación y Configuración

### Prerrequisitos

- Node.js (v16 o superior)
- npm o yarn
- Expo CLI: `npm install -g @expo/cli`

### Instalación

1. **Clonar el repositorio** (si no existe aún):
   ```bash
   git clone <repository-url>
   cd medicapp-frontend
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   - Edita `src/services/api.js` para configurar la URL de tu backend
   - Cambia `API_BASE_URL` según tu entorno

### Ejecución

#### Desarrollo Web
```bash
npm run web
```

#### Desarrollo Android
```bash
npm run android
```

#### Desarrollo iOS (solo en macOS)
```bash
npm run ios
```

#### Desarrollo Universal
```bash
npm start
```

## 🏗️ Arquitectura

### Autenticación
- Utiliza Context API para manejo global de estado
- Token JWT almacenado en AsyncStorage
- Navegación condicional basada en estado de autenticación

### Navegación
- Stack Navigator para flujo de autenticación
- Tab Navigator para pantallas principales
- Navegación diferenciada por roles de usuario:
  - **Paciente**: Dashboard, Recetas, Perfil
  - **Médico**: Dashboard, Pacientes, Recetas
  - **Admin**: Dashboard, Gestión de usuarios

### Temas y Diseño
- Sistema de diseño centralizado en `constants/theme.js`
- Colores, tipografías y espaciados consistentes
- Componentes reutilizables con props configurables

## 📱 Pantallas Implementadas

### ✅ Completadas
- **LoginScreen**: Autenticación de usuarios
- **PatientDashboard**: Panel principal para pacientes

### 🚧 Por Implementar
- **RegisterScreen**: Registro de nuevos usuarios
- **PrescriptionListScreen**: Lista de recetas
- **PrescriptionDetailScreen**: Detalle de receta
- **ProfileScreen**: Perfil de usuario
- **DoctorDashboard**: Panel para médicos
- **AdminDashboard**: Panel para administradores

## 🔧 Dependencias Principales

```json
{
  "expo": "~53.0.20",
  "react": "19.0.0",
  "react-native": "0.79.5",
  "react-native-web": "^0.21.0",
  "react-dom": "^19.1.1",
  "@react-navigation/native": "^6.x",
  "@react-navigation/stack": "^6.x",
  "@react-navigation/bottom-tabs": "^6.x",
  "react-native-screens": "^3.x",
  "react-native-safe-area-context": "^4.x",
  "@react-native-async-storage/async-storage": "^1.x"
}
```

## 🌐 Configuración de Backend

Asegúrate de que tu backend esté ejecutándose y sea accesible:

- **Desarrollo**: `http://localhost:3000/api`
- **Producción**: Configura la URL en `src/services/api.js`

## 📝 Scripts Disponibles

- `npm start`: Inicia el servidor de desarrollo
- `npm run android`: Ejecuta en Android
- `npm run ios`: Ejecuta en iOS
- `npm run web`: Ejecuta en navegador web

## 🔐 Roles de Usuario

La aplicación soporta diferentes roles:

1. **Paciente**: 
   - Ver recetas activas
   - Registrar tomas de medicamentos
   - Ver historial médico

2. **Médico/Profesional**:
   - Gestionar pacientes
   - Crear y editar recetas
   - Ver adherencia de pacientes

3. **Admin**:
   - Gestión de usuarios
   - Carga masiva de datos
   - Reportes del sistema

## 🚀 Próximos Pasos

1. **Implementar pantallas faltantes**
2. **Añadir notificaciones push**
3. **Implementar modo offline**
4. **Añadir tests unitarios**
5. **Optimizar rendimiento**
6. **Añadir internacionalización**

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

**MedicApp** - Gestión inteligente de medicación 💊

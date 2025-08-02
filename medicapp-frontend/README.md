# MedicApp Frontend

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

# Logger de MedicApp - Guía de Uso

El logger personalizado de MedicApp está ubicado en `utils/logger.js` y puede ser utilizado en cualquier parte de la aplicación.

## Importación

```javascript
const logger = require('../utils/logger');
```

## Métodos Disponibles

### Métodos Básicos

```javascript
// Logs informativos
logger.info('Usuario autenticado correctamente');

// Logs de error
logger.error('Error al conectar con la base de datos');

// Logs de advertencia
logger.warn('Token de autenticación próximo a expirar');

// Logs de debug (para desarrollo)
logger.debug('Variable X tiene valor: ' + variableX);
```

### Métodos Especializados

```javascript
// Iniciar una operación
logger.startOperation('Autenticación de usuario', { 
  email: 'usuario@email.com',
  ip: '192.168.1.1' 
});

// Finalizar una operación exitosamente
logger.endOperation('Autenticación de usuario', {
  user_id: 123,
  role: 'admin'
});

// Error en una operación
logger.operationError('Autenticación de usuario', new Error('Credenciales inválidas'));

// Procesar elementos
logger.processItem('usuario', 'user123', 'creado', { email: 'test@test.com' });
logger.processItem('receta', 'REC001', 'actualizada');

// Resumen con estadísticas
logger.summary('Procesamiento nocturno', {
  'Usuarios procesados': 150,
  'Errores encontrados': 2,
  'Tiempo total': '5 minutos'
});
```

## Ejemplos de Uso en Diferentes Contextos

### En un Controlador de Autenticación

```javascript
const logger = require('../utils/logger');

const login = async (req, res) => {
  logger.startOperation('Login de usuario', { email: req.body.email });
  
  try {
    const user = await User.findOne({ email: req.body.email });
    
    if (!user) {
      logger.error('Usuario no encontrado: ' + req.body.email);
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    logger.info('Usuario autenticado exitosamente: ' + user.email);
    logger.endOperation('Login de usuario', { user_id: user.id });
    
    res.json({ success: true, user: user });
  } catch (error) {
    logger.operationError('Login de usuario', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
```

### En un Servicio

```javascript
const logger = require('../utils/logger');

const medicationService = {
  createMedication: async (medicationData) => {
    logger.startOperation('Creación de medicamento', { codigo: medicationData.codigo });
    
    try {
      const medication = await Medication.create(medicationData);
      logger.processItem('medicamento', medication.codigo, 'creado exitosamente');
      logger.endOperation('Creación de medicamento', { id: medication.id });
      
      return medication;
    } catch (error) {
      logger.operationError('Creación de medicamento', error);
      throw error;
    }
  }
};
```

### En Middleware

```javascript
const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
  logger.debug('Verificando autenticación para ruta: ' + req.path);
  
  const token = req.headers.authorization;
  
  if (!token) {
    logger.warn('Intento de acceso sin token a ruta protegida: ' + req.path);
    return res.status(401).json({ message: 'Token requerido' });
  }
  
  // Verificar token...
  logger.info('Token válido para usuario: ' + decoded.userId);
  next();
};
```

## Estructura de Archivos de Log

```
medicapp-backend/
└── log-medicapp/
    ├── medicapp-2025-08-02.log
    ├── medicapp-2025-08-03.log
    └── medicapp-2025-08-04.log
```

## Formato de Logs

```
[02/08/2025 14:30:15] [INFO] >>> INICIANDO: Procesamiento de archivo CSV de recetas
[02/08/2025 14:30:15] [INFO] Archivo CSV válido recibido: recetas.csv (1024 bytes)
[02/08/2025 14:30:16] [INFO] Procesando paciente 12345678: creado - {"nombre":"Juan Pérez"}
[02/08/2025 14:30:17] [ERROR] XXX ERROR EN: Validación de datos - Campo requerido faltante
[02/08/2025 14:30:18] [INFO] <<< FINALIZADO: Procesamiento de archivo CSV de recetas - {"recetas_agregadas":5}
```

## Ventajas del Logger Centralizado

1. **Consistencia**: Todos los logs tienen el mismo formato
2. **Organización**: Archivos separados por día
3. **Reutilización**: Un solo logger para toda la aplicación
4. **Mantenimiento**: Fácil modificar el comportamiento de logging
5. **Debugging**: Logs estructurados facilitan la búsqueda de problemas
6. **Monitoreo**: Fácil seguimiento de operaciones y estadísticas

## Configuración Futura

El logger puede ser extendido fácilmente para:
- Diferentes niveles de log según el ambiente (desarrollo/producción)
- Rotación automática de archivos por tamaño
- Envío de logs críticos por email
- Integración con servicios de monitoreo externos

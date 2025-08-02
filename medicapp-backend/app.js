require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize, createDatabaseIfNotExists } = require('./config/database');
const logger = require('./utils/logger');

const app = express();

// Configurar CORS para permitir conexiones desde cualquier origen
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Importar rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/prescriptions', require('./routes/prescription.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/intakes', require('./routes/medicationIntake.routes'));

// Corregir importación y uso de rutas de carga
const uploadRoutes = require('./routes/upload.routes');
app.use('/api/upload', uploadRoutes);

// Ruta de prueba mejorada con información sobre el servidor
app.get('/api/health', (req, res) => {
  const networkInterfaces = require('os').networkInterfaces();
  const addresses = [];
  
  // Obtener todas las direcciones IP del servidor
  Object.keys(networkInterfaces).forEach(interfaceName => {
    networkInterfaces[interfaceName].forEach(interface => {
      // Filtrar direcciones IPv4 y no internas
      if (interface.family === 'IPv4' && !interface.internal) {
        addresses.push(interface.address);
      }
    });
  });
  
  res.json({ 
    status: 'OK', 
    message: 'MedicApp Backend funcionando correctamente',
    timestamp: new Date().toISOString(),
    serverIp: addresses,
    serverPort: process.env.PORT || 4000,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta para verificar autenticación
app.get('/api/check-auth', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      authenticated: false, 
      message: 'No se proporcionó token de autenticación' 
    });
  }
  
  res.json({ 
    authenticated: true, 
    message: 'Token de autenticación recibido',
    token: authHeader.split(' ')[1]?.substring(0, 10) + '...' // Mostrar solo primeros 10 caracteres por seguridad
  });
});

// Función para inicializar la aplicación
const initializeApp = async () => {
  try {
    console.log('Iniciando MedicApp Backend...');
    logger.info('Iniciando MedicApp Backend...');
    
    // Crear directorio de uploads si no existe
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      logger.info('Directorio uploads creado');
    } else {
      logger.info('Directorio uploads ya existe');
    }
    
    // Crear base de datos si no existe
    await createDatabaseIfNotExists();
    
    // Verificar que sequelize esté definido
    if (!sequelize) {
      throw new Error('Sequelize no está definido correctamente');
    }
    
    // Importar modelos después de que la base de datos exista
    require('./models');
    
    // Sincronizar modelos
    await sequelize.sync({ force: false });
    console.log('Base de datos sincronizada');
    logger.info('Base de datos sincronizada correctamente');
    
    // Iniciar servidor en todas las interfaces de red (0.0.0.0)
    const PORT = process.env.PORT || 4000;
    const HOST = process.env.HOST || '0.0.0.0';
    
    app.listen(PORT, HOST, () => {
      console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
      console.log('🚀 MedicApp Backend iniciado correctamente');
      logger.info(`Servidor corriendo en http://${HOST}:${PORT}`);
      logger.info('🚀 MedicApp Backend iniciado correctamente');
      
      // Mostrar las IPs del servidor para facilitar la conexión desde dispositivos móviles
      const networkInterfaces = require('os').networkInterfaces();
      console.log('\n📱 Direcciones para conectar desde dispositivos móviles:');
      
      Object.keys(networkInterfaces).forEach(interfaceName => {
        networkInterfaces[interfaceName].forEach(interface => {
          if (interface.family === 'IPv4' && !interface.internal) {
            console.log(`  - http://${interface.address}:${PORT}`);
          }
        });
      });
      
      console.log('\n📋 Rutas disponibles:');
      
      // Rutas de salud y prueba
      console.log('\n🔍 Diagnóstico:');
      console.log('  - GET  /api/health                         # Verificar estado del servidor');
      
      // Rutas de autenticación
      console.log('\n🔐 Autenticación:');
      console.log('  - POST /api/auth/register                  # Registrar nuevo usuario');
      console.log('  - POST /api/auth/login                     # Iniciar sesión');

      // Rutas de prescripciones (CRUD completo)
      console.log('\n💊 Prescripciones (Recetas):');
      console.log('  - POST /api/prescriptions                  # Crear nueva receta');
      console.log('  - GET  /api/prescriptions/:id              # Obtener receta por ID');
      console.log('  - PUT  /api/prescriptions/:id              # Actualizar receta existente');
      console.log('  - DELETE /api/prescriptions/:id            # Eliminar receta');
      console.log('  - GET  /api/prescriptions/my-prescriptions # Obtener recetas del paciente');
      console.log('  - GET  /api/prescriptions/pending          # Obtener medicamentos pendientes');
      console.log('  - GET  /api/prescriptions/stats            # Obtener estadísticas del paciente');
      console.log('  - GET  /api/prescriptions/history/:patientId # Ver historial de medicamentos');
      console.log('  - GET  /api/prescriptions/prescriptions-mark-taken # Obtener y marcar recetas');
      console.log('  - POST /api/prescriptions/mark-taken       # Marcar medicamento como tomado');

      // Rutas de items de prescripción
      console.log('\n💉 Items de Prescripción:');
      console.log('  - POST /api/prescriptions/items            # Crear nuevo item en receta');
      console.log('  - PUT  /api/prescriptions/items/:id        # Actualizar item de receta');
      console.log('  - DELETE /api/prescriptions/items/:id      # Eliminar item de receta');

      // Rutas de administración
      console.log('\n⚙️ Administración:');
      console.log('  - GET  /api/admin/users                    # Listar usuarios (administradores)');
      console.log('  - GET  /api/admin/users/:id                # Obtener usuario por ID (administradores)');
      console.log('  - GET  /api/admin/patients                 # Buscar pacientes (administradores)');
      console.log('  - GET  /api/admin/prescriptions            # Listar recetas (administradores)');
      console.log('  - GET  /api/admin/stats                    # Obtener estadísticas (administradores)');

      console.log('\n📚 Documentación completa disponible en: /api-docs');
    });
  } catch (error) {
    console.error('Error inicializando aplicación:', error);
    logger.error(`Error inicializando aplicación: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    process.exit(1);
  }
};

// Inicializar la aplicación
initializeApp();
// Inicializar la aplicación
initializeApp();

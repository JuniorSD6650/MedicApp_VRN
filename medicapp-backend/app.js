require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize, createDatabaseIfNotExists } = require('./config/database');

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/prescriptions', require('./routes/prescription.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MedicApp Backend funcionando correctamente' });
});

// Función para inicializar la aplicación
const initializeApp = async () => {
  try {
    console.log('Iniciando MedicApp Backend...');
    
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
    
    // Iniciar servidor
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log('🚀 MedicApp Backend iniciado correctamente');
      console.log('📋 Rutas disponibles:');
      
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
      console.log('  - POST /api/upload                         # Subir datos (administradores)');
      console.log('  - GET  /api/admin/users                    # Listar usuarios (administradores)');
      
      console.log('\n📚 Documentación completa disponible en: /api-docs');
      console.log('📱 Cliente frontend en: http://localhost:3000');
    });
  } catch (error) {
    console.error('Error inicializando aplicación:', error);
    process.exit(1);
  }
};

// Inicializar la aplicación
initializeApp();

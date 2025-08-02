const express = require('express');
const {
  getAllPrescriptions,
  getSystemStats,
  searchPatients,
  listUsers,
  getUserById
} = require('../controllers/admin.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware de registro para todas las rutas administrativas
router.use((req, res, next) => {
  logger.debug(`Acceso a ruta administrativa: ${req.method} ${req.originalUrl}`, 'AdminRoutes');
  next();
});

// Todas las rutas requieren autenticación y rol admin
router.use(verifyToken, requireAdmin);

// Obtener todas las recetas
router.get('/prescriptions', (req, res, next) => {
  logger.info('Acceso a listado de recetas administrativo', 'AdminRoutes');
  next();
}, getAllPrescriptions);

// Obtener estadísticas del sistema
router.get('/stats', (req, res, next) => {
  logger.info('Acceso a estadísticas del sistema', 'AdminRoutes');
  next();
}, getSystemStats);

// Buscar pacientes
router.get('/patients', (req, res, next) => {
  logger.info(`Búsqueda administrativa de pacientes: ${req.query.search || 'todos'}`, 'AdminRoutes');
  next();
}, searchPatients);

// Listar usuarios con paginación y filtrado
router.get('/users', (req, res, next) => {
  logger.info(`Listado administrativo de usuarios. Filtros: ${JSON.stringify(req.query)}`, 'AdminRoutes');
  next();
}, listUsers);

// Obtener un usuario específico por ID
router.get('/users/:id', (req, res, next) => {
  logger.info(`Acceso a información de usuario específico. ID: ${req.params.id}`, 'AdminRoutes');
  next();
}, getUserById);

// Ruta de prueba para verificar acceso de administrador
router.get('/dashboard', (req, res) => {
  logger.info(`Acceso a dashboard de administración por usuario ID=${req.user.id}`, 'AdminRoutes');
  res.json({ 
    success: true, 
    message: 'Acceso a panel de administración concedido',
    user: req.user
  });
});

module.exports = router;

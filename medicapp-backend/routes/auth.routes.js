const express = require('express');
const { register, login, getMe } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth'); // Asegúrate de importar verifyToken
const logger = require('../utils/logger');

const router = express.Router();

// Middleware de registro para todas las rutas de autenticación
router.use((req, res, next) => {
  logger.debug(`Acceso a ruta de autenticación: ${req.method} ${req.originalUrl}`, 'AuthRoutes');
  next();
});

router.post('/register', (req, res, next) => {
  logger.info(`Intento de registro para: ${req.body.email}, rol: ${req.body.rol || 'paciente'}`, 'AuthRoutes');
  next();
}, register);

router.post('/login', (req, res, next) => {
  logger.info(`Intento de login para: ${req.body.email}`, 'AuthRoutes');
  next();
}, login);

router.get('/me', (req, res, next) => {
  logger.debug('Middleware inicial para /me ejecutado', 'AuthRoutes');
  next();
}, verifyToken, (req, res, next) => {
  logger.debug('Middleware verifyToken ejecutado correctamente', 'AuthRoutes');
  next();
}, getMe); // Verifica que verifyToken y getMe estén conectados correctamente

module.exports = router;
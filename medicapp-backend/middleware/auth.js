const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const verifyToken = (req, res, next) => {
  logger.debug(`Verificando token para ruta: ${req.method} ${req.originalUrl}`, 'AuthMiddleware');
  
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    logger.warn(`Acceso denegado - Token no proporcionado para ruta: ${req.method} ${req.originalUrl}`, 'AuthMiddleware');
    return res.status(401).json({ message: 'Token de acceso requerido' });
  }

  try {
    logger.debug(`Token recibido: ${token.substring(0, 10)}...`, 'AuthMiddleware');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Adjuntar el usuario decodificado a la solicitud
    logger.info(`Token verificado correctamente. Usuario ID=${decoded.id}, Rol=${decoded.rol}`, 'AuthMiddleware');
    next();
  } catch (error) {
    logger.error(`Token inválido: ${error.message}`, 'AuthMiddleware');
    res.status(401).json({ message: 'Token inválido' });
  }
};

const requireAdmin = (req, res, next) => {
  logger.debug(`Verificando rol de administrador para usuario ID=${req.user.id}`, 'AuthMiddleware');
  
  if (req.user && req.user.rol === 'admin') {
    logger.info(`Acceso de administrador concedido a usuario ID=${req.user.id} para ruta: ${req.method} ${req.originalUrl}`, 'AuthMiddleware');
    next();
  } else {
    logger.warn(`Acceso denegado - Usuario ID=${req.user.id} con rol ${req.user.rol} intentó acceder a ruta de administrador: ${req.method} ${req.originalUrl}`, 'AuthMiddleware');
    res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador' });
  }
};

const requirePatient = (req, res, next) => {
  logger.debug(`Verificando rol de paciente para usuario ID=${req.user.id}`, 'AuthMiddleware');
  
  if (req.user && req.user.rol === 'paciente') {
    logger.info(`Acceso de paciente concedido a usuario ID=${req.user.id} para ruta: ${req.method} ${req.originalUrl}`, 'AuthMiddleware');
    next();
  } else {
    logger.warn(`Acceso denegado - Usuario ID=${req.user.id} con rol ${req.user.rol} intentó acceder a ruta de paciente: ${req.method} ${req.originalUrl}`, 'AuthMiddleware');
    res.status(403).json({ message: 'Acceso denegado. Se requiere rol de paciente' });
  }
};

// Agregar middleware para médicos
const requireMedico = (req, res, next) => {
  logger.debug(`Verificando rol de médico para usuario ID=${req.user.id}`, 'AuthMiddleware');
  
  if (req.user && req.user.rol === 'medico') {
    logger.info(`Acceso de médico concedido a usuario ID=${req.user.id} para ruta: ${req.method} ${req.originalUrl}`, 'AuthMiddleware');
    next();
  } else {
    logger.warn(`Acceso denegado - Usuario ID=${req.user.id} con rol ${req.user.rol} intentó acceder a ruta de médico: ${req.method} ${req.originalUrl}`, 'AuthMiddleware');
    res.status(403).json({ message: 'Acceso denegado. Se requiere rol de médico' });
  }
};

module.exports = { verifyToken, requireAdmin, requirePatient, requireMedico };

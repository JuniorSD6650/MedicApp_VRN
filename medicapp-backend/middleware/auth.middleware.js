const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('Acceso denegado: No se proporcionó un token.');
    return res.status(401).json({ message: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Adjuntar el usuario decodificado a la solicitud
    logger.info(`Token verificado correctamente. Usuario ID=${decoded.id}, Rol=${decoded.rol}`);
    next();
  } catch (error) {
    logger.error(`Token inválido: ${error.message}`);
    res.status(403).json({ message: 'Token inválido' });
  }
};

module.exports = { authenticateToken };

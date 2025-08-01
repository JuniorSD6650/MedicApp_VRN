const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.rol === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador' });
  }
};

const requirePatient = (req, res, next) => {
  if (req.user && req.user.rol === 'paciente') {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado. Se requiere rol de paciente' });
  }
};

module.exports = { verifyToken, requireAdmin, requirePatient };

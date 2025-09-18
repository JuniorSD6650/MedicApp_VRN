const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

const register = async (req, res) => {
  logger.startOperation('Registro de usuario', { email: req.body.email, rol: req.body.rol || 'paciente' }, 'AuthController');
  try {
    const { nombre, email, password, rol } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      logger.warn(`Intento de registro con email ya existente: ${email}`, 'AuthController');
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Crear usuario - No hashear la contraseña aquí, el modelo lo hará automáticamente
    const user = await User.create({
      nombre,
      email,
      password_hash: password, // El hook beforeCreate en el modelo User se encargará de hashear
      rol: rol || 'paciente'
    });

    logger.info(`Usuario creado exitosamente: ID=${user.id}, Email=${email}, Rol=${user.rol}`, 'AuthController');

    // Generar token
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol, dni: user.dni || '' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.endOperation('Registro de usuario', { 
      userId: user.id, 
      rol: user.rol 
    }, 'AuthController');

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    logger.operationError('Registro de usuario', error, 'AuthController');
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

const login = async (req, res) => {
  logger.startOperation('Login de usuario', { email: req.body.email }, 'AuthController');
  try {
    const { email, password } = req.body;

    console.log(`Intento de login para: ${email}`);

    // Buscar usuario
    const user = await User.findOne({ where: { email } });
    if (!user) {
      logger.warn(`Intento de login fallido - Usuario no encontrado: ${email}`, 'AuthController');
      console.log(`Usuario no encontrado: ${email}`);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar contraseña usando el método del modelo
    const isValidPassword = await user.checkPassword(password);
    if (!isValidPassword) {
      logger.warn(`Intento de login fallido - Contraseña incorrecta para: ${email}`, 'AuthController');
      console.log(`Contraseña incorrecta para: ${email}`);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    logger.info(`Login exitoso para usuario: ID=${user.id}, Email=${email}, Rol=${user.rol}`, 'AuthController');
    console.log(`Login exitoso para: ${email}, rol: ${user.rol}, dni: ${user.dni || 'no disponible'}`);

    // Generar token incluyendo el DNI
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol, dni: user.dni || '' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.endOperation('Login de usuario', { 
      userId: user.id, 
      rol: user.rol 
    }, 'AuthController');

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        dni: user.dni
      }
    });
  } catch (error) {
    logger.operationError('Login de usuario', error, 'AuthController');
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

const getMe = async (req, res) => {
  logger.startOperation('Obtener información del usuario autenticado', { userId: req.user.id }, 'AuthController');
  try {
    logger.debug(`Buscando usuario con ID=${req.user.id}`, 'AuthController');
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] } // Excluir el hash de la contraseña
    });

    if (!user) {
      logger.warn(`Usuario no encontrado: ID=${req.user.id}`, 'AuthController');
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    logger.info(`Información del usuario obtenida: ID=${user.id}, Email=${user.email}`, 'AuthController');
    res.json({ user });
  } catch (error) {
    logger.operationError('Obtener información del usuario autenticado', error, 'AuthController');
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  } finally {
    logger.endOperation('Obtener información del usuario autenticado', { userId: req.user.id }, 'AuthController');
  }
};

module.exports = { register, login, getMe };

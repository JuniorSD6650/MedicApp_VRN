const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const register = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Crear usuario - No hashear la contraseña aquí, el modelo lo hará automáticamente
    const user = await User.create({
      nombre,
      email,
      password_hash: password, // El hook beforeCreate en el modelo User se encargará de hashear
      rol: rol || 'paciente'
    });

    // Generar token
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol, dni: user.dni || '' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

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
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`Intento de login para: ${email}`);

    // Buscar usuario
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log(`Usuario no encontrado: ${email}`);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar contraseña usando el método del modelo
    const isValidPassword = await user.checkPassword(password);
    if (!isValidPassword) {
      console.log(`Contraseña incorrecta para: ${email}`);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    console.log(`Login exitoso para: ${email}, rol: ${user.rol}`);

    // Generar token
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol, dni: user.dni || '' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

module.exports = { register, login };

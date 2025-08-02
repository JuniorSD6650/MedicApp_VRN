const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rol: {
    type: DataTypes.ENUM('admin', 'medico', 'paciente'), // Eliminado 'profesional'
    allowNull: false,
    defaultValue: 'paciente'
  },
  dni: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeValidate: async (user) => {
      logger.debug(`Validando usuario con email: ${user.email}`, 'UserModel');
    },
    beforeCreate: async (user) => {
      logger.startOperation('Creación de usuario', { email: user.email, rol: user.rol }, 'UserModel');
      if (user.password_hash) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
        logger.debug('Contraseña hasheada correctamente', 'UserModel');
      }
    },
    afterCreate: async (user) => {
      logger.info(`Usuario creado: ID=${user.id}, Email=${user.email}, Rol=${user.rol}`, 'UserModel');
      logger.endOperation('Creación de usuario', { id: user.id, rol: user.rol }, 'UserModel');
    },
    beforeUpdate: async (user) => {
      logger.startOperation('Actualización de usuario', { id: user.id, email: user.email }, 'UserModel');
    },
    afterUpdate: async (user) => {
      logger.info(`Usuario actualizado: ID=${user.id}, Email=${user.email}`, 'UserModel');
      logger.endOperation('Actualización de usuario', { id: user.id }, 'UserModel');
    },
    beforeDestroy: async (user) => {
      logger.warn(`Eliminando usuario: ID=${user.id}, Email=${user.email}`, 'UserModel');
    }
  }
});

// Método para verificar contraseña
User.prototype.checkPassword = async function(password) {
  const isValid = await bcrypt.compare(password, this.password_hash);
  logger.debug(`Verificación de contraseña para usuario ID=${this.id}: ${isValid ? 'correcta' : 'incorrecta'}`, 'UserModel');
  return isValid;
};

module.exports = User;

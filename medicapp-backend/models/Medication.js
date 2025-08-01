const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Medication = sequelize.define('Medication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  unidad: {
    type: DataTypes.STRING
  },
  duracion: {
    type: DataTypes.STRING
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2)
  }
}, {
  tableName: 'medications',
  timestamps: true
});

module.exports = Medication;

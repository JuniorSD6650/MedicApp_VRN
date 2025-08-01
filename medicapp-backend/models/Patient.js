const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dni: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  nombre_completo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sexo: {
    type: DataTypes.STRING
  },
  edad_anios: {
    type: DataTypes.INTEGER
  },
  edad_meses: {
    type: DataTypes.INTEGER
  },
  edad_dias: {
    type: DataTypes.INTEGER
  },
  tipo_seguro: {
    type: DataTypes.STRING
  },
  tipo_paciente: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'patients',
  timestamps: true
});

module.exports = Patient;

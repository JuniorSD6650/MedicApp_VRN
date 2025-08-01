const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Prescription = sequelize.define('Prescription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false
  },
  num_receta: {
    type: DataTypes.STRING,
    allowNull: false
  },
  paciente_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'patients',
      key: 'id'
    }
  },
  profesional_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'professionals',
      key: 'id'
    }
  }
}, {
  tableName: 'prescriptions',
  timestamps: true
});

module.exports = Prescription;

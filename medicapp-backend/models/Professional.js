const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Professional = sequelize.define('Professional', {
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
  cmp: {
    type: DataTypes.STRING
  },
  nombres: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apellidos: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'professionals',
  timestamps: true
});

module.exports = Professional;

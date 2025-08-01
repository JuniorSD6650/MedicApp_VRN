const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PrescriptionItem = sequelize.define('PrescriptionItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  receta_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'prescriptions',
      key: 'id'
    }
  },
  medicamento_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'medications',
      key: 'id'
    }
  },
  cantidad_solicitada: {
    type: DataTypes.INTEGER
  },
  cantidad_dispensada: {
    type: DataTypes.INTEGER
  },
  fecha_despacho: {
    type: DataTypes.DATE
  },
  hora_despacho: {
    type: DataTypes.TIME
  },
  dx_codigo: {
    type: DataTypes.STRING
  },
  dx_descripcion: {
    type: DataTypes.TEXT
  },
  tomado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'prescription_items',
  timestamps: true
});

PrescriptionItem.prototype.calculateNextTake = function () {
  const dispatchDate = new Date(this.fecha_despacho);
  const interval = this.duracion ? parseInt(this.duracion) : 24; // Intervalo en horas
  return new Date(dispatchDate.getTime() + interval * 60 * 60 * 1000);
};

module.exports = PrescriptionItem;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

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
  timestamps: true,
  hooks: {
    beforeValidate: async (item) => {
      logger.debug(`Validando datos de item de receta: Receta ID=${item.receta_id}, Medicamento ID=${item.medicamento_id}`, 'PrescriptionItemModel');
    },
    beforeCreate: async (item) => {
      logger.startOperation('Creación de item de receta', { 
        receta_id: item.receta_id,
        medicamento_id: item.medicamento_id,
        cantidad: item.cantidad_solicitada
      }, 'PrescriptionItemModel');
    },
    afterCreate: async (item) => {
      logger.info(`Item de receta creado: ID=${item.id}, Receta ID=${item.receta_id}, Medicamento ID=${item.medicamento_id}`, 'PrescriptionItemModel');
      logger.endOperation('Creación de item de receta', { id: item.id }, 'PrescriptionItemModel');
    },
    beforeUpdate: async (item) => {
      logger.startOperation('Actualización de item de receta', { id: item.id }, 'PrescriptionItemModel');
    },
    afterUpdate: async (item) => {
      logger.info(`Item de receta actualizado: ID=${item.id}, Tomado=${item.tomado}`, 'PrescriptionItemModel');
      logger.endOperation('Actualización de item de receta', { id: item.id }, 'PrescriptionItemModel');
    },
    beforeDestroy: async (item) => {
      logger.warn(`Eliminando item de receta: ID=${item.id}, Receta ID=${item.receta_id}`, 'PrescriptionItemModel');
    }
  }
});

PrescriptionItem.prototype.calculateNextTake = function () {
  logger.debug(`Calculando próxima toma para item ID=${this.id}`, 'PrescriptionItemModel');
  const dispatchDate = new Date(this.fecha_despacho);
  const interval = this.duracion ? parseInt(this.duracion) : 24; // Intervalo en horas
  return new Date(dispatchDate.getTime() + interval * 60 * 60 * 1000);
};

module.exports = PrescriptionItem;

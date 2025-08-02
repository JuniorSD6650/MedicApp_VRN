const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

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
  timestamps: true,
  hooks: {
    beforeValidate: async (medication) => {
      logger.debug(`Validando datos de medicamento: ${medication.codigo} - ${medication.descripcion}`, 'MedicationModel');
    },
    beforeCreate: async (medication) => {
      logger.startOperation('Creación de medicamento', { 
        codigo: medication.codigo,
        descripcion: medication.descripcion.substring(0, 50) + (medication.descripcion.length > 50 ? '...' : '')
      }, 'MedicationModel');
    },
    afterCreate: async (medication) => {
      logger.info(`Medicamento creado: ID=${medication.id}, Código=${medication.codigo}`, 'MedicationModel');
      logger.endOperation('Creación de medicamento', { id: medication.id }, 'MedicationModel');
    },
    beforeUpdate: async (medication) => {
      logger.startOperation('Actualización de medicamento', { id: medication.id }, 'MedicationModel');
    },
    afterUpdate: async (medication) => {
      logger.info(`Medicamento actualizado: ID=${medication.id}, Código=${medication.codigo}`, 'MedicationModel');
      logger.endOperation('Actualización de medicamento', { id: medication.id }, 'MedicationModel');
    },
    beforeDestroy: async (medication) => {
      logger.warn(`Eliminando medicamento: ID=${medication.id}, Código=${medication.codigo}`, 'MedicationModel');
    }
  }
});

module.exports = Medication;

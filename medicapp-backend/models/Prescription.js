const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

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
  timestamps: true,
  hooks: {
    beforeValidate: async (prescription) => {
      logger.debug(`Validando datos de receta: ${prescription.num_receta}`, 'PrescriptionModel');
    },
    beforeCreate: async (prescription) => {
      logger.startOperation('Creación de receta', { 
        num_receta: prescription.num_receta,
        paciente_id: prescription.paciente_id,
        profesional_id: prescription.profesional_id
      }, 'PrescriptionModel');
    },
    afterCreate: async (prescription) => {
      logger.info(`Receta creada: ID=${prescription.id}, Número=${prescription.num_receta}, Paciente ID=${prescription.paciente_id}`, 'PrescriptionModel');
      logger.endOperation('Creación de receta', { id: prescription.id }, 'PrescriptionModel');
    },
    beforeUpdate: async (prescription) => {
      logger.startOperation('Actualización de receta', { id: prescription.id }, 'PrescriptionModel');
    },
    afterUpdate: async (prescription) => {
      logger.info(`Receta actualizada: ID=${prescription.id}, Número=${prescription.num_receta}`, 'PrescriptionModel');
      logger.endOperation('Actualización de receta', { id: prescription.id }, 'PrescriptionModel');
    },
    beforeDestroy: async (prescription) => {
      logger.warn(`Eliminando receta: ID=${prescription.id}, Número=${prescription.num_receta}`, 'PrescriptionModel');
    }
  }
});

module.exports = Prescription;

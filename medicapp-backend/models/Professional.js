const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

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
  timestamps: true,
  hooks: {
    beforeValidate: async (professional) => {
      logger.debug(`Validando datos de profesional: ${professional.nombres} ${professional.apellidos}`, 'ProfessionalModel');
    },
    beforeCreate: async (professional) => {
      logger.startOperation('Creación de profesional', { 
        dni: professional.dni,
        cmp: professional.cmp || 'No especificado'
      }, 'ProfessionalModel');
    },
    afterCreate: async (professional) => {
      logger.info(`Profesional creado: ID=${professional.id}, DNI=${professional.dni}, CMP=${professional.cmp || 'No especificado'}`, 'ProfessionalModel');
      logger.endOperation('Creación de profesional', { id: professional.id }, 'ProfessionalModel');
    },
    beforeUpdate: async (professional) => {
      logger.startOperation('Actualización de profesional', { id: professional.id }, 'ProfessionalModel');
    },
    afterUpdate: async (professional) => {
      logger.info(`Profesional actualizado: ID=${professional.id}`, 'ProfessionalModel');
      logger.endOperation('Actualización de profesional', { id: professional.id }, 'ProfessionalModel');
    },
    beforeDestroy: async (professional) => {
      logger.warn(`Eliminando profesional: ID=${professional.id}, DNI=${professional.dni}`, 'ProfessionalModel');
    }
  }
});

module.exports = Professional;

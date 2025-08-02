const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

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
  timestamps: true,
  hooks: {
    beforeValidate: async (patient) => {
      logger.debug(`Validando datos de paciente: ${patient.nombre_completo}`, 'PatientModel');
    },
    beforeCreate: async (patient) => {
      logger.startOperation('Creación de paciente', { 
        dni: patient.dni,
        nombre: patient.nombre_completo
      }, 'PatientModel');
    },
    afterCreate: async (patient) => {
      logger.info(`Paciente creado: ID=${patient.id}, DNI=${patient.dni}, Nombre=${patient.nombre_completo}`, 'PatientModel');
      logger.endOperation('Creación de paciente', { id: patient.id }, 'PatientModel');
    },
    beforeUpdate: async (patient) => {
      logger.startOperation('Actualización de paciente', { id: patient.id }, 'PatientModel');
    },
    afterUpdate: async (patient) => {
      logger.info(`Paciente actualizado: ID=${patient.id}, Nombre=${patient.nombre_completo}`, 'PatientModel');
      logger.endOperation('Actualización de paciente', { id: patient.id }, 'PatientModel');
    },
    beforeDestroy: async (patient) => {
      logger.warn(`Eliminando paciente: ID=${patient.id}, DNI=${patient.dni}, Nombre=${patient.nombre_completo}`, 'PatientModel');
    }
  }
});

module.exports = Patient;

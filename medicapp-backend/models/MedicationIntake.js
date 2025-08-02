const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

const MedicationIntake = sequelize.define('MedicationIntake', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  prescription_item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'prescription_items',
      key: 'id'
    }
  },
  scheduled_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  taken: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  taken_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reminder_sent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'medication_intakes',
  timestamps: true,
  hooks: {
    beforeValidate: async (intake) => {
      logger.debug(`Validando datos de toma de medicamento: Item ID=${intake.prescription_item_id}`, 'MedicationIntakeModel');
    },
    beforeCreate: async (intake) => {
      logger.startOperation('Creación de toma programada', { 
        prescription_item_id: intake.prescription_item_id,
        scheduled_time: intake.scheduled_time
      }, 'MedicationIntakeModel');
    },
    afterCreate: async (intake) => {
      logger.info(`Toma programada creada: ID=${intake.id}, Item ID=${intake.prescription_item_id}, Programada para=${intake.scheduled_time}`, 'MedicationIntakeModel');
      logger.endOperation('Creación de toma programada', { id: intake.id }, 'MedicationIntakeModel');
    },
    beforeUpdate: async (intake) => {
      logger.startOperation('Actualización de toma', { id: intake.id }, 'MedicationIntakeModel');
    },
    afterUpdate: async (intake) => {
      if (intake.changed('taken') && intake.taken) {
        logger.info(`Medicamento tomado: Toma ID=${intake.id}, Hora=${intake.taken_time || new Date()}`, 'MedicationIntakeModel');
      } else if (intake.changed('reminder_sent') && intake.reminder_sent) {
        logger.info(`Recordatorio enviado: Toma ID=${intake.id}`, 'MedicationIntakeModel');
      }
      logger.endOperation('Actualización de toma', { id: intake.id, taken: intake.taken }, 'MedicationIntakeModel');
    },
    beforeDestroy: async (intake) => {
      logger.warn(`Eliminando toma programada: ID=${intake.id}, Item ID=${intake.prescription_item_id}`, 'MedicationIntakeModel');
    }
  }
});

module.exports = MedicationIntake;

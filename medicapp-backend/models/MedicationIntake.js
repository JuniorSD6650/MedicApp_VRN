const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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
  timestamps: true
});

module.exports = MedicationIntake;

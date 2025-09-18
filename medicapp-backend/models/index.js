const { sequelize } = require('../config/database');
const User = require('./User');
const Patient = require('./Patient');
const Professional = require('./Professional');
const Medication = require('./Medication');
const Prescription = require('./Prescription');
const PrescriptionItem = require('./PrescriptionItem');
const MedicationIntake = require('./MedicationIntake');
const logger = require('../utils/logger');

logger.info('Iniciando configuración de asociaciones entre modelos', 'Models');

// Definir asociaciones
Prescription.belongsTo(Patient, { foreignKey: 'paciente_id', as: 'paciente' });
Prescription.belongsTo(Professional, { foreignKey: 'profesional_id', as: 'profesional' });

PrescriptionItem.belongsTo(Prescription, { as: 'receta', foreignKey: 'receta_id' });
Prescription.hasMany(PrescriptionItem, { as: 'items', foreignKey: 'receta_id' });

PrescriptionItem.belongsTo(Medication, { as: 'medicamento', foreignKey: 'medicamento_id' });
Medication.hasMany(PrescriptionItem, { foreignKey: 'medicamento_id' });

MedicationIntake.belongsTo(PrescriptionItem, { as: 'prescription_item', foreignKey: 'prescription_item_id' });
PrescriptionItem.hasMany(MedicationIntake, { as: 'intakes', foreignKey: 'prescription_item_id' });

logger.info('Asociaciones entre modelos configuradas correctamente', 'Models');

module.exports = {
  sequelize,
  User,
  Patient,
  Professional,
  Medication,
  Prescription,
  PrescriptionItem,
  MedicationIntake
};
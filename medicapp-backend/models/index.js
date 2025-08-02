const { sequelize } = require('../config/database');
const User = require('./User');
const Patient = require('./Patient');
const Professional = require('./Professional');
const Medication = require('./Medication');
const Prescription = require('./Prescription');
const PrescriptionItem = require('./PrescriptionItem');
const MedicationIntake = require('./MedicationIntake');

// Definir asociaciones
Prescription.belongsTo(Patient, { foreignKey: 'paciente_id', as: 'paciente' });
Prescription.belongsTo(Professional, { foreignKey: 'profesional_id', as: 'profesional' });

PrescriptionItem.belongsTo(Prescription, { foreignKey: 'receta_id', as: 'receta' });
PrescriptionItem.belongsTo(Medication, { foreignKey: 'medicamento_id', as: 'medicamento' });

Prescription.hasMany(PrescriptionItem, { foreignKey: 'receta_id', as: 'items' });
Patient.hasMany(Prescription, { foreignKey: 'paciente_id', as: 'prescriptions' });
Professional.hasMany(Prescription, { foreignKey: 'profesional_id', as: 'prescriptions' });
Medication.hasMany(PrescriptionItem, { foreignKey: 'medicamento_id', as: 'prescriptionItems' });

// Relación entre PrescriptionItem y MedicationIntake
PrescriptionItem.hasMany(MedicationIntake, { 
  foreignKey: 'prescription_item_id', 
  as: 'intakes' 
});
MedicationIntake.belongsTo(PrescriptionItem, { 
  foreignKey: 'prescription_item_id', 
  as: 'prescription_item' 
});

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

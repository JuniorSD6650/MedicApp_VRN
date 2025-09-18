const { Prescription, PrescriptionItem, Medication, Patient, Professional, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class PrescriptionService {
  static async getPrescriptionsByStatus(userId, status) {
    try {
      logger.info(`Obteniendo recetas para usuario ${userId} con estado ${status}`);

      // Primero buscar el paciente asociado al usuario por DNI
      const user = await require('../models').User.findByPk(userId);
      if (!user) {
        logger.error(`Usuario no encontrado con ID ${userId}`);
        throw new Error('Usuario no encontrado');
      }

      // Buscar el paciente por DNI del usuario
      const patient = await require('../models').Patient.findOne({
        where: { dni: user.dni }
      });

      if (!patient) {
        logger.error(`Paciente no encontrado para usuario con DNI ${user.dni}`);
        throw new Error('Paciente no encontrado para este usuario');
      }

      logger.info(`Paciente encontrado: ID=${patient.id}, DNI=${patient.dni}`);

      // Obtener todas las prescripciones del paciente
      const prescriptions = await Prescription.findAll({
        where: { paciente_id: patient.id },
        include: [
          {
            model: Patient, 
            as: 'paciente' 
          },
          { 
            model: Professional, 
            as: 'profesional' 
          },
          {
            model: PrescriptionItem,
            as: 'items',
            include: [{ model: Medication, as: 'medicamento' }]
          }
        ],
        order: [['fecha', 'DESC']]
      });

      // Procesar cada receta para verificar los estados de toma
      for (const prescription of prescriptions) {
        // Verificamos cada item de la receta
        if (prescription.items && prescription.items.length > 0) {
          // Actualizar el estado de cada item basado en tomas relacionadas
          for (const item of prescription.items) {
            // Si todas las tomas asociadas están marcadas, marcar el item como tomado
            const medicationIntakes = await require('../models').MedicationIntake.findAll({
              where: { prescription_item_id: item.id }
            });
            
            // Si hay tomas asociadas y todas están marcadas como tomadas
            if (medicationIntakes.length > 0) {
              const allTaken = medicationIntakes.every(intake => intake.taken);
              if (allTaken && !item.tomado) {
                // Actualizar el estado del item a tomado
                item.tomado = true;
                await item.save();
                logger.info(`Item ID=${item.id} actualizado automáticamente a tomado porque todas sus tomas están completas`);
              }
            }
          }
        }
      }

      logger.info(`Se encontraron ${prescriptions.length} recetas para el paciente ID=${patient.id}`);

      // Si el estado es "all", devolver todas las prescripciones
      if (status === 'all') {
        return prescriptions;
      }

      // Filtrar por estado basándose en si todos los items están tomados
      return prescriptions.filter(prescription => {
        // Si no hay items, consideramos la prescripción como activa
        if (!prescription.items || prescription.items.length === 0) {
          return status === 'active';
        }
        
        // Una prescripción está completada si todos sus items están tomados
        const allItemsTaken = prescription.items.every(item => item.tomado);
        
        // Devolver true si el estado coincide
        return (status === 'completed' && allItemsTaken) || 
               (status === 'active' && !allItemsTaken);
      });
    } catch (error) {
      logger.error(`Error obteniendo recetas: ${error.message}`);
      throw error;
    }
  }

  static async getAllPrescriptionsByPatient(userId) {
    try {
      logger.info(`Obteniendo todas las recetas para el usuario ${userId}`);
      
      // Primero buscar el paciente asociado al usuario por DNI
      const user = await require('../models').User.findByPk(userId);
      if (!user) {
        logger.error(`Usuario no encontrado con ID ${userId}`);
        throw new Error('Usuario no encontrado');
      }

      // Buscar el paciente por DNI del usuario
      const patient = await require('../models').Patient.findOne({
        where: { dni: user.dni }
      });

      if (!patient) {
        logger.error(`Paciente no encontrado para usuario con DNI ${user.dni}`);
        throw new Error('Paciente no encontrado para este usuario');
      }

      logger.info(`Paciente encontrado: ID=${patient.id}, DNI=${patient.dni}`);
      
      const prescriptions = await Prescription.findAll({
        where: { paciente_id: patient.id },
        include: [
          { 
            model: Patient, 
            as: 'paciente' 
          },
          { 
            model: Professional, 
            as: 'profesional' 
          },
          {
            model: PrescriptionItem,
            as: 'items',
            include: [
              { model: Medication, as: 'medicamento' },
              { 
                model: MedicationIntake, 
                as: 'intakes',
                required: false
              }
            ]
          }
        ],
        order: [['fecha', 'DESC']]
      });
      
      logger.info(`Se encontraron ${prescriptions.length} recetas para el paciente ID=${patient.id}`);
      return prescriptions;
    } catch (error) {
      logger.error(`Error obteniendo todas las recetas: ${error.message}`);
      throw error;
    }
  }
}

module.exports = PrescriptionService;

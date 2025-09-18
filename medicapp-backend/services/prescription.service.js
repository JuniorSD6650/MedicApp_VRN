const { Prescription, PrescriptionItem, Medication, Patient, Professional, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class PrescriptionService {
  static async getPrescriptionsByStatus(userId, status) {
    try {
      logger.info(`Obteniendo recetas para usuario ${userId} con estado ${status}`);

      const where = { paciente_id: userId };

      if (status === 'active') {
        where.fecha_fin = { [Op.gte]: new Date() };
      } else if (status === 'completed') {
        where.fecha_fin = { [Op.lt]: new Date() };
      }

      const prescriptions = await Prescription.findAll({
        where,
        include: [
          {
            model: PrescriptionItem,
            as: 'items',
            include: [{ model: Medication, as: 'medicamento' }]
          }
        ],
        order: [['fecha', 'DESC']]
      });

      logger.info(`Se encontraron ${prescriptions.length} recetas para el usuario ${userId} con estado ${status}`);

      prescriptions.forEach((prescription, index) => {
        logger.info(`Receta ${index + 1}: ID=${prescription.id}, Número=${prescription.num_receta}, Fecha=${prescription.fecha}`);
        logger.info(`  - Contiene ${prescription.items.length} ítems`);
        prescription.items.forEach((item, itemIndex) => {
          logger.info(`    Ítem ${itemIndex + 1}: Medicamento=${item.medicamento.descripcion}, Cantidad=${item.cantidad_solicitada}`);
        });
      });

      return prescriptions;
    } catch (error) {
      logger.error(`Error obteniendo recetas: ${error.message}`);
      throw error;
    }
  }

  static async getAllPrescriptionsByPatient(userId) {
    try {
      logger.info(`Obteniendo todas las recetas para el paciente ${userId}`);
      
      const prescriptions = await Prescription.findAll({
        where: { paciente_id: userId },
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
              { model: Medication, as: 'medicamento' }
            ]
          }
        ],
        order: [['fecha', 'DESC']]
      });
      
      return prescriptions;
    } catch (error) {
      logger.error(`Error obteniendo todas las recetas: ${error.message}`);
      throw error;
    }
  }
}

module.exports = PrescriptionService;

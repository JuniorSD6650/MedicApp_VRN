const { MedicationIntake, PrescriptionItem, Medication } = require('../models');
const logger = require('../utils/logger');

/**
 * Calcula y crea las tomas para un item de receta
 * @param {Object} prescriptionItem - Item de receta
 * @param {Object} medicamento - Medicamento asociado
 * @param {Date} fechaDespacho - Fecha de despacho
 * @param {string} horaDespacho - Hora de despacho (formato HH:MM)
 * @param {Object} options - Opciones adicionales como transaction
 */
const createIntakesForPrescriptionItem = async (prescriptionItem, medicamento, fechaDespacho, horaDespacho, options = {}) => {
  logger.startOperation('Creación de tomas programadas', {
    itemId: prescriptionItem.id,
    medicamentoId: medicamento.id,
    medicamento: medicamento.descripcion.substring(0, 30) + (medicamento.descripcion.length > 30 ? '...' : '')
  }, 'medicationIntakeService');
  
  try {
    // Convertir fecha y hora de despacho a Date
    const fechaHoraDespacho = new Date(fechaDespacho);
    if (horaDespacho) {
      const [hours, minutes] = horaDespacho.split(':');
      fechaHoraDespacho.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    
    logger.debug(`Fecha y hora de despacho: ${fechaHoraDespacho.toISOString()}`, 'medicationIntakeService');
    
    // Duración del tratamiento en días
    const duracionDias = parseInt(medicamento.duracion) || 1;
    
    // Cantidad solicitada
    const cantidadSolicitada = parseInt(prescriptionItem.cantidad_solicitada) || 1;
    
    // Cantidad dispensada (usar esta si está disponible)
    const cantidadDispensada = parseInt(prescriptionItem.cantidad_dispensada) || cantidadSolicitada;
    
    // Calcular tomas por día basado en cantidad dispensada y duración
    const tomasPorDia = Math.ceil(cantidadDispensada / duracionDias);
    
    // Calcular intervalo entre tomas (en horas)
    const intervaloHoras = Math.floor(24 / tomasPorDia);
    
    // Hora de primera toma (empezando a las 8 AM del día siguiente al despacho)
    const fechaInicio = new Date(fechaHoraDespacho);
    fechaInicio.setDate(fechaInicio.getDate() + 1);
    fechaInicio.setHours(8, 0, 0, 0);
    
    logger.info(`Creando ${duracionDias * tomasPorDia} tomas para el medicamento ${medicamento.descripcion}`, 'medicationIntakeService');
    logger.debug(`Duración: ${duracionDias} días, Tomas por día: ${tomasPorDia}, Intervalo: ${intervaloHoras} horas`, 'medicationIntakeService');
    
    console.log(`Creando ${duracionDias * tomasPorDia} tomas para el medicamento ${medicamento.descripcion}`);
    console.log(`Duración: ${duracionDias} días, Tomas por día: ${tomasPorDia}, Intervalo: ${intervaloHoras} horas`);
    
    // Crear tomas programadas
    const intakes = [];
    
    for (let dia = 0; dia < duracionDias; dia++) {
      for (let toma = 0; toma < tomasPorDia; toma++) {
        const fechaToma = new Date(fechaInicio);
        fechaToma.setDate(fechaInicio.getDate() + dia);
        fechaToma.setHours(8 + (toma * intervaloHoras), 0, 0, 0);
        
        logger.debug(`Programando toma para: ${fechaToma.toISOString()}`, 'medicationIntakeService');
        
        const newIntake = await MedicationIntake.create({
          prescription_item_id: prescriptionItem.id,
          scheduled_time: fechaToma,
          taken: false
        }, options);
        
        intakes.push(newIntake);
      }
    }
    
    logger.info(`${intakes.length} tomas programadas creadas exitosamente para item ID=${prescriptionItem.id}`, 'medicationIntakeService');
    logger.endOperation('Creación de tomas programadas', { count: intakes.length }, 'medicationIntakeService');
    
    return intakes;
  } catch (error) {
    logger.operationError('Creación de tomas programadas', error, 'medicationIntakeService');
    console.error('Error creando tomas programadas:', error);
    throw error;
  }
};

/**
 * Recalcula las tomas para un item de receta existente
 * @param {number} prescriptionItemId - ID del item de receta
 * @param {Object} options - Opciones adicionales como transaction
 */
const recalculateIntakesForPrescriptionItem = async (prescriptionItemId, options = {}) => {
  logger.startOperation('Recálculo de tomas programadas', { prescriptionItemId }, 'medicationIntakeService');
  try {
    // Buscar el item de receta con su medicamento
    const prescriptionItem = await PrescriptionItem.findByPk(prescriptionItemId, {
      include: [{ model: Medication, as: 'medicamento' }]
    });
    
    if (!prescriptionItem) {
      const error = `Item de receta con ID ${prescriptionItemId} no encontrado`;
      logger.error(error, 'medicationIntakeService');
      throw new Error(error);
    }
    
    logger.info(`Recalculando tomas para Item ID=${prescriptionItemId}, Medicamento=${prescriptionItem.medicamento.descripcion}`, 'medicationIntakeService');
    
    // Eliminar tomas existentes que no hayan sido tomadas
    const deletedCount = await MedicationIntake.destroy({
      where: {
        prescription_item_id: prescriptionItemId,
        taken: false
      },
      ...options
    });
    
    logger.info(`${deletedCount} tomas pendientes eliminadas para recálculo`, 'medicationIntakeService');
    
    // Crear nuevas tomas
    const newIntakes = await createIntakesForPrescriptionItem(
      prescriptionItem,
      prescriptionItem.medicamento,
      prescriptionItem.fecha_despacho,
      prescriptionItem.hora_despacho,
      options
    );
    
    logger.endOperation('Recálculo de tomas programadas', { 
      deleted: deletedCount, 
      created: newIntakes.length 
    }, 'medicationIntakeService');
    
    return newIntakes;
  } catch (error) {
    logger.operationError('Recálculo de tomas programadas', error, 'medicationIntakeService');
    console.error('Error recalculando tomas:', error);
    throw error;
  }
};

/**
 * Busca tomas existentes de un item de receta
 * @param {number} prescriptionItemId - ID del item de receta
 * @returns {Promise<Array>} - Array de tomas existentes
 */
const getIntakesForPrescriptionItem = async (prescriptionItemId) => {
  logger.debug(`Obteniendo tomas para item ID=${prescriptionItemId}`, 'medicationIntakeService');
  try {
    const intakes = await MedicationIntake.findAll({
      where: { prescription_item_id: prescriptionItemId },
      order: [['scheduled_time', 'ASC']]
    });
    
    logger.info(`Recuperadas ${intakes.length} tomas para item ID=${prescriptionItemId}`, 'medicationIntakeService');
    return intakes;
  } catch (error) {
    logger.error(`Error al obtener tomas para item ID=${prescriptionItemId}: ${error.message}`, 'medicationIntakeService');
    console.error('Error al obtener tomas para item de receta:', error);
    throw error;
  }
};

module.exports = {
  createIntakesForPrescriptionItem,
  recalculateIntakesForPrescriptionItem,
  getIntakesForPrescriptionItem
};

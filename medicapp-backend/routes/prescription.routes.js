const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const PrescriptionService = require('../services/prescription.service');
const medicationIntakeController = require('../controllers/medicationIntake.controller');
const logger = require('../utils/logger');
const { Prescription, PrescriptionItem, Medication, Professional, Patient } = require('../models');

router.use(authenticateToken);

// Rutas para obtener recetas por estado
router.get('/my-prescriptions', async (req, res) => {
  try {
    const { status = 'all' } = req.query; // 'all', 'active', 'completed'
    const userId = req.user.id;
    
    logger.info(`Usuario ${userId} solicitando recetas con estado ${status}`);

    const prescriptions = await PrescriptionService.getPrescriptionsByStatus(userId, status);
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    logger.error(`Error al obtener recetas: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ruta para obtener todas las recetas de un paciente
router.get('/all-prescriptions', async (req, res) => {
  try {
    const userId = req.user.id;
    logger.info(`Usuario ${userId} solicitando todas las recetas`);

    const prescriptions = await PrescriptionService.getAllPrescriptionsByPatient(userId);
    logger.info(`Se encontraron ${prescriptions.length} recetas para el usuario ${userId}`);
    
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    logger.error(`Error al obtener todas las recetas: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ruta para obtener progreso diario de medicamentos
router.get('/daily-progress', (req, res) => {
  // Llamamos directamente al controlador de tomas que ya tiene la lógica implementada
  return medicationIntakeController.getMyDailyProgress(req, res);
});

// Corregir la ruta con parámetro opcional - Express no admite la sintaxis /:param?
// Definir dos rutas separadas para manejar el caso con y sin parámetro
router.get('/patient', async (req, res) => {
  try {
    const userId = req.user.id;
    logger.info(`Solicitando recetas para el usuario actual ID=${userId}`);
    
    const prescriptions = await PrescriptionService.getAllPrescriptionsByPatient(userId);
    
    res.json({ 
      success: true, 
      data: prescriptions 
    });
  } catch (error) {
    logger.error(`Error al obtener recetas del paciente: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: "Error al obtener recetas del paciente",
      details: error.message
    });
  }
});

router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    logger.info(`Solicitando recetas para paciente ID=${patientId}`);
    
    const prescriptions = await PrescriptionService.getAllPrescriptionsByPatient(patientId);
    
    res.json({ 
      success: true, 
      data: prescriptions 
    });
  } catch (error) {
    logger.error(`Error al obtener recetas del paciente: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: "Error al obtener recetas del paciente",
      details: error.message
    });
  }
});

// Ruta para obtener una receta específica por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Solicitando detalle de receta ID=${id}`, 'PrescriptionRoutes');
    
    // Buscar la receta por ID
    const prescription = await Prescription.findByPk(id, {
      include: [
        {
          model: PrescriptionItem,
          as: 'items',
          include: [
            {
              model: Medication,
              as: 'medicamento'
            }
          ]
        },
        {
          model: Professional,
          as: 'profesional'
        },
        {
          model: Patient,
          as: 'paciente'
        }
      ]
    });
    
    if (!prescription) {
      logger.warn(`Receta no encontrada con ID=${id}`, 'PrescriptionRoutes');
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }
    
    // Verificar permisos: asegurarse de que el usuario actual tiene derecho a ver esta receta
    const userId = req.user.id;
    const userRole = req.user.rol;
    
    logger.debug(`Usuario ID=${userId}, Rol=${userRole} accediendo a receta ID=${id}`, 'PrescriptionRoutes');
    
    // Si es paciente, verificar que la receta le pertenece
    if (userRole === 'paciente') {
      const patient = await Patient.findOne({ where: { dni: req.user.dni } });
      if (!patient || prescription.paciente_id !== patient.id) {
        logger.warn(`Acceso denegado: Usuario ID=${userId} intentó acceder a receta que no le pertenece`, 'PrescriptionRoutes');
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para ver esta receta'
        });
      }
    }
    
    logger.info(`Detalle de receta ID=${id} enviado exitosamente`, 'PrescriptionRoutes');
    
    res.json({
      success: true,
      prescription
    });
  } catch (error) {
    logger.error(`Error al obtener receta ID=${req.params.id}: ${error.message}`, 'PrescriptionRoutes');
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;

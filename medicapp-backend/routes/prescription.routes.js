const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const PrescriptionService = require('../services/prescription.service');
const medicationIntakeController = require('../controllers/medicationIntake.controller');
const logger = require('../utils/logger');

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

    const prescriptions = await PrescriptionService.getAllPrescriptionsByPatient(userId);
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ruta para obtener progreso diario de medicamentos
router.get('/daily-progress', (req, res) => {
  // Llamamos directamente al controlador de tomas que ya tiene la lógica implementada
  return medicationIntakeController.getMyDailyProgress(req, res);
});

module.exports = router;

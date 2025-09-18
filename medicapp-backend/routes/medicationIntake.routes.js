const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const medicationIntakeController = require('../controllers/medicationIntake.controller');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas originales
router.get('/pending', medicationIntakeController.getMyPendingIntakes);
router.get('/history', medicationIntakeController.getMyIntakeHistory);
router.put('/:intakeId/taken', medicationIntakeController.markIntakeAsTaken);

// Rutas para médicos
router.get('/patient/:patientId', medicationIntakeController.getPatientIntakeHistory);

// Nuevas rutas trasladadas desde prescription.routes.js
router.get('/daily', medicationIntakeController.getMyDailyMedications);
router.get('/daily-progress', medicationIntakeController.getMyDailyProgress);
router.get('/daily-grouped', medicationIntakeController.getMyDailyMedicationsGrouped);

// Ruta de diagnóstico
router.get('/diagnostic', medicationIntakeController.runDiagnostic);

module.exports = router;

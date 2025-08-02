const express = require('express');
const { 
  getMyPendingIntakes,
  getMyIntakeHistory,
  markIntakeAsTaken,
  getPatientIntakeHistory
} = require('../controllers/medicationIntake.controller');
const { verifyToken, requireMedico } = require('../middleware/auth');

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(verifyToken);

// Rutas para pacientes - ver mis tomas pendientes
router.get('/pending', getMyPendingIntakes);

// Ruta para ver todo mi historial de tomas
router.get('/history', getMyIntakeHistory);

// Marcar una toma como realizada
router.patch('/:intakeId/take', markIntakeAsTaken);

// Rutas para médicos - ver tomas de un paciente específico
router.get('/patient/:patientId', requireMedico, getPatientIntakeHistory);

module.exports = router;

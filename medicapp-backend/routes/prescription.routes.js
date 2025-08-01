const express = require('express');
const { 
  // Funciones existentes
  getMyPrescriptions, 
  markMedicationTaken, 
  getMedicationHistory,
  getPendingMedications,
  getPatientStats,
  getPrescriptionsAndMarkTaken,
  
  // Nuevas funciones CRUD para Prescription
  createPrescription,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
  
  // Nuevas funciones CRUD para PrescriptionItem
  createPrescriptionItem,
  updatePrescriptionItem,
  deletePrescriptionItem
} = require('../controllers/prescription.controller');

// Middleware de autenticación simplificado
const authenticateToken = (req, res, next) => {
  // Este es un middleware temporal para permitir que la aplicación funcione
  console.warn('Usando middleware de autenticación provisional');
  
  // Simulamos un usuario autenticado para pruebas
  req.user = {
    id: 1,
    dni: '12345678',
    nombre: 'Usuario de Prueba',
    rol: 'paciente'
  };
  
  next();
};

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// CRUD para Prescriptions
// CREATE - Crear una nueva receta médica
router.post('/', createPrescription);

// READ - Obtener recetas del paciente autenticado
router.get('/my-prescriptions', getMyPrescriptions);

// READ - Obtener una receta específica por ID
router.get('/:id', getPrescriptionById);

// UPDATE - Actualizar una receta existente
router.put('/:id', updatePrescription);

// DELETE - Eliminar una receta
router.delete('/:id', deletePrescription);

// CRUD para PrescriptionItem
// CREATE - Crear un nuevo item de receta
router.post('/items', createPrescriptionItem);

// UPDATE - Actualizar un item de receta
router.put('/items/:id', updatePrescriptionItem);

// DELETE - Eliminar un item de receta
router.delete('/items/:id', deletePrescriptionItem);

// Otras rutas específicas
// Marcar medicamento como tomado (alternativa a updatePrescriptionItem)
router.post('/mark-taken', markMedicationTaken);

// Obtener historial de medicamentos para un paciente (para profesionales)
router.get('/history/:patientId', getMedicationHistory);

// Obtener medicamentos pendientes
router.get('/pending', getPendingMedications);

// Obtener estadísticas del paciente
router.get('/stats', getPatientStats);

// Obtener recetas y marcar medicamentos como tomados
router.get('/prescriptions-mark-taken', getPrescriptionsAndMarkTaken);

module.exports = router;

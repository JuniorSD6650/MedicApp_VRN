const express = require('express');
const {
  getAllPrescriptions,
  getSystemStats,
  searchPatients
} = require('../controllers/admin.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación y rol admin
router.use(verifyToken, requireAdmin);

// Obtener todas las recetas
router.get('/prescriptions', getAllPrescriptions);

// Obtener estadísticas del sistema
router.get('/stats', getSystemStats);

// Buscar pacientes
router.get('/patients', searchPatients);

// Ruta de prueba para verificar acceso de administrador
router.get('/dashboard', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Acceso a panel de administración concedido',
    user: req.user
  });
});

module.exports = router;

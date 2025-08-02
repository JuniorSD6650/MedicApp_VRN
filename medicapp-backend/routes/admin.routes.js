const express = require('express');
const {
  getAllPrescriptions,
  getSystemStats,
  searchPatients,
  listUsers,
  getUserById
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

// Listar usuarios con paginación y filtrado
router.get('/users', listUsers);

// Obtener un usuario específico por ID
router.get('/users/:id', getUserById);

// Ruta de prueba para verificar acceso de administrador
router.get('/dashboard', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Acceso a panel de administración concedido',
    user: req.user
  });
});

module.exports = router;

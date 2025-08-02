// routes/upload.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { handleCsvUpload } = require('../controllers/upload.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Configuración de multer para almacenamiento de archivos
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Filtro para aceptar solo archivos CSV
const fileFilter = (req, file, cb) => {
  // Aceptar archivos CSV o Excel
  if (file.mimetype === 'text/csv' || 
      file.mimetype === 'application/vnd.ms-excel' || 
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no soportado. Solo se permiten archivos CSV.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 10 // 10MB max
  }
});

// Rutas para carga de archivos
router.post('/', verifyToken, requireAdmin, upload.single('file'), handleCsvUpload);

// Ruta de prueba para verificar que la ruta está disponible
router.get('/test', (req, res) => {
  res.json({ message: 'La ruta de carga está funcionando correctamente' });
});

module.exports = router;

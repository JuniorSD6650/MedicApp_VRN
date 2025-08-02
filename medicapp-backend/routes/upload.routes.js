// routes/upload.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { handleCsvUpload } = require('../controllers/upload.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

// Configuración de multer para almacenamiento de archivos
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads');
    logger.info(`Configurando destino de archivo: ${uploadPath}`, 'upload.routes');
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname}`;
    logger.info(`Generando nombre de archivo: ${filename} (original: ${file.originalname})`, 'upload.routes');
    cb(null, filename);
  }
});

// Filtro para aceptar solo archivos CSV
const fileFilter = (req, file, cb) => {
  logger.info(`Validando archivo: ${file.originalname}, mimetype: ${file.mimetype}`, 'upload.routes');
  
  // Aceptar archivos CSV o Excel
  if (file.mimetype === 'text/csv' || 
      file.mimetype === 'application/vnd.ms-excel' || 
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.originalname.endsWith('.csv')) {
    logger.info(`Archivo aceptado: ${file.originalname}`, 'upload.routes');
    cb(null, true);
  } else {
    logger.warn(`Archivo rechazado: ${file.originalname} - Formato no soportado`, 'upload.routes');
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

// Middleware de logging para todas las rutas de upload
router.use((req, res, next) => {
  logger.info(`Solicitud recibida: ${req.method} ${req.originalUrl} desde IP: ${req.ip || req.connection.remoteAddress}`, 'upload.routes');
  
  // Log de headers importantes
  if (req.get('Content-Type')) {
    logger.info(`Content-Type: ${req.get('Content-Type')}`, 'upload.routes');
  }
  
  next();
});

// Rutas para carga de archivos
router.post('/', verifyToken, requireAdmin, (req, res, next) => {
  logger.info('Iniciando proceso de upload de archivo CSV', 'upload.routes');
  next();
}, upload.single('file'), (req, res, next) => {
  if (req.file) {
    logger.info(`Archivo subido exitosamente: ${req.file.originalname} (${req.file.size} bytes) -> ${req.file.filename}`, 'upload.routes');
    logger.info(`Ruta del archivo: ${req.file.path}`, 'upload.routes');
  } else {
    logger.warn('No se recibió ningún archivo en la solicitud', 'upload.routes');
  }
  next();
}, handleCsvUpload);

// Ruta de prueba para verificar que la ruta está disponible
router.get('/test', (req, res) => {
  logger.info('Acceso a ruta de prueba /test', 'upload.routes');
  res.json({ message: 'La ruta de carga está funcionando correctamente' });
});

// Middleware de manejo de errores específico para upload
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    logger.error(`Error de Multer: ${error.message} - Código: ${error.code}`, 'upload.routes');
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'El archivo es demasiado grande. Máximo permitido: 10MB',
        code: 'FILE_TOO_LARGE'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Campo de archivo inesperado. Use el campo "file"',
        code: 'UNEXPECTED_FILE_FIELD'
      });
    }
    
    return res.status(400).json({
      success: false,
      error: 'Error en la carga del archivo',
      code: 'MULTER_ERROR',
      details: error.message
    });
  }
  
  if (error.message.includes('Formato de archivo no soportado')) {
    logger.error(`Formato de archivo no soportado: ${error.message}`, 'upload.routes');
    return res.status(400).json({
      success: false,
      error: 'Formato de archivo no soportado. Solo se permiten archivos CSV',
      code: 'UNSUPPORTED_FILE_FORMAT'
    });
  }
  
  logger.error(`Error no controlado en upload.routes: ${error.message}`, 'upload.routes');
  next(error);
});

module.exports = router;

// routes/upload.routes.js
const express = require('express');
const multer = require('multer');
const { handleCsvUpload } = require('../controllers/upload.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Solo admins pueden subir archivos CSV
router.post('/', verifyToken, requireAdmin, upload.single('file'), handleCsvUpload);

module.exports = router;

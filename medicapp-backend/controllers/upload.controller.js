const fs = require('fs');
const path = require('path');
const { parseCSV } = require('../utils/parseCsv');
const CSVProcessor = require('../services/csvProcessor');
const logger = require('../utils/logger');

const handleCsvUpload = async (req, res) => {
  let filePath = null;
  
  try {
    logger.startOperation('CSV_UPLOAD', { 
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress 
    }, 'handleCsvUpload');

    if (!req.file) {
      logger.warn('No se proporcionó archivo CSV', 'handleCsvUpload');
      return res.status(400).json({ 
        error: 'No se proporcionó archivo CSV' 
      });
    }

    filePath = req.file.path;
    logger.info(`Procesando archivo: ${req.file.originalname}`, 'handleCsvUpload');
    console.log(`Procesando archivo: ${req.file.originalname}`);

    // Parsear CSV
    logger.info('Iniciando parseo del archivo CSV', 'handleCsvUpload');
    const csvData = await parseCSV(filePath);
    
    if (csvData.length === 0) {
      logger.warn('El archivo CSV está vacío', 'handleCsvUpload');
      return res.status(400).json({ 
        error: 'El archivo CSV está vacío' 
      });
    }

    logger.info(`Archivo parseado correctamente. ${csvData.length} filas encontradas`, 'handleCsvUpload');
    console.log(`Archivo parseado correctamente. ${csvData.length} filas encontradas`);

    // Procesar datos
    logger.info('Iniciando procesamiento de datos CSV', 'handleCsvUpload');
    const processor = new CSVProcessor();
    const stats = await processor.processCSVData(csvData);

    logger.info(`Procesamiento completado. Filas procesadas: ${stats.processedRows}/${stats.totalRows}`, 'handleCsvUpload');

    // Respuesta con estadísticas detalladas
    const response = {
      success: true,
      message: 'Archivo procesado exitosamente',
      statistics: {
        totalRows: stats.totalRows,
        processedRows: stats.processedRows,
        errorRows: stats.errorRows,
        successRate: `${((stats.processedRows / stats.totalRows) * 100).toFixed(2)}%`,
        created: {
          patients: stats.createdPatients,
          professionals: stats.createdProfessionals,
          medications: stats.createdMedications,
          prescriptions: stats.createdPrescriptions,
          prescriptionItems: stats.createdPrescriptionItems,
          medicationIntakes: stats.createdMedicationIntakes,
          users: stats.createdUsers
        }
      }
    };

    // Incluir errores si los hay, pero limitados
    if (stats.errors.length > 0) {
      logger.warn(`Se encontraron ${stats.errors.length} errores durante el procesamiento`, 'handleCsvUpload');
      response.warnings = {
        errorCount: stats.errors.length,
        firstErrors: stats.errors.slice(0, 10), // Solo primeros 10 errores
        message: stats.errors.length > 10 ? 
          `Se muestran los primeros 10 errores de ${stats.errors.length} total` : 
          'Todos los errores mostrados'
      };
    }

    logger.endOperation('CSV_UPLOAD', {
      totalRows: stats.totalRows,
      processedRows: stats.processedRows,
      errorRows: stats.errorRows,
      successRate: `${((stats.processedRows / stats.totalRows) * 100).toFixed(2)}%`
    }, 'handleCsvUpload');

    console.log('Procesamiento completado:', response.statistics);
    logger.info('Respuesta enviada al cliente exitosamente', 'handleCsvUpload');
    res.json(response);

  } catch (error) {
    logger.operationError('CSV_UPLOAD', error, 'handleCsvUpload');
    console.error('Error procesando CSV:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al procesar el archivo',
      details: error.message 
    });
  } finally {
    // Limpiar archivo temporal
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        logger.info(`Archivo temporal eliminado: ${path.basename(filePath)}`, 'handleCsvUpload');
        console.log('Archivo temporal eliminado');
      } catch (cleanupError) {
        logger.error(`Error eliminando archivo temporal: ${cleanupError.message}`, 'handleCsvUpload');
        console.error('Error eliminando archivo temporal:', cleanupError);
      }
    } else if (filePath) {
      logger.warn(`Archivo temporal no encontrado para eliminación: ${filePath}`, 'handleCsvUpload');
    }
    
    logger.info('Finalizando operación handleCsvUpload', 'handleCsvUpload');
  }
};

module.exports = {
  handleCsvUpload
};

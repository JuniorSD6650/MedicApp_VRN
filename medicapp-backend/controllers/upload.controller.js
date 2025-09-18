const fs = require('fs');
const path = require('path');
const { parseCSV } = require('../utils/parseCsv');
const CSVProcessor = require('../services/csvProcessor');
const logger = require('../utils/logger');

const handleCsvUpload = async (req, res) => {
  let filePath = null;
  const BATCH_SIZE = 100;
  const TIMEOUT = 300000; // 5 minutos

  // Configurar timeout del servidor
  res.setTimeout(TIMEOUT, () => {
    console.log('Timeout en la petición');
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        error: 'Timeout en el procesamiento'
      });
    }
  });

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó archivo CSV'
      });
    }

    filePath = req.file.path;

    // Parsear CSV
    const csvData = await parseCSV(filePath);
    
    // Configurar processor con eventos de progreso
    const processor = new CSVProcessor({
      batchSize: BATCH_SIZE,
      onProgress: (progress) => {
        // Enviar evento de progreso al cliente
        res.write(JSON.stringify({
          type: 'progress',
          data: progress
        }) + '\n');
      }
    });

    // Procesar datos en batches
    const stats = await processor.processCSVData(csvData);

    // Enviar respuesta final
    res.write(JSON.stringify({
      type: 'complete',
      data: {
        success: true,
        stats: {
          totalRows: stats.totalRows,
          processedRows: stats.processedRows,
          errorRows: stats.errorRows,
          created: stats.created || {}
        }
      }
    }));
    
    res.end();

  } catch (error) {
    console.error('Error procesando CSV:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Error procesando archivo'
      });
    }

  } finally {
    // Limpiar
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

module.exports = {
  handleCsvUpload
};
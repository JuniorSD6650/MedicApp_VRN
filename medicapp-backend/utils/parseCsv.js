// utils/parseCsv.js
const fs = require('fs');
const csv = require('csv-parser');
const logger = require('./logger');

function parseCSV(filePath) {
  logger.startOperation('Parseo de archivo CSV', { filePath }, 'parseCsv');
  
  return new Promise((resolve, reject) => {
    const results = [];
    
    logger.info(`Iniciando lectura de archivo CSV: ${filePath}`, 'parseCsv');
    
    fs.createReadStream(filePath)
      .on('error', (error) => {
        logger.operationError('Parseo de archivo CSV', `Error al abrir archivo: ${error.message}`, 'parseCsv');
        reject(error);
      })
      .pipe(csv({ 
        separator: ';',
        skipEmptyLines: true,
        skipLinesWithError: true
      }))
      .on('data', (data) => {
        // Limpiar espacios en blanco de todos los campos
        const cleanedData = {};
        Object.keys(data).forEach(key => {
          cleanedData[key.trim()] = typeof data[key] === 'string' ? data[key].trim() : data[key];
        });
        results.push(cleanedData);
        
        if (results.length % 1000 === 0) {
          logger.info(`Procesadas ${results.length} filas hasta ahora`, 'parseCsv');
        }
      })
      .on('end', () => {
        logger.info(`CSV parseado completamente: ${results.length} filas`, 'parseCsv');
        logger.endOperation('Parseo de archivo CSV', { rowCount: results.length }, 'parseCsv');
        console.log(`CSV parseado: ${results.length} filas`);
        resolve(results);
      })
      .on('error', (error) => {
        logger.operationError('Parseo de archivo CSV', error, 'parseCsv');
        console.error('Error parseando CSV:', error);
        reject(error);
      });
  });
}

module.exports = { parseCSV };

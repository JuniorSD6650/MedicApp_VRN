// utils/parseCsv.js
const fs = require('fs');
const csv = require('csv-parser');

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
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
      })
      .on('end', () => {
        console.log(`CSV parseado: ${results.length} filas`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error('Error parseando CSV:', error);
        reject(error);
      });
  });
}

module.exports = { parseCSV };

const fs = require('fs');
const path = require('path');
const { parseCSV } = require('../utils/parseCsv');
const CSVProcessor = require('../services/csvProcessor');

const handleCsvUpload = async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No se proporcionó archivo CSV' 
      });
    }

    filePath = req.file.path;
    console.log(`Procesando archivo: ${req.file.originalname}`);

    // Parsear CSV
    const csvData = await parseCSV(filePath);
    
    if (csvData.length === 0) {
      return res.status(400).json({ 
        error: 'El archivo CSV está vacío' 
      });
    }

    console.log(`Archivo parseado correctamente. ${csvData.length} filas encontradas`);

    // Procesar datos
    const processor = new CSVProcessor();
    const stats = await processor.processCSVData(csvData);

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
      response.warnings = {
        errorCount: stats.errors.length,
        firstErrors: stats.errors.slice(0, 10), // Solo primeros 10 errores
        message: stats.errors.length > 10 ? 
          `Se muestran los primeros 10 errores de ${stats.errors.length} total` : 
          'Todos los errores mostrados'
      };
    }

    console.log('Procesamiento completado:', response.statistics);
    res.json(response);

  } catch (error) {
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
        console.log('Archivo temporal eliminado');
      } catch (cleanupError) {
        console.error('Error eliminando archivo temporal:', cleanupError);
      }
    }
  }
};

module.exports = {
  handleCsvUpload
};

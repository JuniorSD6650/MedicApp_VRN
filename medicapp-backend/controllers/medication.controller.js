const MedicationService = require('../services/medication.service');

exports.runDiagnostic = async (req, res) => {
  try {
    const result = await MedicationService.diagnosticSearch();
    res.json({
      success: true,
      message: 'Diagnóstico completado',
      data: result
    });
  } catch (error) {
    console.error('Error en diagnóstico:', error);
    res.status(500).json({
      success: false,
      message: 'Error al ejecutar diagnóstico',
      error: error.message
    });
  }
};
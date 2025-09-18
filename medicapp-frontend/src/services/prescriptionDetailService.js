import api from './api';

/**
 * Servicio para manejar operaciones relacionadas con los detalles de prescripciones
 */
const prescriptionDetailService = {
  /**
   * Obtiene una prescripción específica por ID
   * @param {string|number} id - ID de la prescripción
   * @returns {Promise<Object>} Objeto con la respuesta
   */
  async getPrescriptionById(id) {
    try {
      console.log(`🔍 Solicitando detalle de prescripción ID: ${id}`);
      
      // Probamos con diferentes rutas de API para asegurar compatibilidad
      const possibleEndpoints = [
        `/prescriptions/${id}`,
        `/api/prescriptions/${id}`
      ];
      
      let response = null;
      let error = null;
      
      // Intentar con cada endpoint posible
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Intentando con endpoint: ${endpoint}`);
          response = await api.fetch(endpoint);
          
          if (response && (response.prescription || response.data)) {
            console.log(`✅ Datos obtenidos correctamente desde ${endpoint}`);
            break; // Si tiene éxito, salir del bucle
          }
        } catch (endpointError) {
          console.warn(`⚠️ Error con endpoint ${endpoint}: ${endpointError.message}`);
          error = endpointError;
        }
      }
      
      // Si tenemos una respuesta exitosa
      if (response && (response.prescription || response.data)) {
        const prescriptionData = response.prescription || response.data;
        return { 
          success: true, 
          data: this.formatPrescriptionData(prescriptionData)
        };
      }
      
      // Si estamos en desarrollo, usar datos mockeados
      if (__DEV__) {
        console.log(`🔄 Usando datos mockeados para prescripción ID: ${id}`);
        return {
          success: true,
          data: this.getMockPrescription(id)
        };
      }
      
      // Si llegamos aquí es que ningún endpoint funcionó
      throw error || new Error('No se pudo obtener la información de la receta');
    } catch (error) {
      console.error(`❌ Error general al obtener prescripción ID ${id}:`, error);
      
      // En caso de error, devolver datos mockeados en desarrollo
      if (__DEV__) {
        console.log(`🔄 Fallback a datos mockeados para ID: ${id} después de error`);
        return {
          success: true,
          data: this.getMockPrescription(id)
        };
      }
      
      return { 
        success: false, 
        error: error.message || 'No se pudo cargar la receta',
        data: null 
      };
    }
  },

  /**
   * Cambia el estado de un medicamento (tomado o no tomado)
   * @param {string|number} medicationId - ID del medicamento
   * @param {boolean} taken - Estado del medicamento
   * @returns {Promise<Object>} Objeto con la respuesta
   */
  async toggleMedicationStatus(medicationId, taken = true) {
    try {
      console.log(`💊 ${taken ? 'Marcando' : 'Desmarcando'} medicamento ID=${medicationId} como ${taken ? 'tomado' : 'no tomado'}`);
      
      const response = await api.put(`/prescriptions/items/${medicationId}/toggle`, { taken });
      
      return { 
        success: true,
        data: response
      };
    } catch (error) {
      console.error(`❌ Error al cambiar estado de medicamento ID=${medicationId}:`, error);
      return { 
        success: false,
        error: error.message || 'No se pudo actualizar el estado del medicamento' 
      };
    }
  },

  /**
   * Formatea los datos de una prescripción para usar en los componentes
   * @param {Object} prescription - Datos crudos de la prescripción
   * @returns {Object} Datos formateados
   */
  formatPrescriptionData(prescription) {
    try {
      return {
        id: prescription.id,
        date: new Date(prescription.fecha || prescription.date || Date.now()),
        status: this.calculatePrescriptionStatus(prescription),
        doctorName: prescription.profesional ? 
          `Dr. ${prescription.profesional.nombres} ${prescription.profesional.apellidos}` : 
          prescription.doctorName || 'Doctor no especificado',
        diagnosis: prescription.diagnóstico || prescription.diagnosis || 'No se especificó diagnóstico',
        medications: (prescription.items || prescription.medications || []).map(item => ({
          id: item.id,
          name: (item.medicamento?.descripcion || item.name || 'Medicamento no especificado'),
          dosage: item.dosage || `${item.cantidad_solicitada || 1} unidad(es)`,
          frequency: item.frecuencia || item.frequency || 'Según indicación médica',
          duration: item.duracion || item.duration || 'Según prescripción médica',
          instructions: item.instrucciones || item.instructions || 'Seguir indicaciones médicas',
          taken: !!item.tomado || !!item.taken
        })),
        notes: prescription.observaciones || prescription.notes || ''
      };
    } catch (formatError) {
      console.error('❌ Error al formatear datos de prescripción:', formatError);
      // Si falla el formateo, devolver un objeto básico compatible
      return {
        id: prescription.id || 0,
        date: new Date(),
        status: 'active',
        doctorName: 'Doctor no especificado',
        diagnosis: 'No se pudo cargar diagnóstico',
        medications: [],
        notes: ''
      };
    }
  },

  /**
   * Calcula el estado de una prescripción basado en sus medicamentos
   * @param {Object} prescription - Datos de la prescripción
   * @returns {string} Estado ('active' o 'completed')
   */
  calculatePrescriptionStatus(prescription) {
    try {
      const items = prescription.items || prescription.medications || [];
      if (items.length === 0) return 'active';
      
      return items.every(item => item.tomado || item.taken) ? 'completed' : 'active';
    } catch (error) {
      console.error('❌ Error al calcular estado de prescripción:', error);
      return 'active'; // Por defecto, considerar activa
    }
  },
  
  /**
   * Genera datos mockeados para desarrollo
   * @param {string|number} id - ID de la prescripción
   * @returns {Object} Datos de prescripción mockeados
   */
  getMockPrescription(id) {
    return {
      id: id || 50001,
      date: new Date(),
      status: 'active',
      doctorName: 'Dr. Juan Pérez',
      diagnosis: 'Hipertensión arterial leve',
      medications: [
        {
          id: 1001,
          name: 'Enalapril',
          dosage: '10mg',
          frequency: 'Una vez al día',
          duration: '30 días',
          instructions: 'Tomar por la mañana con el desayuno',
          taken: false
        },
        {
          id: 1002,
          name: 'Hidroclorotiazida',
          dosage: '25mg',
          frequency: 'Una vez al día',
          duration: '30 días',
          instructions: 'Tomar por la mañana con el desayuno',
          taken: true
        }
      ],
      notes: 'Seguimiento en 4 semanas. Mantener dieta baja en sodio y realizar actividad física moderada.'
    };
  }
};

export default prescriptionDetailService;

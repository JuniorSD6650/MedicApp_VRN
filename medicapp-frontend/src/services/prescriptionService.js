import { format } from 'date-fns';
import api from './api';

class PrescriptionService {
  constructor() {
    this.baseURL = api.baseURL;
    this.getAuthHeaders = () => {
      try {
        return api.getAuthHeaders();
      } catch (error) {
        console.error('Error al obtener headers de autenticación:', error);
        return {};
      }
    };
  }

  // Método auxiliar para verificar autenticación
  async ensureAuthentication() {
    try {
      const headers = await this.getAuthHeaders();
      console.log(`🔑 Headers obtenidos:`, headers);
      return headers;
    } catch (error) {
      console.warn('⚠️ Error al obtener headers de autenticación:', error);
      return {}; // Devolver un objeto vacío en lugar de lanzar error
    }
  }

  async getPrescriptionsByStatus(status = 'all') {
    try {
      const headers = this.ensureAuthentication();
      
      const response = await fetch(`${this.baseURL}/prescriptions/my-prescriptions?status=${status}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener recetas');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en getPrescriptionsByStatus:', error);
      return { success: false, error: error.message };
    }
  }

  async getDailyMedications(date) {
    try {
      const formattedDate = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      console.log(`📅 Obteniendo medicamentos para la fecha: ${formattedDate}`);
      
      const url = `${this.baseURL}/prescriptions/daily-medications?date=${formattedDate}`;
      console.log(`🔗 URL de solicitud: ${url}`);
      
      const headers = await this.ensureAuthentication();
      
      // Si no hay token, intentamos una solución alternativa
      if (!headers.Authorization) {
        console.log('⏳ Esperando token para obtener medicamentos diarios...');
        // Retornamos datos vacíos compatibles mientras se carga el token
        return { success: true, data: [] };
      }
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`Error al obtener medicamentos diarios: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Medicamentos diarios obtenidos: ${data.data?.length || 0} registros`);
      return data;
    } catch (error) {
      console.error('Error en getDailyMedications:', error);
      // Devolver un objeto vacío compatible con la interfaz esperada
      return { success: false, error: error.message, data: [] };
    }
  }

  async getDailyMedicationsGrouped(date) {
    try {
      const formattedDate = date ? format(date, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0];
      console.log(`📅 Obteniendo medicamentos agrupados para la fecha: ${formattedDate}`);
      
      // Asegúrate de usar la ruta correcta con el prefijo /api
      const url = `${this.baseURL}/prescriptions/daily-medications-grouped?date=${formattedDate}`;
      console.log(`🔗 URL de solicitud: ${url}`);
      
      const headers = await this.ensureAuthentication();
      
      // Si no hay token, intentamos una solución alternativa
      if (!headers.Authorization) {
        console.log('⏳ Esperando token para obtener medicamentos agrupados...');
        return { success: true, data: [] };
      }
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`Error al obtener medicamentos agrupados: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Medicamentos agrupados obtenidos: ${data.data?.length || 0} registros`);
      return data;
    } catch (error) {
      console.error('Error en getDailyMedicationsGrouped:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async getDailyProgress(date) {
    try {
      // Formatea la fecha como yyyy-MM-dd
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Log para depuración
      console.log('📤 Solicitando progreso diario para fecha:', formattedDate);
      
      const headers = await this.ensureAuthentication();
      
      // Verificar si tenemos headers de autenticación
      if (!headers.Authorization) {
        console.warn('⚠️ No hay token de autenticación para solicitar progreso diario');
        return { success: false, error: 'No hay token de autenticación', data: { total: 0, taken: 0, percentage: 0 } };
      }
      
      // Construir URL explícita
      const url = `${this.baseURL}/prescriptions/daily-progress?date=${formattedDate}`;
      console.log(`🔗 URL completa: ${url}`);
      
      // Realizar solicitud con fetch para más control
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('📥 Datos de progreso diario recibidos:', JSON.stringify(responseData));
      
      return responseData;
    } catch (error) {
      console.error('❌ Error en getDailyProgress:', error);
      return { 
        success: false, 
        error: error.message,
        data: { total: 0, taken: 0, percentage: 0 } 
      };
    }
  }

  async markAsTaken(prescriptionItemId, date, time) {
    try {
      const response = await fetch(`${this.baseURL}/prescriptions/mark-taken`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prescriptionItemId, date, time })
      });

      if (!response.ok) {
        throw new Error('Error al marcar medicamento como tomado');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en markAsTaken:', error);
      return { success: false, error: error.message };
    }
  }

  async getPatientPrescriptions(patientId) {
    try {
      const response = await fetch(`${this.baseURL}/prescriptions/patient/${patientId}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener recetas del paciente');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en getPatientPrescriptions:', error);
      return { success: false, error: error.message };
    }
  }

  async getActivePrescriptions(patientId) {
    try {
      const response = await fetch(`${this.baseURL}/prescriptions/patient/${patientId}/active`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener recetas activas');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en getActivePrescriptions:', error);
      return { success: false, error: error.message };
    }
  }

  async getPrescriptionDetails(prescriptionId) {
    try {
      const response = await fetch(`${this.baseURL}/prescriptions/${prescriptionId}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener detalles de la receta');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en getPrescriptionDetails:', error);
      return { success: false, error: error.message };
    }
  }

  async createPrescription(prescriptionData) {
    try {
      const response = await fetch(`${this.baseURL}/prescriptions`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(prescriptionData)
      });
      
      if (!response.ok) {
        throw new Error('Error al crear receta');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en createPrescription:', error);
      return { success: false, error: error.message };
    }
  }

  async updatePrescription(prescriptionId, prescriptionData) {
    try {
      const response = await fetch(`${this.baseURL}/prescriptions/${prescriptionId}`, {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(prescriptionData)
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar receta');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en updatePrescription:', error);
      return { success: false, error: error.message };
    }
  }

  async completePrescription(prescriptionId) {
    try {
      const response = await fetch(`${this.baseURL}/prescriptions/${prescriptionId}/complete`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Error al completar receta');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en completePrescription:', error);
      return { success: false, error: error.message };
    }
  }
  
  async getAllPrescriptions() {
    try {
      const response = await fetch(`${this.baseURL}/prescriptions`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener todas las recetas');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en getAllPrescriptions:', error);
      return { success: false, error: error.message };
    }
  }
  
  async getPrescriptionsByDoctor(doctorId) {
    try {
      const response = await fetch(`${this.baseURL}/prescriptions/doctor/${doctorId}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener recetas por médico');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en getPrescriptionsByDoctor:', error);
      return { success: false, error: error.message };
    }
  }
  
  async searchPrescriptions(searchCriteria) {
    try {
      // Construir query string de los criterios de búsqueda
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(searchCriteria)) {
        if (value) queryParams.append(key, value);
      }
      
      const response = await fetch(`${this.baseURL}/prescriptions/search?${queryParams}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Error al buscar recetas');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en searchPrescriptions:', error);
      return { success: false, error: error.message };
    }
  }
}

export const prescriptionService = new PrescriptionService();
export default prescriptionService;

import { authService } from './authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL - Ajusta esto según tu configuración
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.18.20:4000/api' // Desarrollo
  : 'https://tu-servidor-produccion.com/api'; // Producción

class ApiService {
  constructor() {
    // Usar la URL correcta dependiendo del entorno
    this.baseURL = __DEV__ 
      ? 'http://192.168.18.20:4000/api'  // URL de desarrollo
      : 'https://tu-servidor-produccion.com/api';  // URL de producción
    this.token = null;
  }

  async setAuthToken(token) {
    try {
      this.token = token;
      if (token) {
        await AsyncStorage.setItem('token', token);
        console.log('🔑 Token almacenado en AsyncStorage.');
      } else {
        await AsyncStorage.removeItem('token');
        console.log('🔑 Token eliminado de AsyncStorage.');
      }
    } catch (error) {
      console.error('Error al guardar el token en AsyncStorage:', error);
    }
  }

  async getToken() {
    try {
      const token = this.token || (await AsyncStorage.getItem('token'));
      console.log(`🔑 Token recuperado: ${token ? token.substring(0, 10) + '...' : 'No disponible'}`);
      return token;
    } catch (error) {
      console.error('Error al obtener el token de AsyncStorage:', error);
      return null;
    }
  }

  async getAuthHeaders() {
    try {
      const token = await this.getToken();
      console.log(`🔑 Obteniendo headers de autenticación. Token existente: ${!!token}`);
      if (!token) {
        console.warn('⚠️ No hay token disponible para la solicitud');
        return {};
      }
      return {
        Authorization: `Bearer ${token}`,
      };
    } catch (error) {
      console.error('Error al obtener headers de autenticación:', error);
      return {};
    }
  }

  // Auth endpoints (usando servicios mockeados)
  async login(credentials) {
    return await authService.login(credentials.email, credentials.password);
  }

  async register(userData) {
    return await authService.register(userData);
  }

  async logout() {
    return { success: true };
  }

  async resetPassword(email) {
    return await authService.resetPassword(email);
  }

  // Patient endpoints
  async getPatientProfile() {
    // Simular obtener perfil de paciente
    return { success: true, data: {} };
  }

  async updatePatientProfile(data) {
    // Simular actualizar perfil
    return { success: true, data };
  }

  // Prescription endpoints
  async getPrescriptions() {
    // Simular obtener recetas
    return { success: true, data: [] };
  }

  async getPrescriptionById(id) {
    // Simular obtener receta específica
    return { success: true, data: {} };
  }

  // Medication intake endpoints
  async getMedicationIntakes() {
    // Simular obtener tomas de medicamentos
    return { success: true, data: [] };
  }

  async recordMedicationIntake(data) {
    // Simular registrar toma
    return { success: true, data };
  }

  async updateMedicationIntake(id, data) {
    // Simular actualizar toma
    return { success: true, data };
  }

  // Professional endpoints (for doctors)
  async getProfessionalDashboard() {
    // Simular dashboard del médico
    return { success: true, data: {} };
  }

  async getPatients() {
    // Simular obtener pacientes
    return { success: true, data: [] };
  }

  async createPrescription(data) {
    // Simular crear receta
    return { success: true, data };
  }

  // Admin endpoints
  async getAdminDashboard() {
    // Simular dashboard del admin
    return { success: true, data: {} };
  }

  async uploadCSV(file) {
    // Simular upload de CSV
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Archivo CSV procesado exitosamente',
          recordsProcessed: Math.floor(Math.random() * 100) + 1
        });
      }, 2000);
    });
  }

  async getCurrentUser(token) {
    try {
      console.log('🔍 Iniciando getCurrentUser con token:', token.substring(0, 20) + '...');
      
      const response = await fetch('http://192.168.18.20:4000/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Datos recibidos en getCurrentUser:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en getCurrentUser:', error.message);
      throw new Error('Error al obtener datos del usuario');
    }
  }

  // Método PUT para actualizar recursos (usando fetch en lugar de axios)
  async put(endpoint, data = {}) {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Error en la petición: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error en PUT ${endpoint}:`, error);
      throw error;
    }
  }

  // Método genérico fetch para solicitudes GET
  async fetch(endpoint) {
    try {
      const token = await this.getToken();
      const url = `${this.baseURL}${endpoint}`;
      
      console.log(`🔍 Solicitando: ${url}`);
      
      // Si estamos en desarrollo y la URL contiene /prescriptions/50001, simular respuesta mockeada
      if (__DEV__ && endpoint.includes('/prescriptions/50001')) {
        console.log('🔧 Detectada solicitud de prescripción 50001 en desarrollo - devolviendo datos mockeados');
        return this.getMockPrescriptionResponse();
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      // Registrar información detallada sobre la respuesta
      console.log(`📥 Respuesta de ${endpoint}: Status ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error HTTP ${response.status}: ${errorText}`);
        
        // Para errores 404 en desarrollo, intentar devolver datos mockeados según el endpoint
        if (__DEV__ && response.status === 404) {
          if (endpoint.includes('/prescriptions/')) {
            console.log('🔧 Endpoint de prescripción no encontrado - devolviendo datos mockeados');
            return this.getMockPrescriptionResponse();
          }
        }
        
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Error en GET ${endpoint}:`, error);
      throw error;
    }
  }

  // Método para simular respuesta de prescripción en desarrollo
  getMockPrescriptionResponse() {
    return {
      success: true,
      prescription: {
        id: 50001,
        fecha: new Date().toISOString(),
        diagnóstico: 'Hipertensión arterial leve',
        observaciones: 'Seguimiento en 4 semanas. Mantener dieta baja en sodio y realizar actividad física moderada.',
        profesional: {
          id: 101,
          nombres: 'Juan',
          apellidos: 'Pérez',
          cmp: '12345'
        },
        items: [
          {
            id: 1001,
            medicamento_id: 2001,
            cantidad_solicitada: 30,
            medicamento: {
              id: 2001,
              codigo: 'ENA10',
              descripcion: 'Enalapril',
              unidad: 'tableta',
              duracion: '30'
            },
            tomado: false,
            frecuencia: 'Una vez al día',
            duracion: '30 días',
            instrucciones: 'Tomar por la mañana con el desayuno'
          },
          {
            id: 1002,
            medicamento_id: 2002,
            cantidad_solicitada: 30,
            medicamento: {
              id: 2002,
              codigo: 'HCT25',
              descripcion: 'Hidroclorotiazida',
              unidad: 'tableta',
              duracion: '30'
            },
            tomado: true,
            frecuencia: 'Una vez al día',
            duracion: '30 días',
            instrucciones: 'Tomar por la mañana con el desayuno'
          }
        ]
      }
    };
  }
}

const apiService = new ApiService();

export default apiService;

import { authService } from './authService';

// API Base URL - Ajusta esto según tu configuración
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' // Desarrollo
  : 'https://tu-servidor-produccion.com/api'; // Producción

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  setAuthToken(token) {
    this.token = token;
  }

  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
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
}

const apiService = new ApiService();

export default apiService;

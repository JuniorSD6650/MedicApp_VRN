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

  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        headers: this.getAuthHeaders(),
        ...options,
      };

      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials) {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.makeRequest('/auth/logout', {
      method: 'POST',
    });
  }

  // Patient endpoints
  async getPatientProfile() {
    return this.makeRequest('/patients/profile');
  }

  async updatePatientProfile(data) {
    return this.makeRequest('/patients/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Prescription endpoints
  async getPrescriptions() {
    return this.makeRequest('/prescriptions');
  }

  async getPrescriptionById(id) {
    return this.makeRequest(`/prescriptions/${id}`);
  }

  // Medication intake endpoints
  async getMedicationIntakes() {
    return this.makeRequest('/medication-intakes');
  }

  async recordMedicationIntake(data) {
    return this.makeRequest('/medication-intakes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMedicationIntake(id, data) {
    return this.makeRequest(`/medication-intakes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Professional endpoints (for doctors)
  async getProfessionalDashboard() {
    return this.makeRequest('/professionals/dashboard');
  }

  async getPatients() {
    return this.makeRequest('/professionals/patients');
  }

  async createPrescription(data) {
    return this.makeRequest('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin endpoints
  async getAdminDashboard() {
    return this.makeRequest('/admin/dashboard');
  }

  async uploadCSV(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.makeRequest('/admin/upload-csv', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: this.token ? `Bearer ${this.token}` : undefined,
        // No incluir Content-Type para FormData
      },
    });
  }
}

const apiService = new ApiService();

export default apiService;

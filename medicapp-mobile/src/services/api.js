import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Crear instancia de axios con URL de red local
// Usando IP específica del servidor backend
const api = axios.create({
  // Usando una de las IPs disponibles del servidor
  baseURL: 'http://192.168.18.26:4000', // Puedes cambiar a http://172.28.28.249:4000 si esta no funciona
  headers: {
    'Content-Type': 'application/json'
  },
  // Aumentar timeout para conexiones más lentas en red local
  timeout: 15000
});

// Configuración para depuración
const DEBUG = true; // Cambiar a false para desactivar logs en producción

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  async (config) => {
    if (DEBUG) {
      console.log('🚀 Request:', config.method?.toUpperCase(), config.url);
    }
    
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error.message);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    if (DEBUG) {
      console.log('✅ Response:', response.status, response.config.url, 
                  response.data ? 'Data received' : 'No data');
    }
    return response;
  },
  async (error) => {
    // Crear mensaje de error detallado para depuración
    const errorDetails = {
      url: error.config?.url || 'unknown url',
      method: error.config?.method?.toUpperCase() || 'unknown method',
      status: error.response?.status || 'no response',
      data: error.response?.data || {},
      message: error.message || 'unknown error'
    };
    
    console.error('❌ API Error:', JSON.stringify(errorDetails, null, 2));
    
    // Si el token expiró (401), cerrar sesión
    if (error.response && error.response.status === 401) {
      console.log('🔐 Token expirado o inválido, cerrando sesión...');
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
    }
    
    return Promise.reject(error);
  }
);

// Utilidad para probar la conexión al servidor (con control para evitar múltiples llamadas)
let connectionTestInProgress = false;
let lastConnectionTest = 0;
const CONNECTION_TEST_THROTTLE = 5000; // 5 segundos mínimo entre pruebas

api.testConnection = async () => {
  // Evitar pruebas concurrentes
  if (connectionTestInProgress) {
    console.log('Ya hay una prueba de conexión en progreso, evitando duplicados');
    return { success: false, error: 'Prueba de conexión ya en progreso' };
  }
  
  // Limitar la frecuencia de las pruebas
  const now = Date.now();
  if (now - lastConnectionTest < CONNECTION_TEST_THROTTLE) {
    console.log('Prueba de conexión limitada por frecuencia');
    return { success: true, cached: true };
  }
  
  try {
    connectionTestInProgress = true;
    lastConnectionTest = now;
    
    const response = await api.get('/api/health');
    console.log('🔄 Conexión exitosa al servidor');
    connectionTestInProgress = false;
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error de conexión al servidor:', error.message);
    connectionTestInProgress = false;
    return {
      success: false,
      error: error.message
    };
  }
};

export default api;

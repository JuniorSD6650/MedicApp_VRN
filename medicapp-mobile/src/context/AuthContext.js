import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);

  // Comprobar token al iniciar la app
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        // Recuperar token guardado
        const token = await AsyncStorage.getItem('userToken');
        const userInfoString = await AsyncStorage.getItem('userInfo');
        
        if (token && userInfoString) {
          const userInfo = JSON.parse(userInfoString);
          setUserToken(token);
          setUserInfo(userInfo);
          
          // Configurar token en axios
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error al recuperar datos de sesión:', error);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  // Iniciar sesión con mejor manejo de errores
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Intentando login con:', email);
      
      const response = await api.post('/api/auth/login', {
        email,
        password
      });
      
      console.log('Login exitoso:', response.data);
      
      const { token, user } = response.data;
      
      // Guardar token y datos de usuario
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(user));
      
      // Actualizar estado
      setUserToken(token);
      setUserInfo(user);
      
      // Configurar token en axios
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return user.rol;
    } catch (error) {
      console.error('Error en login:', error.message, error.response?.data);
      setError(
        error.response?.data?.message || 
        error.message || 
        'Error de conexión. Verifica tu red y la dirección del servidor.'
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Cerrar sesión
  const logout = async () => {
    setIsLoading(true);
    try {
      // Eliminar token y datos de usuario
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
      
      // Actualizar estado
      setUserToken(null);
      setUserInfo(null);
      
      // Eliminar token de axios
      delete api.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para probar la conexión al servidor
  const checkServerConnection = async () => {
    try {
      // No establecer isLoading aquí para evitar re-renderizaciones innecesarias
      const result = await api.testConnection();
      return result;
    } catch (error) {
      console.error('Error de conexión:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  };

  return (
    <AuthContext.Provider value={{
      isLoading,
      userToken,
      userInfo,
      error,
      login,
      logout,
      checkServerConnection
    }}>
      {children}
    </AuthContext.Provider>
  );
};

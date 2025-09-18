import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  checkAuthStatus: () => {},
});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStoredToken = async () => {
      try {
        console.log('🔑 Cargando datos de autenticación almacenados...');
        const storedToken = await AsyncStorage.getItem('auth_token');
        const storedUser = await AsyncStorage.getItem('user_data');
        
        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('🔑 Error cargando datos almacenados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStoredToken();
  }, []);

  const handleLogin = async (token, userData) => {
    try {
      console.log('🔑 Iniciando login con token y datos de usuario');
      
      if (!token || !userData) {
        console.error('🔑 Error: Datos de login incompletos');
        return { success: false, error: 'Datos de autenticación incompletos' };
      }
      
      let userToStore = userData.user ? userData.user : userData;
      
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('user_data', JSON.stringify(userToStore));
      
      setToken(token);
      setUser(userToStore);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('🔑 Error en login:', error);
      return { success: false, error: error.message };
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      
      api.setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setToken(null);
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Incluso si falla el logout en el servidor, limpiar el cliente
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      api.setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setToken(null);
      
      return { 
        success: false, 
        error: error.message || 'Error al cerrar sesión' 
      };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      const newUserData = { ...user, ...updatedUserData };
      setUser(newUserData);
      await AsyncStorage.setItem('user_data', JSON.stringify(newUserData));
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  };

  const checkAuthStatus = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      if (!storedToken) {
        return { success: false };
      }
      // Aquí podrías validar el token con el backend si es necesario
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    token,
    login: handleLogin,
    logout: handleLogout,
    updateUser,
    checkAuthStatus,
  }), [user, loading, isAuthenticated, token]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthProvider;

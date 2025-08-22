import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        const parsedUserData = JSON.parse(userData);
        apiService.setAuthToken(token);
        setUser(parsedUserData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (token, user) => {
    try {
      console.log('AuthContext - login iniciado con:', { token, user });
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      // Actualizar estado
      setUser(user);
      setIsAuthenticated(true);
      
      console.log('AuthContext - login exitoso, usuario establecido:', user);
      return { success: true, user };
    } catch (error) {
      console.error('AuthContext - error en login:', error);
      return { 
        success: false, 
        error: error.message || 'Error de autenticación' 
      };
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await apiService.register(userData);
      
      if (response.success && response.token && response.user) {
        await AsyncStorage.setItem('authToken', response.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.user));
        
        apiService.setAuthToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        
        return { success: true, user: response.user };
      } else {
        throw new Error(response.message || 'Invalid response from server');
      }
    } catch (error) {
      console.error('Register error:', error);
      return { 
        success: false, 
        error: error.message || 'Error en el registro' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Llamar al endpoint de logout en el servidor
      await apiService.logout();
      
      // Limpiar almacenamiento local
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      
      // Limpiar estado
      apiService.setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Incluso si falla el logout en el servidor, limpiar el cliente
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      apiService.setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
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
      setUser(updatedUserData);
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      return { success: true };
    } catch (error) {
      console.error('Update user error:', error);
      return { 
        success: false, 
        error: error.message || 'Error al actualizar usuario' 
      };
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuthStatus,
  }), [user, loading, isAuthenticated]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

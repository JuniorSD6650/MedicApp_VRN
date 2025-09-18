import api from './api';

const userService = {
  async getProfile() {
    try {
      // Usar el método correcto para llamar a la API
      const response = await api.fetch('/auth/me');
      // La respuesta esperada es { user: { ... } }
      if (response && response.user) {
        return { success: true, data: response.user };
      }
      return { success: false, error: 'No se encontró información de usuario' };
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  },

  async updateProfile(profileData) {
    try {
      // Usar el método correcto para actualizar
      const response = await api.put('/auth/me', profileData);
      return { success: true, data: response.user };
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  },
};

export default userService;

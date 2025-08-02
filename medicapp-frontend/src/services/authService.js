// Datos mockeados para simular la API
const MOCK_USERS = [
  {
    id: 1,
    email: 'admin@medicapp.com',
    password: 'admin123',
    name: 'Administrador',
    lastName: 'Principal',
    role: 'admin',
    dni: '12345678',
    phone: '+1234567890'
  },
  {
    id: 2,
    email: 'doctor@medicapp.com',
    password: 'doctor123',
    name: 'Dr. Juan',
    lastName: 'Pérez',
    role: 'doctor',
    dni: '87654321',
    phone: '+0987654321',
    speciality: 'Medicina General',
    license: 'MP-123456'
  },
  {
    id: 3,
    email: 'paciente@medicapp.com',
    password: 'paciente123',
    name: 'María',
    lastName: 'González',
    role: 'patient',
    dni: '11223344',
    phone: '+1122334455',
    birthDate: '1985-05-15',
    address: 'Calle Falsa 123'
  }
];

// Función para simular delay de red
const simulateNetworkDelay = () => {
  return new Promise(resolve => setTimeout(resolve, 1000));
};

// Función para generar token JWT simulado
const generateMockToken = (user) => {
  return `mock_jwt_token_${user.id}_${Date.now()}`;
};

export const authService = {
  // Función de login
  login: async (email, password) => {
    await simulateNetworkDelay();
    
    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      const token = generateMockToken(user);
      
      return {
        success: true,
        token,
        user: userWithoutPassword,
        message: 'Login exitoso'
      };
    } else {
      return {
        success: false,
        message: 'Credenciales inválidas'
      };
    }
  },

  // Función de registro
  register: async (userData) => {
    await simulateNetworkDelay();
    
    // Verificar si el email ya existe
    const existingUser = MOCK_USERS.find(u => u.email === userData.email);
    
    if (existingUser) {
      return {
        success: false,
        message: 'El email ya está registrado'
      };
    }

    // Crear nuevo usuario
    const newUser = {
      id: MOCK_USERS.length + 1,
      ...userData,
      role: userData.role || 'patient' // Por defecto, nuevo usuario es paciente
    };

    // Agregar a la lista de usuarios (en una app real, esto iría a la base de datos)
    MOCK_USERS.push(newUser);

    const { password: _, ...userWithoutPassword } = newUser;
    const token = generateMockToken(newUser);

    return {
      success: true,
      token,
      user: userWithoutPassword,
      message: 'Registro exitoso'
    };
  },

  // Función para recuperar contraseña
  resetPassword: async (email) => {
    await simulateNetworkDelay();
    
    const user = MOCK_USERS.find(u => u.email === email);
    
    if (user) {
      return {
        success: true,
        message: 'Se ha enviado un enlace de recuperación a tu email'
      };
    } else {
      return {
        success: false,
        message: 'No se encontró una cuenta con ese email'
      };
    }
  },

  // Función para verificar token (opcional, para validaciones futuras)
  verifyToken: async (token) => {
    await simulateNetworkDelay();
    
    // En una app real, aquí verificarías el token con el servidor
    return {
      success: true,
      valid: token.startsWith('mock_jwt_token_')
    };
  },

  // Función para obtener datos del usuario por token
  getUserByToken: async (token) => {
    await simulateNetworkDelay();
    
    // Extraer ID del token mockeado
    const tokenParts = token.split('_');
    if (tokenParts.length >= 4) {
      const userId = parseInt(tokenParts[3]);
      const user = MOCK_USERS.find(u => u.id === userId);
      
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        return {
          success: true,
          user: userWithoutPassword
        };
      }
    }
    
    return {
      success: false,
      message: 'Token inválido'
    };
  }
};

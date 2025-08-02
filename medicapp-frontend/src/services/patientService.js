// Datos mockeados de pacientes
const MOCK_PATIENTS = [
  {
    id: 3,
    name: 'María',
    lastName: 'González',
    email: 'paciente@medicapp.com',
    dni: '11223344',
    phone: '+1122334455',
    birthDate: '1985-05-15',
    address: 'Calle Falsa 123',
    role: 'patient',
    medicalHistory: {
      allergies: ['Penicilina'],
      chronicConditions: ['Hipertensión'],
      emergencyContact: {
        name: 'Pedro González',
        relationship: 'Esposo',
        phone: '+1122334466'
      }
    },
    assignedDoctors: [2]
  },
  {
    id: 4,
    name: 'Carlos',
    lastName: 'Rodríguez',
    email: 'carlos.rodriguez@email.com',
    dni: '22334455',
    phone: '+2233445566',
    birthDate: '1978-09-22',
    address: 'Avenida Principal 456',
    role: 'patient',
    medicalHistory: {
      allergies: [],
      chronicConditions: ['Diabetes tipo 2'],
      emergencyContact: {
        name: 'Ana Rodríguez',
        relationship: 'Esposa',
        phone: '+2233445577'
      }
    },
    assignedDoctors: [2]
  },
  {
    id: 5,
    name: 'Ana',
    lastName: 'López',
    email: 'ana.lopez@email.com',
    dni: '33445566',
    phone: '+3344556677',
    birthDate: '1992-12-10',
    address: 'Calle Secundaria 789',
    role: 'patient',
    medicalHistory: {
      allergies: ['Aspirina', 'Mariscos'],
      chronicConditions: [],
      emergencyContact: {
        name: 'Miguel López',
        relationship: 'Padre',
        phone: '+3344556688'
      }
    },
    assignedDoctors: [2]
  }
];

// Función para simular delay de red
const simulateNetworkDelay = () => {
  return new Promise(resolve => setTimeout(resolve, 500));
};

export const patientService = {
  // Buscar pacientes por nombre o DNI
  searchPatients: async (query) => {
    await simulateNetworkDelay();
    
    if (!query || query.trim().length < 2) {
      return {
        success: true,
        data: []
      };
    }

    const searchTerm = query.toLowerCase().trim();
    
    const filteredPatients = MOCK_PATIENTS.filter(patient => {
      const fullName = `${patient.name} ${patient.lastName}`.toLowerCase();
      const dni = patient.dni.toLowerCase();
      
      return fullName.includes(searchTerm) || dni.includes(searchTerm);
    });

    return {
      success: true,
      data: filteredPatients
    };
  },

  // Obtener detalles completos de un paciente
  getPatientDetails: async (patientId) => {
    await simulateNetworkDelay();
    
    const patient = MOCK_PATIENTS.find(p => p.id === patientId);
    
    if (!patient) {
      return {
        success: false,
        message: 'Paciente no encontrado'
      };
    }

    return {
      success: true,
      data: patient
    };
  },

  // Obtener todos los pacientes (para admin)
  getAllPatients: async () => {
    await simulateNetworkDelay();
    
    return {
      success: true,
      data: MOCK_PATIENTS
    };
  },

  // Obtener pacientes asignados a un médico
  getPatientsByDoctor: async (doctorId) => {
    await simulateNetworkDelay();
    
    const patients = MOCK_PATIENTS.filter(patient => 
      patient.assignedDoctors && patient.assignedDoctors.includes(doctorId)
    );

    return {
      success: true,
      data: patients
    };
  },

  // Crear nuevo paciente
  createPatient: async (patientData) => {
    await simulateNetworkDelay();
    
    // Verificar si el DNI ya existe
    const existingPatient = MOCK_PATIENTS.find(p => p.dni === patientData.dni);
    
    if (existingPatient) {
      return {
        success: false,
        message: 'Ya existe un paciente con ese DNI'
      };
    }

    const newPatient = {
      id: MOCK_PATIENTS.length + 1,
      ...patientData,
      role: 'patient',
      medicalHistory: {
        allergies: [],
        chronicConditions: [],
        emergencyContact: null,
        ...patientData.medicalHistory
      },
      assignedDoctors: []
    };

    MOCK_PATIENTS.push(newPatient);

    return {
      success: true,
      message: 'Paciente creado exitosamente',
      data: newPatient
    };
  },

  // Actualizar información del paciente
  updatePatient: async (patientId, patientData) => {
    await simulateNetworkDelay();
    
    const index = MOCK_PATIENTS.findIndex(p => p.id === patientId);
    
    if (index === -1) {
      return {
        success: false,
        message: 'Paciente no encontrado'
      };
    }

    MOCK_PATIENTS[index] = {
      ...MOCK_PATIENTS[index],
      ...patientData
    };

    return {
      success: true,
      message: 'Paciente actualizado exitosamente',
      data: MOCK_PATIENTS[index]
    };
  },

  // Asignar médico a paciente
  assignDoctorToPatient: async (patientId, doctorId) => {
    await simulateNetworkDelay();
    
    const patient = MOCK_PATIENTS.find(p => p.id === patientId);
    
    if (!patient) {
      return {
        success: false,
        message: 'Paciente no encontrado'
      };
    }

    if (!patient.assignedDoctors) {
      patient.assignedDoctors = [];
    }

    if (!patient.assignedDoctors.includes(doctorId)) {
      patient.assignedDoctors.push(doctorId);
    }

    return {
      success: true,
      message: 'Médico asignado exitosamente',
      data: patient
    };
  },

  // Remover médico de paciente
  removeDoctorFromPatient: async (patientId, doctorId) => {
    await simulateNetworkDelay();
    
    const patient = MOCK_PATIENTS.find(p => p.id === patientId);
    
    if (!patient) {
      return {
        success: false,
        message: 'Paciente no encontrado'
      };
    }

    if (patient.assignedDoctors) {
      patient.assignedDoctors = patient.assignedDoctors.filter(id => id !== doctorId);
    }

    return {
      success: true,
      message: 'Médico removido exitosamente',
      data: patient
    };
  },

  // Obtener estadísticas del paciente
  getPatientStats: async (patientId) => {
    await simulateNetworkDelay();
    
    // Simular estadísticas del paciente
    const stats = {
      totalPrescriptions: Math.floor(Math.random() * 10) + 1,
      activeMedications: Math.floor(Math.random() * 5) + 1,
      completedTreatments: Math.floor(Math.random() * 8) + 1,
      adherenceRate: Math.floor(Math.random() * 30) + 70, // Entre 70% y 100%
      lastVisit: '2025-08-01'
    };

    return {
      success: true,
      data: stats
    };
  }
};

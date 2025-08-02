// Datos mockeados de recetas
const MOCK_PRESCRIPTIONS = [
  {
    id: 1,
    patientId: 3,
    doctorId: 2,
    doctorName: 'Dr. Juan Pérez',
    date: '2025-08-01',
    diagnosis: 'Dolor de cabeza y gastritis',
    status: 'active',
    medications: [
      {
        id: 1,
        name: 'Ibuprofeno',
        dosage: '400mg',
        frequency: 'Cada 8 horas',
        duration: '7 días',
        instructions: 'Tomar con comida'
      },
      {
        id: 2,
        name: 'Omeprazol',
        dosage: '20mg',
        frequency: 'Una vez al día',
        duration: '14 días',
        instructions: 'En ayunas'
      }
    ],
    notes: 'Control en una semana'
  },
  {
    id: 2,
    patientId: 3,
    doctorId: 2,
    doctorName: 'Dr. Juan Pérez',
    date: '2025-07-15',
    diagnosis: 'Hipertensión arterial',
    status: 'active',
    medications: [
      {
        id: 3,
        name: 'Losartán',
        dosage: '50mg',
        frequency: 'Una vez al día',
        duration: 'Permanente',
        instructions: 'Por la mañana'
      }
    ],
    notes: 'Control mensual de presión arterial'
  },
  {
    id: 3,
    patientId: 3,
    doctorId: 2,
    doctorName: 'Dr. Juan Pérez',
    date: '2025-06-20',
    diagnosis: 'Gripe estacional',
    status: 'completed',
    medications: [
      {
        id: 4,
        name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Cada 6 horas',
        duration: '5 días',
        instructions: 'Si hay fiebre'
      }
    ],
    notes: 'Tratamiento completado exitosamente'
  }
];

// Función para simular delay de red
const simulateNetworkDelay = () => {
  return new Promise(resolve => setTimeout(resolve, 500));
};

export const prescriptionService = {
  // Obtener todas las recetas de un paciente
  getPatientPrescriptions: async (patientId) => {
    await simulateNetworkDelay();
    
    const prescriptions = MOCK_PRESCRIPTIONS.filter(prescription => 
      prescription.patientId === patientId
    );

    return {
      success: true,
      data: prescriptions
    };
  },

  // Obtener recetas activas de un paciente
  getActivePrescriptions: async (patientId) => {
    await simulateNetworkDelay();
    
    const activePrescriptions = MOCK_PRESCRIPTIONS.filter(prescription => 
      prescription.patientId === patientId && prescription.status === 'active'
    );

    return {
      success: true,
      data: activePrescriptions
    };
  },

  // Obtener detalles de una receta específica
  getPrescriptionDetails: async (prescriptionId) => {
    await simulateNetworkDelay();
    
    const prescription = MOCK_PRESCRIPTIONS.find(p => p.id === prescriptionId);
    
    if (!prescription) {
      return {
        success: false,
        message: 'Receta no encontrada'
      };
    }

    return {
      success: true,
      data: prescription
    };
  },

  // Crear nueva receta (para médicos)
  createPrescription: async (prescriptionData) => {
    await simulateNetworkDelay();
    
    const newPrescription = {
      id: MOCK_PRESCRIPTIONS.length + 1,
      ...prescriptionData,
      date: new Date().toISOString().split('T')[0],
      status: 'active'
    };

    MOCK_PRESCRIPTIONS.push(newPrescription);

    return {
      success: true,
      message: 'Receta creada exitosamente',
      data: newPrescription
    };
  },

  // Actualizar receta
  updatePrescription: async (prescriptionId, prescriptionData) => {
    await simulateNetworkDelay();
    
    const index = MOCK_PRESCRIPTIONS.findIndex(p => p.id === prescriptionId);
    
    if (index === -1) {
      return {
        success: false,
        message: 'Receta no encontrada'
      };
    }

    MOCK_PRESCRIPTIONS[index] = {
      ...MOCK_PRESCRIPTIONS[index],
      ...prescriptionData
    };

    return {
      success: true,
      message: 'Receta actualizada exitosamente',
      data: MOCK_PRESCRIPTIONS[index]
    };
  },

  // Completar receta (marcar como completada)
  completePrescription: async (prescriptionId) => {
    await simulateNetworkDelay();
    
    const prescription = MOCK_PRESCRIPTIONS.find(p => p.id === prescriptionId);
    
    if (!prescription) {
      return {
        success: false,
        message: 'Receta no encontrada'
      };
    }

    prescription.status = 'completed';

    return {
      success: true,
      message: 'Receta marcada como completada',
      data: prescription
    };
  },

  // Obtener todas las recetas (para admin)
  getAllPrescriptions: async () => {
    await simulateNetworkDelay();
    
    return {
      success: true,
      data: MOCK_PRESCRIPTIONS
    };
  },

  // Obtener recetas por médico
  getPrescriptionsByDoctor: async (doctorId) => {
    await simulateNetworkDelay();
    
    const prescriptions = MOCK_PRESCRIPTIONS.filter(prescription => 
      prescription.doctorId === doctorId
    );

    return {
      success: true,
      data: prescriptions
    };
  },

  // Buscar recetas por criterios
  searchPrescriptions: async (searchCriteria) => {
    await simulateNetworkDelay();
    
    let results = MOCK_PRESCRIPTIONS;

    if (searchCriteria.patientId) {
      results = results.filter(p => p.patientId === searchCriteria.patientId);
    }

    if (searchCriteria.doctorId) {
      results = results.filter(p => p.doctorId === searchCriteria.doctorId);
    }

    if (searchCriteria.status) {
      results = results.filter(p => p.status === searchCriteria.status);
    }

    if (searchCriteria.dateFrom) {
      results = results.filter(p => p.date >= searchCriteria.dateFrom);
    }

    if (searchCriteria.dateTo) {
      results = results.filter(p => p.date <= searchCriteria.dateTo);
    }

    return {
      success: true,
      data: results
    };
  }
};

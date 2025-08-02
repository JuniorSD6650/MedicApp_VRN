import { format, addDays, subDays, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Datos mockeados de medicamentos
const MOCK_MEDICATIONS = [
  {
    id: 1,
    patientId: 3,
    prescriptionId: 1,
    name: 'Ibuprofeno',
    dosage: '400mg',
    frequency: 'Cada 8 horas',
    duration: '7 días',
    instructions: 'Tomar con comida',
    startDate: '2025-08-01',
    endDate: '2025-08-08',
    times: ['08:00', '16:00', '00:00'],
    active: true,
    taken: {
      '2025-08-02': ['08:00', '16:00'],
      '2025-08-01': ['08:00', '16:00', '00:00']
    }
  },
  {
    id: 2,
    patientId: 3,
    prescriptionId: 1,
    name: 'Omeprazol',
    dosage: '20mg',
    frequency: 'Una vez al día',
    duration: '14 días',
    instructions: 'En ayunas',
    startDate: '2025-08-01',
    endDate: '2025-08-15',
    times: ['07:00'],
    active: true,
    taken: {
      '2025-08-02': [],
      '2025-08-01': ['07:00']
    }
  },
  {
    id: 3,
    patientId: 3,
    prescriptionId: 2,
    name: 'Losartán',
    dosage: '50mg',
    frequency: 'Una vez al día',
    duration: 'Permanente',
    instructions: 'Por la mañana',
    startDate: '2025-07-15',
    endDate: null,
    times: ['08:00'],
    active: true,
    taken: {
      '2025-08-02': [],
      '2025-08-01': ['08:00']
    }
  }
];

// Función para simular delay de red
const simulateNetworkDelay = () => {
  return new Promise(resolve => setTimeout(resolve, 500));
};

export const medicationService = {
  // Obtener todos los medicamentos de un paciente
  getPatientMedications: async (patientId) => {
    await simulateNetworkDelay();
    
    const medications = MOCK_MEDICATIONS.filter(med => med.patientId === patientId);
    
    return {
      success: true,
      data: medications
    };
  },

  // Obtener medicamentos para el día actual
  getTodayMedications: async (patientId) => {
    await simulateNetworkDelay();
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const medications = MOCK_MEDICATIONS.filter(med => {
      if (med.patientId !== patientId) return false;
      if (!med.active) return false;
      
      const startDate = parseISO(med.startDate);
      const endDate = med.endDate ? parseISO(med.endDate) : null;
      const todayDate = parseISO(today);
      
      return todayDate >= startDate && (!endDate || todayDate <= endDate);
    });

    // Agregar información de tomas para el día
    const medicationsWithTaken = medications.map(med => ({
      ...med,
      todayTaken: med.taken[today] || [],
      pendingTimes: med.times.filter(time => !((med.taken[today] || []).includes(time)))
    }));

    return {
      success: true,
      data: medicationsWithTaken
    };
  },

  // Obtener medicamentos para una fecha específica
  getMedicationsByDate: async (patientId, date) => {
    await simulateNetworkDelay();
    
    const dateStr = format(parseISO(date), 'yyyy-MM-dd');
    const medications = MOCK_MEDICATIONS.filter(med => {
      if (med.patientId !== patientId) return false;
      if (!med.active) return false;
      
      const startDate = parseISO(med.startDate);
      const endDate = med.endDate ? parseISO(med.endDate) : null;
      const targetDate = parseISO(dateStr);
      
      return targetDate >= startDate && (!endDate || targetDate <= endDate);
    });

    // Agregar información de tomas para la fecha
    const medicationsWithTaken = medications.map(med => ({
      ...med,
      dateTaken: med.taken[dateStr] || [],
      pendingTimes: med.times.filter(time => !((med.taken[dateStr] || []).includes(time)))
    }));

    return {
      success: true,
      data: medicationsWithTaken
    };
  },

  // Marcar medicamento como tomado
  markAsTaken: async (medicationId, date, time) => {
    await simulateNetworkDelay();
    
    const medication = MOCK_MEDICATIONS.find(med => med.id === medicationId);
    
    if (!medication) {
      return {
        success: false,
        message: 'Medicamento no encontrado'
      };
    }

    const dateStr = format(parseISO(date), 'yyyy-MM-dd');
    
    // Inicializar el array de tomas para la fecha si no existe
    if (!medication.taken[dateStr]) {
      medication.taken[dateStr] = [];
    }

    // Agregar la hora si no está ya registrada
    if (!medication.taken[dateStr].includes(time)) {
      medication.taken[dateStr].push(time);
    }

    return {
      success: true,
      message: 'Medicamento marcado como tomado',
      data: medication
    };
  },

  // Desmarcar medicamento como tomado
  unmarkAsTaken: async (medicationId, date, time) => {
    await simulateNetworkDelay();
    
    const medication = MOCK_MEDICATIONS.find(med => med.id === medicationId);
    
    if (!medication) {
      return {
        success: false,
        message: 'Medicamento no encontrado'
      };
    }

    const dateStr = format(parseISO(date), 'yyyy-MM-dd');
    
    if (medication.taken[dateStr]) {
      medication.taken[dateStr] = medication.taken[dateStr].filter(t => t !== time);
    }

    return {
      success: true,
      message: 'Medicamento desmarcado',
      data: medication
    };
  },

  // Obtener todos los medicamentos (para admin/doctor)
  getAllMedications: async () => {
    await simulateNetworkDelay();
    
    return {
      success: true,
      data: MOCK_MEDICATIONS
    };
  },

  // Agregar nuevo medicamento
  addMedication: async (medicationData) => {
    await simulateNetworkDelay();
    
    const newMedication = {
      id: MOCK_MEDICATIONS.length + 1,
      ...medicationData,
      active: true,
      taken: {}
    };

    MOCK_MEDICATIONS.push(newMedication);

    return {
      success: true,
      message: 'Medicamento agregado exitosamente',
      data: newMedication
    };
  },

  // Actualizar medicamento
  updateMedication: async (medicationId, medicationData) => {
    await simulateNetworkDelay();
    
    const index = MOCK_MEDICATIONS.findIndex(med => med.id === medicationId);
    
    if (index === -1) {
      return {
        success: false,
        message: 'Medicamento no encontrado'
      };
    }

    MOCK_MEDICATIONS[index] = {
      ...MOCK_MEDICATIONS[index],
      ...medicationData
    };

    return {
      success: true,
      message: 'Medicamento actualizado exitosamente',
      data: MOCK_MEDICATIONS[index]
    };
  },

  // Desactivar medicamento
  deactivateMedication: async (medicationId) => {
    await simulateNetworkDelay();
    
    const medication = MOCK_MEDICATIONS.find(med => med.id === medicationId);
    
    if (!medication) {
      return {
        success: false,
        message: 'Medicamento no encontrado'
      };
    }

    medication.active = false;

    return {
      success: true,
      message: 'Medicamento desactivado exitosamente',
      data: medication
    };
  }
};

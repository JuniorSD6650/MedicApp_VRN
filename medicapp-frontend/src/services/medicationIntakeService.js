// Mock service para gestión de tomas de medicamentos
import { medicationService } from './medicationService';

// Simulación de datos de tomas de medicamentos por paciente
const medicationIntakes = {
  'patient_1': [
    {
      id: 'intake_1',
      patientId: 'patient_1',
      medicationId: 'med_1',
      name: 'Omeprazol 20mg',
      dosage: '20mg',
      frequency: 'Cada 24 horas',
      duration: '30 días',
      startDate: '2025-07-15',
      endDate: '2025-08-14',
      instructions: 'Tomar en ayunas, 30 minutos antes del desayuno',
      status: 'active',
      prescriptionId: 'rx_1'
    },
    {
      id: 'intake_2',
      patientId: 'patient_1',
      medicationId: 'med_2',
      name: 'Ibuprofeno 400mg',
      dosage: '400mg',
      frequency: 'Cada 8 horas',
      duration: '5 días',
      startDate: '2025-07-20',
      endDate: '2025-07-25',
      instructions: 'Tomar después de las comidas',
      status: 'completed',
      prescriptionId: 'rx_1'
    }
  ],
  'patient_2': [
    {
      id: 'intake_3',
      patientId: 'patient_2',
      medicationId: 'med_3',
      name: 'Metformina 850mg',
      dosage: '850mg',
      frequency: 'Cada 12 horas',
      duration: '90 días',
      startDate: '2025-06-01',
      endDate: '2025-08-30',
      instructions: 'Tomar con las comidas principales',
      status: 'active',
      prescriptionId: 'rx_2'
    }
  ],
  'patient_3': [
    {
      id: 'intake_4',
      patientId: 'patient_3',
      medicationId: 'med_4',
      name: 'Amoxicilina 500mg',
      dosage: '500mg',
      frequency: 'Cada 8 horas',
      duration: '10 días',
      startDate: '2025-07-25',
      endDate: '2025-08-04',
      instructions: 'Completar todo el tratamiento aunque se sienta mejor',
      status: 'active',
      prescriptionId: 'rx_3'
    }
  ]
};

// Simulación de registro de tomas diarias
const dailyIntakes = [
  {
    id: 'daily_1',
    patientId: 'patient_1',
    medicationId: 'med_1',
    medicationName: 'Omeprazol 20mg',
    date: '2025-08-02',
    scheduledTime: '08:00',
    takenTime: '08:15',
    status: 'taken',
    notes: ''
  },
  {
    id: 'daily_2',
    patientId: 'patient_1',
    medicationId: 'med_5',
    medicationName: 'Vitamina D',
    date: '2025-08-02',
    scheduledTime: '09:00',
    takenTime: null,
    status: 'pending',
    notes: ''
  },
  {
    id: 'daily_3',
    patientId: 'patient_1',
    medicationId: 'med_6',
    medicationName: 'Calcio',
    date: '2025-08-02',
    scheduledTime: '20:00',
    takenTime: null,
    status: 'pending',
    notes: ''
  }
];

export const medicationIntakeService = {
  // Obtener todos los medicamentos activos de un paciente
  getMedicationsByPatientId: async (patientId) => {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simular delay
    return medicationIntakes[patientId] || [];
  },

  // Obtener medicamentos para un día específico
  getDailyMedications: async (patientId, date) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Filtrar por paciente y fecha
    const patientDailyIntakes = dailyIntakes.filter(
      intake => intake.patientId === patientId && intake.date === date
    );

    // Si no hay datos para la fecha, generar algunos medicamentos de ejemplo
    if (patientDailyIntakes.length === 0) {
      const patientMedications = medicationIntakes[patientId] || [];
      const activeMedications = patientMedications.filter(med => med.status === 'active');
      
      return activeMedications.map((med, index) => ({
        id: `daily_${date}_${index}`,
        patientId,
        medicationId: med.medicationId,
        medicationName: med.name,
        dosage: med.dosage,
        date,
        scheduledTime: ['08:00', '14:00', '20:00'][index % 3],
        takenTime: null,
        status: 'pending',
        notes: '',
        frequency: med.frequency,
        instructions: med.instructions
      }));
    }

    return patientDailyIntakes;
  },

  // Marcar medicamento como tomado
  markMedicationAsTaken: async (intakeId, takenTime = null) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const intake = dailyIntakes.find(item => item.id === intakeId);
    if (intake) {
      intake.status = 'taken';
      intake.takenTime = takenTime || new Date().toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      return { success: true, intake };
    }
    
    return { success: false, error: 'Medicamento no encontrado' };
  },

  // Marcar medicamento como pendiente
  markMedicationAsPending: async (intakeId) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const intake = dailyIntakes.find(item => item.id === intakeId);
    if (intake) {
      intake.status = 'pending';
      intake.takenTime = null;
      return { success: true, intake };
    }
    
    return { success: false, error: 'Medicamento no encontrado' };
  },

  // Agregar nota a una toma
  addNote: async (intakeId, note) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const intake = dailyIntakes.find(item => item.id === intakeId);
    if (intake) {
      intake.notes = note;
      return { success: true, intake };
    }
    
    return { success: false, error: 'Medicamento no encontrado' };
  },

  // Obtener estadísticas de adherencia
  getAdherenceStats: async (patientId, startDate, endDate) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Simular cálculo de estadísticas
    const totalMedications = 21; // 7 días × 3 medicamentos
    const takenMedications = 18;
    const adherencePercentage = Math.round((takenMedications / totalMedications) * 100);
    
    return {
      totalMedications,
      takenMedications,
      missedMedications: totalMedications - takenMedications,
      adherencePercentage,
      period: { startDate, endDate }
    };
  },

  // Obtener historial de tomas
  getIntakeHistory: async (patientId, limit = 10) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Simular historial de tomas
    const history = [];
    const today = new Date();
    
    for (let i = 0; i < limit; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      history.push({
        id: `history_${i}`,
        date: date.toISOString().split('T')[0],
        medicationName: ['Omeprazol 20mg', 'Vitamina D', 'Calcio'][i % 3],
        scheduledTime: '08:00',
        takenTime: i % 4 === 0 ? null : '08:15',
        status: i % 4 === 0 ? 'missed' : 'taken'
      });
    }
    
    return history;
  },

  // Crear nuevo registro de medicamento para un paciente
  createMedicationIntake: async (patientId, medicationData) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newIntake = {
      id: `intake_${Date.now()}`,
      patientId,
      ...medicationData,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    if (!medicationIntakes[patientId]) {
      medicationIntakes[patientId] = [];
    }
    
    medicationIntakes[patientId].push(newIntake);
    return { success: true, intake: newIntake };
  },

  // Actualizar medicamento
  updateMedicationIntake: async (intakeId, updates) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    for (const patientId in medicationIntakes) {
      const intake = medicationIntakes[patientId].find(item => item.id === intakeId);
      if (intake) {
        Object.assign(intake, updates);
        return { success: true, intake };
      }
    }
    
    return { success: false, error: 'Medicamento no encontrado' };
  },

  // Suspender medicamento
  suspendMedicationIntake: async (intakeId, reason = '') => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    for (const patientId in medicationIntakes) {
      const intake = medicationIntakes[patientId].find(item => item.id === intakeId);
      if (intake) {
        intake.status = 'suspended';
        intake.suspensionReason = reason;
        intake.suspendedAt = new Date().toISOString();
        return { success: true, intake };
      }
    }
    
    return { success: false, error: 'Medicamento no encontrado' };
  }
};

export default medicationIntakeService;

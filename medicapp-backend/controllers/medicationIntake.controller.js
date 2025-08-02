const { MedicationIntake, PrescriptionItem, Prescription, Patient, Medication, Professional } = require('../models');
const { Op } = require('sequelize');

// Obtener las tomas pendientes para el paciente autenticado
const getMyPendingIntakes = async (req, res) => {
  try {
    // Buscar paciente asociado al usuario
    const patient = await Patient.findOne({
      where: { dni: req.user.dni }
    });

    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: 'No se encontró información de paciente asociada a este usuario' 
      });
    }

    // Obtener la fecha actual
    const now = new Date();
    // Fecha de 24 horas antes para mostrar tomas recientes también
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    // Fecha para mostrar tomas programadas próximas (3 días después)
    const futureDays = new Date(now);
    futureDays.setDate(futureDays.getDate() + 3);

    // Buscar tomas pendientes o recientes
    const pendingIntakes = await MedicationIntake.findAll({
      where: {
        scheduled_time: {
          [Op.between]: [yesterday, futureDays]
        }
      },
      include: [
        {
          model: PrescriptionItem,
          as: 'prescription_item',
          include: [
            {
              model: Prescription,
              as: 'receta',
              where: { paciente_id: patient.id },
              include: [
                { model: Patient, as: 'paciente' },
                { model: Professional, as: 'profesional' }
              ]
            },
            {
              model: Medication,
              as: 'medicamento'
            }
          ]
        }
      ],
      order: [['scheduled_time', 'ASC']]
    });

    // Organizar tomas por día para mejor visualización
    const organizedIntakes = {
      past: [], // Tomas pasadas (ayer)
      today: [], // Tomas de hoy
      upcoming: [] // Tomas próximas
    };

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    pendingIntakes.forEach(intake => {
      const intakeTime = new Date(intake.scheduled_time);
      
      if (intakeTime < todayStart) {
        organizedIntakes.past.push(intake);
      } else if (intakeTime >= todayStart && intakeTime <= todayEnd) {
        organizedIntakes.today.push(intake);
      } else {
        organizedIntakes.upcoming.push(intake);
      }
    });

    res.json({ 
      success: true,
      intakes: organizedIntakes
    });
  } catch (error) {
    console.error('Error al obtener tomas pendientes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener todas mis tomas (historial completo)
const getMyIntakeHistory = async (req, res) => {
  try {
    // Buscar paciente asociado al usuario
    const patient = await Patient.findOne({
      where: { dni: req.user.dni }
    });

    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: 'No se encontró información de paciente asociada a este usuario' 
      });
    }

    // Obtener todas las tomas del paciente
    const intakes = await MedicationIntake.findAll({
      include: [
        {
          model: PrescriptionItem,
          as: 'prescription_item',
          include: [
            {
              model: Prescription,
              as: 'receta',
              where: { paciente_id: patient.id },
              include: [{ model: Professional, as: 'profesional' }]
            },
            {
              model: Medication,
              as: 'medicamento'
            }
          ]
        }
      ],
      order: [['scheduled_time', 'DESC']]
    });

    // Calcular estadísticas de cumplimiento
    const totalIntakes = intakes.length;
    const takenIntakes = intakes.filter(intake => intake.taken).length;
    const complianceRate = totalIntakes > 0 ? (takenIntakes / totalIntakes) * 100 : 0;

    // Agrupar por mes para visualización de gráficos
    const monthlyData = {};
    intakes.forEach(intake => {
      const date = new Date(intake.scheduled_time);
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          total: 0,
          taken: 0,
          compliance: 0
        };
      }
      
      monthlyData[monthYear].total++;
      if (intake.taken) {
        monthlyData[monthYear].taken++;
      }
    });

    // Calcular tasa de cumplimiento por mes
    for (const month in monthlyData) {
      monthlyData[month].compliance = 
        (monthlyData[month].taken / monthlyData[month].total) * 100;
    }

    res.json({ 
      success: true, 
      intakes,
      stats: {
        total: totalIntakes,
        taken: takenIntakes,
        pending: totalIntakes - takenIntakes,
        complianceRate: complianceRate.toFixed(2),
        monthlyData
      }
    });
  } catch (error) {
    console.error('Error al obtener historial de tomas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Marcar una toma como realizada
const markIntakeAsTaken = async (req, res) => {
  try {
    const { intakeId } = req.params;
    
    // Buscar la toma
    const intake = await MedicationIntake.findByPk(intakeId, {
      include: [
        {
          model: PrescriptionItem,
          as: 'prescription_item',
          include: [
            {
              model: Prescription,
              as: 'receta'
            }
          ]
        }
      ]
    });
    
    if (!intake) {
      return res.status(404).json({ 
        success: false, 
        message: 'Toma no encontrada' 
      });
    }
    
    // Verificar que la toma pertenece al paciente
    const patient = await Patient.findOne({
      where: { dni: req.user.dni }
    });
    
    if (!patient || intake.prescription_item.receta.paciente_id !== patient.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permiso para modificar esta toma' 
      });
    }
    
    // Marcar como tomada
    intake.taken = true;
    intake.taken_time = new Date();
    await intake.save();
    
    res.json({ 
      success: true, 
      message: 'Toma marcada como realizada exitosamente',
      intake
    });
  } catch (error) {
    console.error('Error al marcar toma como realizada:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Para médicos: obtener historial de tomas de un paciente específico
const getPatientIntakeHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Verificar que el usuario es un médico
    if (req.user.rol !== 'medico') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado. Solo médicos pueden ver historiales de tomas' 
      });
    }
    
    // Buscar al paciente
    let patient = null;
    
    // Verificar si patientId es un DNI (string) o un ID (número)
    const isNumericId = !isNaN(parseInt(patientId)) && patientId.length <= 5;
    
    if (isNumericId) {
      console.log('Buscando paciente por ID numérico:', patientId);
      patient = await Patient.findByPk(patientId);
    } else {
      console.log('Buscando paciente por DNI:', patientId);
      patient = await Patient.findOne({
        where: { dni: patientId }
      });
    }
    
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Paciente no encontrado' 
      });
    }
    
    // Obtener todas las tomas del paciente
    const intakes = await MedicationIntake.findAll({
      include: [
        {
          model: PrescriptionItem,
          as: 'prescription_item',
          include: [
            {
              model: Prescription,
              as: 'receta',
              where: { paciente_id: patient.id },
              include: [{ model: Professional, as: 'profesional' }]
            },
            {
              model: Medication,
              as: 'medicamento'
            }
          ]
        }
      ],
      order: [['scheduled_time', 'DESC']]
    });
    
    // Calcular estadísticas
    const totalIntakes = intakes.length;
    const takenIntakes = intakes.filter(intake => intake.taken).length;
    const complianceRate = totalIntakes > 0 ? (takenIntakes / totalIntakes) * 100 : 0;

    // Agrupar tomas por medicamento para análisis
    const medicationGroups = {};
    intakes.forEach(intake => {
      const medicationId = intake.prescription_item.medicamento_id;
      const medicationName = intake.prescription_item.medicamento.descripcion;
      
      if (!medicationGroups[medicationId]) {
        medicationGroups[medicationId] = {
          id: medicationId,
          name: medicationName,
          total: 0,
          taken: 0,
          compliance: 0
        };
      }
      
      medicationGroups[medicationId].total++;
      if (intake.taken) {
        medicationGroups[medicationId].taken++;
      }
    });

    // Calcular tasa de cumplimiento por medicamento
    for (const medId in medicationGroups) {
      medicationGroups[medId].compliance = 
        (medicationGroups[medId].taken / medicationGroups[medId].total) * 100;
    }
    
    res.json({ 
      success: true, 
      patient,
      intakes,
      stats: {
        total: totalIntakes,
        taken: takenIntakes,
        pending: totalIntakes - takenIntakes,
        complianceRate: complianceRate.toFixed(2)
      },
      medicationGroups: Object.values(medicationGroups)
    });
  } catch (error) {
    console.error('Error al obtener historial de tomas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  getMyPendingIntakes,
  getMyIntakeHistory,
  markIntakeAsTaken,
  getPatientIntakeHistory
};

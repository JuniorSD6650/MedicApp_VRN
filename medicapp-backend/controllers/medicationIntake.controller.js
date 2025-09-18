const { MedicationIntake, PrescriptionItem, Prescription, Patient, Medication, Professional, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

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

// Toggle (marcar/desmarcar) una toma como realizada
const toggleIntakeTaken = async (req, res) => {
  try {
    const { intakeId } = req.params;
    logger.info(`Recibida solicitud para toggle de toma ID=${intakeId}`, 'MedicationIntakeController');
    
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
      logger.warn(`Toma no encontrada: ID=${intakeId}`, 'MedicationIntakeController');
      return res.status(404).json({ 
        success: false, 
        message: `Toma no encontrada con ID ${intakeId}` 
      });
    }
    
    // Verificar que la toma pertenece al paciente
    const patient = await Patient.findOne({
      where: { dni: req.user.dni }
    });
    
    if (!patient) {
      logger.warn(`Paciente no encontrado para usuario DNI=${req.user.dni}`, 'MedicationIntakeController');
      return res.status(404).json({
        success: false,
        message: 'No se encontró información de paciente asociada a este usuario'
      });
    }
    
    logger.info(`Verificando permisos: Paciente ID=${patient.id}, Receta Paciente ID=${intake.prescription_item.receta.paciente_id}`, 'MedicationIntakeController');
    
    if (intake.prescription_item.receta.paciente_id !== patient.id) {
      logger.warn(`Acceso denegado: Paciente ID=${patient.id} intentando modificar toma del paciente ID=${intake.prescription_item.receta.paciente_id}`, 'MedicationIntakeController');
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permiso para modificar esta toma' 
      });
    }
    
    // Cambiar el estado (toggle)
    const currentState = intake.taken;
    intake.taken = !currentState;
    
    // Si estamos marcando como tomado, actualizar el tiempo de toma
    if (intake.taken) {
      intake.taken_time = new Date();
      logger.info(`Medicamento ID=${intakeId} marcado como tomado por paciente ID=${patient.id}`, 'MedicationIntakeController');
    } else {
      // Si estamos desmarcando, resetear el tiempo de toma
      intake.taken_time = null;
      logger.warn(`Medicamento ID=${intakeId} desmarcado por paciente ID=${patient.id}`, 'MedicationIntakeController');
    }
    
    await intake.save();
    
    res.json({ 
      success: true, 
      message: intake.taken ? 'Medicamento marcado como tomado exitosamente' : 'Medicamento desmarcado exitosamente',
      intake
    });
  } catch (error) {
    logger.error(`Error al cambiar estado de toma: ${error.message}`, 'MedicationIntakeController');
    logger.error(`Stack trace: ${error.stack}`, 'MedicationIntakeController');
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

// Nueva función - Obtener medicamentos del día actual
const getMyDailyMedications = async (req, res) => {
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

    const date = req.query.date || new Date().toISOString().split('T')[0];
    logger.info(`Obteniendo medicamentos diarios para usuario ${patient.id} en fecha ${date}`);

    const formattedDate = new Date(date);
    const dateStr = formattedDate.toISOString().split('T')[0];
    
    logger.debug(`Fecha normalizada: ${dateStr}`, 'MedicationIntakeController');

    const intakes = await MedicationIntake.findAll({
      include: [
        {
          model: PrescriptionItem,
          as: 'prescription_item',
          required: true,
          include: [
            {
              model: Prescription,
              as: 'receta',
              required: true,
              where: { paciente_id: patient.id }
            },
            {
              model: Medication,
              as: 'medicamento',
              required: true
            }
          ]
        }
      ],
      where: sequelize.where(
        sequelize.fn('DATE', sequelize.col('MedicationIntake.scheduled_time')),
        dateStr
      ),
      order: [['scheduled_time', 'ASC']]
    });

    logger.info(`Se encontraron ${intakes.length} tomas de medicamento para la fecha ${dateStr}`);
    
    res.json({
      success: true,
      data: intakes
    });
  } catch (error) {
    logger.error(`Error obteniendo medicamentos diarios: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener medicamentos diarios',
      error: error.message
    });
  }
};

// Nueva función - Obtener progreso diario de medicamentos
const getMyDailyProgress = async (req, res) => {
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

    const date = req.query.date || new Date().toISOString().split('T')[0];
    logger.startOperation('getDailyProgress', { patientId: patient.id, date }, 'MedicationIntakeController');

    const formattedDate = new Date(date);
    const dateStr = formattedDate.toISOString().split('T')[0];

    logger.info(`Fecha normalizada para búsqueda: ${dateStr}`, 'MedicationIntakeController');

    // Buscar todas las tomas (MedicationIntake) asociadas al paciente y la fecha
    const intakes = await MedicationIntake.findAll({
      include: [
        {
          model: PrescriptionItem,
          as: 'prescription_item',
          required: true,
          include: [
            {
              model: Prescription,
              as: 'receta',
              required: true,
              where: { paciente_id: patient.id }
            },
            {
              model: Medication,
              as: 'medicamento',
              required: true
            }
          ]
        }
      ],
      where: sequelize.where(
        sequelize.fn('DATE', sequelize.col('MedicationIntake.scheduled_time')),
        dateStr
      ),
      order: [['scheduled_time', 'ASC']]
    });

    logger.info(`Búsqueda completada. Total de tomas encontradas: ${intakes.length}`, 'MedicationIntakeController');

    if (intakes.length === 0) {
      return res.json({
        success: true,
        data: {
          date: dateStr,
          total: 0,
          taken: 0,
          pending: 0,
          percentage: 0,
          intakes: []
        }
      });
    }

    // Transformar las tomas para incluir detalles del medicamento
    const detailedIntakes = intakes.map(intake => ({
      id: intake.id,
      scheduled_time: intake.scheduled_time,
      taken: intake.taken,
      taken_time: intake.taken_time,
      notes: intake.notes,
      medication: {
        id: intake.prescription_item.medicamento.id,
        name: intake.prescription_item.medicamento.descripcion,
        dosage: intake.prescription_item.cantidad_solicitada
      }
    }));

    // Calcular totales
    const total = detailedIntakes.length;
    const taken = detailedIntakes.filter(intake => intake.taken).length;
    const pending = total - taken;
    const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;

    logger.summary('Progreso diario calculado', { total, taken, pending, percentage });

    res.json({
      success: true,
      data: {
        date: dateStr,
        total,
        taken,
        pending,
        percentage,
        intakes: detailedIntakes
      }
    });
  } catch (error) {
    logger.error(`Error al obtener progreso diario: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener progreso diario',
      error: error.message
    });
  }
};

// Nueva función - Obtener medicamentos diarios agrupados
const getMyDailyMedicationsGrouped = async (req, res) => {
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

    const date = req.query.date || new Date().toISOString().split('T')[0];
    logger.info(`Obteniendo medicamentos diarios agrupados para usuario ${patient.id} en fecha ${date}`);

    // Reutilizar la función para obtener medicamentos diarios
    const intakes = await MedicationIntake.findAll({
      include: [
        {
          model: PrescriptionItem,
          as: 'prescription_item',
          required: true,
          include: [
            {
              model: Prescription,
              as: 'receta',
              required: true,
              where: { paciente_id: patient.id }
            },
            {
              model: Medication,
              as: 'medicamento',
              required: true
            }
          ]
        }
      ],
      where: sequelize.where(
        sequelize.fn('DATE', sequelize.col('MedicationIntake.scheduled_time')),
        new Date(date).toISOString().split('T')[0]
      ),
      order: [['scheduled_time', 'ASC']]
    });

    const medicationMap = new Map();

    intakes.forEach(intake => {
      if (!intake.prescription_item || !intake.prescription_item.medicamento) return;

      const medication = intake.prescription_item.medicamento;
      const prescriptionItem = intake.prescription_item;

      if (!medicationMap.has(medication.id)) {
        medicationMap.set(medication.id, {
          id: medication.id,
          name: medication.descripcion,
          description: medication.unidad,
          dosage: prescriptionItem.cantidad_solicitada,
          frequency: prescriptionItem.dx_codigo,
          instructions: prescriptionItem.dx_descripcion,
          times: [],
          dateTaken: []
        });
      }

      const medicationEntry = medicationMap.get(medication.id);

      const schedTime = new Date(intake.scheduled_time);
      const timeStr = `${String(schedTime.getHours()).padStart(2, '0')}:${String(schedTime.getMinutes()).padStart(2, '0')}`;

      medicationEntry.times.push(timeStr);

      if (intake.taken) {
        medicationEntry.dateTaken.push(timeStr);
      }
    });

    res.json({
      success: true,
      data: Array.from(medicationMap.values())
    });
  } catch (error) {
    logger.error(`Error obteniendo medicamentos diarios agrupados: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener medicamentos diarios agrupados',
      error: error.message
    });
  }
};

// Función de diagnóstico
const runDiagnostic = async (req, res) => {
  try {
    logger.info('Ejecutando búsqueda de diagnóstico...', 'MedicationIntakeController');
    
    // 1. Verificar si hay tomas en la tabla
    const totalIntakes = await MedicationIntake.count();
    logger.info(`Total de tomas en la base de datos: ${totalIntakes}`, 'MedicationIntakeController');
    
    // 2. Verificar si hay recetas
    const totalPrescriptions = await Prescription.count();
    logger.info(`Total de recetas en la base de datos: ${totalPrescriptions}`, 'MedicationIntakeController');
    
    // 3. Verificar fechas disponibles
    if (totalIntakes > 0) {
      const availableDates = await sequelize.query(
        'SELECT DISTINCT DATE(scheduled_time) as date FROM medication_intakes ORDER BY date',
        { type: sequelize.QueryTypes.SELECT }
      );
      logger.info(`Fechas disponibles en la base de datos: ${JSON.stringify(availableDates)}`, 'MedicationIntakeController');
    }
    
    // 4. Verificar pacientes con recetas
    const patientsWithPrescriptions = await sequelize.query(
      'SELECT DISTINCT paciente_id FROM prescriptions',
      { type: sequelize.QueryTypes.SELECT }
    );
    logger.info(`Pacientes con recetas: ${JSON.stringify(patientsWithPrescriptions)}`, 'MedicationIntakeController');
    
    res.json({
      success: true,
      message: 'Diagnóstico completado',
      data: {
        totalIntakes,
        totalPrescriptions,
        patientsInfo: patientsWithPrescriptions
      }
    });
  } catch (error) {
    logger.error(`Error en diagnóstico: ${error.message}`, 'MedicationIntakeController');
    res.status(500).json({ 
      success: false, 
      message: 'Error al ejecutar diagnóstico',
      error: error.message
    });
  }
};

module.exports = {
  getMyPendingIntakes,
  getMyIntakeHistory,
  markIntakeAsTaken,
  toggleIntakeTaken,
  getPatientIntakeHistory,
  getMyDailyMedications,
  getMyDailyProgress,
  getMyDailyMedicationsGrouped,
  runDiagnostic
};

const { Patient, Professional, Prescription, PrescriptionItem, Medication } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Obtener recetas y medicamentos del paciente autenticado
const getMyPrescriptions = async (req, res) => {
  logger.startOperation('Obtención de recetas del paciente', { userId: req.user.id, dni: req.user.dni }, 'PrescriptionController');
  try {
    // Buscar paciente asociado al usuario
    const patient = await Patient.findOne({
      where: { dni: req.user.dni }
    });

    if (!patient) {
      logger.warn(`No se encontró paciente asociado al usuario ID=${req.user.id}, DNI=${req.user.dni}`, 'PrescriptionController');
      return res.status(404).json({ 
        success: false, 
        message: 'No se encontró información de paciente asociada a este usuario' 
      });
    }

    logger.info(`Paciente encontrado: ID=${patient.id}, Nombre=${patient.nombre_completo}`, 'PrescriptionController');

    // Buscar recetas del paciente con items y medicamentos
    const prescriptions = await Prescription.findAll({
      where: { paciente_id: patient.id },
      include: [
        {
          model: PrescriptionItem,
          as: 'items',
          include: [
            {
              model: Medication,
              as: 'medicamento'
            }
          ]
        },
        {
          model: Professional,
          as: 'profesional',
          attributes: ['id', 'nombres', 'apellidos', 'cmp']
        }
      ],
      order: [['fecha', 'DESC']]
    });

    logger.info(`Recuperadas ${prescriptions.length} recetas para el paciente ID=${patient.id}`, 'PrescriptionController');

    // Calcular próximas tomas para cada medicamento
    const prescriptionsWithSchedule = prescriptions.map(prescription => {
      const plainPrescription = prescription.get({ plain: true });
      
      // Calcular horarios de toma para cada medicamento
      plainPrescription.items = plainPrescription.items.map(item => {
        // Obtener duracion del medicamento (días)
        const duracionDias = parseInt(item.medicamento.duracion) || 1;
        
        // Calcular tomas por día basado en cantidad y duración
        const tomasPorDia = Math.ceil(item.cantidad_solicitada / duracionDias);
        
        // Calcular intervalo entre tomas (en horas)
        const intervaloHoras = Math.floor(24 / tomasPorDia);
        
        logger.debug(`Calculando horarios para medicamento ID=${item.medicamento_id}: duración=${duracionDias} días, tomas por día=${tomasPorDia}`, 'PrescriptionController');
        
        // Calcular fechas de tomas
        const fechaTomas = [];
        const fechaInicio = new Date(item.fecha_despacho || prescription.fecha);
        
        for (let dia = 0; dia < duracionDias; dia++) {
          for (let toma = 0; toma < tomasPorDia; toma++) {
            const fechaToma = new Date(fechaInicio);
            fechaToma.setDate(fechaToma.getDate() + dia);
            fechaToma.setHours(8 + (toma * intervaloHoras), 0, 0, 0); // Comenzar a las 8 AM
            
            const yaVencio = new Date() > fechaToma;
            const proximasTresHoras = new Date() <= new Date(fechaToma.getTime() + 3 * 60 * 60 * 1000);
            
            fechaTomas.push({
              fecha: fechaToma,
              tomado: item.tomado && yaVencio,
              puedeTomarAhora: yaVencio && proximasTresHoras && !item.tomado
            });
          }
        }
        
        return {
          ...item,
          horarioTomas: fechaTomas
        };
      });
      
      return plainPrescription;
    });

    logger.endOperation('Obtención de recetas del paciente', { 
      prescriptionCount: prescriptions.length,
      patientId: patient.id
    }, 'PrescriptionController');

    res.json({ 
      success: true, 
      prescriptions: prescriptionsWithSchedule
    });
  } catch (error) {
    logger.operationError('Obtención de recetas del paciente', error, 'PrescriptionController');
    console.error('Error al obtener recetas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor al obtener recetas',
      error: error.message
    });
  }
};

// Marcar medicamento como tomado
const markMedicationTaken = async (req, res) => {
  const { prescriptionItemId } = req.body;
  logger.startOperation('Marcar medicamento como tomado', { 
    userId: req.user.id, 
    prescriptionItemId 
  }, 'PrescriptionController');
  
  try {
    if (!prescriptionItemId) {
      logger.warn('Solicitud incompleta: falta prescriptionItemId', 'PrescriptionController');
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere el ID del item de la receta' 
      });
    }

    // Buscar el item de receta
    const prescriptionItem = await PrescriptionItem.findByPk(prescriptionItemId);
    
    if (!prescriptionItem) {
      logger.warn(`Item de receta no encontrado: ID=${prescriptionItemId}`, 'PrescriptionController');
      return res.status(404).json({ 
        success: false, 
        message: 'Item de receta no encontrado' 
      });
    }

    // Verificar que la receta pertenece al paciente
    const prescription = await Prescription.findByPk(prescriptionItem.receta_id);
    
    if (!prescription) {
      logger.warn(`Receta no encontrada: ID=${prescriptionItem.receta_id}`, 'PrescriptionController');
      return res.status(404).json({ 
        success: false, 
        message: 'Receta no encontrada' 
      });
    }

    // Buscar paciente por DNI del usuario
    const patient = await Patient.findOne({
      where: { dni: req.user.dni }
    });

    if (!patient || prescription.paciente_id !== patient.id) {
      logger.warn(`Acceso denegado: Usuario con DNI=${req.user.dni} intentó marcar medicamento de otro paciente`, 'PrescriptionController');
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permiso para modificar esta receta' 
      });
    }

    logger.info(`Marcando medicamento como tomado: Item ID=${prescriptionItem.id}, Receta ID=${prescription.id}, Paciente ID=${patient.id}`, 'PrescriptionController');

    // Marcar como tomado
    prescriptionItem.tomado = true;
    await prescriptionItem.save();

    logger.endOperation('Marcar medicamento como tomado', { 
      itemId: prescriptionItem.id,
      recetaId: prescription.id,
      pacienteId: patient.id
    }, 'PrescriptionController');

    res.json({ 
      success: true, 
      message: 'Medicamento marcado como tomado exitosamente',
      prescriptionItem
    });
  } catch (error) {
    logger.operationError('Marcar medicamento como tomado', error, 'PrescriptionController');
    console.error('Error al marcar medicamento como tomado:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener historial de medicamentos para el médico
const getMedicationHistory = async (req, res) => {
  const { patientId } = req.params;
  logger.startOperation('Obtención de historial de medicamentos', { 
    userId: req.user.id,
    patientId 
  }, 'PrescriptionController');
  
  try {
    console.log('Buscando historial para paciente:', patientId);
    logger.info(`Buscando historial para paciente: ${patientId}`, 'PrescriptionController');
    
    // Verificar que el usuario es un médico
    if (req.user.rol !== 'medico') {
      logger.warn(`Acceso denegado: Usuario con rol=${req.user.rol} intentó acceder a historial médico`, 'PrescriptionController');
      return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado. Solo médicos pueden ver historiales' 
      });
    }
    
    // Buscar al paciente - primero intentar por DNI
    let patient = null;
    
    // Verificar si patientId es un DNI (string) o un ID (número)
    const isNumericId = !isNaN(parseInt(patientId)) && patientId.length <= 5; // IDs suelen ser cortos
    
    if (isNumericId) {
      console.log('Buscando paciente por ID numérico:', patientId);
      logger.debug(`Buscando paciente por ID numérico: ${patientId}`, 'PrescriptionController');
      patient = await Patient.findByPk(patientId);
    } else {
      console.log('Buscando paciente por DNI:', patientId);
      logger.debug(`Buscando paciente por DNI: ${patientId}`, 'PrescriptionController');
      patient = await Patient.findOne({
        where: { dni: patientId }
      });
    }
    
    if (!patient) {
      console.log('Paciente no encontrado con identificador:', patientId);
      logger.warn(`Paciente no encontrado con identificador: ${patientId}`, 'PrescriptionController');
      return res.status(404).json({ 
        success: false, 
        message: 'Paciente no encontrado' 
      });
    }
    
    console.log('Paciente encontrado:', patient.nombre_completo);
    logger.info(`Paciente encontrado: ID=${patient.id}, Nombre=${patient.nombre_completo}`, 'PrescriptionController');
    
    // Obtener historial de recetas con sus items
    const prescriptions = await Prescription.findAll({
      where: { paciente_id: patient.id },
      include: [
        {
          model: PrescriptionItem,
          as: 'items',
          include: [
            {
              model: Medication,
              as: 'medicamento'
            }
          ]
        },
        {
          model: Professional,
          as: 'profesional'
        }
      ],
      order: [['fecha', 'DESC']]
    });
    
    console.log(`Se encontraron ${prescriptions.length} recetas para el paciente`);
    logger.info(`Se encontraron ${prescriptions.length} recetas para el paciente ID=${patient.id}`, 'PrescriptionController');
    
    logger.endOperation('Obtención de historial de medicamentos', { 
      patientId: patient.id,
      prescriptionCount: prescriptions.length
    }, 'PrescriptionController');
    
    res.json({ 
      success: true, 
      patient,
      prescriptions 
    });
  } catch (error) {
    logger.operationError('Obtención de historial de medicamentos', error, 'PrescriptionController');
    console.error('Error al obtener historial de medicamentos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener medicamentos pendientes
const getPendingMedications = async (req, res) => {
  try {
    // Aquí va la consulta para obtener medicamentos pendientes
    const pendingItems = await PrescriptionItem.findAll({
      where: {
        tomado: false,
        // Otras condiciones si es necesario
      },
      include: [
        {
          model: Prescription,
          as: 'receta',
          include: [
            {
              model: Patient,
              as: 'paciente'
            },
            {
              model: Professional,
              as: 'profesional'
            }
          ]
        },
        {
          model: Medication,
          as: 'medicamento'
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      pending_medications: pendingItems.map(item => ({
        id: item.id,
        receta_numero: item.receta.num_receta,
        fecha_receta: item.receta.fecha,
        medicamento: {
          codigo: item.medicamento.codigo,
          descripcion: item.medicamento.descripcion,
          unidad: item.medicamento.unidad,
          duracion: item.medicamento.duracion
        },
        cantidad_dispensada: item.cantidad_dispensada,
        fecha_despacho: item.fecha_despacho,
        hora_despacho: item.hora_despacho,
        dx_descripcion: item.dx_descripcion
      }))
    });
  } catch (error) {
    console.error('Error obteniendo medicamentos pendientes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener estadísticas del paciente
const getPatientStats = async (req, res) => {
  try {
    const { id: userId } = req.user;
    
    const user = await require('../models').User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Contar total de medicamentos y tomados
    const totalItems = await PrescriptionItem.count({
      include: [{
        model: Prescription,
        as: 'receta',
        include: [{
          model: Patient,
          as: 'paciente',
          where: { 
            nombre_completo: { [Op.like]: `%${user.nombre}%` }
          }
        }]
      }]
    });

    const takenItems = await PrescriptionItem.count({
      where: { tomado: true },
      include: [{
        model: Prescription,
        as: 'receta',
        include: [{
          model: Patient,
          as: 'paciente',
          where: { 
            nombre_completo: { [Op.like]: `%${user.nombre}%` }
          }
        }]
      }]
    });

    const totalPrescriptions = await Prescription.count({
      include: [{
        model: Patient,
        as: 'paciente',
        where: { 
          nombre_completo: { [Op.like]: `%${user.nombre}%` }
        }
      }]
    });

    res.json({
      stats: {
        total_recetas: totalPrescriptions,
        total_medicamentos: totalItems,
        medicamentos_tomados: takenItems,
        medicamentos_pendientes: totalItems - takenItems,
        porcentaje_cumplimiento: totalItems > 0 ? Math.round((takenItems / totalItems) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener recetas y marcar medicamentos como tomados
const getPrescriptionsAndMarkTaken = async (req, res) => {
  try {
    const { id: userId } = req.user;
    
    // Buscar paciente asociado al usuario
    const user = await require('../models').User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Obtener recetas del paciente
    const prescriptions = await Prescription.findAll({
      where: { paciente_id: user.paciente.id },
      include: [
        {
          model: PrescriptionItem,
          as: 'items',
          include: [{
            model: Medication,
            as: 'medicamento'
          }]
        }
      ],
      order: [['fecha', 'DESC']]
    });

    // Marcar medicamentos como tomados si corresponde
    const now = new Date();
    for (const prescription of prescriptions) {
      for (const item of prescription.items) {
        const dispatchDate = new Date(item.fecha_despacho);
        const nextTakeDate = new Date(dispatchDate.getTime() + item.duracion * 24 * 60 * 60 * 1000);
        
        if (now >= nextTakeDate) {
          item.tomado = true;
          await item.save();
        }
      }
    }

    res.json({
      prescriptions: prescriptions.map(prescription => ({
        id: prescription.id,
        fecha: prescription.fecha,
        num_receta: prescription.num_receta,
        paciente: {
          nombre: prescription.paciente.nombre_completo,
          dni: prescription.paciente.dni
        },
        profesional: {
          nombres: prescription.profesional.nombres,
          apellidos: prescription.profesional.apellidos,
          cmp: prescription.profesional.cmp
        },
        medicamentos: prescription.items.map(item => ({
          id: item.id,
          medicamento: {
            codigo: item.medicamento.codigo,
            descripcion: item.medicamento.descripcion,
            unidad: item.medicamento.unidad,
            duracion: item.medicamento.duracion
          },
          cantidad_solicitada: item.cantidad_solicitada,
          cantidad_dispensada: item.cantidad_dispensada,
          fecha_despacho: item.fecha_despacho,
          hora_despacho: item.hora_despacho,
          tomado: item.tomado,
          dx_codigo: item.dx_codigo,
          dx_descripcion: item.dx_descripcion
        }))
      }))
    });
  } catch (error) {
    console.error('Error obteniendo recetas y marcando como tomadas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// CREATE - Crear una nueva receta médica
const createPrescription = async (req, res) => {
  logger.startOperation('Creación de receta', {
    userId: req.user.id,
    userRol: req.user.rol
  }, 'PrescriptionController');
  
  try {
    const { fecha, num_receta, paciente_id, profesional_id, items } = req.body;
    
    // Validaciones básicas
    if (!fecha || !num_receta || !paciente_id || !profesional_id || !items || !items.length) {
      logger.warn('Solicitud incompleta para crear receta', 'PrescriptionController');
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios para crear la receta'
      });
    }
    
    // Verificar que el médico es quien está creando la receta
    if (req.user.rol !== 'medico') {
      logger.warn(`Acceso denegado: Usuario con rol ${req.user.rol} intentó crear una receta`, 'PrescriptionController');
      return res.status(403).json({
        success: false,
        message: 'Solo los médicos pueden crear recetas'
      });
    }
    
    logger.info(`Creando receta para paciente ID=${paciente_id} por profesional ID=${profesional_id}`, 'PrescriptionController');
    
    // Crear la receta
    const newPrescription = await Prescription.create({
      fecha,
      num_receta,
      paciente_id,
      profesional_id
    });
    
    logger.info(`Receta creada con ID=${newPrescription.id}, Num=${num_receta}`, 'PrescriptionController');
    
    // Crear los items de la receta
    const prescriptionItems = [];
    for (const item of items) {
      logger.debug(`Creando item para medicamento ID=${item.medicamento_id}`, 'PrescriptionController');
      
      const newItem = await PrescriptionItem.create({
        receta_id: newPrescription.id,
        medicamento_id: item.medicamento_id,
        cantidad_solicitada: item.cantidad_solicitada,
        dx_codigo: item.dx_codigo,
        dx_descripcion: item.dx_descripcion,
        tomado: false
      });
      prescriptionItems.push(newItem);
    }
    
    logger.info(`Creados ${prescriptionItems.length} items para la receta ID=${newPrescription.id}`, 'PrescriptionController');
    logger.endOperation('Creación de receta', {
      recetaId: newPrescription.id,
      itemsCount: prescriptionItems.length
    }, 'PrescriptionController');
    
    res.status(201).json({
      success: true,
      message: 'Receta creada exitosamente',
      prescription: {
        ...newPrescription.get({ plain: true }),
        items: prescriptionItems
      }
    });
  } catch (error) {
    logger.operationError('Creación de receta', error, 'PrescriptionController');
    console.error('Error al crear receta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// READ - Obtener una receta específica por ID
const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const prescription = await Prescription.findByPk(id, {
      include: [
        {
          model: PrescriptionItem,
          as: 'items',
          include: [
            {
              model: Medication,
              as: 'medicamento'
            }
          ]
        },
        {
          model: Professional,
          as: 'profesional'
        },
        {
          model: Patient,
          as: 'paciente'
        }
      ]
    });
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }
    
    // Verificar permisos: solo el paciente dueño o profesionales pueden ver
    if (req.user.rol === 'paciente' && prescription.paciente.dni !== req.user.dni) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta receta'
      });
    }
    
    res.json({
      success: true,
      prescription
    });
  } catch (error) {
    console.error('Error al obtener receta por ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// UPDATE - Actualizar una receta existente
const updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, num_receta, items } = req.body;
    
    const prescription = await Prescription.findByPk(id);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }
    
    // Verificar permisos: solo médicos pueden actualizar
    if (req.user.rol !== 'medico' || prescription.profesional_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar esta receta'
      });
    }
    
    // Actualizar datos básicos
    if (fecha) prescription.fecha = fecha;
    if (num_receta) prescription.num_receta = num_receta;
    
    await prescription.save();
    
    // Actualizar items si se proporcionaron
    if (items && items.length) {
      // Primero borrar los items existentes (opcional, podrías actualizarlos)
      await PrescriptionItem.destroy({ where: { receta_id: id } });
      
      // Crear los nuevos items
      const prescriptionItems = [];
      for (const item of items) {
        const newItem = await PrescriptionItem.create({
          receta_id: id,
          medicamento_id: item.medicamento_id,
          cantidad_solicitada: item.cantidad_solicitada,
          dx_codigo: item.dx_codigo,
          dx_descripcion: item.dx_descripcion,
          tomado: item.tomado || false
        });
        prescriptionItems.push(newItem);
      }
      
      res.json({
        success: true,
        message: 'Receta actualizada exitosamente',
        prescription: {
          ...prescription.get({ plain: true }),
          items: prescriptionItems
        }
      });
    } else {
      res.json({
        success: true,
        message: 'Receta actualizada exitosamente',
        prescription
      });
    }
  } catch (error) {
    console.error('Error al actualizar receta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// DELETE - Eliminar una receta
const deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    
    const prescription = await Prescription.findByPk(id);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }
    
    // Verificar permisos: solo médicos pueden eliminar
    if (req.user.rol !== 'medico' || prescription.profesional_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta receta'
      });
    }
    
    // Eliminar items relacionados primero
    await PrescriptionItem.destroy({ where: { receta_id: id } });
    
    // Eliminar la receta
    await prescription.destroy();
    
    res.json({
      success: true,
      message: 'Receta eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar receta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// CRUD para PrescriptionItem

// Crear un nuevo item de receta
const createPrescriptionItem = async (req, res) => {
  try {
    const { receta_id, medicamento_id, cantidad_solicitada, dx_codigo, dx_descripcion } = req.body;
    
    // Validar datos
    if (!receta_id || !medicamento_id || !cantidad_solicitada) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios'
      });
    }
    
    // Verificar que la receta existe
    const prescription = await Prescription.findByPk(receta_id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }
    
    // Verificar permisos
    if (req.user.rol !== 'medico' || prescription.profesional_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar esta receta'
      });
    }
    
    // Crear el item
    const newItem = await PrescriptionItem.create({
      receta_id,
      medicamento_id,
      cantidad_solicitada,
      dx_codigo,
      dx_descripcion,
      tomado: false
    });
    
    res.status(201).json({
      success: true,
      message: 'Item de receta creado exitosamente',
      item: newItem
    });
  } catch (error) {
    console.error('Error al crear item de receta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar un item de receta
const updatePrescriptionItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad_solicitada, cantidad_dispensada, fecha_despacho, hora_despacho, tomado } = req.body;
    
    // Buscar el item
    const item = await PrescriptionItem.findByPk(id, {
      include: [{
        model: Prescription,
        as: 'receta'
      }]
    });
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item de receta no encontrado'
      });
    }
    
    // Verificar permisos
    if (req.user.rol === 'medico') {
      if (item.receta.profesional_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para modificar este item'
        });
      }
    }
    
    // Si es un paciente, solo puede marcar como tomado
    if (req.user.rol === 'paciente') {
      if (Object.keys(req.body).some(key => key !== 'tomado')) {
        return res.status(403).json({
          success: false,
          message: 'Como paciente, solo puedes marcar como tomado'
        });
      }
      
      // Verificar que el paciente es dueño de la receta
      const patient = await Patient.findOne({ where: { dni: req.user.dni } });
      if (!patient || item.receta.paciente_id !== patient.id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para modificar este item'
        });
      }
    }
    
    // Actualizar campos
    if (cantidad_solicitada !== undefined) item.cantidad_solicitada = cantidad_solicitada;
    if (cantidad_dispensada !== undefined) item.cantidad_dispensada = cantidad_dispensada;
    if (fecha_despacho !== undefined) item.fecha_despacho = fecha_despacho;
    if (hora_despacho !== undefined) item.hora_despacho = hora_despacho;
    if (tomado !== undefined) item.tomado = tomado;
    
    await item.save();
    
    res.json({
      success: true,
      message: 'Item de receta actualizado exitosamente',
      item
    });
  } catch (error) {
    console.error('Error al actualizar item de receta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar un item de receta
const deletePrescriptionItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar el item
    const item = await PrescriptionItem.findByPk(id, {
      include: [{
        model: Prescription,
        as: 'receta'
      }]
    });
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item de receta no encontrado'
      });
    }
    
    // Verificar permisos: solo médicos pueden eliminar
    if (req.user.rol !== 'medico' || item.receta.profesional_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar este item'
      });
    }
    
    // Eliminar el item
    await item.destroy();
    
    res.json({
      success: true,
      message: 'Item de receta eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar item de receta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Asegúrate de que solo haya un module.exports al final del archivo
module.exports = {
  getMyPrescriptions,
  markMedicationTaken,
  getMedicationHistory,
  getPendingMedications,
  getPatientStats,
  getPrescriptionsAndMarkTaken,
  createPrescription,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
  createPrescriptionItem,
  updatePrescriptionItem,
  deletePrescriptionItem
};
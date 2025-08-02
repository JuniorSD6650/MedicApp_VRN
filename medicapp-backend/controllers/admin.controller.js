const { Prescription, PrescriptionItem, Patient, Professional, Medication, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Obtener todas las recetas (solo admin)
const getAllPrescriptions = async (req, res) => {
  logger.startOperation('Obtención de todas las recetas', req.query, 'AdminController');
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = search ? {
      [Op.or]: [
        { num_receta: { [Op.like]: `%${search}%` } },
        { '$paciente.nombre_completo$': { [Op.like]: `%${search}%` } },
        { '$paciente.dni$': { [Op.like]: `%${search}%` } }
      ]
    } : {};

    const { rows: prescriptions, count } = await Prescription.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Patient,
          as: 'paciente'
        },
        {
          model: Professional,
          as: 'profesional'
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['fecha', 'DESC']]
    });

    logger.info(`Recuperadas ${prescriptions.length} recetas de un total de ${count}`, 'AdminController');
    logger.endOperation('Obtención de todas las recetas', {
      total: count,
      returned: prescriptions.length,
      page: parseInt(page),
      pages: Math.ceil(count / limit)
    }, 'AdminController');

    res.json({
      prescriptions: prescriptions.map(p => ({
        id: p.id,
        fecha: p.fecha,
        num_receta: p.num_receta,
        paciente: {
          nombre: p.paciente.nombre_completo,
          dni: p.paciente.dni
        },
        profesional: {
          nombres: p.profesional.nombres,
          apellidos: p.profesional.apellidos
        }
      })),
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        current_page: parseInt(page),
        per_page: parseInt(limit)
      }
    });
  } catch (error) {
    logger.operationError('Obtención de todas las recetas', error, 'AdminController');
    console.error('Error obteniendo recetas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener estadísticas generales del sistema
const getSystemStats = async (req, res) => {
  logger.startOperation('Obtención de estadísticas del sistema', {}, 'AdminController');
  try {
    const totalUsers = await User.count();
    const totalPatients = await Patient.count();
    const totalProfessionals = await Professional.count();
    const totalMedications = await Medication.count();
    const totalPrescriptions = await Prescription.count();
    const totalItems = await PrescriptionItem.count();
    const takenItems = await PrescriptionItem.count({ where: { tomado: true } });

    // Estadísticas por mes (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Prescription.findAll({
      where: {
        fecha: { [Op.gte]: sixMonthsAgo }
      },
      attributes: [
        [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('fecha'), '%Y-%m'), 'month'],
        [require('sequelize').fn('COUNT', '*'), 'count']
      ],
      group: ['month'],
      order: [['month', 'ASC']]
    });

    const stats = {
      total_usuarios: totalUsers,
      total_pacientes: totalPatients,
      total_profesionales: totalProfessionals,
      total_medicamentos: totalMedications,
      total_recetas: totalPrescriptions,
      total_items_medicamentos: totalItems,
      medicamentos_tomados: takenItems,
      porcentaje_cumplimiento_global: totalItems > 0 ? Math.round((takenItems / totalItems) * 100) : 0
    };

    logger.summary('Estadísticas del sistema', stats);
    logger.endOperation('Obtención de estadísticas del sistema', stats, 'AdminController');

    res.json({
      general_stats: stats,
      monthly_prescriptions: monthlyStats.map(stat => ({
        month: stat.getDataValue('month'),
        count: stat.getDataValue('count')
      }))
    });
  } catch (error) {
    logger.operationError('Obtención de estadísticas del sistema', error, 'AdminController');
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Buscar pacientes
const searchPatients = async (req, res) => {
  logger.startOperation('Búsqueda de pacientes', req.query, 'AdminController');
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = search ? {
      [Op.or]: [
        { nombre_completo: { [Op.like]: `%${search}%` } },
        { dni: { [Op.like]: `%${search}%` } }
      ]
    } : {};

    const { rows: patients, count } = await Patient.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['nombre_completo', 'ASC']]
    });

    logger.info(`Búsqueda de pacientes con término "${search}" retornó ${patients.length} resultados`, 'AdminController');
    logger.endOperation('Búsqueda de pacientes', {
      total: count,
      returned: patients.length,
      search_term: search
    }, 'AdminController');

    res.json({
      patients,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        current_page: parseInt(page),
        per_page: parseInt(limit)
      }
    });
  } catch (error) {
    logger.operationError('Búsqueda de pacientes', error, 'AdminController');
    console.error('Error buscando pacientes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener estadísticas del dashboard (admin)
const getDashboardStats = async (req, res) => {
  logger.startOperation('Obtención de estadísticas del dashboard', {}, 'AdminController');
  try {
    // Obtener estadísticas
    const stats = {
      users: await User.count(),
      patients: await Patient.count(),
      professionals: await Professional.count(),
      medications: await Medication.count(),
      prescriptions: await Prescription.count(),
      prescriptionItems: await PrescriptionItem.count(),
    };
    
    // Obtener usuarios recientes
    const recentUsers = await User.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'nombre', 'email', 'rol', 'createdAt']
    });
    
    // Obtener recetas recientes
    const recentPrescriptions = await Prescription.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Patient, as: 'paciente' },
        { model: Professional, as: 'profesional' }
      ]
    });

    logger.summary('Estadísticas del dashboard', stats);
    logger.info(`Obtenidos ${recentUsers.length} usuarios recientes y ${recentPrescriptions.length} recetas recientes`, 'AdminController');
    logger.endOperation('Obtención de estadísticas del dashboard', stats, 'AdminController');
    
    res.json({
      success: true,
      stats,
      recentUsers,
      recentPrescriptions
    });
  } catch (error) {
    logger.operationError('Obtención de estadísticas del dashboard', error, 'AdminController');
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Listar usuarios con paginación y filtrado
const listUsers = async (req, res) => {
  logger.startOperation('Listado de usuarios', req.query, 'AdminController');
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      role = '', 
      sort = 'createdAt', 
      order = 'DESC' 
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Construir condiciones de búsqueda
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { dni: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (role && ['admin', 'medico', 'paciente'].includes(role)) {
      whereClause.rol = role;
    }
    
    // Validar el campo de ordenación
    const validSortFields = ['id', 'nombre', 'email', 'rol', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sort) ? sort : 'createdAt';
    
    // Validar dirección de ordenación
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    logger.debug(`Parámetros de búsqueda: ${JSON.stringify({search, role, sort: sortField, order: sortOrder})}`, 'AdminController');
    
    // Realizar la consulta
    const { rows: users, count } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'nombre', 'email', 'rol', 'dni', 'createdAt', 'updatedAt'],
      limit: parseInt(limit),
      offset: offset,
      order: [[sortField, sortOrder]]
    });
    
    logger.info(`Listado de usuarios: ${users.length} recuperados de un total de ${count}`, 'AdminController');
    logger.endOperation('Listado de usuarios', {
      total: count,
      returned: users.length,
      page: parseInt(page),
      pages: Math.ceil(count / parseInt(limit))
    }, 'AdminController');
    
    res.json({
      success: true,
      users,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.operationError('Listado de usuarios', error, 'AdminController');
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener un usuario específico por ID
const getUserById = async (req, res) => {
  const userId = req.params.id;
  logger.startOperation('Obtención de usuario por ID', { userId }, 'AdminController');
  try {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'nombre', 'email', 'rol', 'dni', 'createdAt', 'updatedAt']
    });
    
    if (!user) {
      logger.warn(`Usuario con ID ${userId} no encontrado`, 'AdminController');
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    logger.info(`Usuario recuperado: ID=${user.id}, Email=${user.email}, Rol=${user.rol}`, 'AdminController');
    logger.endOperation('Obtención de usuario por ID', { userId: user.id, rol: user.rol }, 'AdminController');
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    logger.operationError('Obtención de usuario por ID', error, 'AdminController');
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  getAllPrescriptions,
  getSystemStats,
  searchPatients,
  getDashboardStats,
  listUsers,
  getUserById
};

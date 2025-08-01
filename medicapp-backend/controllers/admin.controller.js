const { Prescription, PrescriptionItem, Patient, Professional, Medication, User } = require('../models');
const { Op } = require('sequelize');

// Obtener todas las recetas (solo admin)
const getAllPrescriptions = async (req, res) => {
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
    console.error('Error obteniendo recetas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener estadísticas generales del sistema
const getSystemStats = async (req, res) => {
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

    res.json({
      general_stats: {
        total_usuarios: totalUsers,
        total_pacientes: totalPatients,
        total_profesionales: totalProfessionals,
        total_medicamentos: totalMedications,
        total_recetas: totalPrescriptions,
        total_items_medicamentos: totalItems,
        medicamentos_tomados: takenItems,
        porcentaje_cumplimiento_global: totalItems > 0 ? Math.round((takenItems / totalItems) * 100) : 0
      },
      monthly_prescriptions: monthlyStats.map(stat => ({
        month: stat.getDataValue('month'),
        count: stat.getDataValue('count')
      }))
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Buscar pacientes
const searchPatients = async (req, res) => {
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
    console.error('Error buscando pacientes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener estadísticas del dashboard (admin)
const getDashboardStats = async (req, res) => {
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
    
    res.json({
      success: true,
      stats,
      recentUsers,
      recentPrescriptions
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
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
  getDashboardStats
};

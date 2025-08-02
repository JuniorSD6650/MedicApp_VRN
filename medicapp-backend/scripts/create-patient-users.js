require('dotenv').config();
const { sequelize } = require('../config/database');
const { Patient, User } = require('../models');
const bcrypt = require('bcrypt');

async function createPatientUsers() {
  try {
    console.log('Iniciando creación de usuarios para pacientes existentes...');
    
    // Encontrar todos los pacientes
    const patients = await Patient.findAll();
    console.log(`Se encontraron ${patients.length} pacientes`);
    
    let created = 0;
    let skipped = 0;
    
    // Para cada paciente, verificar si ya tiene usuario
    for (const patient of patients) {
      const email = `${patient.dni}@medicapp.com`;
      
      // Buscar si ya existe un usuario con este email
      const existingUser = await User.findOne({ where: { email } });
      
      if (!existingUser) {
        // Crear contraseña para todos los usuarios (12345678)
        const defaultPassword = "12345678";
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(defaultPassword, salt);
        
        // Crear el usuario
        await User.create({
          nombre: patient.nombre_completo,
          email: email,
          password_hash: hashedPassword,
          rol: 'paciente',
          dni: patient.dni
        });
        
        created++;
        if (created % 10 === 0) {
          console.log(`Creados ${created} usuarios hasta ahora...`);
        }
      } else {
        skipped++;
      }
    }
    
    console.log(`Proceso completado. Se crearon ${created} usuarios nuevos.`);
    console.log(`Se omitieron ${skipped} pacientes que ya tenían usuario.`);
    
  } catch (error) {
    console.error('Error al crear usuarios para pacientes:', error);
  } finally {
    await sequelize.close();
  }
}

createPatientUsers();

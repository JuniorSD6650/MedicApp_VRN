require('dotenv').config();
const { sequelize } = require('../config/database');

async function updateUserRoles() {
  try {
    console.log('Iniciando actualización de roles de usuario...');
    
    // 1. Modificar la columna rol para eliminar el valor 'profesional'
    await sequelize.query(`
      UPDATE users 
      SET rol = 'medico' 
      WHERE rol = 'profesional';
    `);
    console.log('Usuarios con rol "profesional" actualizados a "medico"');
    
    // 2. Actualizar la definición de la columna para permitir solo los 3 roles
    await sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN rol ENUM('admin', 'medico', 'paciente') 
      NOT NULL DEFAULT 'paciente';
    `);
    console.log('Definición de la columna rol actualizada');
    
    console.log('Actualización completada correctamente');
  } catch (error) {
    console.error('Error al actualizar roles de usuario:', error);
  } finally {
    await sequelize.close();
  }
}

updateUserRoles();

// Para ejecutar este script:
// node scripts/update-user-roles.js

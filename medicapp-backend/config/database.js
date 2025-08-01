const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');

// Función para crear la base de datos si no existe
const createDatabaseIfNotExists = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS || ''
    });

    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    await connection.end();
    console.log(`Base de datos '${process.env.DB_NAME}' verificada/creada`);
  } catch (error) {
    console.error('Error creando base de datos:', error.message);
    throw error;
  }
};

// Crear instancia de Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    define: {
      charset: 'utf8',
      collate: 'utf8_general_ci'
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Exportar tanto la instancia como la función
module.exports = {
  sequelize,
  createDatabaseIfNotExists
};

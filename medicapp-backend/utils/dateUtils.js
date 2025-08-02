const logger = require('./logger');

function parseDate(dateString) {
  if (!dateString || dateString.trim() === '') {
    logger.debug('Intento de parseo de fecha con valor vacío o nulo', 'dateUtils');
    return null;
  }

  try {
    // Formato esperado: d/m/yyyy (ej: 4/10/2024)
    const parts = dateString.trim().split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
      const year = parseInt(parts[2]);
      
      const date = new Date(year, month, day);
      
      // Verificar que la fecha es válida
      if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
        logger.debug(`Fecha parseada correctamente: ${dateString} -> ${date.toISOString()}`, 'dateUtils');
        return date;
      }
    }
    
    logger.warn(`Formato de fecha inválido: ${dateString}`, 'dateUtils');
    return null;
  } catch (error) {
    logger.error(`Error parseando fecha "${dateString}": ${error.message}`, 'dateUtils');
    return null;
  }
}

function formatDate(date) {
  if (!date) {
    logger.debug('Intento de formateo de fecha con valor nulo', 'dateUtils');
    return null;
  }
  const formattedDate = date.toISOString().split('T')[0];
  logger.debug(`Fecha formateada: ${date} -> ${formattedDate}`, 'dateUtils');
  return formattedDate;
}

module.exports = {
  parseDate,
  formatDate
};

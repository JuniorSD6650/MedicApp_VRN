function parseDate(dateString) {
  if (!dateString || dateString.trim() === '') {
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
        return date;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

function formatDate(date) {
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

module.exports = {
  parseDate,
  formatDate
};

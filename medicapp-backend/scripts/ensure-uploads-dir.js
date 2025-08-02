const fs = require('fs');
const path = require('path');

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
  console.log('Creando directorio de uploads...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Directorio de uploads creado en:', uploadsDir);
} else {
  console.log('El directorio de uploads ya existe en:', uploadsDir);
}

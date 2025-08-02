const fs = require('fs');
const csv = require('fast-csv');
const { Patient, Professional, Prescription, PrescriptionItem, Medication } = require('../models');
const { createIntakesForPrescriptionItem } = require('../services/medicationIntake.service');

// Función para procesar archivos CSV de recetas
const processPrescriptionsCsv = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se ha subido ningún archivo' });
    }

    const prescriptionsAdded = [];
    const errors = [];
    let rowCount = 0;
    let processedRows = 0;

    // Stream para leer el CSV
    fs.createReadStream(req.file.path)
      .pipe(csv.parse({ headers: true, delimiter: ';' }))
      .on('error', error => {
        console.error('Error al procesar CSV:', error);
        errors.push('Error al procesar el archivo CSV');
      })
      .on('data', async row => {
        rowCount++;
        try {
          // Buscar o crear paciente
          let [patient, patientCreated] = await Patient.findOrCreate({
            where: { dni: row.DNI },
            defaults: {
              dni: row.DNI,
              nombre_completo: row.PACIENTE,
              sexo: row.SEXO,
              edad: parseInt(row.A__OS) || 0
            }
          });

          // Buscar o crear profesional
          let [professional, professionalCreated] = await Professional.findOrCreate({
            where: { cmp: row.CMP },
            defaults: {
              dni: row.DNI_PROFESIONAL,
              nombres: row.NOMBRE_PROFESIONAL,
              apellidos: `${row.APELLPAT_PROFESIONAL} ${row.APELLMAT_PROFESIONAL}`.trim(),
              cmp: row.CMP
            }
          });

          // Buscar o crear receta
          let [prescription, prescriptionCreated] = await Prescription.findOrCreate({
            where: { 
              num_receta: row.NUM_RECETA,
              paciente_id: patient.id
            },
            defaults: {
              fecha: new Date(formatDate(row.FECHA_SOLICITUD)),
              num_receta: row.NUM_RECETA,
              paciente_id: patient.id,
              profesional_id: professional.id
            }
          });

          if (prescriptionCreated) {
            prescriptionsAdded.push(prescription.num_receta);
          }

          // Buscar o crear medicamento
          let [medication, medicationCreated] = await Medication.findOrCreate({
            where: { codigo: row.COD_MEDICAMENTO },
            defaults: {
              codigo: row.COD_MEDICAMENTO,
              descripcion: row.DESC_MEDICAMENTO,
              unidad: row.UNIDAD,
              duracion: row.DURACION_MED || 30
            }
          });

          // Fecha de despacho
          const fechaDespacho = row.FECHA_DESPACHO ? new Date(formatDate(row.FECHA_DESPACHO)) : null;

          // Buscar o crear item de receta
          let [prescriptionItem, prescriptionItemCreated] = await PrescriptionItem.findOrCreate({
            where: {
              receta_id: prescription.id,
              medicamento_id: medication.id
            },
            defaults: {
              receta_id: prescription.id,
              medicamento_id: medication.id,
              cantidad_solicitada: parseInt(row.CANT_SOLICITUD) || 0,
              cantidad_dispensada: parseInt(row.CANT_ATENDIDA) || 0,
              fecha_despacho: fechaDespacho,
              hora_despacho: row.HORA_DESPACHO || null,
              dx_codigo: row.COD_DX || null,
              dx_descripcion: row.DESC_DX || null,
              tomado: false
            }
          });

          // Si se creó un nuevo item o se actualizó, crear sus tomas programadas
          if (fechaDespacho && (prescriptionItemCreated || !await hasMedicationIntakes(prescriptionItem.id))) {
            await createIntakesForPrescriptionItem(
              prescriptionItem,
              medication,
              fechaDespacho,
              row.HORA_DESPACHO
            );
          }
          
          processedRows++;
        } catch (error) {
          console.error(`Error al procesar fila ${rowCount}:`, error);
          errors.push(`Error en fila ${rowCount}: ${error.message}`);
        }
      })
      .on('end', async () => {
        console.log(`Procesamiento de CSV finalizado. ${rowCount} filas en total, ${processedRows} procesadas.`);
        
        // Eliminar el archivo temporal
        fs.unlinkSync(req.file.path);
        
        res.json({
          success: true,
          message: `Archivo CSV procesado. ${prescriptionsAdded.length} recetas añadidas.`,
          total_rows: rowCount,
          processed_rows: processedRows,
          prescriptions_added: prescriptionsAdded,
          errors: errors
        });
      });
  } catch (error) {
    console.error('Error al procesar archivo CSV:', error);
    // Eliminar el archivo temporal en caso de error
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Función para verificar si un item de receta ya tiene tomas asociadas
async function hasMedicationIntakes(prescriptionItemId) {
  const count = await MedicationIntake.count({
    where: { prescription_item_id: prescriptionItemId }
  });
  return count > 0;
}

// Función para formatear fechas desde el formato DD/MM/YYYY al formato YYYY-MM-DD
function formatDate(dateString) {
  if (!dateString) return null;
  
  const parts = dateString.split('/');
  if (parts.length !== 3) return dateString;
  
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

module.exports = {
  processPrescriptionsCsv
};

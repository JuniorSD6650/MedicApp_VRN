const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const { Patient, Professional, Prescription, PrescriptionItem, Medication, MedicationIntake } = require('../models');
const { createIntakesForPrescriptionItem } = require('../services/medicationIntake.service');
const logger = require('../utils/logger');

// Función para procesar archivos CSV de recetas
const processPrescriptionsCsv = async (req, res) => {
  try {
    logger.startOperation('Procesamiento de archivo CSV de recetas');
    
    if (!req.file) {
      logger.error('No se recibió ningún archivo en la solicitud');
      return res.status(400).json({ success: false, message: 'No se ha subido ningún archivo' });
    }

    // Validar que el archivo sea CSV
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    const allowedMimeTypes = ['text/csv', 'application/csv', 'text/plain'];
    
    if (fileExtension !== 'csv' && !allowedMimeTypes.includes(req.file.mimetype)) {
      logger.error(`Formato de archivo inválido. Archivo: ${req.file.originalname}, Tipo MIME: ${req.file.mimetype}`);
      // Eliminar el archivo temporal si no es válido
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        success: false, 
        message: 'El archivo debe ser un CSV válido. Formatos permitidos: .csv' 
      });
    }

    logger.info(`Archivo CSV válido recibido: ${req.file.originalname} (${req.file.size} bytes)`);

    const prescriptionsAdded = [];
    const errors = [];
    let rowCount = 0;
    let processedRows = 0;

    logger.info('Iniciando lectura y procesamiento del archivo CSV...');

    // Stream para leer el CSV
    fs.createReadStream(req.file.path)
      .pipe(csv.parse({ headers: true, delimiter: ';' }))
      .on('error', error => {
        logger.operationError('Procesamiento CSV', error);
        errors.push('Error al procesar el archivo CSV');
      })
      .on('data', async row => {
        rowCount++;
        logger.processItem('fila', rowCount, 'procesando');
        
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

          if (patientCreated) {
            logger.processItem('paciente', row.DNI, 'creado', { nombre: row.PACIENTE });
          } else {
            logger.processItem('paciente', row.DNI, 'existente encontrado');
          }

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

          if (professionalCreated) {
            logger.processItem('profesional', row.CMP, 'creado', { nombre: row.NOMBRE_PROFESIONAL });
          } else {
            logger.processItem('profesional', row.CMP, 'existente encontrado');
          }

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
            logger.processItem('receta', row.NUM_RECETA, 'creada', { paciente_dni: row.DNI });
          } else {
            logger.processItem('receta', row.NUM_RECETA, 'existente encontrada');
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

          if (medicationCreated) {
            logger.processItem('medicamento', row.COD_MEDICAMENTO, 'creado', { descripcion: row.DESC_MEDICAMENTO });
          } else {
            logger.processItem('medicamento', row.COD_MEDICAMENTO, 'existente encontrado');
          }

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

          if (prescriptionItemCreated) {
            logger.processItem('item_receta', `${row.NUM_RECETA}-${row.COD_MEDICAMENTO}`, 'creado', 
              { medicamento: row.DESC_MEDICAMENTO });
          } else {
            logger.processItem('item_receta', `${row.NUM_RECETA}-${row.COD_MEDICAMENTO}`, 'existente encontrado');
          }

          // Si se creó un nuevo item o se actualizó, crear sus tomas programadas
          if (fechaDespacho && (prescriptionItemCreated || !await hasMedicationIntakes(prescriptionItem.id))) {
            logger.info(`Creando tomas programadas para medicamento: ${row.DESC_MEDICAMENTO}`);
            await createIntakesForPrescriptionItem(
              prescriptionItem,
              medication,
              fechaDespacho,
              row.HORA_DESPACHO
            );
            logger.info(`Tomas programadas creadas exitosamente para medicamento: ${row.DESC_MEDICAMENTO}`);
          } else if (!fechaDespacho) {
            logger.warn(`No se crearon tomas programadas - sin fecha de despacho para medicamento: ${row.DESC_MEDICAMENTO}`);
          } else {
            logger.info(`Tomas programadas ya existen para medicamento: ${row.DESC_MEDICAMENTO}`);
          }
          
          processedRows++;
          logger.processItem('fila', rowCount, 'procesada exitosamente');
        } catch (error) {
          logger.operationError(`Procesamiento fila ${rowCount}`, error);
          logger.error(`Datos de la fila con error: ${JSON.stringify(row, null, 2)}`);
          errors.push(`Error en fila ${rowCount}: ${error.message}`);
        }
      })
      .on('end', async () => {
        // Crear resumen de la operación
        const stats = {
          'Total de filas en el archivo': rowCount,
          'Filas procesadas exitosamente': processedRows,
          'Recetas nuevas añadidas': prescriptionsAdded.length,
          'Errores encontrados': errors.length
        };

        logger.summary('Procesamiento CSV', stats);
        
        if (prescriptionsAdded.length > 0) {
          logger.info(`Números de recetas añadidas: ${prescriptionsAdded.join(', ')}`);
        }
        
        if (errors.length > 0) {
          logger.error(`Errores detallados: ${errors.join('; ')}`);
        }
        
        logger.info('Eliminando archivo temporal...');
        // Eliminar el archivo temporal
        fs.unlinkSync(req.file.path);
        logger.info('Archivo temporal eliminado exitosamente');
        
        logger.endOperation('Procesamiento de archivo CSV de recetas', {
          recetas_agregadas: prescriptionsAdded.length,
          filas_procesadas: processedRows,
          errores: errors.length
        });
        
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
    logger.operationError('Procesamiento crítico de archivo CSV', error);
    
    // Eliminar el archivo temporal en caso de error
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
        logger.info('Archivo temporal eliminado tras error');
      } catch (unlinkError) {
        logger.operationError('Eliminación de archivo temporal', unlinkError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor al procesar el archivo CSV',
      error: error.message
    });
  }
};

// Función para verificar si un item de receta ya tiene tomas asociadas
async function hasMedicationIntakes(prescriptionItemId) {
  try {
    const count = await MedicationIntake.count({
      where: { prescription_item_id: prescriptionItemId }
    });
    logger.debug(`Verificando tomas existentes para item ${prescriptionItemId}: ${count} tomas encontradas`);
    return count > 0;
  } catch (error) {
    logger.operationError(`Verificación de tomas para item ${prescriptionItemId}`, error);
    return false;
  }
}

// Función para formatear fechas desde el formato DD/MM/YYYY al formato YYYY-MM-DD
function formatDate(dateString) {
  if (!dateString) {
    logger.debug('Fecha vacía recibida para formateo');
    return null;
  }
  
  const parts = dateString.split('/');
  if (parts.length !== 3) {
    logger.warn(`Formato de fecha inválido: ${dateString}. Se devuelve sin cambios.`);
    return dateString;
  }
  
  const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
  logger.debug(`Fecha formateada: ${dateString} -> ${formattedDate}`);
  return formattedDate;
}

module.exports = {
  processPrescriptionsCsv
};

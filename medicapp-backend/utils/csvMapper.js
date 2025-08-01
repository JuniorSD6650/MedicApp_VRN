const { parseDate } = require('./dateUtils');

class CSVMapper {
  static mapRow(row) {
    // Mapeo de campos basado en el CSV real
    const mapped = {
      centro: row.CENTRO?.trim(),
      profesional: {
        dni: row.DNI_PROFESIONAL?.trim(),
        cmp: row.CMP?.trim(),
        apellidoPaterno: row.APELLPAT_PROFESIONAL?.trim(),
        apellidoMaterno: row.APELLMAT_PROFESIONAL?.trim(),
        nombres: row.NOMBRE_PROFESIONAL?.trim()
      },
      paciente: {
        dni: row.DNI?.trim(),
        nombre_completo: row.PACIENTE?.trim(),
        sexo: row.SEXO?.trim(),
        edad_anios: parseInt(row.AÑOS) || 0,
        edad_meses: parseInt(row.MESES) || 0,
        edad_dias: parseInt(row.DIAS) || 0,
        tipo_seguro: row.TIPO_SEGURO?.trim(),
        tipo_paciente: row.TIPO_PACIENTE?.trim()
      },
      medicamento: {
        codigo: row.COD_MEDICAMENTO?.trim(),
        descripcion: row.DESC_MEDICAMENTO?.trim(),
        cantidad_solicitada: parseInt(row.CANT_SOLICITUD) || 0,
        cantidad_dispensada: parseInt(row.CANT_ATENDIDA) || 0,
        unidad: row.UNIDAD?.trim(),
        duracion: row.DURACION_MED?.trim(),
        precio: parseFloat(row.PRECIO) || 0
      },
      receta: {
        num_receta: row.NUM_RECETA?.trim(),
        fecha_solicitud: parseDate(row.FECHA_SOLICITUD),
        fecha_despacho: parseDate(row.FECHA_DESPACHO),
        hora_despacho: row.HORA_DESPACHO?.trim()
      },
      diagnostico: {
        codigo: row.COD_DX?.trim(),
        descripcion: row.DESC_DX?.trim()
      },
      farmacia: {
        codigo: row.COD_FARMACIA?.trim(),
        nombre: row.FARMACIA?.trim(),
        usuario_despacho: row.CODUSU_DESPACHO?.trim(),
        nombre_usuario_despacho: row.NOMUSUDESPACHO?.trim()
      },
      tipo_movimiento: row.TIPO_MOVIMIENTO?.trim()
    };

    return mapped;
  }

  static validateRow(mapped, rowIndex) {
    const errors = [];

    // Validaciones críticas
    if (!mapped.paciente.dni) {
      errors.push(`Fila ${rowIndex}: DNI del paciente es requerido`);
    } else if (mapped.paciente.dni.length !== 8 || !/^\d{8}$/.test(mapped.paciente.dni)) {
      errors.push(`Fila ${rowIndex}: DNI del paciente debe tener 8 dígitos`);
    }

    if (!mapped.paciente.nombre_completo) {
      errors.push(`Fila ${rowIndex}: Nombre del paciente es requerido`);
    }

    if (!mapped.profesional.dni) {
      errors.push(`Fila ${rowIndex}: DNI del profesional es requerido`);
    } else if (mapped.profesional.dni.length !== 8 || !/^\d{8}$/.test(mapped.profesional.dni)) {
      errors.push(`Fila ${rowIndex}: DNI del profesional debe tener 8 dígitos`);
    }

    if (!mapped.profesional.nombres) {
      errors.push(`Fila ${rowIndex}: Nombre del profesional es requerido`);
    }

    if (!mapped.medicamento.codigo) {
      errors.push(`Fila ${rowIndex}: Código del medicamento es requerido`);
    }

    if (!mapped.medicamento.descripcion) {
      errors.push(`Fila ${rowIndex}: Descripción del medicamento es requerida`);
    }

    if (!mapped.receta.num_receta) {
      errors.push(`Fila ${rowIndex}: Número de receta es requerido`);
    }

    if (!mapped.receta.fecha_solicitud) {
      errors.push(`Fila ${rowIndex}: Fecha de solicitud es requerida`);
    }

    // Validaciones de formato
    if (mapped.paciente.sexo && !['M', 'F'].includes(mapped.paciente.sexo)) {
      errors.push(`Fila ${rowIndex}: Sexo debe ser 'M' o 'F'`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: mapped
    };
  }
}

module.exports = CSVMapper;

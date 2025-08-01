const { sequelize } = require('../config/database');
const { Patient, Professional, Medication, Prescription, PrescriptionItem, User } = require('../models');
const CSVMapper = require('../utils/csvMapper');
const medicationIntakeService = require('./medicationIntake.service');
const bcrypt = require('bcrypt');

class CSVProcessor {
  constructor() {
    this.stats = {
      totalRows: 0,
      processedRows: 0,
      errorRows: 0,
      createdPatients: 0,
      createdProfessionals: 0,
      createdMedications: 0,
      createdPrescriptions: 0,
      createdPrescriptionItems: 0,
      createdMedicationIntakes: 0,
      createdUsers: 0,
      errors: []
    };
  }

  async processCSVData(csvData) {
    const transaction = await sequelize.transaction();

    try {
      this.stats.totalRows = csvData.length;
      console.log(`Iniciando procesamiento de ${this.stats.totalRows} filas`);

      for (let i = 0; i < csvData.length; i++) {
        const rowIndex = i + 1;
        try {
          await this.processRow(csvData[i], rowIndex, transaction);
          this.stats.processedRows++;

          if (rowIndex % 100 === 0) {
            console.log(`Procesadas ${rowIndex} filas de ${this.stats.totalRows}`);
          }
        } catch (error) {
          this.stats.errorRows++;
          this.stats.errors.push(`Fila ${rowIndex}: ${error.message}`);
          console.error(`Error en fila ${rowIndex}:`, error.message);
        }
      }

      await transaction.commit();
      return this.stats;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async processRow(row, rowIndex, transaction) {
    const validation = CSVMapper.validateRow(CSVMapper.mapRow(row), rowIndex);
    if (!validation.isValid) {
      throw new Error(validation.errors.join('; '));
    }

    const data = validation.data;

    const patient = await this.findOrCreatePatient(data.paciente, transaction);
    const professional = await this.findOrCreateProfessional(data.profesional, transaction);
    const medication = await this.findOrCreateMedication(data.medicamento, transaction);
    const prescription = await this.findOrCreatePrescription({
      num_receta: data.receta.num_receta,
      fecha: data.receta.fecha_solicitud,
      paciente_id: patient.id,
      profesional_id: professional.id
    }, transaction);

    const prescriptionItem = await this.createPrescriptionItem({
      receta_id: prescription.id,
      medicamento_id: medication.id,
      cantidad_solicitada: data.medicamento.cantidad_solicitada,
      cantidad_dispensada: data.medicamento.cantidad_dispensada,
      fecha_despacho: data.receta.fecha_despacho,
      hora_despacho: data.receta.hora_despacho,
      dx_codigo: data.diagnostico.codigo,
      dx_descripcion: data.diagnostico.descripcion
    }, transaction);

    // Generar tomas de medicamentos si hay fecha de despacho
    if (data.receta.fecha_despacho) {
      try {
        const intakes = await medicationIntakeService.createIntakesForPrescriptionItem(
          prescriptionItem, 
          medication, 
          data.receta.fecha_despacho, 
          data.receta.hora_despacho,
          { transaction }
        );
        this.stats.createdMedicationIntakes += intakes.length;
      } catch (error) {
        console.error(`Error creando tomas para fila ${rowIndex}:`, error.message);
        // No lanzamos el error para permitir que continúe el proceso
      }
    }
  }

  async findOrCreatePatient(patientData, transaction) {
    let patient = await Patient.findOne({
      where: { dni: patientData.dni },
      transaction
    });

    if (!patient) {
      patient = await Patient.create({
        dni: patientData.dni,
        nombre_completo: patientData.nombre_completo,
        sexo: patientData.sexo,
        edad_anios: patientData.edad_anios,
        edad_meses: patientData.edad_meses,
        edad_dias: patientData.edad_dias,
        tipo_seguro: patientData.tipo_seguro,
        tipo_paciente: patientData.tipo_paciente
      }, { transaction });

      this.stats.createdPatients++;
      
      // Crear automáticamente un usuario para el paciente
      await this.createUserForPatient(patient, transaction);
    }

    return patient;
  }

  // Nuevo método para crear usuarios para pacientes
  async createUserForPatient(patient, transaction) {
    try {
      // Verificar si ya existe un usuario con este DNI como email
      const email = `${patient.dni}@medicapp.com`;
      let user = await User.findOne({
        where: { email },
        transaction
      });

      if (!user) {
        // Crear contraseña para todos los usuarios (12345678)
        const defaultPassword = "12345678";
        
        // Crear el usuario
        user = await User.create({
          nombre: patient.nombre_completo,
          email: email,
          password_hash: defaultPassword, // Se hasheará automáticamente por el hook del modelo
          rol: 'paciente',
          dni: patient.dni
        }, { transaction });

        console.log(`Usuario creado para el paciente ${patient.nombre_completo} (DNI: ${patient.dni})`);
        this.stats.createdUsers++;
      }
    } catch (error) {
      console.error(`Error al crear usuario para el paciente ${patient.dni}:`, error.message);
      // No lanzamos el error para permitir que continúe el proceso
    }
  }

  async findOrCreateProfessional(professionalData, transaction) {
    let professional = await Professional.findOne({
      where: { dni: professionalData.dni },
      transaction
    });

    if (!professional) {
      professional = await Professional.create({
        dni: professionalData.dni,
        cmp: professionalData.cmp,
        nombres: professionalData.nombres,
        apellidos: `${professionalData.apellidoPaterno || ''} ${professionalData.apellidoMaterno || ''}`.trim()
      }, { transaction });

      this.stats.createdProfessionals++;
    }

    return professional;
  }

  async findOrCreateMedication(medicationData, transaction) {
    let medication = await Medication.findOne({
      where: { codigo: medicationData.codigo },
      transaction
    });

    if (!medication) {
      medication = await Medication.create({
        codigo: medicationData.codigo,
        descripcion: medicationData.descripcion,
        unidad: medicationData.unidad,
        duracion: medicationData.duracion,
        precio: medicationData.precio
      }, { transaction });

      this.stats.createdMedications++;
    }

    return medication;
  }

  async findOrCreatePrescription(prescriptionData, transaction) {
    let prescription = await Prescription.findOne({
      where: {
        num_receta: prescriptionData.num_receta,
        paciente_id: prescriptionData.paciente_id
      },
      transaction
    });

    if (!prescription) {
      prescription = await Prescription.create({
        num_receta: prescriptionData.num_receta,
        fecha: prescriptionData.fecha,
        paciente_id: prescriptionData.paciente_id,
        profesional_id: prescriptionData.profesional_id
      }, { transaction });

      this.stats.createdPrescriptions++;
    }

    return prescription;
  }

  async createPrescriptionItem(itemData, transaction) {
    const prescriptionItem = await PrescriptionItem.create({
      receta_id: itemData.receta_id,
      medicamento_id: itemData.medicamento_id,
      cantidad_solicitada: itemData.cantidad_solicitada,
      cantidad_dispensada: itemData.cantidad_dispensada,
      fecha_despacho: itemData.fecha_despacho,
      hora_despacho: itemData.hora_despacho,
      dx_codigo: itemData.dx_codigo,
      dx_descripcion: itemData.dx_descripcion,
      tomado: false
    }, { transaction });

    this.stats.createdPrescriptionItems++;

    return prescriptionItem;
  }

  calculateBirthDate(years, months, days) {
    const today = new Date();
    const birthYear = today.getFullYear() - (years || 0);
    const birthMonth = today.getMonth() - (months || 0);
    const birthDay = today.getDate() - (days || 0);
    return new Date(birthYear, birthMonth, birthDay);
  }
}

module.exports = CSVProcessor;

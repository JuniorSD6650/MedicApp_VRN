import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';

const CsvUploadScreen = ({ navigation }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStep, setUploadStep] = useState('select'); // 'select', 'preview', 'validate', 'success'
  const [validationResults, setValidationResults] = useState(null);

  // Datos de ejemplo para simular el contenido del CSV
  const sampleCsvData = [
    {
      nombre: 'María García López',
      dni: '12345678A',
      edad: '35',
      telefono: '912345678',
      email: 'maria.garcia@email.com',
      diagnostico: 'Hipertensión arterial',
      medicamento: 'Enalapril 10mg',
      dosis: '1 comprimido cada 12 horas',
      duracion: '30 días'
    },
    {
      nombre: 'Juan Pérez Martín',
      dni: '87654321B',
      edad: '42',
      telefono: '923456789',
      email: 'juan.perez@email.com',
      diagnostico: 'Diabetes tipo 2',
      medicamento: 'Metformina 850mg',
      dosis: '1 comprimido cada 8 horas',
      duracion: '60 días'
    },
    {
      nombre: 'Ana Rodríguez Silva',
      dni: '11223344C',
      edad: '28',
      telefono: '934567890',
      email: 'ana.rodriguez@email.com',
      diagnostico: 'Infección respiratoria',
      medicamento: 'Amoxicilina 500mg',
      dosis: '1 cápsula cada 8 horas',
      duracion: '7 días'
    }
  ];

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/comma-separated-values',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        setUploadStep('preview');
        
        // Simular procesamiento del archivo
        setTimeout(() => {
          setCsvData(sampleCsvData);
        }, 1000);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const validateData = () => {
    setIsProcessing(true);
    setUploadStep('validate');

    // Simular validación
    setTimeout(() => {
      const results = {
        totalRows: csvData.length,
        validRows: csvData.length - 1,
        errors: [
          {
            row: 2,
            field: 'email',
            message: 'Formato de email inválido'
          }
        ],
        warnings: [
          {
            row: 1,
            field: 'telefono',
            message: 'Teléfono ya existe en el sistema'
          }
        ]
      };
      setValidationResults(results);
      setIsProcessing(false);
    }, 2000);
  };

  const processUpload = () => {
    setIsProcessing(true);

    // Simular guardado en base de datos
    setTimeout(() => {
      setIsProcessing(false);
      setUploadStep('success');
    }, 3000);
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setCsvData(null);
    setValidationResults(null);
    setUploadStep('select');
  };

  const renderSelectStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.uploadArea}>
        <Text style={styles.uploadIcon}>📁</Text>
        <Text style={styles.uploadTitle}>Cargar archivo CSV</Text>
        <Text style={styles.uploadSubtitle}>
          Selecciona un archivo CSV con datos de pacientes y medicamentos
        </Text>
        
        <TouchableOpacity style={styles.selectButton} onPress={pickDocument}>
          <Text style={styles.selectButtonText}>Seleccionar archivo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Formato requerido</Text>
        <Text style={styles.infoText}>
          El archivo CSV debe contener las siguientes columnas:
        </Text>
        <View style={styles.columnsList}>
          <Text style={styles.columnItem}>• nombre</Text>
          <Text style={styles.columnItem}>• dni</Text>
          <Text style={styles.columnItem}>• edad</Text>
          <Text style={styles.columnItem}>• telefono</Text>
          <Text style={styles.columnItem}>• email</Text>
          <Text style={styles.columnItem}>• diagnostico</Text>
          <Text style={styles.columnItem}>• medicamento</Text>
          <Text style={styles.columnItem}>• dosis</Text>
          <Text style={styles.columnItem}>• duracion</Text>
        </View>
      </View>
    </View>
  );

  const renderPreviewStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName}>{selectedFile?.name}</Text>
        <Text style={styles.fileSize}>
          {selectedFile?.size ? `${(selectedFile.size / 1024).toFixed(2)} KB` : 'Tamaño desconocido'}
        </Text>
      </View>

      <Text style={styles.stepTitle}>Vista previa del contenido</Text>
      
      {csvData ? (
        <ScrollView horizontal style={styles.tableContainer}>
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.tableRow}>
              {Object.keys(csvData[0]).map((key) => (
                <Text key={key} style={styles.tableHeader}>{key}</Text>
              ))}
            </View>
            
            {/* Rows */}
            {csvData.map((row, index) => (
              <View key={index} style={styles.tableRow}>
                {Object.values(row).map((value, cellIndex) => (
                  <Text key={cellIndex} style={styles.tableCell}>{value}</Text>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E86AB" />
          <Text style={styles.loadingText}>Procesando archivo...</Text>
        </View>
      )}

      {csvData && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={resetUpload}>
            <Text style={styles.secondaryButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={validateData}>
            <Text style={styles.primaryButtonText}>Validar datos</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderValidateStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Validación de datos</Text>
      
      {isProcessing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E86AB" />
          <Text style={styles.loadingText}>Validando datos...</Text>
        </View>
      ) : validationResults && (
        <>
          <View style={styles.validationSummary}>
            <Text style={styles.summaryTitle}>Resumen de validación</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total de filas:</Text>
              <Text style={styles.summaryValue}>{validationResults.totalRows}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Filas válidas:</Text>
              <Text style={[styles.summaryValue, { color: '#28A745' }]}>
                {validationResults.validRows}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Errores:</Text>
              <Text style={[styles.summaryValue, { color: '#DC3545' }]}>
                {validationResults.errors.length}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Advertencias:</Text>
              <Text style={[styles.summaryValue, { color: '#FFC107' }]}>
                {validationResults.warnings.length}
              </Text>
            </View>
          </View>

          {validationResults.errors.length > 0 && (
            <View style={styles.issuesContainer}>
              <Text style={styles.issuesTitle}>Errores encontrados</Text>
              {validationResults.errors.map((error, index) => (
                <View key={index} style={styles.errorItem}>
                  <Text style={styles.errorText}>
                    Fila {error.row}, campo '{error.field}': {error.message}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {validationResults.warnings.length > 0 && (
            <View style={styles.issuesContainer}>
              <Text style={styles.issuesTitle}>Advertencias</Text>
              {validationResults.warnings.map((warning, index) => (
                <View key={index} style={styles.warningItem}>
                  <Text style={styles.warningText}>
                    Fila {warning.row}, campo '{warning.field}': {warning.message}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.secondaryButton} onPress={resetUpload}>
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.primaryButton, validationResults.errors.length > 0 && styles.disabledButton]} 
              onPress={processUpload}
              disabled={validationResults.errors.length > 0}
            >
              <Text style={styles.primaryButtonText}>
                {validationResults.errors.length > 0 ? 'Corregir errores' : 'Guardar en BD'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>¡Importación completada!</Text>
        <Text style={styles.successMessage}>
          Los datos se han guardado correctamente en la base de datos.
        </Text>
        
        <View style={styles.successStats}>
          <Text style={styles.successStat}>
            📊 {validationResults?.validRows || 0} registros procesados
          </Text>
          <Text style={styles.successStat}>
            👥 {validationResults?.validRows || 0} pacientes agregados
          </Text>
          <Text style={styles.successStat}>
            💊 {validationResults?.validRows || 0} medicamentos asignados
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={resetUpload}>
            <Text style={styles.secondaryButtonText}>Nuevo archivo</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.primaryButtonText}>Volver al dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill, 
            { width: `${getProgressWidth()}%` }
          ]} />
        </View>
        <Text style={styles.progressText}>{getStepText()}</Text>
      </View>

      <ScrollView style={styles.content}>
        {uploadStep === 'select' && renderSelectStep()}
        {uploadStep === 'preview' && renderPreviewStep()}
        {uploadStep === 'validate' && renderValidateStep()}
        {uploadStep === 'success' && renderSuccessStep()}
      </ScrollView>
    </View>
  );

  function getProgressWidth() {
    switch (uploadStep) {
      case 'select': return 25;
      case 'preview': return 50;
      case 'validate': return 75;
      case 'success': return 100;
      default: return 0;
    }
  }

  function getStepText() {
    switch (uploadStep) {
      case 'select': return 'Paso 1: Seleccionar archivo';
      case 'preview': return 'Paso 2: Vista previa';
      case 'validate': return 'Paso 3: Validación';
      case 'success': return 'Completado';
      default: return '';
    }
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  progressContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E9ECEF',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6C63FF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  stepContainer: {
    paddingBottom: 40,
  },
  uploadArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 24,
  },
  selectButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 12,
  },
  columnsList: {
    marginLeft: 8,
  },
  columnItem: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
  fileInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 14,
    color: '#6C757D',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 16,
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  table: {
    padding: 16,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    paddingVertical: 8,
  },
  tableHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    width: 120,
    marginRight: 8,
    textTransform: 'uppercase',
  },
  tableCell: {
    fontSize: 14,
    color: '#6C757D',
    width: 120,
    marginRight: 8,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 16,
  },
  validationSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  issuesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  issuesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  errorItem: {
    backgroundColor: '#F8D7DA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#721C24',
  },
  warningItem: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
  },
  successContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28A745',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 24,
  },
  successStats: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successStat: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flex: 1,
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#6C63FF',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flex: 1,
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: '#6C757D',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6C63FF',
    textAlign: 'center',
  },
});

export default CsvUploadScreen;

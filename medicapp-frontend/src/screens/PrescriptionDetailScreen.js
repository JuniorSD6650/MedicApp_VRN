import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import prescriptionDetailService from '../services/prescriptionDetailService';
import { useFocusEffect } from '@react-navigation/native';

const PrescriptionDetailScreen = ({ route, navigation }) => {
  const { prescription: initialPrescription, prescriptionId } = route.params;
  const [prescription, setPrescription] = useState(initialPrescription);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { token } = useAuth();

  // Función para cargar los datos actualizados de la receta
  const loadPrescriptionData = useCallback(async () => {
    if (!prescriptionId && !prescription?.id) {
      console.warn("⚠️ No hay ID de prescripción para cargar datos actualizados");
      return;
    }

    try {
      setLoading(true);
      const id = prescriptionId || prescription?.id;
      console.log("🔄 Cargando datos actualizados de la prescripción ID:", id);
      
      // Asegurar que el token está establecido
      await api.setAuthToken(token);
      
      const result = await prescriptionDetailService.getPrescriptionById(id);
      
      if (result.success && result.data) {
        console.log("✅ Datos de prescripción actualizados correctamente");
        setPrescription(result.data);
      } else {
        console.warn("⚠️ Error al cargar datos de prescripción:", result.error);
        // Mostrar un mensaje solo si no tenemos datos previos
        if (!prescription) {
          Alert.alert(
            "Error de conexión",
            "No se pudieron cargar los datos de la receta. Verifica la conexión a internet o inténtalo más tarde.",
            [{ text: "OK" }]
          );
        }
      }
    } catch (error) {
      console.error("❌ Error cargando datos de prescripción:", error);
      if (!prescription) {
        Alert.alert(
          "Error",
          "Ocurrió un problema al cargar los datos. Por favor, inténtalo nuevamente.",
          [{ text: "OK" }]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [prescriptionId, prescription?.id, token]);

  // Cargar datos cuando la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      console.log("🔍 PrescriptionDetailScreen obtuvo el foco - recargando datos");
      loadPrescriptionData();
    }, [loadPrescriptionData])
  );

  // También cargar al montar inicialmente
  useEffect(() => {
    console.log("🔄 Montando PrescriptionDetailScreen - carga inicial");
    loadPrescriptionData();
  }, [loadPrescriptionData]);

  // Función para actualizar los datos mediante pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPrescriptionData();
  }, [loadPrescriptionData]);

  // Mostrar un indicador de carga si no hay datos iniciales
  if (loading && !prescription) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86AB" />
        <Text style={styles.loadingText}>Cargando datos de la receta...</Text>
      </View>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#28A745';
      case 'completed':
        return '#6C757D';
      default:
        return '#FFC107';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'completed':
        return 'Completada';
      default:
        return 'Pendiente';
    }
  };

  const handleContactDoctor = () => {
    Alert.alert(
      'Contactar Médico',
      `¿Deseas contactar a ${prescription.doctorName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Llamar', onPress: () => Alert.alert('Función no disponible', 'Esta función estará disponible próximamente') },
        { text: 'Mensaje', onPress: () => Alert.alert('Función no disponible', 'Esta función estará disponible próximamente') }
      ]
    );
  };

  const handleSharePrescription = async () => {
    try {
      // Formatear los medicamentos como texto
      const medicationsList = prescription.medications.map(med => 
        `• ${med.name} ${med.dosage}${med.taken ? ' (Tomado)' : ' (Pendiente)'}`
      ).join('\n');
      
      // Calcular el progreso
      const takenCount = prescription.medications.filter(med => med.taken).length;
      const totalMeds = prescription.medications.length;
      const progressPercentage = Math.round((takenCount / totalMeds) * 100);
      
      // Crear el mensaje para compartir
      const message = `
📋 RECETA MÉDICA DETALLADA
📅 Fecha: ${format(new Date(prescription.date), 'dd MMMM yyyy', { locale: es })}
👨‍⚕️ Doctor: ${prescription.doctorName}
🔍 Diagnóstico: ${prescription.diagnosis}

💊 MEDICAMENTOS:
${medicationsList}

📊 Progreso: ${takenCount}/${totalMeds} medicamentos tomados (${progressPercentage}%)

📝 Notas: ${prescription.notes || 'Sin notas adicionales'}

🏥 Compartido desde MedicApp
      `;
      
      // Mostrar diálogo de compartir
      const result = await Share.share({
        message: message.trim(),
        title: 'Receta Médica - MedicApp'
      });
      
      if (result.action === Share.sharedAction) {
        console.log('✅ Receta compartida exitosamente');
      } else if (result.action === Share.dismissedAction) {
        console.log('❌ Compartir cancelado');
      }
    } catch (error) {
      console.error('Error al compartir receta:', error);
      Alert.alert('Error', 'No se pudo compartir la receta');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={["#2E86AB"]}
            tintColor="#2E86AB" 
          />
        }
      >
        {/* Header Information */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.dateSection}>
              <Text style={styles.dateLabel}>Fecha de emisión</Text>
              <Text style={styles.dateText}>
                {format(new Date(prescription.date), 'EEEE, d MMMM yyyy', { locale: es })}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(prescription.status) }]}>
              <Text style={styles.statusText}>{getStatusText(prescription.status)}</Text>
            </View>
          </View>

          <View style={styles.doctorSection}>
            <Text style={styles.doctorLabel}>Médico tratante</Text>
            <Text style={styles.doctorName}>{prescription.doctorName}</Text>
            <TouchableOpacity style={styles.contactButton} onPress={handleContactDoctor}>
              <Text style={styles.contactButtonText}>Contactar médico</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Diagnosis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnóstico</Text>
          <View style={styles.diagnosisCard}>
            <Text style={styles.diagnosisText}>{prescription.diagnosis}</Text>
          </View>
        </View>

        {/* Medications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medicamentos ({prescription.medications.length})</Text>
          {prescription.medications.map((medication, index) => (
            <MedicationCard key={index} medication={medication} />
          ))}
        </View>

        {/* Notes */}
        {prescription.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas del médico</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesIcon}>📝</Text>
              <Text style={styles.notesText}>{prescription.notes}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSharePrescription}>
            <Text style={styles.actionButtonText}>Compartir receta</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryActionButton]} 
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.actionButtonText, styles.secondaryActionButtonText]}>
              Volver a mis recetas
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// Componente para cada medicamento
const MedicationCard = ({ medication }) => {
  // Asegurar que las propiedades tengan valores predeterminados útiles
  const frequency = medication.frequency || 'Según indicación médica';
  const duration = medication.duration || 'Según prescripción médica';
  const instructions = medication.instructions || 'Seguir indicaciones médicas';
  
  return (
    <View style={styles.medicationCard}>
      <View style={styles.medicationHeader}>
        <View style={styles.medicationIcon}>
          <Text style={styles.medicationEmoji}>💊</Text>
        </View>
        <View style={styles.medicationInfo}>
          <Text style={styles.medicationName}>{medication.name}</Text>
          <Text style={styles.medicationDosage}>{medication.dosage}</Text>
        </View>
      </View>

      <View style={styles.medicationDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Frecuencia:</Text>
          <Text style={styles.detailValue}>{frequency}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duración:</Text>
          <Text style={styles.detailValue}>{duration}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Estado:</Text>
          <Text style={[
            styles.detailValue, 
            medication.taken ? styles.takenText : styles.pendingText
          ]}>
            {medication.taken ? '✓ Tomado' : '⏱ Pendiente'}
          </Text>
        </View>

        {instructions && (
          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsLabel}>Instrucciones:</Text>
            <Text style={styles.instructionsText}>{instructions}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerCard: {
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  dateSection: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E86AB',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  doctorSection: {
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingTop: 20,
  },
  doctorLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  contactButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E86AB',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2E86AB',
    marginBottom: 12,
  },
  diagnosisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  diagnosisText: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
  },
  medicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  medicationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  medicationEmoji: {
    fontSize: 24,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E86AB',
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 16,
    color: '#6C757D',
  },
  medicationDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#6C757D',
    flex: 1,
  },
  instructionsSection: {
    marginTop: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  instructionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  notesText: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
    flex: 1,
  },
  actionsSection: {
    marginBottom: 40,
  },
  actionButton: {
    backgroundColor: '#2E86AB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryActionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2E86AB',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryActionButtonText: {
    color: '#2E86AB',
  },
  takenText: {
    color: '#28A745',
    fontWeight: '500',
  },
  pendingText: {
    color: '#FFC107',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C757D',
  },
});

export default PrescriptionDetailScreen;

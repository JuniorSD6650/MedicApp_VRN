import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Share
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { prescriptionService } from '../services/prescriptionService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const PrescriptionsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'completed'

  useEffect(() => {
    if (user?.id) {
      loadPrescriptions();
    }
  }, [user?.id]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando prescripciones para el usuario:', user.id);

      // Cargar todas las prescripciones para poder mostrar los contadores correctamente
      const allResponse = await prescriptionService.getPrescriptionsByStatus('all');
      
      if (allResponse.success && allResponse.data) {
        console.log(`✅ Se recibieron ${allResponse.data.length} prescripciones en total`);
        
        // Convertir los datos al formato esperado por el componente
        const formattedPrescriptions = allResponse.data.map(prescription => ({
          id: prescription.id,
          date: new Date(prescription.fecha),
          status: hasTakenAllMedications(prescription) ? 'completed' : 'active',
          doctorName: prescription.profesional ? 
            `Dr. ${prescription.profesional.nombres} ${prescription.profesional.apellidos}` : 
            'Doctor no especificado',
          diagnosis: prescription.diagnóstico || 'No se especificó diagnóstico',
          medications: (prescription.items || []).map(item => ({
            id: item.id,
            name: item.medicamento?.descripcion || 'Medicamento no especificado',
            dosage: `${item.cantidad_solicitada} unidad(es)`,
            taken: item.tomado ? true : false
          })),
          notes: prescription.observaciones || ''
        }));
        
        setPrescriptions(formattedPrescriptions);
        
        // Si hay un filtro activo, cargar también las prescripciones filtradas
        if (filterStatus !== 'all') {
          // No necesitamos hacer otra petición, podemos filtrar en memoria
          // ya que tenemos toda la información necesaria
        }
      } else {
        console.warn('⚠️ No se pudieron obtener prescripciones:', allResponse.error);
        Alert.alert('Error', 'No se pudieron cargar las recetas');
        setPrescriptions([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar prescripciones:', error);
      Alert.alert('Error', 'No se pudieron cargar las recetas');
      setPrescriptions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función auxiliar para determinar si todos los medicamentos de una prescripción han sido tomados
  const hasTakenAllMedications = (prescription) => {
    if (!prescription.items || prescription.items.length === 0) return false;
    return prescription.items.every(item => item.tomado);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrescriptions();
  };

  const navigateToPrescriptionDetail = (prescription) => {
    navigation.navigate('PrescriptionDetail', { prescription });
  };

  // Modificar la función que obtiene las prescripciones filtradas
  const getFilteredPrescriptions = () => {
    switch (filterStatus) {
      case 'active':
        return prescriptions.filter(p => p.status === 'active');
      case 'completed':
        return prescriptions.filter(p => p.status === 'completed');
      default:
        return prescriptions;
    }
  };

  const filteredPrescriptions = getFilteredPrescriptions();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86AB" />
        <Text style={styles.loadingText}>Cargando recetas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filterStatus === 'all' && styles.activeFilterTab]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterText, filterStatus === 'all' && styles.activeFilterText]}>
            Todas ({prescriptions.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filterStatus === 'active' && styles.activeFilterTab]}
          onPress={() => setFilterStatus('active')}
        >
          <Text style={[styles.filterText, filterStatus === 'active' && styles.activeFilterText]}>
            Activas ({prescriptions.filter(p => p.status === 'active').length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filterStatus === 'completed' && styles.activeFilterTab]}
          onPress={() => setFilterStatus('completed')}
        >
          <Text style={[styles.filterText, filterStatus === 'completed' && styles.activeFilterText]}>
            Completadas ({prescriptions.filter(p => p.status === 'completed').length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredPrescriptions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No hay recetas</Text>
            <Text style={styles.emptyMessage}>
              {filterStatus === 'all' 
                ? 'No tienes recetas médicas registradas'
                : filterStatus === 'active'
                ? 'No tienes recetas activas en este momento'
                : 'No tienes recetas completadas'
              }
            </Text>
          </View>
        ) : (
          filteredPrescriptions.map((prescription) => (
            <PrescriptionCard
              key={prescription.id}
              prescription={prescription}
              onPress={() => navigateToPrescriptionDetail(prescription)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

// Componente para cada receta
const PrescriptionCard = ({ prescription, onPress }) => {
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

  // Calcular el progreso de la receta (qué porcentaje de medicamentos han sido tomados)
  const calculateProgress = () => {
    if (!prescription.medications || prescription.medications.length === 0) return 0;
    const takenCount = prescription.medications.filter(med => med.taken).length;
    return Math.round((takenCount / prescription.medications.length) * 100);
  };

  const progress = calculateProgress();

  return (
    <TouchableOpacity style={styles.prescriptionCard} onPress={onPress}>
      <View style={styles.prescriptionHeader}>
        <View style={styles.prescriptionInfo}>
          <Text style={styles.prescriptionDate}>
            {format(new Date(prescription.date), 'dd MMM yyyy', { locale: es })}
          </Text>
          <Text style={styles.doctorName}>{prescription.doctorName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(prescription.status) }]}>
          <Text style={styles.statusText}>{getStatusText(prescription.status)}</Text>
        </View>
      </View>

      <Text style={styles.diagnosis}>{prescription.diagnosis}</Text>

      {/* Barra de progreso para visualizar medicamentos tomados */}
      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>Progreso: {progress}%</Text>
          <Text style={styles.progressDetail}>
            {prescription.medications.filter(med => med.taken).length}/{prescription.medications.length} medicamentos
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${progress}%` }
            ]} 
          />
        </View>
      </View>

      <View style={styles.medicationsPreview}>
        <Text style={styles.medicationsTitle}>Medicamentos ({prescription.medications.length}):</Text>
        {prescription.medications.slice(0, 2).map((med, index) => (
          <Text key={index} style={styles.medicationPreview}>
            • {med.name} {med.dosage}
            {med.taken ? ' ✓' : ''}
          </Text>
        ))}
        {prescription.medications.length > 2 && (
          <Text style={styles.moreText}>
            +{prescription.medications.length - 2} más...
          </Text>
        )}
      </View>

      {prescription.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesText}>📝 {prescription.notes}</Text>
        </View>
      )}

      <View style={styles.prescriptionFooter}>
        <Text style={styles.viewDetailsText}>Toca para ver detalles →</Text>
      </View>
    </TouchableOpacity>
  );
};

const PrescriptionDetail = ({ route, navigation }) => {
  const { prescription } = route.params;

  // Función para compartir la receta
  const handleShare = async () => {
    try {
      // Formatear los medicamentos como texto
      const medicationsList = prescription.medications.map(med => 
        `• ${med.name} ${med.dosage}${med.taken ? ' (Tomado)' : ' (Pendiente)'}`
      ).join('\n');
      
      // Crear el mensaje para compartir
      const message = `
📋 RECETA MÉDICA DETALLADA
📅 Fecha: ${format(new Date(prescription.date), 'dd MMMM yyyy', { locale: es })}
👨‍⚕️ Doctor: ${prescription.doctorName}
🔍 Diagnóstico: ${prescription.diagnosis}

💊 MEDICAMENTOS:
${medicationsList}

📊 Progreso: ${prescription.medications.filter(med => med.taken).length}/${prescription.medications.length} medicamentos tomados

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
  
  // Configurar el botón de compartir en la barra de navegación
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={handleShare} 
          style={styles.headerButton}
        >
          <Ionicons name="share-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, prescription]);

  // Calcular el progreso
  const calculateProgress = () => {
    if (!prescription.medications || prescription.medications.length === 0) return 0;
    const takenCount = prescription.medications.filter(med => med.taken).length;
    return Math.round((takenCount / prescription.medications.length) * 100);
  };

  const progress = calculateProgress();

  return (
    <ScrollView style={styles.container}>
      {/* Encabezado de la receta */}
      <View style={styles.header}>
        <Text style={styles.date}>
          {format(new Date(prescription.date), 'dd MMMM yyyy', { locale: es })}
        </Text>
        <Text style={styles.doctorName}>{prescription.doctorName}</Text>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Estado:</Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: prescription.status === 'active' ? '#28A745' : '#6C757D' }
          ]}>
            <Text style={styles.statusText}>
              {prescription.status === 'active' ? 'Activa' : 'Completada'}
            </Text>
          </View>
        </View>
      </View>

      {/* Diagnóstico */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diagnóstico</Text>
        <Text style={styles.diagnosisText}>{prescription.diagnosis}</Text>
      </View>

      {/* Barra de progreso */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Progreso</Text>
          <Text style={styles.progressPercentage}>{progress}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${progress}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressDetail}>
          {prescription.medications.filter(med => med.taken).length} de {prescription.medications.length} medicamentos tomados
        </Text>
      </View>

      {/* Lista de medicamentos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medicamentos</Text>
        {prescription.medications.map((med, index) => (
          <View key={index} style={styles.medicationItem}>
            <View style={styles.medicationHeader}>
              <Text style={styles.medicationName}>{med.name}</Text>
              <View style={[
                styles.medicationStatus, 
                { backgroundColor: med.taken ? '#D4EDDA' : '#F8F9FA' }
              ]}>
                <Text style={[
                  styles.medicationStatusText, 
                  { color: med.taken ? '#28A745' : '#6C757D' }
                ]}>
                  {med.taken ? 'Tomado' : 'Pendiente'}
                </Text>
              </View>
            </View>
            <Text style={styles.medicationDosage}>Dosis: {med.dosage}</Text>
          </View>
        ))}
      </View>

      {/* Notas */}
      {prescription.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas</Text>
          <View style={styles.notesContainer}>
            <Text style={styles.notesText}>{prescription.notes}</Text>
          </View>
        </View>
      )}

      {/* Botón de compartir en el cuerpo de la pantalla */}
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Ionicons name="share-outline" size={20} color="#FFFFFF" />
        <Text style={styles.shareButtonText}>Compartir Receta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#2E86AB',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C757D',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 24,
  },
  prescriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  prescriptionInfo: {
    flex: 1,
  },
  prescriptionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E86AB',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 14,
    color: '#6C757D',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  diagnosis: {
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 12,
  },
  medicationsPreview: {
    marginBottom: 12,
  },
  medicationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 6,
  },
  medicationPreview: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 2,
  },
  moreText: {
    fontSize: 14,
    color: '#2E86AB',
    fontWeight: '500',
    marginTop: 4,
  },
  notesSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#6C757D',
    fontStyle: 'italic',
  },
  prescriptionFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingTop: 12,
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#2E86AB',
    fontWeight: '500',
  },
  progressSection: {
    marginVertical: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E86AB',
  },
  progressDetail: {
    fontSize: 14,
    color: '#6C757D',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2E86AB',
    borderRadius: 4,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  detailContent: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E86AB',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: '#6C757D',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  doctorName: {
    fontSize: 16,
    color: '#2E86AB',
    marginBottom: 4,
  },
  diagnosis: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 12,
  },
  medicationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  medicationStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: '#28A745',
  },
  notes: {
    fontSize: 14,
    color: '#6C757D',
    fontStyle: 'italic',
  },
  shareButton: {
    backgroundColor: '#2E86AB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerButton: {
    padding: 10,
    marginRight: 5,
  },
});

export default PrescriptionsScreen;
export { PrescriptionDetail };
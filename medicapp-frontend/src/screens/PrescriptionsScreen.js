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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { prescriptionService } from '../services/prescriptionService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
      const response = await prescriptionService.getPatientPrescriptions(user.id);
      
      if (response.success) {
        setPrescriptions(response.data);
      }
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      Alert.alert('Error', 'No se pudieron cargar las recetas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrescriptions();
  };

  const navigateToPrescriptionDetail = (prescription) => {
    navigation.navigate('PrescriptionDetail', { prescription });
  };

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
          filteredPrescriptions.map(prescription => (
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

      <View style={styles.medicationsPreview}>
        <Text style={styles.medicationsTitle}>Medicamentos ({prescription.medications.length}):</Text>
        {prescription.medications.slice(0, 2).map((med, index) => (
          <Text key={index} style={styles.medicationPreview}>
            • {med.name} {med.dosage}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
});

export default PrescriptionsScreen;

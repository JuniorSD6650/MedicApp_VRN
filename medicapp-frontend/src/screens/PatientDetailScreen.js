import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { patientService } from '../services/patientService';
import { prescriptionService } from '../services/prescriptionService';
import { medicationIntakeService } from '../services/medicationIntakeService';

const PatientDetailScreen = ({ route, navigation }) => {
  const { patientId } = route.params;
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'prescriptions', 'medications'

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar datos del paciente
      const patientData = await patientService.getPatientById(patientId);
      setPatient(patientData);

      // Cargar recetas del paciente
      const patientPrescriptions = await prescriptionService.getPrescriptionsByPatientId(patientId);
      setPrescriptions(patientPrescriptions);

      // Cargar medicamentos activos
      const patientMedications = await medicationIntakeService.getMedicationsByPatientId(patientId);
      setMedications(patientMedications);

    } catch (error) {
      console.error('Error loading patient data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del paciente');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatientData();
    setRefreshing(false);
  };

  const handleCreatePrescription = () => {
    navigation.navigate('CreatePrescription', { patientId, patientName: patient?.name });
  };

  const handleCallPatient = () => {
    Alert.alert(
      'Llamar paciente',
      `¿Deseas llamar a ${patient?.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Llamar', onPress: () => Alert.alert('Función no disponible', 'Esta función estará disponible próximamente') }
      ]
    );
  };

  const handleEmailPatient = () => {
    Alert.alert('Enviar email', 'Esta función estará disponible próximamente');
  };

  if (isLoading || !patient) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando datos del paciente...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Patient Header */}
        <View style={styles.patientHeader}>
          <View style={styles.patientAvatar}>
            <Text style={styles.avatarText}>
              {patient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientAge}>{patient.age} años</Text>
            <Text style={styles.patientDni}>DNI: {patient.dni}</Text>
          </View>

          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactButton} onPress={handleCallPatient}>
              <Text style={styles.contactIcon}>📞</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton} onPress={handleEmailPatient}>
              <Text style={styles.contactIcon}>📧</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <ActionButton
            title="Nueva receta"
            icon="📝"
            onPress={handleCreatePrescription}
            primary
          />
          <ActionButton
            title="Ver historial"
            icon="📊"
            onPress={() => {}}
          />
          <ActionButton
            title="Programar cita"
            icon="📅"
            onPress={() => {}}
          />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TabButton
            title="Información"
            active={activeTab === 'info'}
            onPress={() => setActiveTab('info')}
          />
          <TabButton
            title={`Recetas (${prescriptions.length})`}
            active={activeTab === 'prescriptions'}
            onPress={() => setActiveTab('prescriptions')}
          />
          <TabButton
            title={`Medicamentos (${medications.length})`}
            active={activeTab === 'medications'}
            onPress={() => setActiveTab('medications')}
          />
        </View>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <PatientInfoTab patient={patient} />
        )}

        {activeTab === 'prescriptions' && (
          <PrescriptionsTab 
            prescriptions={prescriptions} 
            navigation={navigation}
            onCreateNew={handleCreatePrescription}
          />
        )}

        {activeTab === 'medications' && (
          <MedicationsTab medications={medications} />
        )}
      </ScrollView>
    </View>
  );
};

// Tab de información del paciente
const PatientInfoTab = ({ patient }) => (
  <View style={styles.tabContent}>
    <InfoCard title="Datos personales">
      <InfoRow label="Nombre completo" value={patient.name} />
      <InfoRow label="DNI" value={patient.dni} />
      <InfoRow label="Edad" value={`${patient.age} años`} />
      <InfoRow label="Fecha de nacimiento" value={patient.birthDate || 'No disponible'} />
      <InfoRow label="Género" value={patient.gender || 'No especificado'} />
    </InfoCard>

    <InfoCard title="Información de contacto">
      <InfoRow label="Teléfono" value={patient.phone} />
      <InfoRow label="Email" value={patient.email} />
      <InfoRow label="Dirección" value={patient.address || 'No disponible'} />
    </InfoCard>

    <InfoCard title="Información médica">
      <InfoRow label="Obra social" value={patient.insurance || 'No especificada'} />
      <InfoRow label="Grupo sanguíneo" value={patient.bloodType || 'No disponible'} />
      <InfoRow label="Alergias" value={patient.allergies || 'Ninguna conocida'} />
      <InfoRow label="Condiciones médicas" value={patient.conditions || 'Ninguna registrada'} />
    </InfoCard>
  </View>
);

// Tab de recetas
const PrescriptionsTab = ({ prescriptions, navigation, onCreateNew }) => (
  <View style={styles.tabContent}>
    {prescriptions.length > 0 ? (
      <>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recetas recientes</Text>
          <TouchableOpacity style={styles.newButton} onPress={onCreateNew}>
            <Text style={styles.newButtonText}>+ Nueva</Text>
          </TouchableOpacity>
        </View>
        
        {prescriptions.map((prescription) => (
          <PrescriptionCard
            key={prescription.id}
            prescription={prescription}
            onPress={() => navigation.navigate('PrescriptionDetail', { prescription })}
          />
        ))}
      </>
    ) : (
      <EmptyState
        icon="📋"
        title="Sin recetas"
        subtitle="Este paciente no tiene recetas registradas"
        actionText="Crear primera receta"
        onAction={onCreateNew}
      />
    )}
  </View>
);

// Tab de medicamentos
const MedicationsTab = ({ medications }) => (
  <View style={styles.tabContent}>
    {medications.length > 0 ? (
      medications.map((medication) => (
        <MedicationCard key={medication.id} medication={medication} />
      ))
    ) : (
      <EmptyState
        icon="💊"
        title="Sin medicamentos activos"
        subtitle="Este paciente no tiene medicamentos asignados actualmente"
      />
    )}
  </View>
);

// Componentes auxiliares
const ActionButton = ({ title, icon, onPress, primary = false }) => (
  <TouchableOpacity
    style={[styles.actionButton, primary && styles.primaryActionButton]}
    onPress={onPress}
  >
    <Text style={styles.actionIcon}>{icon}</Text>
    <Text style={[styles.actionTitle, primary && styles.primaryActionTitle]}>
      {title}
    </Text>
  </TouchableOpacity>
);

const TabButton = ({ title, active, onPress }) => (
  <TouchableOpacity
    style={[styles.tabButton, active && styles.activeTabButton]}
    onPress={onPress}
  >
    <Text style={[styles.tabButtonText, active && styles.activeTabButtonText]}>
      {title}
    </Text>
  </TouchableOpacity>
);

const InfoCard = ({ title, children }) => (
  <View style={styles.infoCard}>
    <Text style={styles.infoCardTitle}>{title}</Text>
    {children}
  </View>
);

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const PrescriptionCard = ({ prescription, onPress }) => (
  <TouchableOpacity style={styles.prescriptionCard} onPress={onPress}>
    <View style={styles.prescriptionHeader}>
      <Text style={styles.prescriptionDate}>
        {format(new Date(prescription.date), 'dd MMM yyyy', { locale: es })}
      </Text>
      <View style={[
        styles.prescriptionStatus,
        { backgroundColor: prescription.status === 'active' ? '#28A745' : '#6C757D' }
      ]}>
        <Text style={styles.prescriptionStatusText}>
          {prescription.status === 'active' ? 'Activa' : 'Completada'}
        </Text>
      </View>
    </View>
    <Text style={styles.prescriptionDiagnosis}>{prescription.diagnosis}</Text>
    <Text style={styles.prescriptionMedications}>
      {prescription.medications.length} medicamento(s)
    </Text>
  </TouchableOpacity>
);

const MedicationCard = ({ medication }) => (
  <View style={styles.medicationCard}>
    <Text style={styles.medicationName}>{medication.name}</Text>
    <Text style={styles.medicationDosage}>{medication.dosage}</Text>
    <Text style={styles.medicationFrequency}>{medication.frequency}</Text>
  </View>
);

const EmptyState = ({ icon, title, subtitle, actionText, onAction }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyStateIcon}>{icon}</Text>
    <Text style={styles.emptyStateTitle}>{title}</Text>
    <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
    {actionText && onAction && (
      <TouchableOpacity style={styles.emptyStateButton} onPress={onAction}>
        <Text style={styles.emptyStateButtonText}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

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
    fontSize: 16,
    color: '#6C757D',
  },
  content: {
    flex: 1,
  },
  patientHeader: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2E86AB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 4,
  },
  patientAge: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 2,
  },
  patientDni: {
    fontSize: 14,
    color: '#6C757D',
  },
  contactButtons: {
    flexDirection: 'row',
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  contactIcon: {
    fontSize: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  primaryActionButton: {
    backgroundColor: '#2E86AB',
    marginHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
  },
  primaryActionTitle: {
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#2E86AB',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C757D',
  },
  activeTabButtonText: {
    color: '#2E86AB',
  },
  tabContent: {
    padding: 20,
  },
  infoCard: {
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
  infoCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E86AB',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: '#6C757D',
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E86AB',
  },
  newButton: {
    backgroundColor: '#28A745',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  newButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  prescriptionCard: {
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
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  prescriptionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E86AB',
  },
  prescriptionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  prescriptionStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  prescriptionDiagnosis: {
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 4,
  },
  prescriptionMedications: {
    fontSize: 14,
    color: '#6C757D',
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
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E86AB',
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 2,
  },
  medicationFrequency: {
    fontSize: 14,
    color: '#6C757D',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyStateButton: {
    backgroundColor: '#2E86AB',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 16,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default PatientDetailScreen;

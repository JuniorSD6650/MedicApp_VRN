import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { patientService } from '../services/patientService';
import { prescriptionService } from '../services/prescriptionService';

const DoctorDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar todos los pacientes
      const allPatients = await patientService.getAllPatients();
      setPatients(allPatients.slice(0, 5)); // Mostrar solo los primeros 5

      // Cargar recetas recientes
      const allPrescriptions = await prescriptionService.getAllPrescriptions();
      const recent = allPrescriptions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
      setRecentPrescriptions(recent);

      // Simular citas del día
      const appointments = generateTodayAppointments(allPatients);
      setTodayAppointments(appointments);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTodayAppointments = (patientsList) => {
    const times = ['09:00', '10:30', '14:00', '16:30'];
    return patientsList.slice(0, 4).map((patient, index) => ({
      id: `apt_${index}`,
      patientId: patient.id,
      patientName: patient.name,
      time: times[index],
      type: index % 2 === 0 ? 'Consulta' : 'Control',
    }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', onPress: logout, style: 'destructive' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Panel Médico</Text>
            <Text style={styles.subGreeting}>Dr. {user?.name || 'Doctor'}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.profileButton} 
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.profileButtonText}>👤</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Header */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>¡Bienvenido,</Text>
          <Text style={styles.doctorName}>Dr. {user?.name || 'Doctor'}!</Text>
          <Text style={styles.dateText}>
            {format(new Date(), 'EEEE, d MMMM yyyy', { locale: es })}
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Pacientes"
            value={patients.length}
            icon="👥"
            onPress={() => navigation.navigate('PatientSearch')}
          />
          <StatCard
            title="Citas hoy"
            value={todayAppointments.length}
            icon="📅"
            onPress={() => {}}
          />
          <StatCard
            title="Recetas"
            value={recentPrescriptions.length}
            icon="📋"
            onPress={() => navigation.navigate('PrescriptionManagement')}
          />
        </View>

        {/* Today's Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Citas de hoy</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          {todayAppointments.length > 0 ? (
            todayAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onPress={() => navigation.navigate('PatientDetail', { 
                  patientId: appointment.patientId 
                })}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No tienes citas programadas para hoy</Text>
            </View>
          )}
        </View>

        {/* Recent Patients */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pacientes recientes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PatientSearch')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          {patients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onPress={() => navigation.navigate('PatientDetail', { 
                patientId: patient.id 
              })}
            />
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones rápidas</Text>
          <View style={styles.quickActions}>
            <ActionButton
              title="Buscar paciente"
              icon="🔍"
              onPress={() => navigation.navigate('PatientSearch')}
            />
            <ActionButton
              title="Nueva receta"
              icon="📝"
              onPress={() => navigation.navigate('CreatePrescription')}
            />
            <ActionButton
              title="Historial médico"
              icon="📊"
              onPress={() => {}}
            />
            <ActionButton
              title="Configuración"
              icon="⚙️"
              onPress={() => navigation.navigate('DoctorSettings')}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Componente para estadísticas
const StatCard = ({ title, value, icon, onPress }) => (
  <TouchableOpacity style={styles.statCard} onPress={onPress}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </TouchableOpacity>
);

// Componente para citas
const AppointmentCard = ({ appointment, onPress }) => (
  <TouchableOpacity style={styles.appointmentCard} onPress={onPress}>
    <View style={styles.appointmentTime}>
      <Text style={styles.timeText}>{appointment.time}</Text>
    </View>
    <View style={styles.appointmentInfo}>
      <Text style={styles.patientNameText}>{appointment.patientName}</Text>
      <Text style={styles.appointmentType}>{appointment.type}</Text>
    </View>
    <View style={styles.appointmentArrow}>
      <Text style={styles.arrowText}>›</Text>
    </View>
  </TouchableOpacity>
);

// Componente para pacientes
const PatientCard = ({ patient, onPress }) => (
  <TouchableOpacity style={styles.patientCard} onPress={onPress}>
    <View style={styles.patientAvatar}>
      <Text style={styles.avatarText}>
        {patient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
      </Text>
    </View>
    <View style={styles.patientInfo}>
      <Text style={styles.patientName}>{patient.name}</Text>
      <Text style={styles.patientDetails}>
        {patient.age} años • DNI: {patient.dni}
      </Text>
    </View>
    <View style={styles.patientArrow}>
      <Text style={styles.arrowText}>›</Text>
    </View>
  </TouchableOpacity>
);

// Componente para acciones rápidas
const ActionButton = ({ title, icon, onPress }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <Text style={styles.actionIcon}>{icon}</Text>
    <Text style={styles.actionTitle}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#2E86AB',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subGreeting: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  welcomeCard: {
    backgroundColor: '#2E86AB',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    textTransform: 'capitalize',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2E86AB',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2E86AB',
    fontWeight: '500',
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentTime: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E86AB',
  },
  appointmentInfo: {
    flex: 1,
  },
  patientNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 2,
  },
  appointmentType: {
    fontSize: 14,
    color: '#6C757D',
  },
  appointmentArrow: {
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 20,
    color: '#6C757D',
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2E86AB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 2,
  },
  patientDetails: {
    fontSize: 14,
    color: '#6C757D',
  },
  patientArrow: {
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
  },
});

export default DoctorDashboard;

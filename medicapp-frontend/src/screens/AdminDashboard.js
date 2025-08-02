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
import { useAuth } from '../context/AuthContext';
import { patientService } from '../services/patientService';
import { prescriptionService } from '../services/prescriptionService';

const AdminDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalPrescriptions: 0,
    recentUploads: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar estadísticas
      const patients = await patientService.getAllPatients();
      const prescriptions = await prescriptionService.getAllPrescriptions();
      
      setStats({
        totalPatients: Array.isArray(patients) ? patients.length : 0,
        totalDoctors: 15, // Dato simulado
        totalPrescriptions: Array.isArray(prescriptions) ? prescriptions.length : 0,
        recentUploads: 3 // Dato simulado
      });

      // Generar actividad reciente
      const activity = generateRecentActivity(patients, prescriptions);
      setRecentActivity(activity);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRecentActivity = (patients, prescriptions) => {
    const activities = [];
    
    // Actividades de pacientes
    const patientsArray = Array.isArray(patients) ? patients : [];
    patientsArray.slice(0, 3).forEach((patient, index) => {
      activities.push({
        id: `patient_${index}`,
        type: 'patient',
        title: 'Nuevo paciente registrado',
        description: patient.name,
        time: `Hace ${index + 1} hora${index > 0 ? 's' : ''}`,
        icon: '👤'
      });
    });

    // Actividades de recetas
    const prescriptionsArray = Array.isArray(prescriptions) ? prescriptions : [];
    prescriptionsArray.slice(0, 2).forEach((prescription, index) => {
      activities.push({
        id: `prescription_${index}`,
        type: 'prescription',
        title: 'Nueva receta emitida',
        description: `${prescription.doctorName} - ${prescription.diagnosis}`,
        time: `Hace ${index + 2} horas`,
        icon: '📋'
      });
    });

    return activities.sort(() => Math.random() - 0.5).slice(0, 5);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleCsvUpload = () => {
    navigation.navigate('CsvUpload');
  };

  const handleSystemSettings = () => {
    Alert.alert('Configuración', 'Esta función estará disponible próximamente');
  };

  const handleUserManagement = () => {
    Alert.alert('Gestión de usuarios', 'Esta función estará disponible próximamente');
  };

  const handleReports = () => {
    Alert.alert('Reportes', 'Esta función estará disponible próximamente');
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
            <Text style={styles.greeting}>Panel Administrativo</Text>
            <Text style={styles.subGreeting}>{user?.name || 'Administrador'}</Text>
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
          <Text style={styles.welcomeText}>Panel de Administración</Text>
          <Text style={styles.adminName}>Bienvenido, {user?.name || 'Administrador'}</Text>
          <Text style={styles.dateText}>
            {format(new Date(), 'EEEE, d MMMM yyyy', { locale: es })}
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard
              title="Pacientes"
              value={stats.totalPatients}
              icon="👥"
              color="#2E86AB"
              onPress={() => navigation.navigate('PatientManagement')}
            />
            <StatCard
              title="Médicos"
              value={stats.totalDoctors}
              icon="👨‍⚕️"
              color="#28A745"
              onPress={handleUserManagement}
            />
          </View>
          
          <View style={styles.statsRow}>
            <StatCard
              title="Recetas"
              value={stats.totalPrescriptions}
              icon="📋"
              color="#FFC107"
              onPress={handleReports}
            />
            <StatCard
              title="Cargas CSV"
              value={stats.recentUploads}
              icon="📁"
              color="#DC3545"
              onPress={handleCsvUpload}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones principales</Text>
          <View style={styles.quickActions}>
            <ActionButton
              title="Cargar CSV"
              subtitle="Importar datos"
              icon="📊"
              onPress={handleCsvUpload}
              primary
            />
            <ActionButton
              title="Gestión usuarios"
              subtitle="Administrar accesos"
              icon="👥"
              onPress={handleUserManagement}
            />
            <ActionButton
              title="Configuración"
              subtitle="Ajustes del sistema"
              icon="⚙️"
              onPress={handleSystemSettings}
            />
            <ActionButton
              title="Reportes"
              subtitle="Estadísticas y análisis"
              icon="📈"
              onPress={handleReports}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Actividad reciente</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todo</Text>
            </TouchableOpacity>
          </View>
          
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No hay actividad reciente</Text>
            </View>
          )}
        </View>

        {/* System Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado del sistema</Text>
          <View style={styles.systemStatus}>
            <StatusItem
              label="Servidor"
              status="online"
              value="Operativo"
            />
            <StatusItem
              label="Base de datos"
              status="online"
              value="Conectada"
            />
            <StatusItem
              label="Almacenamiento"
              status="warning"
              value="85% usado"
            />
            <StatusItem
              label="Último backup"
              status="online"
              value="Hace 2 horas"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Componente para estadísticas
const StatCard = ({ title, value, icon, color, onPress }) => (
  <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
    <View style={styles.statIconContainer}>
      <Text style={styles.statIcon}>{icon}</Text>
    </View>
    <View style={styles.statInfo}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  </TouchableOpacity>
);

// Componente para acciones rápidas
const ActionButton = ({ title, subtitle, icon, onPress, primary = false }) => (
  <TouchableOpacity
    style={[styles.actionButton, primary && styles.primaryActionButton]}
    onPress={onPress}
  >
    <Text style={styles.actionIcon}>{icon}</Text>
    <Text style={[styles.actionTitle, primary && styles.primaryActionTitle]}>
      {title}
    </Text>
    <Text style={[styles.actionSubtitle, primary && styles.primaryActionSubtitle]}>
      {subtitle}
    </Text>
  </TouchableOpacity>
);

// Componente para actividad reciente
const ActivityCard = ({ activity }) => (
  <View style={styles.activityCard}>
    <View style={styles.activityIcon}>
      <Text style={styles.activityEmoji}>{activity.icon}</Text>
    </View>
    <View style={styles.activityInfo}>
      <Text style={styles.activityTitle}>{activity.title}</Text>
      <Text style={styles.activityDescription}>{activity.description}</Text>
      <Text style={styles.activityTime}>{activity.time}</Text>
    </View>
  </View>
);

// Componente para estado del sistema
const StatusItem = ({ label, status, value }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return '#28A745';
      case 'warning':
        return '#FFC107';
      case 'offline':
        return '#DC3545';
      default:
        return '#6C757D';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return '●';
      case 'warning':
        return '⚠';
      case 'offline':
        return '●';
      default:
        return '●';
    }
  };

  return (
    <View style={styles.statusItem}>
      <View style={styles.statusLeft}>
        <Text style={[styles.statusIcon, { color: getStatusColor() }]}>
          {getStatusIcon()}
        </Text>
        <Text style={styles.statusLabel}>{label}</Text>
      </View>
      <Text style={styles.statusValue}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#6C63FF',
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
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  adminName: {
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
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    marginRight: 12,
  },
  statIcon: {
    fontSize: 24,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    color: '#6C757D',
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
    color: '#495057',
  },
  seeAllText: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '500',
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
  primaryActionButton: {
    backgroundColor: '#6C63FF',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
    textAlign: 'center',
  },
  primaryActionTitle: {
    color: '#FFFFFF',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },
  primaryActionSubtitle: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  activityCard: {
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
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 20,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#ADB5BD',
  },
  systemStatus: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 12,
    marginRight: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#495057',
  },
  statusValue: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
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

export default AdminDashboard;

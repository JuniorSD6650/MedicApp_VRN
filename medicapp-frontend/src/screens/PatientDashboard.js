import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthContext } from '../context/AuthContext';
import { medicationService } from '../services/medicationService';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';

const PatientDashboard = ({ navigation }) => {
  // Manejo seguro del contexto para prevenir errores en web
  const authContext = typeof AuthContext !== 'undefined' ? useContext(AuthContext) : null;
  const user = authContext?.user || {};
  const logout = authContext?.logout || (() => console.log('Logout not available'));
  const token = authContext?.token || '';

  // Asegurarse de que userName siempre tenga un valor por defecto
  const [userName, setUserName] = useState('Usuario');
  
  const [todayMedications, setTodayMedications] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Depuración inicial
  useEffect(() => {
    console.log('🔍 Datos iniciales del usuario:', {
      userId: user?.id || 'No disponible',
      userEmail: user?.email || 'No disponible',
      userName: user?.nombre || 'No disponible',
      tokenExists: !!token
    });
  }, []);

  // Efecto para actualizar medicamentos
  useEffect(() => {
    if (user?.id) {
      loadMedications();
    } else {
      // Si no hay usuario, finalizar carga después de un breve retraso
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user?.id, selectedDate]);

  // Modificar el useEffect para el nombre del usuario
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        console.log('🔑 No hay token disponible');
        return;
      }

      try {
        console.log('🔍 Obteniendo datos del usuario con token:', token.substring(0, 20) + '...');
        const userData = await api.getCurrentUser(token);
        
        if (userData && userData.user) {
          const { nombre } = userData.user;
          
          // Procesamiento del nombre completo
          const nombreCompleto = nombre || '';
          const nombres = nombreCompleto.split(' ');
          const primerNombre = nombres[0] || 'Usuario';
          
          console.log('✅ Nombre procesado:', primerNombre);
          setUserName(primerNombre);
        } else {
          console.log('⚠️ No se encontraron datos de usuario en la respuesta');
          setUserName('Usuario');
        }
      } catch (error) {
        console.error('❌ Error al obtener datos del usuario:', error);
        // No cambiar el nombre si hay error, mantener el actual
      }
    };

    fetchUserData();
  }, [token]); // Asegúrate de que se ejecute cuando cambie el token

  // Implementación adaptada para web/móvil
  const isWeb = Platform.OS === 'web';

  const loadMedications = async () => {
    // Solo intentar cargar medicamentos si hay un ID de usuario
    if (!user?.id) {
      setTodayMedications([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await medicationService.getMedicationsByDate(user.id, dateStr);
      
      if (response.success) {
        setTodayMedications(response.data);
      } else {
        setTodayMedications([]);
      }
    } catch (error) {
      console.error('Error loading medications:', error);
      setTodayMedications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedications();
  };

  const handleMedicationToggle = async (medicationId, time) => {
    try {
      const medication = todayMedications.find(med => med.id === medicationId);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const isTaken = medication.dateTaken?.includes(time);

      if (isTaken) {
        await medicationService.unmarkAsTaken(medicationId, dateStr, time);
      } else {
        await medicationService.markAsTaken(medicationId, dateStr, time);
      }

      // Reload medications
      await loadMedications();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado del medicamento');
    }
  };

  const navigateDate = (direction) => {
    if (direction === 'prev') {
      setSelectedDate(prev => subDays(prev, 1));
    } else {
      setSelectedDate(prev => addDays(prev, 1));
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', onPress: logout, style: 'destructive' }
      ]
    );
  };

  const getCompletionStats = () => {
    const totalDoses = todayMedications.reduce((acc, med) => acc + med.times.length, 0);
    const takenDoses = todayMedications.reduce((acc, med) => acc + (med.dateTaken?.length || 0), 0);
    return { totalDoses, takenDoses };
  };

  const { totalDoses, takenDoses } = getCompletionStats();
  const completionPercentage = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86AB" />
        <Text style={styles.loadingText}>Cargando medicamentos...</Text>
      </View>
    );
  }

  // Versión simplificada para web si hay problemas con el contexto
  if (isWeb && !authContext) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>¡Hola!</Text>
              <Text style={styles.subGreeting}>Bienvenido a MedicApp Web</Text>
            </View>
          </View>
        </View>
        <ScrollView style={styles.content}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💊</Text>
            <Text style={styles.emptyTitle}>Versión web simplificada</Text>
            <Text style={styles.emptyMessage}>
              Por favor utiliza la aplicación móvil para una experiencia completa
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Versión completa
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>
              ¡Hola, {userName}!
            </Text>
            <Text style={styles.subGreeting}>¿Cómo te sientes hoy?</Text>
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
      
      {/* Contenido principal */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2E86AB"
          />
        }
      >
        {/* Navegador de fechas */}
        <View style={styles.dateNavigator}>
          <TouchableOpacity style={styles.dateButton} onPress={() => navigateDate('prev')}>
            <Text style={styles.dateButtonText}>◀</Text>
          </TouchableOpacity>
          
          <View style={styles.dateDisplay}>
            <Text style={styles.dateText}>{format(selectedDate, 'EEEE, d MMMM', { locale: es })}</Text>
            {!isToday && (
              <TouchableOpacity onPress={goToToday}>
                <Text style={styles.todayButton}>Hoy</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity style={styles.dateButton} onPress={() => navigateDate('next')}>
            <Text style={styles.dateButtonText}>▶</Text>
          </TouchableOpacity>
        </View>
        
        {/* Tarjeta de progreso */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Tu progreso hoy</Text>
          
          <View style={styles.progressStats}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
            </View>
            
            <View style={styles.progressDetails}>
              <Text style={styles.progressDetail}>
                Medicamentos tomados: {takenDoses}
              </Text>
              <Text style={styles.progressDetail}>
                Total de dosis: {totalDoses}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Sección de medicamentos */}
        <View style={styles.medicationsSection}>
          <Text style={styles.sectionTitle}>Medicamentos</Text>
          
          {todayMedications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>💊</Text>
              <Text style={styles.emptyTitle}>Sin medicamentos para hoy</Text>
              <Text style={styles.emptyMessage}>
                Parece que no tienes medicamentos programados para hoy. ¡Disfruta tu día!
              </Text>
            </View>
          ) : (
            todayMedications.map(medication => (
              <MedicationCard 
                key={medication.id} 
                medication={medication} 
                onToggle={handleMedicationToggle}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// Componente para cada medicamento
const MedicationCard = ({ medication, onToggle }) => {
  const takenTimes = medication.dateTaken || [];
  
  return (
    <View style={styles.medicationCard}>
      <View style={styles.medicationHeader}>
        <Text style={styles.medicationName}>{medication.name}</Text>
        <Text style={styles.medicationDosage}>{medication.dosage}</Text>
      </View>
      
      <Text style={styles.medicationFrequency}>{medication.frequency}</Text>
      
      {medication.instructions && (
        <Text style={styles.medicationInstructions}>📝 {medication.instructions}</Text>
      )}

      <View style={styles.medicationTimes}>
        {medication.times.map(time => {
          const isTaken = takenTimes.includes(time);
          return (
            <TouchableOpacity
              key={time}
              style={[styles.timeButton, isTaken && styles.timeButtonTaken]}
              onPress={() => onToggle(medication.id, time)}
            >
              <Text style={[styles.timeText, isTaken && styles.timeTextTaken]}>
                {time}
              </Text>
              {isTaken && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dateNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateButton: {
    padding: 8,
  },
  dateButtonText: {
    fontSize: 18,
    color: '#2E86AB',
    fontWeight: 'bold',
  },
  dateDisplay: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E86AB',
    textTransform: 'capitalize',
  },
  todayButton: {
    fontSize: 12,
    color: '#28A745',
    marginTop: 4,
    fontWeight: '500',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E86AB',
    marginBottom: 16,
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6C757D',
  },
  progressDetails: {
    flex: 1,
  },
  progressDetail: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
  medicationsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2E86AB',
    marginBottom: 16,
  },
  emptyState: {
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
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E86AB',
    flex: 1,
  },
  medicationDosage: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  medicationFrequency: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
  },
  medicationInstructions: {
    fontSize: 12,
    color: '#6C757D',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  medicationTimes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
    justifyContent: 'center',
  },
  timeButtonTaken: {
    backgroundColor: '#D4EDDA',
    borderColor: '#28A745',
  },
  timeText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  timeTextTaken: {
    color: '#28A745',
  },
  checkmark: {
    marginLeft: 4,
    fontSize: 12,
    color: '#28A745',
  },
});

export default PatientDashboard;
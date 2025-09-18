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
import { prescriptionService } from '../services/prescriptionService';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

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
  const [dailyProgress, setDailyProgress] = useState({ total: 0, taken: 0, percentage: 0 });

  // Depuración inicial
  useEffect(() => {
    console.log('🔍 Datos iniciales del usuario:', {
      userId: user?.id || 'No disponible',
      userEmail: user?.email || 'No disponible',
      userName: user?.nombre || 'No disponible',
      tokenExists: !!token
    });
  }, []);

  // Cargar medicamentos/progreso tanto al montar como al enfocar la pantalla
  useEffect(() => {
    if (user?.id) {
      loadMedications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, selectedDate]);

  // Asegurarse de que se carguen los datos cuando el token o el usuario cambian
  useEffect(() => {
    if (token && user?.id) {
      console.log('🔄 Datos de usuario/token actualizados, cargando medicamentos...');
      loadMedications();
    }
  }, [token, user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      if (user?.id && token) {
        console.log('🔄 Pantalla enfocada, cargando medicamentos...');
        loadMedications();
      }
    }, [user?.id, token, selectedDate])
  );

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
    if (!user?.id || !token) {
      console.log('⚠️ No hay usuario o token disponible, no se cargarán medicamentos');
      setTodayMedications([]);
      setDailyProgress({ total: 0, taken: 0, percentage: 0 });
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // Asegurarse de que el token está establecido en el API
      await api.setAuthToken(token);
      
      // Formatear fecha para la API
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      console.log('📅 Fecha seleccionada para la API:', formattedDate);
      
      // Log del token de autenticación
      console.log('🔑 Token para la solicitud:', token ? `${token.substring(0, 20)}...` : 'No hay token');
      
      // Obtener progreso diario
      console.log('🔄 Solicitando progreso diario...');
      const progressResponse = await prescriptionService.getDailyProgress(selectedDate);
      
      console.log('📊 Respuesta completa de progreso diario:', JSON.stringify(progressResponse));
      
      if (progressResponse.success && progressResponse.data) {
        const { total = 0, taken = 0, pending = 0, percentage = 0, date, intakes = [] } = progressResponse.data;
        console.log('✅ Datos de progreso procesados:', { total, taken, pending, percentage, date, formattedDate });
        
        // Verificar si hay discrepancia entre fechas
        if (date && date !== formattedDate) {
          console.warn('⚠️ La fecha devuelta por el servidor no coincide con la solicitada:', 
            { solicitada: formattedDate, recibida: date });
        }
        
        setDailyProgress({ total, taken, pending, percentage });
        
        // Agrupar intakes por ID de medicamento
        const groupedMedications = [];
        const medicationMap = new Map();
        
        // Agrupar por ID de medicamento
        intakes.forEach(intake => {
          const medId = intake.medication.id;
          
          if (!medicationMap.has(medId)) {
            medicationMap.set(medId, {
              id: medId,
              name: intake.medication.name,
              dosage: intake.medication.dosage,
              intakes: []
            });
          }
          
          medicationMap.get(medId).intakes.push(intake);
        });
        
        // Convertir el mapa a un array y formatear para el componente
        medicationMap.forEach((medData) => {
          const times = [];
          const dateTaken = [];
          
          // Procesar cada intake para obtener los tiempos
          medData.intakes.forEach(intake => {
            const schedTime = new Date(intake.scheduled_time);
            const timeStr = format(schedTime, 'HH:mm');
            
            times.push(timeStr);
            
            if (intake.taken) {
              dateTaken.push(timeStr);
            }
          });
          
          // Agregar el medicamento al array con los tiempos procesados
          groupedMedications.push({
            id: medData.id,
            name: medData.name,
            dosage: `${medData.dosage} unidades`,
            times,
            dateTaken,
            // Usar las notas del primer intake como frecuencia e instrucciones
            frequency: medData.intakes.length > 0 ? `${medData.intakes.length} veces al día` : '',
            instructions: medData.intakes.length > 0 ? medData.intakes[0].notes : '',
            // Guardar los intakes originales por si se necesitan
            _intakes: medData.intakes
          });
        });
        
        setTodayMedications(groupedMedications);
      } else {
        console.warn('⚠️ No se pudo obtener el progreso diario:', progressResponse.error);
        setDailyProgress({ total: 0, taken: 0, pending: 0, percentage: 0 });
        setTodayMedications([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar los datos:', error);
      // Agregar más detalles del error
      if (error.response) {
        console.error('❌ Respuesta del servidor:', {
          status: error.response.status,
          data: error.response.data
        });
      } else if (error.request) {
        console.error('❌ No se recibió respuesta del servidor');
      } else {
        console.error('❌ Error al configurar la solicitud:', error.message);
      }
      
      Alert.alert('Error', 'No se pudieron cargar los datos');
      setDailyProgress({ total: 0, taken: 0, percentage: 0 });
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
      // Buscar la toma correspondiente al medicamento y hora
      const medication = todayMedications.find(med => med.id === medicationId);
      if (!medication || !medication._intakes) {
        Alert.alert('Error', 'No se encontró información de la toma');
        return;
      }
      
      // Encontrar el ID de la toma específica basada en la hora
      const timeDate = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${time}`);
      const intake = medication._intakes.find(i => {
        const intakeTime = new Date(i.scheduled_time);
        return format(intakeTime, 'HH:mm') === time;
      });
      
      if (!intake) {
        Alert.alert('Error', 'No se encontró la toma para esta hora');
        return;
      }
      
      const intakeId = intake.id;
      console.log(`🔍 Intentando toggle para intake ID: ${intakeId}`);
      const isTaken = medication.dateTaken?.includes(time);
      
      // Mostrar confirmación según el estado actual
      if (isTaken) {
        // Confirmación para desmarcar
        Alert.alert(
          "Desmarcar medicamento",
          "¿Está seguro que desea desmarcar este medicamento? Utilice esta opción solo si lo marcó por error.",
          [
            { text: "Cancelar", style: "cancel" },
            { 
              text: "Desmarcar", 
              style: "destructive",
              onPress: async () => {
                try {
                  console.log(`🔄 Enviando solicitud a: /api/intakes/${intakeId}/toggle`);
                  // Usar fetch directamente para depuración
                  const token = await api.getToken();
                  const response = await fetch(`http://192.168.18.20:4000/api/intakes/${intakeId}/toggle`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    }
                  });
                  
                  if (!response.ok) {
                    console.error(`❌ Error HTTP: ${response.status} - ${response.statusText}`);
                    const errorText = await response.text();
                    console.error(`❌ Respuesta de error: ${errorText}`);
                    throw new Error(`Error HTTP: ${response.status}`);
                  }
                  
                  const data = await response.json();
                  if (data.success) {
                    console.log('✅ Medicamento desmarcado exitosamente');
                    // Recargar medicamentos
                    await loadMedications();
                  } else {
                    Alert.alert('Error', data.message || 'No se pudo desmarcar el medicamento');
                  }
                } catch (error) {
                  console.error('Error al desmarcar medicamento:', error);
                  Alert.alert('Error', 'No se pudo comunicar con el servidor');
                }
              }
            }
          ]
        );
      } else {
        // Confirmación para marcar como tomado
        Alert.alert(
          "Marcar medicamento",
          "¿Confirma que ha tomado este medicamento?",
          [
            { text: "Cancelar", style: "cancel" },
            { 
              text: "Confirmar", 
              onPress: async () => {
                try {
                  console.log(`🔄 Enviando solicitud a: /api/intakes/${intakeId}/toggle`);
                  // Usar fetch directamente para depuración
                  const token = await api.getToken();
                  const response = await fetch(`http://192.168.18.20:4000/api/intakes/${intakeId}/toggle`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    }
                  });
                  
                  if (!response.ok) {
                    console.error(`❌ Error HTTP: ${response.status} - ${response.statusText}`);
                    const errorText = await response.text();
                    console.error(`❌ Respuesta de error: ${errorText}`);
                    throw new Error(`Error HTTP: ${response.status}`);
                  }
                  
                  const data = await response.json();
                  if (data.success) {
                    console.log('✅ Medicamento marcado como tomado exitosamente');
                    // Recargar medicamentos
                    await loadMedications();
                  } else {
                    Alert.alert('Error', data.message || 'No se pudo marcar el medicamento como tomado');
                  }
                } catch (error) {
                  console.error('Error al marcar medicamento:', error);
                  Alert.alert('Error', 'No se pudo comunicar con el servidor');
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error al manejar toma de medicamento:', error);
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
    // Asegurarse de que todayMedications es un array
    if (!Array.isArray(todayMedications)) {
      return { totalDoses: 0, takenDoses: 0 };
    }
    
    const totalDoses = todayMedications.reduce((acc, med) => 
      acc + (Array.isArray(med.times) ? med.times.length : 0), 0);
    
    const takenDoses = todayMedications.reduce((acc, med) => 
      acc + (Array.isArray(med.dateTaken) ? med.dateTaken.length : 0), 0);
    
    return { totalDoses, takenDoses };
  };

  const { totalDoses, takenDoses } = getCompletionStats();
  const completionPercentage = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  useEffect(() => {
    const initializeToken = async () => {
      if (token) {
        console.log('🔑 Estableciendo token en ApiService.');
        await api.setAuthToken(token);
      } else {
        console.warn('⚠️ No se encontró token en el contexto de autenticación.');
      }
    };

    initializeToken();
  }, [token]);

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
            <Text style={styles.greeting}>¡Hola, {userName}!</Text>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E86AB" />
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
              <Text style={styles.progressPercentage}>{dailyProgress.percentage || 0}%</Text>
            </View>
            <View style={styles.progressDetails}>
              <Text style={styles.progressDetail}>
                Pendientes: <Text style={styles.progressValue}>{dailyProgress.pending || 0}</Text>
              </Text>
              <Text style={styles.progressDetail}>
                Medicamentos tomados: <Text style={styles.progressValue}>{dailyProgress.taken || 0}</Text>
              </Text>
              <Text style={styles.progressDetail}>
                Total de dosis: <Text style={styles.progressValue}>{dailyProgress.total || 0}</Text>
              </Text>
            </View>
          </View>
          
          {/* Barra de progreso visual */}
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${dailyProgress.percentage || 0}%` }
              ]} 
            />
          </View>
        </View>
        
        {/* Sección de medicamentos */}
        <View style={styles.medicationsSection}>
          <Text style={styles.sectionTitle}>Medicamentos</Text>
          
          {(!todayMedications || todayMedications.length === 0) ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>💊</Text>
              <Text style={styles.emptyTitle}>Sin medicamentos para hoy</Text>
              <Text style={styles.emptyMessage}>
                Parece que no tienes medicamentos programados para hoy. ¡Disfruta tu día!
              </Text>
            </View>
          ) : (
            todayMedications.map((medication) => {
              return (
                <MedicationCard
                  key={medication.id}
                  medication={medication}
                  onToggle={handleMedicationToggle}
                />
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// Componente para cada medicamento
const MedicationCard = ({ medication, onToggle }) => {
  // Verificación de seguridad para medication
  if (!medication) {
    return null;
  }
  
  const takenTimes = medication.dateTaken || [];
  const times = medication.times || [];
  
  // Calcular progreso de este medicamento
  const totalDoses = times.length;
  const takenDoses = takenTimes.length;
  const medicationProgress = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;
  
  return (
    <View style={styles.medicationCard}>
      <View style={styles.medicationHeader}>
        <Text style={styles.medicationName}>{medication.name || 'Sin nombre'}</Text>
        <Text style={styles.medicationDosage}>{medication.dosage || ''}</Text>
      </View>
      
      <View style={styles.medicationProgressRow}>
        <Text style={styles.medicationFrequency}>{medication.frequency || ''}</Text>
        <Text style={styles.medicationProgress}>
          {takenDoses}/{totalDoses} ({medicationProgress}%)
        </Text>
      </View>
      
      {medication.instructions && (
        <Text style={styles.medicationInstructions}>📝 {medication.instructions}</Text>
      )}

      <View style={styles.medicationTimes}>
        {times.map(time => {
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
  progressValue: {
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#E9ECEF',
    borderRadius: 5,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2E86AB',
    borderRadius: 5,
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
  medicationProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationProgress: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E86AB',
  },
});

export default PatientDashboard;
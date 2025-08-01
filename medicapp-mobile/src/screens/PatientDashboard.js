import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Text, Button, ActivityIndicator, Chip, FAB, Divider, SegmentedButtons } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';
import PrescriptionItem from '../components/PrescriptionItem';

const PatientDashboard = ({ route }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState(route?.params?.view === 'calendar' ? 'calendar' : 'list');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState({});
  const [stats, setStats] = useState(null);
  
  const { userInfo, logout } = useContext(AuthContext);

  // Cargar recetas del paciente
  useEffect(() => {
    fetchPrescriptions();
    fetchStats();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/api/prescriptions/my-prescriptions');
      setPrescriptions(response.data.prescriptions);
      
      // Preparar fechas marcadas para el calendario
      const marked = {};
      response.data.prescriptions.forEach(prescription => {
        const date = new Date(prescription.fecha).toISOString().split('T')[0];
        marked[date] = { 
          marked: true, 
          dotColor: '#2196F3',
          selectedColor: '#E3F2FD',
        };
        
        // Marcar fechas con medicamentos pendientes
        prescription.items.forEach(item => {
          if (item.horarioTomas) {
            item.horarioTomas.forEach(toma => {
              if (!toma.tomado && toma.puedeTomarAhora) {
                const tomaDate = new Date(toma.fecha).toISOString().split('T')[0];
                marked[tomaDate] = { 
                  ...marked[tomaDate],
                  marked: true,
                  dotColor: '#F44336',
                };
              }
            });
          }
        });
      });
      
      // Marcar el día seleccionado
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true
      };
      
      setMarkedDates(marked);
    } catch (error) {
      console.error('Error al obtener recetas:', error);
      setError('No se pudieron cargar tus recetas. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/prescriptions/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
    }
  };

  const handleMarkTaken = async (itemId) => {
    try {
      await api.post('/api/prescriptions/mark-taken', {
        prescriptionItemId: itemId
      });
      
      // Actualizar la lista de recetas
      fetchPrescriptions();
      fetchStats();
    } catch (error) {
      console.error('Error al marcar medicamento como tomado:', error);
      setError('No se pudo marcar el medicamento como tomado. Intenta de nuevo.');
    }
  };

  const onDayPress = (day) => {
    const selected = day.dateString;
    setSelectedDate(selected);
    
    // Actualizar fechas marcadas
    const updatedMarkedDates = { ...markedDates };
    
    // Eliminar selección anterior
    Object.keys(updatedMarkedDates).forEach(date => {
      if (updatedMarkedDates[date].selected) {
        updatedMarkedDates[date] = {
          ...updatedMarkedDates[date],
          selected: false
        };
      }
    });
    
    // Agregar nueva selección
    updatedMarkedDates[selected] = {
      ...updatedMarkedDates[selected],
      selected: true
    };
    
    setMarkedDates(updatedMarkedDates);
  };

  // Filtrar recetas por fecha para la vista de calendario
  const getFilteredPrescriptions = () => {
    if (viewMode !== 'calendar' || !selectedDate) return prescriptions;
    
    return prescriptions.filter(prescription => {
      // Incluir recetas de la fecha seleccionada
      const prescriptionDate = new Date(prescription.fecha).toISOString().split('T')[0];
      if (prescriptionDate === selectedDate) return true;
      
      // Incluir recetas con tomas programadas para la fecha seleccionada
      let hasTake = false;
      prescription.items.forEach(item => {
        if (item.horarioTomas) {
          item.horarioTomas.forEach(toma => {
            const tomaDate = new Date(toma.fecha).toISOString().split('T')[0];
            if (tomaDate === selectedDate) {
              hasTake = true;
            }
          });
        }
      });
      
      return hasTake;
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Cargando tus recetas...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={50} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={fetchPrescriptions}
            style={styles.retryButton}
          >
            Intentar de nuevo
          </Button>
        </View>
      );
    }

    const filteredPrescriptions = getFilteredPrescriptions();

    if (filteredPrescriptions.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="medkit-outline" size={50} color="#757575" />
          <Text style={styles.emptyText}>
            {viewMode === 'calendar' 
              ? 'No hay medicamentos para esta fecha'
              : 'No tienes recetas médicas'
            }
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredPrescriptions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.prescriptionContainer}>
            <Card style={styles.prescriptionCard}>
              <Card.Content>
                <View style={styles.prescriptionHeader}>
                  <View>
                    <Text style={styles.prescriptionNumber}>Receta #{item.num_receta}</Text>
                    <Text style={styles.prescriptionDate}>
                      {new Date(item.fecha).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.doctorName}>
                    Dr. {item.profesional.nombres} {item.profesional.apellidos}
                  </Text>
                </View>
                <Divider style={styles.divider} />
                
                {item.items.map((prescriptionItem) => (
                  <PrescriptionItem 
                    key={prescriptionItem.id} 
                    item={prescriptionItem} 
                    onMarkTaken={() => handleMarkTaken(prescriptionItem.id)}
                  />
                ))}
              </Card.Content>
            </Card>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Mis Medicamentos" onLogout={logout} />
      
      {stats && (
        <Card style={styles.statsCard}>
          <Card.Content>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.total_recetas}</Text>
                <Text style={styles.statLabel}>Recetas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.medicamentos_tomados}</Text>
                <Text style={styles.statLabel}>Tomados</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.medicamentos_pendientes}</Text>
                <Text style={styles.statLabel}>Pendientes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.porcentaje_cumplimiento}%</Text>
                <Text style={styles.statLabel}>Cumplimiento</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}
      
      <View style={styles.viewToggle}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={setViewMode}
          buttons={[
            { value: 'list', icon: 'format-list-bulleted', label: 'Lista' },
            { value: 'calendar', icon: 'calendar', label: 'Calendario' },
          ]}
        />
      </View>
      
      {viewMode === 'calendar' && (
        <Card style={styles.calendarCard}>
          <Calendar
            markedDates={markedDates}
            onDayPress={onDayPress}
            theme={{
              todayTextColor: '#2196F3',
              selectedDayBackgroundColor: '#2196F3',
              selectedDayTextColor: '#FFFFFF',
            }}
          />
        </Card>
      )}
      
      <View style={styles.content}>
        {renderContent()}
      </View>
      
      <FAB
        style={styles.fab}
        icon="refresh"
        onPress={fetchPrescriptions}
        color="#FFFFFF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  statsCard: {
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
  },
  viewToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  calendarCard: {
    marginHorizontal: 15,
    marginBottom: 10,
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#757575',
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    marginTop: 10,
    backgroundColor: '#2196F3',
  },
  emptyText: {
    color: '#757575',
    textAlign: 'center',
    marginTop: 10,
  },
  list: {
    padding: 15,
  },
  prescriptionContainer: {
    marginBottom: 15,
  },
  prescriptionCard: {
    elevation: 2,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  prescriptionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  prescriptionDate: {
    fontSize: 14,
    color: '#757575',
  },
  doctorName: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
  },
  divider: {
    marginVertical: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});

export default PatientDashboard;

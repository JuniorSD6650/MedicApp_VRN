import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, Text, ActivityIndicator, List, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';
import PrescriptionItem from '../components/PrescriptionItem';

const DoctorDashboard = ({ route }) => {
  const [patientDni, setPatientDni] = useState('');
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [error, setError] = useState(null);
  const { userInfo, logout } = useContext(AuthContext);
  const view = route?.params?.view || 'search';

  const searchPatient = async () => {
    if (!patientDni.trim()) {
      setError('Por favor ingresa el DNI del paciente');
      return;
    }

    setLoading(true);
    setError(null);
    setPatient(null);
    setPrescriptions([]);

    try {
      console.log('Buscando paciente con DNI:', patientDni);
      const response = await api.get(`/api/prescriptions/history/${patientDni}`);
      
      if (response.data.success && response.data.patient) {
        console.log('Paciente encontrado:', response.data.patient.nombre_completo);
        setPatient(response.data.patient);
        setPrescriptions(response.data.prescriptions || []);
        
        if (response.data.prescriptions?.length === 0) {
          console.log('Paciente sin recetas médicas');
        }
      } else {
        setError('No se pudo obtener información del paciente');
      }
    } catch (error) {
      console.error('Error al buscar paciente:', error);
      const errorMessage = error.response?.data?.message || 
                           'No se encontraron datos del paciente';
      
      // Mostrar mensaje más detallado
      if (error.response?.status === 404) {
        setError(`Paciente con DNI ${patientDni} no encontrado en el sistema`);
      } else if (error.response?.status === 403) {
        setError('No tienes permiso para ver el historial de este paciente');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Panel Médico" onLogout={logout} />
      
      <View style={styles.content}>
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Title>Dr. {userInfo?.nombre || ''}</Title>
            <Paragraph>Consulta el historial médico de tus pacientes.</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.searchCard}>
          <Card.Content>
            <Title>Buscar Paciente</Title>
            <View style={styles.searchContainer}>
              <TextInput
                label="DNI del Paciente"
                value={patientDni}
                onChangeText={setPatientDni}
                style={styles.searchInput}
                keyboardType="numeric"
                left={<TextInput.Icon icon="account-search" />}
                mode="outlined"
              />
              <Button 
                mode="contained" 
                onPress={searchPatient}
                loading={loading}
                disabled={loading}
                style={styles.searchButton}
              >
                Buscar
              </Button>
            </View>
            
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </Card.Content>
        </Card>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Buscando paciente...</Text>
          </View>
        )}

        {patient && (
          <Card style={styles.patientCard}>
            <Card.Content>
              <Title>Información del Paciente</Title>
              <View style={styles.patientInfo}>
                <List.Item
                  title="Nombre"
                  description={patient.nombre_completo}
                  left={props => <List.Icon {...props} icon="account" />}
                />
                <Divider />
                <List.Item
                  title="DNI"
                  description={patient.dni}
                  left={props => <List.Icon {...props} icon="card-account-details" />}
                />
                <Divider />
                <List.Item
                  title="Fecha de Nacimiento"
                  description={new Date(patient.fecha_nacimiento).toLocaleDateString()}
                  left={props => <List.Icon {...props} icon="calendar" />}
                />
                <Divider />
                <List.Item
                  title="Género"
                  description={patient.genero === 'M' ? 'Masculino' : 'Femenino'}
                  left={props => <List.Icon {...props} icon={patient.genero === 'M' ? "gender-male" : "gender-female"} />}
                />
              </View>
            </Card.Content>
          </Card>
        )}

        {patient && prescriptions.length > 0 && (
          <Card style={styles.prescriptionsCard}>
            <Card.Content>
              <Title>Historial de Medicamentos</Title>
              <Paragraph>Total de recetas: {prescriptions.length}</Paragraph>
            </Card.Content>
            
            <FlatList
              data={prescriptions}
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
                      </View>
                      <Divider style={styles.divider} />
                      
                      {item.items.map((prescriptionItem) => (
                        <PrescriptionItem 
                          key={prescriptionItem.id} 
                          item={prescriptionItem} 
                          isDoctor={true}
                        />
                      ))}
                    </Card.Content>
                  </Card>
                </View>
              )}
              contentContainerStyle={styles.prescriptionsList}
            />
          </Card>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  welcomeCard: {
    marginBottom: 15,
    elevation: 2,
  },
  searchCard: {
    marginBottom: 15,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#F9F9F9',
  },
  searchButton: {
    backgroundColor: '#4CAF50',
  },
  errorText: {
    color: '#F44336',
    marginTop: 10,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  patientCard: {
    marginBottom: 15,
    elevation: 2,
  },
  patientInfo: {
    marginTop: 10,
  },
  prescriptionsCard: {
    marginBottom: 15,
    elevation: 2,
  },
  prescriptionsList: {
    paddingVertical: 10,
  },
  prescriptionContainer: {
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  prescriptionCard: {
    elevation: 1,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  prescriptionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  prescriptionDate: {
    fontSize: 14,
    color: '#757575',
  },
  divider: {
    marginVertical: 10,
  },
});

export default DoctorDashboard;

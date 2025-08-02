import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { patientService } from '../services/patientService';

const PatientSearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchType, setSearchType] = useState('name'); // 'name' or 'dni'

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchQuery, patients, searchType]);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const allPatients = await patientService.getAllPatients();
      setPatients(allPatients);
      setFilteredPatients(allPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
      Alert.alert('Error', 'No se pudieron cargar los pacientes');
    } finally {
      setIsLoading(false);
    }
  };

  const filterPatients = () => {
    if (!searchQuery.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = patients.filter(patient => {
      if (searchType === 'name') {
        return patient.name.toLowerCase().includes(query);
      } else {
        return patient.dni.includes(query);
      }
    });

    setFilteredPatients(filtered);
  };

  const handlePatientPress = (patient) => {
    navigation.navigate('PatientDetail', { patientId: patient.id });
  };

  const renderPatientItem = ({ item }) => (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={() => handlePatientPress(item)}
    >
      <View style={styles.patientAvatar}>
        <Text style={styles.avatarText}>
          {item.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientDetails}>
          DNI: {item.dni} • {item.age} años
        </Text>
        <Text style={styles.patientContact}>
          📞 {item.phone} • 📧 {item.email}
        </Text>
      </View>
      
      <View style={styles.patientArrow}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🔍</Text>
      <Text style={styles.emptyStateTitle}>
        {searchQuery ? 'No se encontraron pacientes' : 'Busca un paciente'}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchQuery 
          ? `No hay pacientes que coincidan con "${searchQuery}"`
          : 'Ingresa un nombre o DNI para buscar pacientes'
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchTypeContainer}>
          <TouchableOpacity
            style={[
              styles.searchTypeButton,
              searchType === 'name' && styles.searchTypeButtonActive
            ]}
            onPress={() => setSearchType('name')}
          >
            <Text style={[
              styles.searchTypeText,
              searchType === 'name' && styles.searchTypeTextActive
            ]}>
              Nombre
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.searchTypeButton,
              searchType === 'dni' && styles.searchTypeButtonActive
            ]}
            onPress={() => setSearchType('dni')}
          >
            <Text style={[
              styles.searchTypeText,
              searchType === 'dni' && styles.searchTypeTextActive
            ]}>
              DNI
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={searchType === 'name' ? 'Buscar por nombre...' : 'Buscar por DNI...'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            keyboardType={searchType === 'dni' ? 'numeric' : 'default'}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {searchQuery 
              ? `Resultados (${filteredPatients.length})`
              : `Todos los pacientes (${patients.length})`
            }
          </Text>
          
          {!searchQuery && (
            <TouchableOpacity style={styles.addPatientButton}>
              <Text style={styles.addPatientText}>+ Nuevo paciente</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredPatients}
          renderItem={renderPatientItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          onRefresh={loadPatients}
          refreshing={isLoading}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  searchHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchTypeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 4,
  },
  searchTypeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  searchTypeButtonActive: {
    backgroundColor: '#2E86AB',
  },
  searchTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C757D',
  },
  searchTypeTextActive: {
    color: '#FFFFFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#495057',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#6C757D',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E86AB',
  },
  addPatientButton: {
    backgroundColor: '#28A745',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addPatientText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  listContainer: {
    paddingBottom: 20,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2E86AB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  patientContact: {
    fontSize: 12,
    color: '#6C757D',
  },
  patientArrow: {
    marginLeft: 16,
  },
  arrowText: {
    fontSize: 24,
    color: '#6C757D',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
});

export default PatientSearchScreen;

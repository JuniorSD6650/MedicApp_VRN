import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { prescriptionService } from '../services/prescriptionService';

const PrescriptionListScreen = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const loadPrescriptions = async (status = 'all') => {
    try {
      setLoading(true);
      const response = await prescriptionService.getPrescriptionsByStatus(status);
      if (response.success) {
        setPrescriptions(response.data);
      }
    } catch (error) {
      console.error('Error cargando recetas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions(activeFilter);
  }, [activeFilter]);

  const FilterButton = ({ title, value }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeFilter === value && styles.filterButtonActive
      ]}
      onPress={() => setActiveFilter(value)}
    >
      <Text style={[
        styles.filterButtonText,
        activeFilter === value && styles.filterButtonTextActive
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86AB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <FilterButton title="Todas" value="all" />
        <FilterButton title="Activas" value="active" />
        <FilterButton title="Completadas" value="completed" />
      </View>

      <FlatList
        data={prescriptions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.prescriptionCard}>
            <Text style={styles.prescriptionDate}>
              {new Date(item.fecha).toLocaleDateString()}
            </Text>
            <Text style={styles.prescriptionNumber}>
              Receta #{item.num_receta}
            </Text>
            {/* Renderizar medicamentos de la receta */}
            {item.PrescriptionItems?.map(prescriptionItem => (
              <View key={prescriptionItem.id} style={styles.medicationItem}>
                <Text style={styles.medicationName}>
                  {prescriptionItem.Medication?.descripcion}
                </Text>
                <Text style={styles.medicationDosage}>
                  Cantidad: {prescriptionItem.cantidad_solicitada}
                </Text>
              </View>
            ))}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // ... estilos existentes y nuevos...
});

export default PrescriptionListScreen;

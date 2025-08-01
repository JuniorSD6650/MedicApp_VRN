import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Chip, Button, Surface, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const PrescriptionItem = ({ item, onMarkTaken, isDoctor = false }) => {
  // Formatear la información del medicamento para mostrarla
  const formatMedicationInfo = () => {
    const med = item.medicamento;
    return `${med.descripcion} (${med.unidad})`;
  };

  // Determinar si se puede mostrar el botón de marcar como tomado
  const canMarkAsTaken = () => {
    return !isDoctor && !item.tomado && item.horarioTomas?.some(toma => toma.puedeTomarAhora);
  };

  // Renderizar información de tomas programadas
  const renderSchedule = () => {
    if (!item.horarioTomas || isDoctor) return null;

    const today = new Date().toDateString();
    const todayTakes = item.horarioTomas.filter(
      toma => new Date(toma.fecha).toDateString() === today
    );

    if (todayTakes.length === 0) return null;

    return (
      <View style={styles.scheduleContainer}>
        <Text style={styles.scheduleTitle}>Horario de hoy:</Text>
        <View style={styles.scheduleList}>
          {todayTakes.map((toma, index) => (
            <Chip 
              key={index} 
              style={[
                styles.scheduleChip,
                toma.tomado ? styles.takenChip : (toma.puedeTomarAhora ? styles.canTakeChip : styles.pendingChip)
              ]}
              icon={toma.tomado ? "check" : (toma.puedeTomarAhora ? "alarm" : "clock-outline")}
            >
              {new Date(toma.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Chip>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Surface style={styles.container}>
      <View style={styles.header}>
        <View style={styles.medicationInfo}>
          <Text style={styles.medicationName}>{formatMedicationInfo()}</Text>
          <Text style={styles.dosage}>
            Cantidad: {item.cantidad_solicitada} {item.medicamento?.unidad}
            {item.cantidad_dispensada && ` (Dispensado: ${item.cantidad_dispensada})`}
          </Text>
          {item.dx_descripcion && (
            <Text style={styles.diagnosis}>
              Diagnóstico: {item.dx_descripcion}
            </Text>
          )}
        </View>
        <View style={styles.statusContainer}>
          {item.tomado ? (
            <Chip icon="check-circle" style={styles.takenStatus}>Tomado</Chip>
          ) : (
            <Chip icon="clock-outline" style={styles.pendingStatus}>Pendiente</Chip>
          )}
        </View>
      </View>
      
      {renderSchedule()}
      
      {canMarkAsTaken() && (
        <Button 
          mode="contained" 
          onPress={() => onMarkTaken(item.id)}
          style={styles.markTakenButton}
          icon="pill"
        >
          Marcar como tomado
        </Button>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dosage: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  diagnosis: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  statusContainer: {
    marginLeft: 10,
  },
  takenStatus: {
    backgroundColor: '#E8F5E9',
    color: '#4CAF50',
  },
  pendingStatus: {
    backgroundColor: '#FFF3E0',
    color: '#FF9800',
  },
  scheduleContainer: {
    marginTop: 10,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 5,
  },
  scheduleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  scheduleChip: {
    margin: 2,
  },
  takenChip: {
    backgroundColor: '#E8F5E9',
  },
  canTakeChip: {
    backgroundColor: '#E3F2FD',
  },
  pendingChip: {
    backgroundColor: '#F5F5F5',
  },
  markTakenButton: {
    marginTop: 10,
    backgroundColor: '#2196F3',
  },
});

export default PrescriptionItem;

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/theme';

const PrescriptionItem = ({ 
  prescription, 
  onPress,
  showStatus = true,
  showDate = true 
}) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'activo':
        return COLORS.success;
      case 'completed':
      case 'completado':
        return COLORS.info;
      case 'expired':
      case 'expirado':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => onPress?.(prescription)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.doctorName}>
          Dr. {prescription?.professional?.name || 'Nombre no disponible'}
        </Text>
        {showStatus && prescription?.status && (
          <View style={[
            styles.statusBadge, 
            { backgroundColor: getStatusColor(prescription.status) }
          ]}>
            <Text style={styles.statusText}>
              {prescription.status}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.diagnosis}>
        {prescription?.diagnosis || 'Sin diagnóstico especificado'}
      </Text>

      {showDate && prescription?.createdAt && (
        <Text style={styles.date}>
          Fecha: {formatDate(prescription.createdAt)}
        </Text>
      )}

      {prescription?.medications && prescription.medications.length > 0 && (
        <View style={styles.medicationsContainer}>
          <Text style={styles.medicationsTitle}>
            Medicamentos ({prescription.medications.length}):
          </Text>
          {prescription.medications.slice(0, 2).map((med, index) => (
            <Text key={index} style={styles.medicationItem}>
              • {med.name || med.medication?.name || 'Medicamento'}
              {med.dosage && ` - ${med.dosage}`}
            </Text>
          ))}
          {prescription.medications.length > 2 && (
            <Text style={styles.moreText}>
              y {prescription.medications.length - 2} más...
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    marginHorizontal: SIZES.margin,
    marginBottom: SIZES.base,
    borderRadius: SIZES.radius,
    ...SHADOWS.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  doctorName: {
    fontSize: SIZES.callout,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: SIZES.base,
    paddingVertical: SIZES.base / 2,
    borderRadius: SIZES.radius / 2,
    marginLeft: SIZES.base,
  },
  statusText: {
    fontSize: SIZES.caption1,
    fontFamily: FONTS.medium,
    color: COLORS.surface,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  diagnosis: {
    fontSize: SIZES.subhead,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    marginBottom: SIZES.base,
    lineHeight: SIZES.subhead * 1.2,
  },
  date: {
    fontSize: SIZES.footnote,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SIZES.base,
  },
  medicationsContainer: {
    marginTop: SIZES.base / 2,
    paddingTop: SIZES.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  medicationsTitle: {
    fontSize: SIZES.footnote,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: SIZES.base / 2,
  },
  medicationItem: {
    fontSize: SIZES.footnote,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    marginBottom: 2,
  },
  moreText: {
    fontSize: SIZES.footnote,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
});

export default PrescriptionItem;

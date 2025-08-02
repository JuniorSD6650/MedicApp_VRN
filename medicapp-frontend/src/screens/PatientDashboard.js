import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/theme';
import Header from '../components/Header';

const PatientDashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const StatCard = ({ title, value, color = COLORS.primary }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const QuickActionButton = ({ title, onPress, color = COLORS.primary }) => (
    <TouchableOpacity 
      style={[styles.actionButton, { backgroundColor: color }]} 
      onPress={onPress}
    >
      <Text style={styles.actionButtonText}>{title}</Text>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Header 
        title={`Hola, ${user.name || 'Usuario'}`}
        subtitle="Panel de Paciente"
      />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              title="Recetas Activas" 
              value="3" 
              color={COLORS.success}
            />
            <StatCard 
              title="Medicamentos" 
              value="5" 
              color={COLORS.primary}
            />
            <StatCard 
              title="Próxima Toma" 
              value="2h" 
              color={COLORS.warning}
            />
            <StatCard 
              title="Adherencia" 
              value="85%" 
              color={COLORS.info}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsGrid}>
            <QuickActionButton 
              title="Ver Recetas"
              onPress={() => {}}
              color={COLORS.primary}
            />
            <QuickActionButton 
              title="Registrar Toma"
              onPress={() => {}}
              color={COLORS.success}
            />
            <QuickActionButton 
              title="Mi Perfil"
              onPress={() => {}}
              color={COLORS.info}
            />
            <QuickActionButton 
              title="Historial"
              onPress={() => {}}
              color={COLORS.secondary}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>
              No hay actividad reciente para mostrar
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
  },
  loadingText: {
    marginTop: SIZES.base,
    fontSize: SIZES.body,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: SIZES.title3,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SIZES.margin,
  },
  statsContainer: {
    marginBottom: SIZES.margin * 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    width: '48%',
    marginBottom: SIZES.base,
    borderLeftWidth: 4,
    ...SHADOWS.light,
  },
  statValue: {
    fontSize: SIZES.title2,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: SIZES.footnote,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SIZES.base / 2,
  },
  actionsContainer: {
    marginBottom: SIZES.margin * 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    width: '48%',
    marginBottom: SIZES.base,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  actionButtonText: {
    color: COLORS.surface,
    fontSize: SIZES.subhead,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  activityContainer: {
    marginBottom: SIZES.margin * 2,
  },
  activityCard: {
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    ...SHADOWS.light,
  },
  activityText: {
    fontSize: SIZES.body,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  logoutButtonText: {
    color: COLORS.surface,
    fontSize: SIZES.callout,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
});

export default PatientDashboard;

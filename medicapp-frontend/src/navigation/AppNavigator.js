import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Patient screens
import PatientDashboard from '../screens/PatientDashboard';
import PrescriptionsScreen from '../screens/PrescriptionsScreen';
import PrescriptionDetailScreen from '../screens/PrescriptionDetailScreen';

// Doctor screens
import DoctorDashboard from '../screens/DoctorDashboard';
import PatientSearchScreen from '../screens/PatientSearchScreen';
import PatientDetailScreen from '../screens/PatientDetailScreen';

// Admin screens
import AdminDashboard from '../screens/AdminDashboard';
import CsvUploadScreen from '../screens/CsvUploadScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const MainStack = createStackNavigator();

// Loading component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#2E86AB" />
    <Text style={styles.loadingText}>Cargando...</Text>
  </View>
);

// Auth Stack Navigator
const AuthNavigator = () => {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

// Patient Tab Navigator
const PatientNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#2E86AB',
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingTop: 5,
          paddingBottom: 5,
          height: 60,
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={PatientDashboard}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Prescriptions" 
        component={PrescriptionsStackNavigator}
        options={{
          tabBarLabel: 'Recetas',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Prescriptions Stack Navigator (para navegar entre lista y detalles)
const PrescriptionsStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="PrescriptionsList" 
        component={PrescriptionsScreen}
        options={{ 
          title: 'Mis Recetas',
          headerStyle: { backgroundColor: '#2E86AB' },
          headerTintColor: '#FFFFFF',
        }}
      />
      <Stack.Screen 
        name="PrescriptionDetail" 
        component={PrescriptionDetailScreen}
        options={{ 
          title: 'Detalle de Receta',
          headerStyle: { backgroundColor: '#2E86AB' },
          headerTintColor: '#FFFFFF',
        }}
      />
    </Stack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
      />
    </Stack.Navigator>
  );
};

// Doctor Drawer Navigator
const DoctorNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="DoctorDashboard"
      screenOptions={{
        headerStyle: { backgroundColor: '#2E86AB' },
        headerTintColor: '#FFFFFF',
        drawerActiveTintColor: '#2E86AB',
        drawerInactiveTintColor: '#666666',
      }}
    >
      <Drawer.Screen 
        name="DoctorDashboard" 
        component={DoctorDashboard}
        options={{
          title: 'Panel Médico',
          drawerLabel: 'Inicio',
          drawerIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏠</Text>
          ),
        }}
      />
      <Drawer.Screen 
        name="PatientSearch" 
        component={PatientStackNavigator}
        options={{
          title: 'Buscar Pacientes',
          drawerLabel: 'Pacientes',
          drawerIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>👥</Text>
          ),
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Mi Perfil',
          drawerLabel: 'Perfil',
          drawerIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>👤</Text>
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

// Patient Stack Navigator for doctors
const PatientStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PatientSearchList" component={PatientSearchScreen} />
      <Stack.Screen name="PatientDetail" component={PatientDetailScreen} />
    </Stack.Navigator>
  );
};

// Admin Drawer Navigator
const AdminNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="AdminDashboard"
      screenOptions={{
        headerStyle: { backgroundColor: '#2E86AB' },
        headerTintColor: '#FFFFFF',
        drawerActiveTintColor: '#2E86AB',
        drawerInactiveTintColor: '#666666',
      }}
    >
      <Drawer.Screen 
        name="AdminDashboard" 
        component={AdminDashboard}
        options={{
          title: 'Panel Administrativo',
          drawerLabel: 'Inicio',
          drawerIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏠</Text>
          ),
        }}
      />
      <Drawer.Screen 
        name="CsvUpload" 
        component={CsvUploadScreen}
        options={{
          title: 'Cargar CSV',
          drawerLabel: 'Importar Datos',
          drawerIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📁</Text>
          ),
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Mi Perfil',
          drawerLabel: 'Perfil',
          drawerIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>👤</Text>
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // Renderizar el navegador correspondiente según el rol
  switch (user?.rol) {
    case 'admin':
      return <AdminNavigator />;
    case 'medico':
      return <DoctorNavigator />;
    case 'paciente':
      return <PatientNavigator />;
    default:
      return <AuthNavigator />;
  }
};

const styles = StyleSheet.create({
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
    fontWeight: '500',
  },
});

export default AppNavigator;

import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Contexto de autenticación
import { AuthContext } from '../context/AuthContext';

// Pantallas
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import AdminDashboard from '../screens/AdminDashboard';
import DoctorDashboard from '../screens/DoctorDashboard';
import PatientDashboard from '../screens/PatientDashboard';

// Navegadores
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navegador para pacientes
const PatientTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Mis Recetas') {
          iconName = focused ? 'medkit' : 'medkit-outline';
        } else if (route.name === 'Calendario') {
          iconName = focused ? 'calendar' : 'calendar-outline';
        } else if (route.name === 'Perfil') {
          iconName = focused ? 'person' : 'person-outline';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#2196F3',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="Mis Recetas" component={PatientDashboard} />
    <Tab.Screen name="Calendario" component={PatientDashboard} initialParams={{ view: 'calendar' }} />
    <Tab.Screen name="Perfil" component={PatientDashboard} initialParams={{ view: 'profile' }} />
  </Tab.Navigator>
);

// Navegador para médicos
const DoctorTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Pacientes') {
          iconName = focused ? 'people' : 'people-outline';
        } else if (route.name === 'Historial') {
          iconName = focused ? 'document-text' : 'document-text-outline';
        } else if (route.name === 'Perfil') {
          iconName = focused ? 'person' : 'person-outline';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#4CAF50',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="Pacientes" component={DoctorDashboard} />
    <Tab.Screen name="Historial" component={DoctorDashboard} initialParams={{ view: 'history' }} />
    <Tab.Screen name="Perfil" component={DoctorDashboard} initialParams={{ view: 'profile' }} />
  </Tab.Navigator>
);

// Navegador principal
const AppNavigator = () => {
  const { isLoading, userToken, userInfo } = useContext(AuthContext);

  if (isLoading) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userToken ? (
        // Rutas autenticadas según rol
        userInfo?.rol === 'admin' ? (
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        ) : userInfo?.rol === 'medico' || userInfo?.rol === 'profesional' ? (
          <Stack.Screen name="DoctorDashboard" component={DoctorTabNavigator} />
        ) : (
          <Stack.Screen name="PatientDashboard" component={PatientTabNavigator} />
        )
      ) : (
        // Ruta de login
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;

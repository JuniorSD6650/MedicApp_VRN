import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import PatientDashboard from '../screens/PatientDashboard';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

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
      {/* Add Register screen when created */}
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
        }}
      />
      {/* Add more tabs as needed */}
    </Tab.Navigator>
  );
};

// Doctor Navigator (placeholder for future implementation)
const DoctorNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2E86AB',
        tabBarInactiveTintColor: '#666666',
      }}
    >
      <Tab.Screen 
        name="DoctorDashboard" 
        component={PatientDashboard} // Placeholder
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
    </Tab.Navigator>
  );
};

// Admin Navigator (placeholder for future implementation)
const AdminNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2E86AB',
        tabBarInactiveTintColor: '#666666',
      }}
    >
      <Tab.Screen 
        name="AdminDashboard" 
        component={PatientDashboard} // Placeholder
        options={{
          tabBarLabel: 'Admin',
        }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return null; // or a loading screen
  }

  if (!isAuthenticated) {
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  // Determine navigator based on user role
  const getUserNavigator = () => {
    if (!user?.role) {
      return <PatientNavigator />; // Default to patient
    }

    switch (user.role.toLowerCase()) {
      case 'patient':
      case 'paciente':
        return <PatientNavigator />;
      case 'professional':
      case 'doctor':
      case 'médico':
        return <DoctorNavigator />;
      case 'admin':
      case 'administrator':
        return <AdminNavigator />;
      default:
        return <PatientNavigator />; // Default fallback
    }
  };

  return (
    <NavigationContainer>
      {getUserNavigator()}
    </NavigationContainer>
  );
};

export default AppNavigator;

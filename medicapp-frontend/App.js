import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MedicApp Frontend</Text>
      <Text style={styles.subtitle}>
        Aplicación React Native multiplataforma para gestión de medicamentos
      </Text>
      <Text style={styles.platform}>
        Plataforma: Web, iOS, Android
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  platform: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});

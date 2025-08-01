import React, { useState, useContext } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card, Title, Paragraph, Text, ActivityIndicator, Divider, List } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';

const AdminDashboard = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const { userInfo, logout } = useContext(AuthContext);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });
      
      if (result.type === 'success') {
        setFile(result);
        setUploadResult(null);
      }
    } catch (error) {
      console.error('Error al seleccionar archivo:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const uploadFile = async () => {
    if (!file) {
      Alert.alert('Error', 'Por favor selecciona un archivo primero');
      return;
    }

    setLoading(true);
    setUploadResult(null);

    try {
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: 'text/csv',
      });

      // Enviar archivo al servidor
      const response = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadResult({
        success: true,
        message: 'Archivo subido correctamente',
        data: response.data,
      });
    } catch (error) {
      console.error('Error al subir archivo:', error);
      setUploadResult({
        success: false,
        message: error.response?.data?.message || 'Error al subir archivo',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Panel de Administrador" onLogout={logout} />
      
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Bienvenido, {userInfo?.nombre || 'Administrador'}</Title>
            <Paragraph>Desde aquí puedes gestionar los datos de la aplicación.</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Cargar Datos CSV</Title>
            <Paragraph>Sube archivos CSV con información de pacientes, médicos o medicamentos.</Paragraph>
            
            <View style={styles.fileSection}>
              <Button 
                mode="outlined" 
                onPress={pickDocument} 
                icon="file-upload" 
                style={styles.button}
              >
                Seleccionar Archivo
              </Button>
              
              {file && (
                <View style={styles.fileInfo}>
                  <Ionicons name="document-text" size={24} color="#2196F3" />
                  <Text style={styles.fileName}>{file.name}</Text>
                </View>
              )}
              
              <Button 
                mode="contained" 
                onPress={uploadFile}
                disabled={!file || loading}
                loading={loading}
                icon="cloud-upload" 
                style={[styles.button, styles.uploadButton]}
              >
                Subir Archivo
              </Button>
            </View>
            
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>Subiendo archivo...</Text>
              </View>
            )}
            
            {uploadResult && (
              <View style={styles.resultContainer}>
                <Divider style={styles.divider} />
                <Text style={[
                  styles.resultText, 
                  uploadResult.success ? styles.successText : styles.errorText
                ]}>
                  {uploadResult.message}
                </Text>
                
                {uploadResult.success && uploadResult.data && (
                  <View style={styles.resultStats}>
                    <List.Item 
                      title="Registros procesados" 
                      right={() => <Text>{uploadResult.data.processed || 0}</Text>}
                      left={() => <List.Icon icon="check-circle" />}
                    />
                    <List.Item 
                      title="Registros con errores" 
                      right={() => <Text>{uploadResult.data.errors || 0}</Text>}
                      left={() => <List.Icon color="red" icon="alert-circle" />}
                    />
                  </View>
                )}
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
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
  card: {
    marginBottom: 15,
    elevation: 2,
  },
  fileSection: {
    marginTop: 20,
  },
  button: {
    marginVertical: 10,
  },
  uploadButton: {
    backgroundColor: '#2196F3',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 5,
  },
  fileName: {
    marginLeft: 10,
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  resultContainer: {
    marginTop: 15,
  },
  divider: {
    marginVertical: 15,
  },
  resultText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  successText: {
    color: '#4CAF50',
  },
  errorText: {
    color: '#F44336',
  },
  resultStats: {
    marginTop: 10,
    backgroundColor: '#FAFAFA',
    borderRadius: 5,
  },
});

export default AdminDashboard;

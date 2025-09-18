import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import CustomAlert from '../components/CustomAlert';
import userService from '../services/userService';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateUser } = useAuth();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullProfile, setFullProfile] = useState(null);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: []
  });
  // Solo los campos requeridos
  const [editFormData, setEditFormData] = useState({
    nombre: '',
    email: '',
    dni: ''
  });

  // Cargar perfil completo al iniciar
  useEffect(() => {
    loadFullProfile();
  }, []);

  const loadFullProfile = async () => {
    try {
      setLoading(true);
      const response = await userService.getProfile();
      if (response.success && response.data) {
        setFullProfile(response.data);
        setEditFormData({
          nombre: response.data.nombre || '',
          email: response.data.email || '',
          dni: response.data.dni || ''
        });
      }
      // No mostrar alerta si hay datos, solo si falla realmente
    } catch (error) {
      showAlert('Error', 'Ha ocurrido un error al cargar tu perfil');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title, message, buttons = [{ text: 'OK' }]) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons
    });
  };

  const hideAlert = () => {
    setAlertConfig({
      visible: false,
      title: '',
      message: '',
      buttons: []
    });
  };

  const handleLogout = async () => {
    showAlert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { 
          text: 'Cancelar', 
          style: 'cancel'
        },
        { 
          text: 'Salir', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      // Validar campos obligatorios
      if (!editFormData.nombre || !editFormData.email) {
        showAlert('Error', 'El nombre y el email son obligatorios');
        setLoading(false);
        return;
      }
      const userData = {
        nombre: editFormData.nombre,
        email: editFormData.email,
        dni: editFormData.dni
      };
      const result = await userService.updateProfile(userData);
      if (result.success) {
        await loadFullProfile();
        showAlert('Éxito', 'Perfil actualizado correctamente');
        setIsEditModalVisible(false);
      } else {
        showAlert('Error', result.error || 'No se pudo actualizar el perfil');
      }
    } catch (error) {
      showAlert('Error', 'Ha ocurrido un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !fullProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86AB" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  const profileData = fullProfile || user;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profileData?.nombre?.charAt(0)?.toUpperCase() || '👤'}
            </Text>
          </View>
          <Text style={styles.userName}>
            {profileData?.nombre}
          </Text>
        </View>

        {/* Información Personal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          <ProfileItem
            icon="👤"
            label="Nombre"
            value={profileData?.nombre}
          />
          <ProfileItem
            icon="🆔"
            label="DNI"
            value={profileData?.dni}
          />
          <ProfileItem
            icon="✉️"
            label="Email"
            value={profileData?.email}
          />
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutActionButton} onPress={handleLogout}>
            <Text style={styles.logoutActionIcon}>🚪</Text>
            <Text style={styles.logoutActionText}>Cerrar Sesión</Text>
            <Text style={styles.actionButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={loading}>
              <Text style={styles.modalSaveText}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={editFormData.nombre}
                onChangeText={(text) => setEditFormData({...editFormData, nombre: text})}
                placeholder="Nombre"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>DNI</Text>
              <TextInput
                style={styles.input}
                value={editFormData.dni}
                onChangeText={(text) => setEditFormData({...editFormData, dni: text})}
                placeholder="DNI"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                value={editFormData.email}
                onChangeText={(text) => setEditFormData({...editFormData, email: text})}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <Text style={styles.requiredFieldsNote}>* Campos obligatorios</Text>
          </ScrollView>
        </View>
      </Modal>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#2E86AB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#DC3545',
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2E86AB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 25,
    textAlign: 'center',
  },
  profileItemLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 2,
  },
  profileItemValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 25,
    textAlign: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  actionButtonArrow: {
    fontSize: 16,
    color: '#6C757D',
  },
  logoutActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  logoutActionIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 25,
    textAlign: 'center',
  },
  logoutActionText: {
    fontSize: 16,
    color: '#DC3545',
    flex: 1,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6C757D',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#2E86AB',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333333',
  },
  requiredFieldsNote: {
    fontSize: 14,
    color: '#DC3545',
    marginTop: 10,
    textAlign: 'center',
  },
});

const ProfileItem = ({ icon, label, value }) => (
  <View style={styles.profileItem}>
    <View style={styles.profileItemLeft}>
      <Text style={styles.profileItemIcon}>{icon}</Text>
      <View>
        <Text style={styles.profileItemLabel}>{label}</Text>
        <Text style={styles.profileItemValue}>{value || 'No especificado'}</Text>
      </View>
    </View>
    {/* Botón de editar eliminado */}
  </View>
);

export default ProfileScreen;

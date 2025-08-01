import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { TextInput, Button, Text, Snackbar } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(null);

  const { login, error, checkServerConnection } = useContext(AuthContext);

  // Verificar la conexión al cargar la pantalla, pero solo una vez
  useEffect(() => {
    let isMounted = true;
    
    const checkConnection = async () => {
      try {
        const result = await checkServerConnection();
        // Solo mostrar error si la conexión falla
        if (isMounted && !result.success) {
          setSnackbarMessage(`Error de conexión: ${result.error}`);
          setSnackbarVisible(true);
        }
      } catch (error) {
        if (isMounted) {
          setSnackbarMessage(`Error: ${error.message}`);
          setSnackbarVisible(true);
        }
      }
    };

    checkConnection();
    
    // Limpieza para evitar actualizar estado en componentes desmontados
    return () => {
      isMounted = false;
    };
  }, []); // Array de dependencias vacío para ejecutar solo una vez

  // Función para verificar conexión pero sin mostrar UI
  const testServerConnection = async () => {
    return await checkServerConnection();
  };

  const handleLogin = async () => {
    // Validación básica
    if (!email.trim() || !password.trim()) {
      setSnackbarMessage('Por favor ingresa tu email y contraseña');
      setSnackbarVisible(true);
      return;
    }

    // Verificar la conexión antes de intentar iniciar sesión
    if (connectionStatus !== 'connected') {
      const connectionTest = await checkServerConnection();
      if (!connectionTest.success) {
        setSnackbarMessage(`No se puede conectar al servidor: ${connectionTest.error}`);
        setSnackbarVisible(true);
        return;
      }
    }

    try {
      setLoading(true);
      console.log('Intentando iniciar sesión...');
      
      const result = await login(email, password);
      
      if (!result) {
        setSnackbarMessage(error || 'Error al iniciar sesión');
        setSnackbarVisible(true);
        console.log('Login fallido, error:', error);
      } else {
        console.log('Login exitoso, rol:', result);
      }
    } catch (e) {
      console.error('Error en handleLogin:', e);
      setSnackbarMessage('Error inesperado: ' + e.message);
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Eliminamos el indicador de estado de conexión */}
        
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>MedicApp</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
        
        <View style={styles.formContainer}>
          <TextInput
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            left={<TextInput.Icon icon="email" />}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TextInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon 
                icon={showPassword ? "eye-off" : "eye"} 
                onPress={() => setShowPassword(!showPassword)} 
              />
            }
            style={styles.input}
          />
          
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
          >
            Iniciar Sesión
          </Button>
          
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        </View>
        
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'OK',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#F5F5F5',
  },
  loginButton: {
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: '#2196F3',
  },
  forgotPassword: {
    marginTop: 20,
    alignSelf: 'center',
  },
  forgotPasswordText: {
    color: '#2196F3',
  },
});
export default LoginScreen;
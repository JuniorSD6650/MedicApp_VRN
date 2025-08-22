import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import CustomAlert from '../components/CustomAlert';
import { Image } from 'react-native';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: []
  });

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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Error', 'Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        showAlert('Error', result.error || 'Error de autenticación');
      }
    } catch (error) {
      showAlert('Error', 'Ha ocurrido un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setIsLoading(true);
    let credentials;

    switch (role) {
      case 'patient':
        credentials = { email: 'paciente@medicapp.com', password: 'paciente123' };
        break;
      case 'doctor':
        credentials = { email: 'doctor@medicapp.com', password: 'doctor123' };
        break;
      case 'admin':
        credentials = { email: 'admin@medicapp.com', password: 'admin123' };
        break;
    }

    setEmail(credentials.email);
    setPassword(credentials.password);

    try {
      const result = await login(credentials.email, credentials.password);
      if (!result.success) {
        showAlert('Error', result.error || 'Error en el acceso rápido');
      }
    } catch (error) {
      showAlert('Error', 'Ha ocurrido un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
          />
          <Text style={styles.title}>MedicApp</Text>
          <Text style={styles.subtitle}>Gestión inteligente de medicación</Text>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.passwordToggleIcon}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Access */}
        <View style={styles.quickAccess}>
          <Text style={styles.quickAccessTitle}>Acceso rápido para demo</Text>

          <TouchableOpacity
            style={[styles.quickButton, styles.patientButton]}
            onPress={() => handleQuickLogin('patient')}
            disabled={isLoading}
          >
            <Text style={styles.quickButtonIcon}>👤</Text>
            <Text style={styles.quickButtonText}>Ingresar como Paciente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickButton, styles.doctorButton]}
            onPress={() => handleQuickLogin('doctor')}
            disabled={isLoading}
          >
            <Text style={styles.quickButtonIcon}>👨‍⚕️</Text>
            <Text style={styles.quickButtonText}>Ingresar como Médico</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickButton, styles.adminButton]}
            onPress={() => handleQuickLogin('admin')}
            disabled={isLoading}
          >
            <Text style={styles.quickButtonIcon}>⚙️</Text>
            <Text style={styles.quickButtonText}>Ingresar como Administrador</Text>
          </TouchableOpacity>
        </View>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Regístrate aquí</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea', // Gradiente azul moderno
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#F7FAFC',
    color: '#2D3748',
    transition: 'all 0.2s ease',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#F7FAFC',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: 'transparent',
    color: '#2D3748',
  },
  passwordToggle: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  passwordToggleIcon: {
    fontSize: 20,
  },
  loginButton: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1 }],
  },
  disabledButton: {
    backgroundColor: '#A0AEC0',
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 24,
  },
  forgotPasswordText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  quickAccess: {
    marginBottom: 30,
  },
  quickAccessTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  patientButton: {
    borderLeftWidth: 5,
    borderLeftColor: '#48BB78',
  },
  doctorButton: {
    borderLeftWidth: 5,
    borderLeftColor: '#4299E1',
  },
  adminButton: {
    borderLeftWidth: 5,
    borderLeftColor: '#ED8936',
  },
  quickButtonIcon: {
    fontSize: 26,
    marginRight: 15,
  },
  quickButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  registerText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  registerLink: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default LoginScreen;

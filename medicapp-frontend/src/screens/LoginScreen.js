import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/theme';
import Header from '../components/Header';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login({ email: email.trim(), password });
      
      if (!result.success) {
        Alert.alert('Error de autenticación', result.error);
      }
      // Si es exitoso, la navegación se manejará automáticamente por el AuthContext
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Header title="Iniciar Sesión" showLogo={true} />

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="ingresa tu email"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="ingresa tu contraseña"
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.surface} />
            ) : (
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity 
              onPress={navigateToRegister}
              disabled={isLoading}
            >
              <Text style={styles.registerLink}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  formContainer: {
    flex: 1,
    padding: SIZES.padding,
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: SIZES.margin,
  },
  label: {
    fontSize: SIZES.subhead,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: SIZES.base / 2,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    fontSize: SIZES.body,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    ...SHADOWS.light,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
    marginTop: SIZES.margin,
    ...SHADOWS.medium,
  },
  disabledButton: {
    backgroundColor: COLORS.textSecondary,
  },
  loginButtonText: {
    color: COLORS.surface,
    fontSize: SIZES.callout,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.margin * 2,
  },
  registerText: {
    fontSize: SIZES.subhead,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  registerLink: {
    fontSize: SIZES.subhead,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default LoginScreen;

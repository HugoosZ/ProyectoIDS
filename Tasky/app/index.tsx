import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import globalStyles from './globalStyles';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/context/AuthContext';

export default function Index() {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { setJwt } = useAuth();

  const handleLogin = async () => {
    if (!rut || !password) {
      Alert.alert('Error', 'Debe rellenar los campos');
      return;
    }

    try {
      const response = await fetch('https://proyecto-ids.vercel.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut, password }),
      });

      if (!response.ok) throw new Error('Error en la autenticación');

      const data = await response.json();

      if (!data.token) throw new Error('No se recibió el token de autenticación');

      setJwt(data.token);
      router.push(data.isAdmin ? '/admin/main' : '/trabajador/ver-tareas');
    } catch (error) {
      console.error('Error de login:', error);
      Alert.alert('Error', 'Credenciales incorrectas');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#e9e9e9' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1 }}>
          {/* Logo en esquina superior derecha, más abajo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/logotasky.jpg')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.titleCentered}>¡Bienvenid@ a Tasky!</Text>

            <View style={globalStyles.formContainer}>
              <Text style={globalStyles.subtitle}>Ingresa a tu cuenta</Text>

              <TextInput
                style={globalStyles.input}
                placeholder="RUT (Ej: 12345678-9)"
                placeholderTextColor="#999"
                value={rut}
                onChangeText={setRut}
                autoCapitalize="none"
              />

              <View style={{ ...globalStyles.input, flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={{ flex: 1 }}
                  placeholder="Contraseña"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={24}
                    color="#666"
                    style={{ paddingHorizontal: 8 }}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={globalStyles.button} onPress={handleLogin}>
                <Text style={globalStyles.buttonText}>Iniciar sesión</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('./forgotPassword')}>
                <Text style={globalStyles.registerLink}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    position: 'absolute',
    top: 50, // más abajo para no chocar con la batería/notch
    right: 15,
    zIndex: 10,
  },
  logo: {
    width: 70,
    height: 70,
  },
  container: {
    flexGrow: 1,
    paddingTop: 0,
    paddingHorizontal: 20,
    justifyContent: 'center',
    backgroundColor: '#e9e9e9',
  },
  titleCentered: {
    ...globalStyles.title,
    textAlign: 'center',
  },
});

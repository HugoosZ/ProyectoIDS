import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rut,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error('Error en la autenticación');
      }

      const data = await response.json();
      
      if (!data.token) {
        throw new Error('No se recibió el token de autenticación');
      }

      // Guardar el token en el contexto
      setJwt(data.token);

      // Redirigir según el rol del usuario
      router.push(data.isAdmin ? '/admin/main' : '/trabajador/maint');
      
    } catch (error) {
      console.error('Error de login:', error);
      Alert.alert('Error', 'Credenciales incorrectas');
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>¡Bienvenid@ a Tasky!</Text>

      <Image
        source={require('../assets/images/logotasky.jpg')}
        style={styles.image}
      />

      <View style={globalStyles.formContainer}>
        <Text style={globalStyles.subtitle}>Ingresa a tu cuenta</Text>

        <TextInput
          style={globalStyles.input}
          placeholder="RUT (Ej: 12345678-9)"
          placeholderTextColor="#999"
          value={rut}
          onChangeText={setRut}
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={globalStyles.input}
            placeholder="Contraseña"
            secureTextEntry={!showPassword} // Si showPassword es false, ocultar la contraseña
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)} // Cambiar el estado de showPassword
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color="#999"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={globalStyles.button} onPress={handleLogin}>
          <Text style={globalStyles.buttonText}>Iniciar sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/forgotPassword')}>
          <Text style={globalStyles.registerLink}>
            ¿Olvidaste tu contraseña?
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
});

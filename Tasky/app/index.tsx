import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, SafeAreaView, 
  View, KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import globalStyles from './globalStyles';
import { auth } from '../firebase'; // ajusta si está en otra carpeta
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons'; // Para el ícono de ver/ocultar
import { signInWithEmailAndPassword } from 'firebase/auth';
import type { UserCredential } from 'firebase/auth';
import { fetchUsers } from '../lib/api/users';
import { useAuth } from '../lib/context/AuthContext'; // ajusta la ruta si es necesario
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = getFirestore();

export default function Index() {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Estado para mostrar/ocultar la contraseña
  const router = useRouter();
  const { setJwt } = useAuth();

  const handleLogin = async () => {
    if (!rut || !password) {
      Alert.alert('Error', 'Debe rellenar los campos');
      return;
    }
  
    try {
      const userDoc = await getDoc(doc(db, 'users', rut));
      if (!userDoc.exists()) {
        Alert.alert('Error', 'Usuario no encontrado');
        return;
      }
  
      const userData = userDoc.data();
      const email = userData.email;
  
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const token = await user.getIdToken();
        
        setJwt(token); 
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userId', user.uid);

        const rol = userData.isAdmin ? 'admin' : 'trabajador';
        router.push(rol === 'admin' ? '/admin/main' : '/trabajador/ver-tareas');
      } catch (error) {
        console.error(error);
      }
  
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Ocurrió un problema al intentar iniciar sesión');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} // Ajusta si tienes header
      >
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={globalStyles.card}>
            <Image
              source={require('../assets/images/logotasky.jpg')}
              style={globalStyles.logo}
            />

            <Text style={[globalStyles.title, globalStyles.titleCentered]}>
              ¡Bienvenid@ a Tasky!
            </Text>

            <View style={globalStyles.formContainer}>
              <Text style={[globalStyles.subtitle, globalStyles.PurpleText]}>
                Ingresa a tu cuenta
              </Text>

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
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
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
                <Text style={globalStyles.forgotPasswordText}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(137, 113, 187, 1)', // morado solo para esta pantalla
  },
  centerContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: 12,
  },
});
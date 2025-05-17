import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import globalStyles from './globalStyles';
import { auth } from '../firebase'; // ajusta si está en otra carpeta
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons'; // Para el ícono de ver/ocultar
import { signInWithEmailAndPassword } from 'firebase/auth';
import type { UserCredential } from 'firebase/auth';
import { fetchUsers } from '../lib/api/users';
import { useAuth } from '../lib/context/AuthContext'; // ajusta la ruta si es necesario

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
      // 1. Buscar el correo asociado al RUT en Firestore
      const userDoc = await getDoc(doc(db, 'users', rut));
      if (!userDoc.exists()) {
        Alert.alert('Error', 'Usuario no encontrado');
        return;
      }
  
      const userData = userDoc.data();
      const email = userData.email;
  
      // 2. Autenticar con Firebase Auth usando email y password
      try {
        const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const token = await user.getIdToken();
        
        console.log("TOKEN JWT:", token); // opcional
        setJwt(token); 


        try {
          const response = await fetchUsers(token); 
        } catch (error) {
          console.error(" Error al validar token con backend:", error);
        }

        const rol = userData.isAdmin ? 'admin' : 'trabajador';
        router.push(rol === 'admin' ? '/admin/main' : '/trabajador/ver-tareas');
      } catch (error) {
        console.error(error);
      }
  
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Ocurrió un problema al intentar iniciar sesión');
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

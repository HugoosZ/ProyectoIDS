import { useRouter } from 'expo-router';
import React, { useState } from 'react';
<<<<<<< HEAD
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native'; // ActivityIndicator AÑADIDO AQUÍ
import globalStyles from './globalStyles'; // Asegúrate que la ruta sea correcta
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'; // Asegúrate que la ruta a tu config de Firebase sea correcta
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Importar AsyncStorage
=======
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import globalStyles from './globalStyles';
import { auth } from '../firebase'; // ajusta si está en otra carpeta
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons'; // Para el ícono de ver/ocultar
import { signInWithEmailAndPassword } from 'firebase/auth';
import type { UserCredential } from 'firebase/auth';
import { fetchUsers } from '../lib/api/users';
import { useAuth } from '../lib/context/AuthContext'; // ajusta la ruta si es necesario
>>>>>>> ee8ae6c376b4d588e393d1fff90ac337d6f9436a

const db = getFirestore();

// Define las claves que se usarán para guardar y leer desde AsyncStorage.
// Estas deben coincidir con las usadas en otros componentes (ej. VerTareas).
const USER_ID_STORAGE_KEY = 'userId';
const USER_TOKEN_STORAGE_KEY = 'userToken';

export default function Index() {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Estado para feedback de carga
  const router = useRouter();
  const { setJwt } = useAuth();

  const handleLogin = async () => {
    if (!rut || !password) {
      Alert.alert('Error', 'Debe rellenar los campos de RUT y contraseña.');
      return;
    }
    setLoading(true);

    try {
      // 1. Buscar el correo asociado al RUT en Firestore
      console.log(`Buscando usuario con RUT: ${rut}`);
      const userDocRef = doc(db, 'users', rut); // Asume que el ID del documento en 'users' es el RUT
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        Alert.alert('Error de Autenticación', 'Usuario no encontrado con el RUT proporcionado.');
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      const email = userData?.email; // Asegúrate que el campo se llame 'email' en tu Firestore

      if (!email) {
        Alert.alert('Error de Datos', 'No se pudo encontrar el correo electrónico para este usuario.');
        setLoading(false);
        return;
      }

      console.log(`Usuario encontrado. Email: ${email}. Intentando autenticar con Firebase Auth...`);

      // 2. Autenticar con Firebase Auth usando email y password
<<<<<<< HEAD
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        console.log("Autenticación con Firebase exitosa. Usuario:", firebaseUser.uid);

        const uid = firebaseUser.uid;
        const idToken = await firebaseUser.getIdToken();

        // 3. Guardar UID y Token en AsyncStorage
        await AsyncStorage.setItem(USER_ID_STORAGE_KEY, uid);
        await AsyncStorage.setItem(USER_TOKEN_STORAGE_KEY, idToken);

        console.log('UID y Token guardados en AsyncStorage:', {
          [USER_ID_STORAGE_KEY]: uid,
          [USER_TOKEN_STORAGE_KEY]: idToken ? idToken.substring(0,20) + "..." : null, // Solo muestra una parte del token en logs
        });

        // 4. Redirigir según tipo de usuario (basado en los datos de Firestore)
        const rol = userData.isAdmin ? 'admin' : 'trabajador'; // Asegúrate que el campo se llame 'isAdmin'
        console.log(`Rol del usuario: ${rol}. Redirigiendo...`);
        router.replace(rol === 'admin' ? '/admin/main' : '/trabajador/ver-tareas'); // Usar replace para no volver al login con el botón atrás
      } else {
        // Este caso es improbable si signInWithEmailAndPassword no lanzó error, pero por si acaso.
        Alert.alert('Error de Autenticación', 'No se pudo obtener la información del usuario después del login.');
      }

    } catch (error: any) {
      console.error("Error en handleLogin:", error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        Alert.alert('Error de Autenticación', 'RUT o contraseña incorrecta.');
      } else if (error.message.includes("Usuario no encontrado")) { // Para el error personalizado de getDoc
         Alert.alert('Error de Autenticación', 'Usuario no encontrado con el RUT proporcionado.');
      }
      else {
        Alert.alert('Error', 'Ocurrió un problema al intentar iniciar sesión. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
=======
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
>>>>>>> ee8ae6c376b4d588e393d1fff90ac337d6f9436a
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>¡Bienvenid@ a Tasky!</Text>

      <Image
        // Asegúrate que la ruta a tu imagen sea correcta
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
          autoCapitalize="none"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={[globalStyles.input, styles.passwordInput]} // Para que el input ocupe el espacio menos el ícono
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
              name={showPassword ? 'eye-off-outline' : 'eye-outline'} // Ajustado para nombres de íconos más comunes
              size={24}
              color="#999"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[globalStyles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" /> // Aquí se usa ActivityIndicator
          ) : (
            <Text style={globalStyles.buttonText}>Iniciar sesión</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/forgotPassword')} disabled={loading}>
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
    borderRadius: 20, // Opcional: para hacerla redonda si es un logo
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%', // Asegura que el contenedor ocupe el ancho
    position: 'relative', // Para posicionar el ícono absolutamente dentro de este
  },
  passwordInput: {
    flex: 1, // El input toma el espacio disponible
  },
  eyeIcon: {
    position: 'absolute', // Posiciona el ícono sobre el TextInput
    right: 10, // Ajusta según el padding de tu input
    height: '100%', // Para centrar verticalmente el ícono
    justifyContent: 'center', // Centra el ícono verticalmente
    paddingHorizontal: 5, // Espacio para tocar el ícono
  },
  buttonDisabled: {
    backgroundColor: '#ccc', // Color para botón deshabilitado
  }
});
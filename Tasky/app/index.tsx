import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import globalStyles from './globalStyles';
import { auth } from '../firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../lib/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptUID } from '../lib/api/encryptUID';

const db = getFirestore();

export default function Index() {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { setJwt } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!rut || !password) {
      Alert.alert('Error', 'Debe rellenar los campos');
      return;
    }

    try {
      // Obtener el UID codificado desde el backend usando el RUT
      let encryptedRut;
      try {
        encryptedRut = await encryptUID(rut);
      } catch (err) {
        Alert.alert('Error', 'No se pudo obtener el UID para este RUT');
        return;
      }
      const userDoc = await getDoc(doc(db, 'users', encryptedRut));
      if (!userDoc.exists()) {
        Alert.alert('Error', 'Este usuario no existe');
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
        Alert.alert('Error', 'Contraseña incorrecta');
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              globalStyles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Image
              source={require('../assets/images/logotasky.png')}
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
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9kK]/g, '');
                  let formatted = cleaned;
                  if (cleaned.length > 1) {
                    const body = cleaned.slice(0, -1);
                    const dv = cleaned.slice(-1);
                    formatted = `${body}-${dv}`;
                  }
                  if (formatted.length <= 10) {
                    setRut(formatted);
                  }
                }}
                maxLength={10}
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
                  style={globalStyles.eyeIcon}
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
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(137, 113, 187, 1)',
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
    top: '50%',
    transform: [{ translateY: -20 }],
  },
});

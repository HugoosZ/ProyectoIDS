import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
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
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
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

  const showError=(msg: string)=>{
    setErrorMessage(msg);
    setErrorModalVisible(true);
  };
  const closeModal=()=>{
    setErrorModalVisible(false);
  };

  const handleLogin = async () => {
    if (!rut || !password) {
      showError('Por favor, completa todos los campos');
      return;
    }

    try {
      // Obtener el UID codificado desde el backend usando el RUT
      let encryptedRut;
      try {
        encryptedRut = await encryptUID(rut);
      } catch (err) {
        showError('Rut no reconocido.');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', encryptedRut));
      if (!userDoc.exists()) {
        showError('Usuario no encontrado. Verifica tu RUT.');
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
        showError('Contraseña incorrecta. Inténtalo de nuevo.');
      }

    } catch (error) {
      showError('Error al iniciar sesión. Por favor, intenta nuevamente.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      <Modal
        transparent={true}
        visible={errorModalVisible}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity onPress={closeModal} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 10,
    padding: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
    color: '#b00020',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#b00020',
    paddingVertical: 10,
    borderRadius: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});

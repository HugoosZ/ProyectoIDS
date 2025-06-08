import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const router = useRouter();

const getStoredAuthData = async (): Promise<{ userId: string | null; token: string | null }> => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    const token = await AsyncStorage.getItem('userToken');
    return { userId, token };
  } catch (e) {
    console.error('Error al obtener datos de autenticación:', e);
    return { userId: null, token: null };
  }
};

const Turno=() =>{
  const [turno, setTurno]=useState(false);
  const [loading, setLoading]=useState(true);
  const [userId, setUserId]=useState<string | null>(null);
  const [token, setToken]=useState<string | null>(null);

  useEffect(() =>{

    const fetchUserAndTurno=async () =>{
      try {
        const { userId, token }=await getStoredAuthData();
        if (!userId || !token) throw new Error('Usuario no autenticado');

        setUserId(userId);
        setToken(token);
        
        const response=await fetch(`https://proyecto-ids.vercel.app/api/User/attendance/${userId}?isPresent=true&time=today`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data=await response.json();
        console.log('Datos de asistencia:', data);

      if (Array.isArray(data) && data.length > 0){
        const today = new Date().toISOString().split('T')[0];
        const asistenciaHoy = data.find((d) => d.date === today);

        if(asistenciaHoy && asistenciaHoy.isPresent===true){
          setTurno(true);
        }else{
          setTurno(false);
        }
      }
      else {
        setTurno(false);

      }
        
      } catch (err) {
        console.error('Error cargando turno:', err);
        Alert.alert('Error', 'No se pudo cargar el estado del turno');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndTurno();
  }, []);

  //funcion para iniciar el turno
  const iniciar_turno=async () => {
    if (!userId || !token) return;

    try {

      const response=await fetch(`https://proyecto-ids.vercel.app/api/checkIn/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data=await response.json();
       console.log('Info checkIn:', data);

      if (response.ok){
        setTurno(true);
        Alert.alert('Éxito', data.message||'Turno iniciado correctamente');
      }else{
        Alert.alert('Aviso', data?.error || 'No se pudo iniciar el turno');
      }
    } catch (err){
      console.error(err);
      Alert.alert('Error', 'Error al iniciar turno');
    }
  };

  //funcion para terminar el turno
  const terminar_turno=async () =>{
    if (!userId || !token) return;

    try{
      const response=await fetch(`https://proyecto-ids.vercel.app/api/checkOut/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok){
        setTurno(false);
        Alert.alert('Éxito', 'Turno finalizado correctamente');
      } else {
        const errorData=await response.json();
        console.error('Error al terminar turno:', errorData);
        throw new Error('No se pudo terminar el turno');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Error al terminar turno');
    }
  };

  if(loading){
    return (
      <SafeAreaView style={styles.container}>
         <Text style={{ textAlign: 'center', marginTop: 40 }}>Cargando turno...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/trabajador/ver-tareas')}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={20} color="#111827" />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Ionicons
            name={turno ? 'time-outline' : 'play-outline'}
            size={64}
            color="#4e4e4e"
            style={styles.icon}
          />
          <Text style={styles.title}>
            {turno ? 'Turno en curso' : 'Inicia tu jornada laboral'}
          </Text>
          <Text style={styles.subtitle}>
            {turno
              ? 'Finaliza tu turno cuando termines tu jornada.'
              : 'Presiona el botón para iniciar tu turno.'}
          </Text>

          <TouchableOpacity
            disabled={loading}
            style={[
              styles.button,
              turno ? styles.buttonSecondary : styles.buttonPrimary,
              loading && { opacity: 0.6 },
            ]}
            onPress={turno ? terminar_turno : iniciar_turno}
          >
            <Text style={styles.buttonText}>
              {turno ? 'Finalizar' : 'Iniciar'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Turno;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 16 : 16,
    marginLeft: 0,
    zIndex: 1,
  },
  backText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 4,
  },
  card: {
    marginTop: 100,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 30,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  buttonPrimary: {
    backgroundColor: 'rgba(137, 113, 187, 1)',
  },
  buttonSecondary: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
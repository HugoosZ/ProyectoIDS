import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';



const getStoredAuthData = async (): Promise<{ userId: string | null; token: string | null }> => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    const token = await AsyncStorage.getItem('token');
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

    //funcion para obtener datos del usuario y verificar si su turno esta activo
    const fetchUserAndTurno=async () =>{
      try {
        const { userId, token }=await getStoredAuthData();
        if (!userId || !token) throw new Error('Usuario no autenticado');

        setUserId(userId);
        setToken(token);

        //falta ajustar fetch para obtener el estado del turno
        /*
        const response=await fetch(`https://proyecto-ids.vercel.app/api/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const data=await response.json();
        setTurno(data.turnoActivo);
        */
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

      //falta ajustar fetch para iniciar el turno
      /*
      const response=await fetch(`https://proyecto-ids.vercel.app/api/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({userId}),
      });
      */

      if (response.ok){
        setTurno(true);
      }else{
        throw new Error('No se pudo iniciar el turno');
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

      //falta ajustar fetch para terminar el turno
      /*
      const response=await fetch(`https://proyecto-ids.vercel.app/api/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId}),
      });
      */

      if (response.ok){
        setTurno(false);
      } else {
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
        <Text>Cargando turno...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity //adicion boton de volver a vista "ver-tareas"
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
          style={[
            styles.button,
            turno ? styles.buttonSecondary : styles.buttonPrimary,
          ]}
          onPress={turno ? terminar_turno : iniciar_turno}
        >
          <Text style={styles.buttonText}>
            {turno ? 'Finalizar' : 'Iniciar'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Turno;

const styles=StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingTop: 16,
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
    marginBottom: 16,
  },
  backText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
    alignSelf: 'center',
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
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
    backgroundColor: '#2563eb',
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
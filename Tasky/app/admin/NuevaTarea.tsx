import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import globalStyles from '../globalStyles';

import TopBar from '../../components/TopBar'; 
import { useRouter } from 'expo-router'; 

const NuevaTarea = () => {
  const router = useRouter(); 

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [createdBy, setCreatedBy] = useState('');

  const handleCreateTask = async () => {
    if (!title || !description) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'No se encontró el token. Inicia sesión nuevamente.');
        return;
      }

      const response = await fetch('https://proyecto-ids.vercel.app/api/createTask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          createdBy,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Éxito', 'Tarea creada correctamente');
        setTitle('');
        setDescription('');
      } else {
        console.error('Error en la respuesta del servidor:', data);
        Alert.alert('Error', data.message || 'No se pudo crear la tarea');
      }
    } catch (error) {
      console.error('Error al crear tarea:', error);
      Alert.alert('Error', 'Ocurrió un error al crear la tarea');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f2f2f2' }}>
      <TopBar /> 
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.goBackContainer}>
          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => router.push('/admin/main')} 
          >
            <Text style={styles.buttonText}>Volver</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Crear Nueva Tarea</Text>
        </View>

        <TextInput
          placeholder="Título"
          placeholderTextColor="#999"
          style={[styles.input, { borderColor: 'rgba(137, 113, 187, 1)', color: '#999' }]}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          placeholder="Descripción"
          placeholderTextColor="#999"
          style={[styles.input, { borderColor: 'rgba(137, 113, 187, 1)', color: '#999' }]}
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity style={globalStyles.button} onPress={handleCreateTask}>
          <Text style={styles.buttonText}>Crear Tarea</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f2f2f2',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20,
  },
  goBackContainer: {
    alignItems: 'flex-start', 
    marginBottom: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center', 
    marginTop: 0,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(137, 113, 187, 1)',
    color: '#999',
  },
  pickerText: {
    color: '#333',
  },
  label: {
    marginTop: 10,
    marginBottom: 4,
    fontWeight: '600',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(137, 113, 187, 1)',
    marginBottom: 12,
  },
buttonText: {
  fontSize: 15,
  fontWeight: '500',
  color: '#fff',
  // sin marginLeft porque no hay ícono, así queda centrado
  textAlign: 'center',
  },
 goBackButton: {
  backgroundColor: 'rgba(137, 113, 187, 1)', // color morado
  height: 40,                                // altura fija para buen centrado vertical
  borderRadius: 50,
  justifyContent: 'center',                  // centra verticalmente el contenido
  alignItems: 'center',                      // centra horizontalmente
  paddingHorizontal: 15,                     // padding horizontal para espacio interior
  alignSelf: 'flex-start',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 2,
  elevation: 2,
  marginBottom: 12,
  },
});
export default NuevaTarea;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import globalStyles from '../globalStyles';
import { useRouter } from 'expo-router';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const NuevaTarea = () => {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [createdBy, setCreatedBy] = useState('');


  const [isStartPickerVisible, setStartPickerVisible] = useState(false);
  const [isEndPickerVisible, setEndPickerVisible] = useState(false);

  const handleConfirmStart = (date: Date) => {
    setStartTime(date.toISOString());
    setStartPickerVisible(false);
  };
  
  const handleConfirmEnd = (date: Date) => {
    setEndTime(date.toISOString());
    setEndPickerVisible(false);
  };

  useEffect(() => {
    const getUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) {
        setCreatedBy(storedUserId);
      }
    };
    getUserId();
  }, []);

  const handleCreateTask = async () => {
    if (!title || !assignedTo || !startTime || !endTime || !status || !priority || !description) {
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
          startTime,
          endTime,
          priority,
          status,
          assignedTo,
          createdBy,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Éxito', 'Tarea creada correctamente');
        setTitle('');
        setDescription('');
        setStartTime('');
        setEndTime('');
        setPriority('');
        setStatus('');
        setAssignedTo('');
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
    <ScrollView contentContainerStyle={globalStyles.container}>
      <Text style={globalStyles.title}>Crear Nueva Tarea</Text>

      <TextInput placeholder="Título" style={globalStyles.input} value={title} onChangeText={setTitle} />
      <TextInput placeholder="Descripción" style={globalStyles.input} value={description} onChangeText={setDescription} />

       {/* Start time picker */}
       <TouchableOpacity
        style={[globalStyles.input, { justifyContent: 'center' }]}
        onPress={() => setStartPickerVisible(true)}
      >
        <Text style={{ color: startTime ? '#000' : '#999' }}>
          {startTime ? new Date(startTime).toLocaleString() : 'Selecciona fecha y hora inicio'}
        </Text>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isStartPickerVisible}
        mode="datetime"
        onConfirm={handleConfirmStart}
        onCancel={() => setStartPickerVisible(false)}
      />

      {/* End time picker */}
      <TouchableOpacity
        style={[globalStyles.input, { justifyContent: 'center' }]}
        onPress={() => setEndPickerVisible(true)}
      >
        <Text style={{ color: endTime ? '#000' : '#999' }}>
          {endTime ? new Date(endTime).toLocaleString() : 'Selecciona fecha y hora fin'}
        </Text>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isEndPickerVisible}
        mode="datetime"
        onConfirm={handleConfirmEnd}
        onCancel={() => setEndPickerVisible(false)}
      />

      <TextInput placeholder="Prioridad (alta, media, baja)" style={globalStyles.input} value={priority} onChangeText={setPriority} />
      <TextInput placeholder="Estado (pendiente, completada, etc.)" style={globalStyles.input} value={status} onChangeText={setStatus} />
      <TextInput placeholder="Rut del trabajador asignado" style={globalStyles.input} value={assignedTo} onChangeText={setAssignedTo} />


      <TouchableOpacity style={globalStyles.button} onPress={handleCreateTask}>
        <Text style={globalStyles.buttonText}>Crear Tarea</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[globalStyles.button, { backgroundColor: '#999', marginTop: 16 }]} onPress={() => router.back()}>
        <Text style={globalStyles.buttonText}>Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}


export default NuevaTarea;
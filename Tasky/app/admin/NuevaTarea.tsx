import React, { useEffect, useState } from 'react';
import { View, Text, Alert, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/context/AuthContext';
import { fetchUsers } from '../../lib/api/users';
import globalStyles from '../globalStyles';

export default function NuevaTarea() {
  const { jwt } = useAuth();
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  useEffect(() => {
    const validateUser = async () => {
      if (!jwt) {
        Alert.alert("Sesión expirada", "Por favor inicia sesión de nuevo.");
        router.push('/');
        return;
      }

      try {
        const user = await fetchUsers(jwt);
        setUserData(user);

        const res = await fetch('https://proyecto-ids.vercel.app/api/checkAdmin', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });

        if (!res.ok) throw new Error("No autorizado");

        const data = await res.json();
        setIsAdmin(data.isAdmin);
      } catch (error) {
        Alert.alert("Error", "No tienes permisos para crear tareas.");
        router.back();
      }
    };

    validateUser();
  }, [jwt]);

  const handleCreateTask = async () => {
    if (!isAdmin) {
      Alert.alert("Error", "No tienes permisos para crear tareas.");
      return;
    }

    try {
      const response = await fetch('https://proyecto-ids.vercel.app/api/createTask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          title,
          description,
          startTime,
          endTime,
          priority,
          status,
          assignedTo,
          createdBy: userData?.uid,
        }),
      });

      if (!response.ok) throw new Error('Error al crear la tarea');
      const data = await response.json();

      Alert.alert("Tarea creada", `ID: ${data.id}`);
      router.back();
    } catch (err) {
      Alert.alert("Error", "No se pudo crear la tarea");
      console.error(err);
    }
  };

  return (
    <ScrollView contentContainerStyle={globalStyles.container}>
      <Text style={globalStyles.title}>Crear Nueva Tarea</Text>

      <TextInput placeholder="Título" style={globalStyles.input} value={title} onChangeText={setTitle} />
      <TextInput placeholder="Descripción" style={globalStyles.input} value={description} onChangeText={setDescription} />
      <TextInput placeholder="Inicio (ISO)" style={globalStyles.input} value={startTime} onChangeText={setStartTime} />
      <TextInput placeholder="Fin (ISO)" style={globalStyles.input} value={endTime} onChangeText={setEndTime} />
      <TextInput placeholder="Prioridad (alta, media, baja)" style={globalStyles.input} value={priority} onChangeText={setPriority} />
      <TextInput placeholder="Estado (pendiente, completada, etc.)" style={globalStyles.input} value={status} onChangeText={setStatus} />
      <TextInput placeholder="Rut del trabajador" style={globalStyles.input} value={assignedTo} onChangeText={setAssignedTo} />

      <TouchableOpacity style={globalStyles.button} onPress={handleCreateTask}>
        <Text style={globalStyles.buttonText}>Crear Tarea</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[globalStyles.button, { backgroundColor: '#999', marginTop: 16 }]} onPress={() => router.back()}>
        <Text style={globalStyles.buttonText}>Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
// Está en formato ISO pq no se ve el calendario en formato web 

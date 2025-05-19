import React, { useEffect, useState } from 'react';
import { View, Text, Alert, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/context/AuthContext';
import { fetchUsers } from '../../lib/api/users';
import globalStyles from '../globalStyles';
import { Picker } from '@react-native-picker/picker'; 


export default function ReasignarTarea() {
  const { jwt } = useAuth();
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tareas, setTareas] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [newAssignedToUid, setNewAssignedToUid] = useState('');

  useEffect(() => {
    const init = async () => {
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
          headers: { Authorization: `Bearer ${jwt}` },
        });

        if (!res.ok) throw new Error("No autorizado");
        const data = await res.json();
        setIsAdmin(data.isAdmin);

        const tareasRes = await fetch('https://proyecto-ids.vercel.app/api/tasks');
        const tareasData = await tareasRes.json();
        setTareas(tareasData);
      } catch (error) {
        Alert.alert("Error", "No tienes permisos para reasignar tareas.");
        router.back();
      }
    };

    init();
  }, [jwt]);

  const handleReassign = async () => {
    if (!isAdmin) {
      Alert.alert("Error", "No tienes permisos para reasignar tareas.");
      return;
    }

    if (!selectedTaskId || !newAssignedToUid) {
      Alert.alert("Error", "Debes seleccionar una tarea e ingresar el nuevo UID.");
      return;
    }

    try {
      const response = await fetch(`https://proyecto-ids.vercel.app/api/reassign-task/${selectedTaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          newAssignedToUid,
          adminUid: userData?.uid,
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Error al reasignar tarea');
      Alert.alert("Éxito", result.message);
      router.back();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={globalStyles.container}>
      <Text style={globalStyles.title}>Reasignar Tarea</Text>

      <Text style={globalStyles.subtitle}>Selecciona una tarea:</Text>
      <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 20 }}>
        <Picker
          selectedValue={selectedTaskId}
          onValueChange={(itemValue) => setSelectedTaskId(itemValue)}
          style={{ height: 50, width: '100%' }}
        >
          <Picker.Item label="-- Selecciona una tarea --" value="" />
          {tareas.map((tarea) => (
            <Picker.Item
              key={tarea.id}
              label={`${tarea.title} (Asignado a: ${tarea.assignedTo})`}
              value={tarea.id}
            />
          ))}
        </Picker>
      </View>

      <TextInput
        placeholder="RUT del nuevo trabajador asignado"
        style={globalStyles.input}
        value={newAssignedToUid}
        onChangeText={setNewAssignedToUid}
      />

      <TouchableOpacity style={globalStyles.button} onPress={handleReassign}>
        <Text style={globalStyles.buttonText}>Reasignar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[globalStyles.button, { backgroundColor: '#999', marginTop: 16 }]} onPress={() => router.back()}>
        <Text style={globalStyles.buttonText}>Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Alert,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import globalStyles from '../globalStyles';
import { useRouter } from 'expo-router';

type Usuario = {
  id: string;
  name?: string;
  lastName?: string;
  rut?: string;
};

type Tarea = {
  id: string;
  title?: string;
  assignedTo?: string | string[] | null;
  status?: string;
};

export default function ReasignarTarea() {
  const router = useRouter();

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [usuariosMap, setUsuariosMap] = useState<Record<string, string>>({});
  const [usuariosList, setUsuariosList] = useState<Usuario[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchUsuarios = async (token: string) => {
    try {
      const resUsers = await fetch('https://proyecto-ids.vercel.app/api/users', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resUsers.ok) throw new Error('Error al obtener usuarios');
      const dataUsers: Usuario[] = await resUsers.json();

      const resAttendance = await fetch('https://proyecto-ids.vercel.app/api/admin/attendance?isPresent=true', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resAttendance.ok) throw new Error('Error al obtener asistencias');
      const attendanceDataRaw = await resAttendance.json();

      // Convertir a array si viene como objeto
      const attendanceData = Array.isArray(attendanceDataRaw)
        ? attendanceDataRaw
        : Object.values(attendanceDataRaw);

      // Solo usuarios con isPresent === true ya filtrado por la API
      const presentUserIds = new Set(
        attendanceData.map((att: any) => att.userId)
      );

      const filteredUsers = dataUsers.filter((user) => presentUserIds.has(user.id));

      const map: Record<string, string> = {};
      filteredUsers.forEach((u) => {
        map[u.id] = `${u.name} ${u.lastName}`;
      });

      setUsuariosMap(map);
      setUsuariosList(filteredUsers);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios disponibles.');
    }
  };

  const fetchTareas = async (token: string) => {
    try {
      const res = await fetch('https://proyecto-ids.vercel.app/api/tasks', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al obtener tareas');
      const data: Tarea[] = await res.json();

      // Filtrar tareas pendientes, en progreso o sin asignar
      const tareasFiltradas = data.filter((tarea) => {
        let assigned = '';
        if (Array.isArray(tarea.assignedTo)) {
          assigned = tarea.assignedTo.length > 0 ? 'assigned' : '';
        } else {
          assigned = tarea.assignedTo ?? '';
        }
        const status = (tarea.status ?? '').toString().trim().toLowerCase();
        return assigned === '' || status === 'pendiente' || status === 'en progreso';
      });

      setTareas(tareasFiltradas);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar las tareas.');
    }
  };

  const checkAdmin = async (token: string) => {
    try {
      const res = await fetch('https://proyecto-ids.vercel.app/api/checkAdmin', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('No eres administrador');
      const data = await res.json();
      setIsAdmin(data.isAdmin);
      if (!data.isAdmin) Alert.alert('Error', 'No tienes permisos de administrador');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No tienes permisos de administrador');
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'No se encontró el token. Inicia sesión nuevamente.');
        router.push('/');
        return;
      }
      await checkAdmin(token);
      await fetchUsuarios(token);
      await fetchTareas(token);
    };
    init();
  }, []);

  const handleReassign = async () => {
    if (!selectedTaskId || !selectedUserId) {
      Alert.alert('Error', 'Selecciona una tarea y un trabajador.');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const adminUid = await AsyncStorage.getItem('userId');
      if (!token || !adminUid) {
        Alert.alert('Error', 'Inicia sesión nuevamente.');
        router.push('/');
        return;
      }
      const res = await fetch(`https://proyecto-ids.vercel.app/api/reassign-task/${selectedTaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newAssignedToUid: selectedUserId,
          adminUid: adminUid,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al reasignar tarea');
      Alert.alert('Éxito', data.message || 'Tarea reasignada correctamente');
      router.back();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Error al reasignar tarea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={globalStyles.container}>
      <Text style={globalStyles.title}>Reasignar Tarea</Text>

      <Text style={globalStyles.subtitle}>Selecciona una tarea pendiente o en progreso:</Text>
      {tareas.length === 0 && <Text>No hay tareas disponibles</Text>}
      <ScrollView style={{ maxHeight: 250, marginBottom: 20 }}>
        {tareas.map((tarea) => {
          const isSelected = selectedTaskId === tarea.id;
          return (
            <TouchableOpacity
              key={tarea.id}
              style={{
                padding: 12,
                backgroundColor: isSelected ? '#cce5ff' : '#eee',
                marginVertical: 4,
                borderRadius: 5,
              }}
              onPress={() => setSelectedTaskId(tarea.id)}
            >
              <Text>{tarea.title || 'Sin título'}</Text>
              <Text style={{ fontSize: 12, color: '#555' }}>
                Asignado a: {typeof tarea.assignedTo === 'string' ? (usuariosMap[tarea.assignedTo] || tarea.assignedTo) : 'No asignado'}
              </Text>
              <Text style={{ fontSize: 12, color: '#555' }}>
                Estado: {tarea.status || 'Desconocido'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={globalStyles.subtitle}>Selecciona un trabajador presente hoy:</Text>
      {usuariosList.length === 0 && <Text>No hay trabajadores disponibles</Text>}
      <ScrollView style={{ maxHeight: 250, marginBottom: 20 }}>
        {usuariosList.map((user) => {
          const isSelected = selectedUserId === user.id;
          return (
            <TouchableOpacity
              key={user.id}
              style={{
                padding: 12,
                backgroundColor: isSelected ? '#cce5ff' : '#eee',
                marginVertical: 4,
                borderRadius: 5,
              }}
              onPress={() => setSelectedUserId(user.id)}
            >
              <Text>
                {user.name} {user.lastName} ({user.rut})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={[globalStyles.button, loading ? { opacity: 0.6 } : {}]}
        onPress={handleReassign}
        disabled={loading}
      >
        <Text style={globalStyles.buttonText}>{loading ? 'Reasignando...' : 'Reasignar'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[globalStyles.button, { backgroundColor: '#999', marginTop: 16 }]}
        onPress={() => router.back()}
      >
        <Text style={globalStyles.buttonText}>Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({});

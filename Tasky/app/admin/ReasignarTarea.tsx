import React, { useEffect, useState } from 'react';
import { Text, Alert, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import globalStyles from '../globalStyles';
import { useRouter } from 'expo-router';
import TopBar from '../../components/TopBar'; // El TopBar ahora tendrá el icono para abrir el Drawer

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
  const [loading, setLoading] = useState(false);

  // --- Fetch de usuarios presentes
  const fetchUsuarios = async (token: string) => {
    try {
      const resUsers = await fetch('https://proyecto-ids.vercel.app/api/users', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resUsers.ok) throw new Error('Error al obtener usuarios');
      const dataUsers: Usuario[] = await resUsers.json();

      const resAttendance = await fetch('https://proyecto-ids.vercel.app/api/admin/attendance?isPresent=true&time=today', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resAttendance.ok) throw new Error('Error al obtener asistencias');
      const attendanceDataRaw = await resAttendance.json();

      const attendanceData = Array.isArray(attendanceDataRaw)
        ? attendanceDataRaw
        : Object.values(attendanceDataRaw);

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

  // --- Fetch tareas
  const fetchTareas = async (token: string) => {
    try {
      const res = await fetch('https://proyecto-ids.vercel.app/api/tasks', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al obtener tareas');
      const data: Tarea[] = await res.json();

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

  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'No se encontró el token. Inicia sesión nuevamente.');
        router.push('/');
        return;
      }
      await fetchUsuarios(token);
      await fetchTareas(token);
    };
    init();
  }, [router]);

  // --- Reasignar Tarea ---
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f3f3' }}>
      <TopBar /> {/* TopBar con el icono para abrir el Drawer */}
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Reasignar Tarea</Text>

        <Text style={globalStyles.subtitle}>
          Selecciona una tarea pendiente o en progreso:
        </Text>
        {tareas.length === 0 && <Text>No hay tareas disponibles</Text>}
        <ScrollView style={{ maxHeight: 180, marginBottom: 20, width: '100%' }}>
          {tareas.map((tarea) => {
            const isSelected = selectedTaskId === tarea.id;
            return (
              <TouchableOpacity
                key={tarea.id}
                style={[styles.cardItem, isSelected && styles.selectedCardItem]}
                onPress={() => setSelectedTaskId(tarea.id)}
                activeOpacity={0.85}
              >
                <Text style={styles.cardTitle}>{tarea.title || 'Sin título'}</Text>
                <Text style={styles.cardMeta}>
                  Asignado a:{' '}
                  {typeof tarea.assignedTo === 'string'
                    ? usuariosMap[tarea.assignedTo] || tarea.assignedTo
                    : 'No asignado'}
                </Text>
                <Text style={styles.cardMeta}>
                  Estado: {tarea.status || 'Desconocido'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={globalStyles.subtitle}>
          Selecciona un trabajador presente hoy:
        </Text>
        {usuariosList.length === 0 && <Text>No hay trabajadores disponibles</Text>}
        <ScrollView style={{ maxHeight: 120, marginBottom: 20, width: '100%' }}>
          {usuariosList.map((user) => {
            const isSelected = selectedUserId === user.id;
            return (
              <TouchableOpacity
                key={user.id}
                style={[styles.cardItem, isSelected && styles.selectedCardItem]}
                onPress={() => setSelectedUserId(user.id)}
                activeOpacity={0.85}
              >
                <Text style={styles.cardTitle}>
                  {user.name} {user.lastName} ({user.rut})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={[globalStyles.button, loading ? { opacity: 0.6 } : {}, { marginTop: 8 }]}
          onPress={handleReassign}
          disabled={loading}
        >
          <Text style={globalStyles.buttonText}>
            {loading ? 'Reasignando...' : 'Reasignar'}
          </Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  cardItem: {
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(137, 113, 187, 1)',
    elevation: 2,
  },
  selectedCardItem: {
    borderColor: 'rgba(137, 113, 187, 1)',
    backgroundColor: '#e5ddfb',
  },
  cardTitle: {
    fontWeight: 'bold',
    color: 'rgba(90,22,163,1)',
    fontSize: 16,
    marginBottom: 2,
  },
  cardMeta: {
    color: '#5b5b5b',
    fontSize: 12,
  },
});

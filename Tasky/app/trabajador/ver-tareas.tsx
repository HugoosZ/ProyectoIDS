import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Button, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

const globalStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
    backgroundColor: '#f0f2f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#555',
    marginTop: 20,
  },
});

type Tarea = {
  id: string;
  title: string;
  description: string;
  status: string;
  startTime?: string;
  endTime?: string;
  priority?: string;
};

const getStoredAuthData = async (): Promise<{ userId: string | null; token: string | null }> => {
  try {
    const userId = await AsyncStorage.getItem('userId'); // Aquí debe estar guardado el RUT como uid
    const token = await AsyncStorage.getItem('userToken');
    return { userId, token };
  } catch (e) {
    console.error("Error al obtener datos de auth:", e);
    return { userId: null, token: null };
  }
};

export default function VerTareas() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadAuth = async () => {
      const { userId, token } = await getStoredAuthData();
      if (userId && token) {
        setAuthUserId(userId);
        setAuthToken(token);
      } else {
        setError("Usuario no autenticado.");
        setLoading(false);
      }
    };
    loadAuth();
  }, []);

  useEffect(() => {
    if (authUserId && authToken) fetchTareas();
  }, [authUserId, authToken]);

  const fetchTareas = async () => {
    if (!authUserId || !authToken) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://proyecto-ids.vercel.app/api/statustasks/${authUserId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Error al obtener tareas");

      const tareasMapeadas = data.tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status.toLowerCase(),
        startTime: t.startTime,
        endTime: t.endTime,
        priority: t.priority,
      }));

      setTareas(tareasMapeadas);
    } catch (e: any) {
      console.error("Error al obtener tareas:", e);
      setError(e.message || "Error al cargar tareas.");
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstadoTarea = async (tareaId: string, nuevoEstado: string) => {
    if (!authToken) return;
    setActualizandoId(tareaId);

    try {
      const res = await fetch(`https://proyecto-ids.vercel.app/api/tasks/${tareaId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nuevoEstado }),
      });

      const resultado = await res.json();
      if (!res.ok) throw new Error(resultado.message || "No se pudo actualizar el estado.");

      fetchTareas();
    } catch (e: any) {
      console.error("Error al actualizar estado:", e);
      Alert.alert("Error", e.message);
    } finally {
      setActualizandoId(null);
    }
  };

  const mostrarEstado = (estado: string) => {
    if (estado === 'pendiente') return '🕒 Pendiente';
    if (estado === 'en progreso') return '🔄 En progreso';
    if (estado === 'completada') return '✅ Completada';
    return estado;
  };

  const getHora = (startTime?: string) => {
    if (!startTime) return 'N/A';
    return new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={globalStyles.container}>
        <Text style={globalStyles.title}>Tareas asignadas</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={globalStyles.errorText}>{error}</Text>
            <Button title="Reintentar" onPress={fetchTareas} color="#007AFF" />
          </View>
        )}

        {!error && tareas.length === 0 && !loading && (
          <Text style={globalStyles.emptyText}>No hay tareas asignadas.</Text>
        )}

        {loading && !error && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text>Cargando tareas...</Text>
          </View>
        )}

        {!loading && tareas.map(tarea => (
          <View key={tarea.id} style={styles.tareaCard}>
            <View style={styles.tareaHeader}>
              <Text style={styles.tareaHora}>{getHora(tarea.startTime)}</Text>
              <Text style={[styles.tareaEstado, { color: getEstadoColor(tarea.status) }]}>
                {mostrarEstado(tarea.status)}
              </Text>
            </View>
            <Text style={styles.tareaNombre}>{tarea.title}</Text>
            <Text style={styles.tareaDescripcion}>{tarea.description}</Text>

            {tarea.status === 'pendiente' && (
              <Button
                title={actualizandoId === tarea.id ? "Cambiando..." : "Empezar"}
                onPress={() => actualizarEstadoTarea(tarea.id, 'en progreso')}
                color="#1E90FF"
                disabled={actualizandoId === tarea.id}
              />
            )}

            {tarea.status === 'en progreso' && (
              <Button
                title={actualizandoId === tarea.id ? "Actualizando..." : "Completar"}
                onPress={() => actualizarEstadoTarea(tarea.id, 'completada')}
                color="#28a745"
                disabled={actualizandoId === tarea.id}
              />
            )}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.botonCalendario}
        onPress={() => router.push('/trabajador/calendario-semanal')}
      >
        <Ionicons name="calendar-outline" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const getEstadoColor = (estado: string) => {
  if (estado === 'pendiente') return '#FFA500';
  if (estado === 'completada') return '#32CD32';
  if (estado === 'en progreso') return '#1E90FF';
  return '#666';
};

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  tareaCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tareaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tareaHora: {
    fontWeight: 'bold',
    color: '#555',
    fontSize: 14,
  },
  tareaEstado: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  tareaNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  tareaDescripcion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  botonCalendario: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 30,
    elevation: 5,
  },
});

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
  nombre: string;
  descripcion: string;
  estado: string;
  hora: string;
  priority?: string;
  startTime?: string | Date;
  endTime?: string | Date;
};

const getStoredAuthData = async (): Promise<{ userId: string | null; token: string | null }> => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    const token = await AsyncStorage.getItem('userToken');
    return { userId, token };
  } catch (e) {
    console.error("Error al obtener datos de auth:", e);
    return { userId: null, token: null };
  }
};

export default function VerTareas() {
  const [tareasDelDia, setTareasDelDia] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadAuthData = async () => {
      const { userId, token } = await getStoredAuthData();
      if (userId && token) {
        setAuthUserId(userId);
        setAuthToken(token);
      } else {
        setError("Usuario no autenticado.");
        setLoading(false);
      }
    };
    loadAuthData();
  }, []);

  const fetchTareas = async () => {
    if (!authUserId || !authToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://proyecto-ids.vercel.app/api/statustasks/${authUserId}?today=true`, {
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      const tareas: Tarea[] = data.tasks.map((apiTask: any) => ({
        id: apiTask.id,
        nombre: apiTask.title,
        descripcion: apiTask.description,
        estado: apiTask.status.toLowerCase(),
        hora: apiTask.startTime
          ? new Date(apiTask.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
          : 'N/A',
        priority: apiTask.priority,
        startTime: apiTask.startTime,
        endTime: apiTask.endTime,
      }));

      setTareasDelDia(tareas);
    } catch (err: any) {
      console.error("Error al obtener tareas:", err);
      setError("Error al cargar las tareas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authUserId && authToken) fetchTareas();
  }, [authUserId, authToken]);

  const actualizarEstadoTarea = async (tareaId: string, nuevoEstado: string) => {
    if (!authToken) return;

    try {
      setActualizandoId(tareaId);

      const response = await fetch(`https://proyecto-ids.vercel.app/api/tasks/${tareaId}/status`, {
        method: 'PATCH',
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nuevoEstado }),
      });

      const resultado = await response.json();
      console.log("Respuesta:", resultado);

      if (!response.ok) {
        throw new Error(resultado.message || 'Error al actualizar tarea.');
      }

      await fetchTareas();
    } catch (err: any) {
      console.error("Error actualizando tarea:", err);
      Alert.alert("Error", err.message || "No se pudo actualizar la tarea.");
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

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={globalStyles.container}>
        <Text style={globalStyles.title}>Tareas del Día</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={globalStyles.errorText}>{error}</Text>
            <Button title="Reintentar" onPress={fetchTareas} color="#007AFF" />
          </View>
        )}

        {!error && tareasDelDia.length === 0 && !loading && (
          <Text style={globalStyles.emptyText}>No hay tareas asignadas para hoy.</Text>
        )}

        {loading && !error && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text>Cargando tareas...</Text>
          </View>
        )}

        {!loading && tareasDelDia.map(tarea => (
          <View key={tarea.id} style={styles.tareaCard}>
            <View style={styles.tareaHeader}>
              <Text style={styles.tareaHora}>{tarea.hora}</Text>
              <Text style={[styles.tareaEstado, { color: getEstadoColor(tarea.estado) }]}>
                {mostrarEstado(tarea.estado)}
              </Text>
            </View>
            <Text style={styles.tareaNombre}>{tarea.nombre}</Text>
            <Text style={styles.tareaDescripcion}>{tarea.descripcion}</Text>

            {tarea.estado === 'pendiente' && (
              <Button
                title={actualizandoId === tarea.id ? "Cambiando..." : "Empezar"}
                onPress={() => actualizarEstadoTarea(tarea.id, 'en progreso')}
                color="#1E90FF"
                disabled={actualizandoId === tarea.id}
              />
            )}

            {tarea.estado === 'en progreso' && (
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

      {/* Botón del calendario con la ruta corregida */}
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

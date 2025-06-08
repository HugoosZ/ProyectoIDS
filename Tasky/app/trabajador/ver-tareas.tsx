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
  requiereRelevo: boolean;
  trabajadorSaliente: string;
  trabajadorEntrante: string;
};

const MINUTOS_MINIMOS = 15; // minutos mínimos para poder terminar tarea

// Función para obtener los datos de autenticación (userId y token)
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

  useEffect(() => {
    if (authUserId && authToken) {
      fetchTareas();
    }
  }, [authUserId, authToken]);

  const fetchTareas = async () => {
    if (!authUserId || !authToken) return;

    setLoading(true);
    setError(null);

    console.log('Fecha y hora actual al cargar tareas:', new Date().toLocaleString());

    const filtros={
        //today: "true",
        //week: "true",
       //status: "en proceso",
      //priority: "alta",
      //requiereRelevo: "true",
      }

      const queryParams = new URLSearchParams(filtros).toString();

    try {

      const response = await fetch(`https://proyecto-ids.vercel.app/api/statustasks/${authUserId}?${queryParams}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const data = await response.json();

      console.log('Respuesta de la API:', data);

      if (data && data.tasks) {
        const tareas: Tarea[] = data.tasks.map((apiTask: any) => ({
          id: apiTask.id,
          nombre: apiTask.title,
          descripcion: apiTask.description,
          estado: apiTask.status.toLowerCase(),
          hora: apiTask.startTime
            ? new Date(apiTask.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
            : 'N/A',
          priority: apiTask.priority,
          startTime: apiTask.startTime ? new Date(apiTask.startTime) : null,
          endTime: apiTask.endTime ? new Date(apiTask.endTime) : null,
          requiereRelevo: apiTask.requiereRelevo || false,
          trabajadorSaliente: apiTask.trabajadorSaliente || '',
          trabajadorEntrante: apiTask.trabajadorEntrante || ''
        }));

        const tareasFiltradas = tareas.filter(tarea => {
          const esHoy=tarea.startTime && new Date(tarea.startTime).toDateString() === new Date().toDateString();
          const esEstadoValido=tarea.estado === 'pendiente' || tarea.estado === 'en progreso';

          const esAsignado = 
            (!tarea.requiereRelevo && tarea.trabajadorSaliente === authUserId) || // tareas normales
            (tarea.requiereRelevo && (tarea.trabajadorSaliente === authUserId || tarea.trabajadorEntrante === authUserId)); // con relevo

          return esHoy && esEstadoValido && esAsignado;
});


        console.log('Tareas filtradas:', tareasFiltradas);
        setTareasDelDia(tareasFiltradas);
      } else {
        throw new Error('No se encontraron tareas en la respuesta');
      }
    } catch (err: any) {
      console.error("Error al obtener tareas:", err);
      setError("Error al cargar las tareas.");
    } finally {
      setLoading(false);
    }
  };

  const hayTareaEnProgreso = (): boolean => {
    return tareasDelDia.some(tarea => tarea.estado === "en progreso");
  };

  const puedeTerminarTarea = (startTime?: string | Date): boolean => {
    if (!startTime) return false;
    const inicio = new Date(startTime).getTime();
    const ahora = Date.now();
    const diffMinutos = (ahora - inicio) / (1000 * 60);
    return diffMinutos >= MINUTOS_MINIMOS;
  };

  const actualizarEstadoTarea = async (tareaId: string, nuevoEstado: string) => {
    if (!authToken || !authUserId) return;

    const empresaId = '9ccfbbf4-da1a-4ece-8145-f54dc1e8aa23';

    if (nuevoEstado === "completada") {
      const tarea = tareasDelDia.find(t => t.id === tareaId);
      if (!tarea) {
        Alert.alert("Error", "Tarea no encontrada.");
        return;
      }
      if (!puedeTerminarTarea(tarea.startTime)) {
        Alert.alert(
          "Atención",
          `No puedes finalizar esta tarea hasta que hayan pasado al menos ${MINUTOS_MINIMOS} minutos desde su inicio.`
        );
        return;
      }
    }

    if (nuevoEstado === "en progreso") {
      if (hayTareaEnProgreso()) {
        Alert.alert("Atención", "Solo puedes tener una tarea en ejecución al mismo tiempo.");
        return;
      }
    }

    try {
      setActualizandoId(tareaId);

      const response = await fetch(`https://proyecto-ids.vercel.app/api/tasks/${tareaId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nuevoEstado,
          empresaId: empresaId
        }),
      });

      const resultado = await response.json();
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
          <Text style={globalStyles.emptyText}>No hay tareas asignadas.</Text>
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
            
            {tarea.requiereRelevo && (
              <text style={styles.requiereRelevoTexto}>
                Tarea con relevo
              </text>
              )}

            {tarea.estado === 'pendiente' && (
              <Button
                title={actualizandoId === tarea.id ? "Cambiando..." : "Empezar"}
                onPress={() => actualizarEstadoTarea(tarea.id, 'en progreso')}
                color="#1E90FF"
                disabled={actualizandoId === tarea.id || hayTareaEnProgreso()}
              />
            )}

            {tarea.estado === 'en progreso' && (
              <>
                {tarea.requiereRelevo && tarea.trabajadorEntrante === authUserId ? (
                  <Button
                    title="Relevar tarea"
                    onPress={() => router.push({ pathname: '/trabajador/ingreso_relevo', params: { taskId: tarea.id } })}
                    color="#FFA500"
                    />
                ) : (
                  <Button
                    title={actualizandoId === tarea.id ? "Cambiando..." : "Terminar"}
                    onPress={() => actualizarEstadoTarea(tarea.id, 'completada')}
                    color="#32CD32"
                    disabled={actualizandoId === tarea.id || !puedeTerminarTarea(tarea.startTime)}
              />
            )}
            </>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.botonCalendario}
          onPress={() => router.push('/trabajador/turno')}
        >
          <Ionicons name="time" size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonCalendario}
          onPress={() => router.push('/trabajador/tareas_completadas')}
        >
          <Ionicons name="checkmark-done-outline" size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonCalendario}
          onPress={() => router.push('/trabajador/calendario-semanal')}
        >
          <Ionicons name="calendar-outline" size={30} color="white" />
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 30,
    elevation: 5,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  requiereRelevoTexto: {
    color: '#FF4500',
    fontWeight: 'bold',
    marginBottom: 8,
  },
});

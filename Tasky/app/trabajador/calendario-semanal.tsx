import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

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

type TareasPorDia = {
  [fecha: string]: Tarea[];
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

export default function CalendarioSemanalTareas() {
  const [tareasPorDia, setTareasPorDia] = useState<TareasPorDia>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const loadAuthData = async () => {
      const { userId, token } = await getStoredAuthData();
      if (userId && token) {
        setUserId(userId);
        setToken(token);
      } else {
        setError("Usuario no autenticado.");
        setLoading(false);
      }
    };
    loadAuthData();
  }, []);

  const fetchTareas = async () => {
    if (!userId || !token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://proyecto-ids.vercel.app/api/statustasks/${userId}?week=true`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

      const data = await response.json();

      // data.tasks es el arreglo de tareas
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

      // Agrupar tareas por fecha (ISO yyyy-mm-dd)
      const agrupadas: TareasPorDia = {};
      tareas.forEach((tarea) => {
        const fecha = tarea.startTime ? new Date(tarea.startTime).toISOString().split('T')[0] : 'Sin fecha';
        if (!agrupadas[fecha]) agrupadas[fecha] = [];
        agrupadas[fecha].push(tarea);
      });

      setTareasPorDia(agrupadas);
    } catch (err: any) {
      console.error("Error al obtener tareas:", err);
      setError(err.message || "Error al cargar las tareas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && token) {
      fetchTareas();
    }
  }, [userId, token]);

  const getColorDeFondo = (fecha: string, estado: string) => {
    const hoy = new Date();
    const fechaTarea = new Date(fecha);
    if (estado === 'completada' && fechaTarea < hoy) {
      return '#e6f4ea';
    }
    return '#fff';
  const getColorDeFondo = (fecha: string, estado: string) => {
    const hoy = new Date();
    const fechaTarea = new Date(fecha);
    if (estado === 'completada' && fechaTarea < hoy) {
      return '#e6f4ea';
    }
    return '#fff';
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Cargando tareas...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button title="← Volver" onPress={() => router.push('/trabajador/ver-tareas')} />

      <Text style={styles.title}>Tareas Semanales</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {Object.keys(tareasPorDia).length === 0 && !error && (
        <Text style={styles.empty}>No hay tareas programadas.</Text>
      )}

      {Object.entries(tareasPorDia).map(([fecha, tareas]) => (
        <View key={fecha} style={styles.diaContainer}>
          <Text style={styles.fecha}>{fecha}</Text>
          {tareas.map((tarea) => (
            <View
              key={tarea.id}
              style={[styles.tareaCard, { backgroundColor: getColorDeFondo(fecha, tarea.estado) }]}
            >
              <Text style={styles.titulo}>{tarea.nombre}</Text>
              <Text style={styles.descripcion}>{tarea.descripcion}</Text>
             <Text style={styles.estado}>
               {tarea.estado === 'completada' ? '✅ Completada' 
               : tarea.estado === 'en progreso' ? '🔄 En progreso' 
                 : '🕒 Pendiente'}
                </Text>
              <Text style={styles.hora}>Hora: {tarea.hora}</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    textAlign: 'center',
    color: '#333',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  empty: {
    textAlign: 'center',
    color: '#555',
    marginTop: 20,
  },
  diaContainer: {
    marginBottom: 20,
  },
  fecha: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#222',
  },
  tareaCard: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  descripcion: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  estado: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  hora: {
    fontSize: 13,
    color: '#555',
    marginTop: 3,
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Button, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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

// Función para convertir un Timestamp de Firestore a un objeto Date
const parseFirestoreTimestamp = (timestamp: any): Date => {
  if (timestamp && timestamp._seconds) {
    return new Date(timestamp._seconds * 1000); // Convertir el valor de segundos a milisegundos
  }
  return new Date(); // Si no es un objeto válido, retornamos la fecha actual
};

export default function VerTareas() {
  const [tareasDelDia, setTareasDelDia] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();


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

  const logout = async () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        {
          text: "Cancelar",
          onPress: () => console.log("Cierre de sesión cancelado"),
          style: "cancel"
        },
        {
          text: "Confirmar",
          onPress: async () => {
              try {
                await AsyncStorage.removeItem('userId');
                await AsyncStorage.removeItem('userToken');
                router.replace('/'); // Redirige a login
              } catch (e) {
                console.error('Error al cerrar sesión:', e);
                Alert.alert("Error", "No se pudo cerrar sesión. Inténtalo de nuevo.");
              }
          },
          style: "destructive"
        }
      ],
      { cancelable: true }
    );
  };

  useEffect(() => {
    if (authUserId && authToken) {
      fetchTareas();
    }
  }, [authUserId, authToken]);

  const fetchTareas = async () => {
  if (!authUserId || !authToken) return;

    setLoading(true);
    setError(null);

  try {
    const response = await fetch(`https://proyecto-ids.vercel.app/api/statustasks/${authUserId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }

      const data = await response.json();

      if (Array.isArray(data)) {
        const tareas: Tarea[] = data.map((apiTask: any) => {
          return {
            id: apiTask.assignmentId,
            nombre: apiTask.taskName || apiTask.individualTask || 'Sin nombre',
            descripcion: apiTask.taskDescription || '',
            estado: apiTask.status.toLowerCase(),
            hora: apiTask.startTime
              ? parseFirestoreTimestamp(apiTask.startTime).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })
              : 'N/A',
            priority: apiTask.priority || 'normal',
            startTime: parseFirestoreTimestamp(apiTask.startTime), // Asegúrate de convertirlo a Date
            endTime: parseFirestoreTimestamp(apiTask.endTime), // Asegúrate de convertirlo a Date
            requiereRelevo: apiTask.requiereRelevo || false,
            trabajadorSaliente: apiTask.trabajadorSaliente || '',
            trabajadorEntrante: apiTask.trabajadorEntrante || ''
          };
        });

        // Filtramos las tareas para que solo se muestren las pendientes o en curso
        const tareasFiltradas = tareas.filter(tarea => 
          tarea.estado === 'pendiente' || tarea.estado === 'en curso'
        );

        setTareasDelDia(tareasFiltradas);
      } else {
        throw new Error('Formato de respuesta inválido: se esperaba un array');
      }
    } catch (err: any) {
      setError("Error al cargar las tareas: " + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const hayTareaEnCurso = (): boolean => {
    return tareasDelDia.some(tarea => tarea.estado === "en curso");
  };

  const actualizarEstadoTarea = async (tareaId: string, nuevoEstado: string) => {
    if (!authToken || !authUserId) return;

    const empresaId = '9ccfbbf4-da1a-4ece-8145-f54dc1e8aa23';

    if (nuevoEstado === "en curso") {
      if (hayTareaEnCurso()) {
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
      Alert.alert("Error", err.message || "No se pudo actualizar la tarea.");
    } finally {
      setActualizandoId(null);
    }
  };

  const mostrarEstado = (estado: string) => {
    if (estado === 'pendiente') return 'Pendiente';
    if (estado === 'en curso') return 'En curso';
    if (estado === 'completada') return 'Completada';
    return estado;
  };

  return (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f2f5' }}>
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <Text style={globalStyles.title}>Tareas del Día</Text>
    </View>

    <ScrollView contentContainerStyle={styles.scrollContent}>
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

          {tarea.estado === 'pendiente' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.buttonPrimary]}
              onPress={() => actualizarEstadoTarea(tarea.id, 'en curso')}
              disabled={actualizandoId === tarea.id || hayTareaEnCurso()}
            >
              <Text style={styles.buttonPrimaryText}>
                {actualizandoId === tarea.id ? "Cambiando..." : "Empezar"}
              </Text>
            </TouchableOpacity>
          )}

          {tarea.estado === 'en curso' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.buttonPrimary]}
              onPress={() => actualizarEstadoTarea(tarea.id, 'completada')}
            >
              <Text style={styles.actionButtonText}>
                {actualizandoId === tarea.id ? "Actualizando..." : "Completar"}
              </Text>
            </TouchableOpacity>
          )}

        </View>
      ))}
    </ScrollView>

    <View style={[styles.bottomMenu, { paddingBottom: insets.bottom }]}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => router.push('/trabajador/turno')}
      >
        <Ionicons name="time" size={24} style={styles.menuIconPrimary} />
        <Text style={styles.menuText}>Turno</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => router.push('/trabajador/tareas_completadas')}
      >
        <Ionicons name="checkmark-done-outline" size={24} style={styles.menuIconPrimary} />
        <Text style={styles.menuText}>Completadas</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => router.push('/trabajador/calendario-semanal')}
      >
        <Ionicons name="calendar-outline" size={24} style={styles.menuIconPrimary} />
        <Text style={styles.menuText}>Calendario</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuButton}
        onPress={logout}
      >
        <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        <Text style={[styles.menuText, { color: '#FF3B30' }]}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

}

const getEstadoColor = (estado: string) => {
  if (estado === 'pendiente') return '#FFA500';
  if (estado === 'completada') return '#32CD32';
  if (estado === 'en curso') return '#1E90FF';
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
  backgroundColor: '#ffffff',
  padding: 16,
  marginVertical: 10,
  borderRadius: 16,
  elevation: 4,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  borderWidth: 1,
  borderColor: '#e0e0e0',
},
  tareaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tareaHora: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
  },
  tareaEstado: {
    fontWeight: '600',
    fontSize: 13,
  },
  tareaNombre: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1c1c1e',
  },
  tareaDescripcion: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
   bottomMenu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 5,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  menuButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 3,
  },
  menuText: {
    fontSize: 12,
    color: '#8971BB',
    marginTop: 2,
  },
  header: {
  backgroundColor: '#f0f2f5',
  paddingHorizontal: 20,
  paddingBottom: 10,
  },
  scrollContent: {
  paddingHorizontal: 20,
  paddingBottom: 100,
},
  actionButton: {
  marginTop: 10,
  paddingVertical: 10,
  paddingHorizontal: 24,
  borderRadius: 30,
  alignItems: 'center',
},
actionButtonText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 14,
},
buttonPrimary: {
  backgroundColor: 'rgba(137, 113, 187, 1)',
},
buttonPrimaryText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 14,
},
menuIconPrimary: {
  color: 'rgba(137, 113, 187, 1)',
},
menuTextPrimary: {
  color: 'rgba(137, 113, 187, 1)',
},
});

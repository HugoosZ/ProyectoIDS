import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Button } from 'react-native';
// Importa AsyncStorage o tu método de almacenamiento preferido
import AsyncStorage from '@react-native-async-storage/async-storage';

// Asegúrate de que la ruta a globalStyles sea correcta
// import globalStyles from '../globalStyles';

// Definición de estilos globales simulada si no se proporciona el archivo
const globalStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
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

// Tipo Tarea ajustado a los campos devueltos por /statustasks
// y los que necesita el componente para mostrar.
type Tarea = {
  id: string; // Desde la API
  nombre: string; // Mapeado desde 'title' de la API
  descripcion: string; // Desde 'description' de la API
  estado: string; // Desde 'status' de la API
  hora: string; // Formateado desde 'startTime' de la API
  // Campos adicionales de la API que podrías querer usar:
  priority?: string;
  startTime?: string | Date; // La API devuelve "fechas JS"
  endTime?: string | Date;
};

const getStoredAuthData = async (): Promise<{ userId: string | null; token: string | null }> => {
  console.log("Intentando obtener datos de autenticación desde AsyncStorage...");
  try {
    const userIdKey = 'userId'; 
    const tokenKey = 'userToken'; 

    const userId = await AsyncStorage.getItem(userIdKey);
    const token = await AsyncStorage.getItem(tokenKey);

    console.log(`Valor recuperado para ${userIdKey}:`, userId);
    console.log(`Valor recuperado para ${tokenKey}:`, token);

    if (!userId) {
      console.warn(`AsyncStorage: No se encontró valor para la clave '${userIdKey}'. Asegúrate de guardarlo después del login.`);
    }
    if (!token) {
      console.warn(`AsyncStorage: No se encontró valor para la clave '${tokenKey}'. Asegúrate de guardarlo después del login.`);
    }

    return { userId, token };
  } catch (e) {
    console.error("Error al obtener datos de auth de AsyncStorage:", e);
    return { userId: null, token: null };
  }
};


export default function VerTareas() {
  const [tareasDelDia, setTareasDelDia] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const loadAuthDataAndFetchTasks = async () => {
      const { userId, token } = await getStoredAuthData();
      if (userId && token) {
        console.log("Datos de autenticación cargados:", { userId, token });
        setAuthUserId(userId);
        setAuthToken(token);
      } else {
        console.error("Fallo al cargar datos de autenticación. userId o token es null/undefined.");
        setError("Usuario no autenticado. No se pueden cargar las tareas.");
        setLoading(false);
      }
    };
    loadAuthDataAndFetchTasks();
  }, []);


  const fetchTareas = async () => {
    if (!authUserId || !authToken) {
      console.warn("fetchTareas llamado sin authUserId o authToken.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null); 

    const queryParams = new URLSearchParams({
      today: "true"
    });

    const API_URL = `https://proyecto-ids.vercel.app/api/statustasks/${authUserId}?${queryParams.toString()}`;
    console.log(`Fetching tareas desde: ${API_URL}`);
    console.log(`Usando token: Bearer ${authToken ? authToken.substring(0, 15) + "..." : "NULL"}`);


    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        let errorDataMessage = "No se pudo obtener más información del error del servidor.";
        try {
            const errorData = await response.json(); 
            console.error("Error response JSON data:", errorData);
            errorDataMessage = errorData.message || errorData.error || JSON.stringify(errorData);
        } catch (jsonError) {
            const errorText = await response.text();
            console.error("Error response text data:", errorText);
            errorDataMessage = errorText;
        }
        throw new Error(`Error HTTP ${response.status} (${response.statusText}): ${errorDataMessage}`);
      }

      const data = await response.json();
      console.log('Datos recibidos de /statustasks:', JSON.stringify(data, null, 2));

      if (data && Array.isArray(data.tasks)) {
        const tareasMapeadas: Tarea[] = data.tasks.map((apiTask: any) => ({
          id: apiTask.id,
          nombre: apiTask.title,
          descripcion: apiTask.description,
          estado: apiTask.status,
          hora: apiTask.startTime ? new Date(apiTask.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A',
          priority: apiTask.priority,
          startTime: apiTask.startTime,
          endTime: apiTask.endTime,
        }));
        setTareasDelDia(tareasMapeadas);
      } else {
        console.warn("La respuesta de la API no tiene el formato esperado (data.tasks no es un array) o no hay tareas:", data);
        setTareasDelDia([]);
      }
    } catch (err: any) {
      console.error('Error detallado al obtener tareas:', err);
      setError(err.message || 'Ocurrió un error desconocido al cargar las tareas.');
    } finally {
      setLoading(false);
    }
  };

   useEffect(() => {
    if (authUserId && authToken) {
      fetchTareas();
    }
  }, [authUserId, authToken]);


  const mostrarEstado = (estado: string) => {
    const estadoNormalizado = estado ? estado.toLowerCase() : "";
    if (estadoNormalizado === 'pendiente') return '🕒 Pendiente';
    if (estadoNormalizado === 'en curso') return '🔄 En curso';
    if (estadoNormalizado === 'terminada' || estadoNormalizado === 'completada') return '✅ Terminada';
    if (estadoNormalizado === 'finalizada') return '✅ Finalizada';
    return estado;
  };

  if (loading && !error) { 
    return (
      <View style={[globalStyles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Cargando tareas...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={globalStyles.container}>
      <Text style={globalStyles.title}>Tareas del Día</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={globalStyles.errorText}>{error}</Text>
          {authUserId && authToken && <Button title="Reintentar" onPress={fetchTareas} color="#007AFF" />}
        </View>
      )}

      {!error && tareasDelDia.length === 0 && !loading && (
        <Text style={globalStyles.emptyText}>No hay tareas asignadas para el día de hoy.</Text>
      )}

      {!error && tareasDelDia.map((tarea) => (
        <View key={tarea.id} style={styles.tareaCard}>
          <View style={styles.tareaHeader}>
            <Text style={styles.tareaHora}>{tarea.hora}</Text>
            <Text style={[styles.tareaEstado, { color: getEstadoColor(tarea.estado) }]}>
              {mostrarEstado(tarea.estado)}
            </Text>
          </View>
          <Text style={styles.tareaNombre}>{tarea.nombre}</Text>
          <Text style={styles.tareaDescripcion}>{tarea.descripcion}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const getEstadoColor = (estado: string) => {
  const estadoNormalizado = estado ? estado.toLowerCase() : "";
  if (estadoNormalizado === 'pendiente') return '#FFA500';
  if (estadoNormalizado === 'en curso') return '#1E90FF';
  if (estadoNormalizado === 'terminada' || estadoNormalizado === 'completada' || estadoNormalizado === 'finalizada') return '#32CD32';
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
});

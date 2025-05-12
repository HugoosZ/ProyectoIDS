import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Button } from 'react-native';
// Asegúrate de que la ruta a globalStyles sea correcta
// import globalStyles from '../globalStyles';

// Definición de estilos globales simulada si no se proporciona el archivo
const globalStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f0f2f5', // Un color de fondo neutro
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

// Definición del tipo Tarea
type Tarea = {
  _id: string;
  nombre: string;
  descripcion: string;
  fecha?: string; // Hacemos 'fecha' opcional para manejar casos donde no exista
  hora: string;
  estado: string;
  // Añade aquí otros campos que pueda tener tu tarea, como 'dia' o 'bloque' si los usas aquí
};

export default function VerTareas() {
  const [todasLasTareas, setTodasLasTareas] = useState<Tarea[]>([]);
  const [tareasDelDia, setTareasDelDia] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getHoyFechaString = () => {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = (hoy.getMonth() + 1).toString().padStart(2, '0'); // Meses son 0-indexados
    const dia = hoy.getDate().toString().padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  };

  const fetchTareas = () => {
    setLoading(true);
    setError(null);
    fetch('https://proyecto-ids-hugooszs-projects.vercel.app/api/tasks')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        const tareasObtenidas: Tarea[] = Array.isArray(data) 
            ? data 
            : (data.tasks || data.data || []); 

        if (!Array.isArray(tareasObtenidas)) {
            console.error('Error: La respuesta de la API no es un array de tareas válido:', tareasObtenidas);
            throw new Error('Formato de datos incorrecto recibido de la API.');
        }

        console.log('Todas las tareas obtenidas de la API:', JSON.stringify(tareasObtenidas, null, 2)); 
        setTodasLasTareas(tareasObtenidas);

        const hoyString = getHoyFechaString();
        console.log(`Filtrando para la fecha de hoy: ${hoyString}`);

        const filtradas = tareasObtenidas.filter(tarea => {
          console.log(`Inspeccionando tarea ID ${tarea._id}, fecha: ${tarea.fecha} (tipo: ${typeof tarea.fecha})`); 
          if (typeof tarea.fecha === 'string' && tarea.fecha.startsWith(hoyString)) {
            return true;
          }
          if (tarea.fecha === undefined) { 
            console.warn(`Tarea con ID ${tarea._id} no tiene propiedad 'fecha'.`);
          } else if (typeof tarea.fecha !== 'string') {
            console.warn(`Tarea con ID ${tarea._id} tiene una 'fecha' que no es string:`, tarea.fecha);
          } else {
            console.log(`Tarea con ID ${tarea._id} tiene fecha ${tarea.fecha}, no coincide con el inicio de ${hoyString}`);
          }
          return false;
        });
        console.log(`Tareas filtradas para hoy (${hoyString}):`, filtradas.length > 0 ? JSON.stringify(filtradas, null, 2) : 'Ninguna');
        setTareasDelDia(filtradas);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error al obtener tareas:', err);
        setError(err.message || 'Ocurrió un error al cargar las tareas.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTareas();
  }, []);

  const mostrarEstado = (estado: string) => {
    if (estado === 'pendiente') return '🕒 Pendiente';
    if (estado === 'en curso') return '🔄 En curso';
    if (estado === 'terminada') return '✅ Terminada';
    if (estado === 'finalizada') return '✅ Finalizada'; 
    return estado;
  };

  if (loading) {
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
          <Button title="Reintentar" onPress={fetchTareas} color="#007AFF" />
        </View>
      )}

      {!error && tareasDelDia.length === 0 && !loading && (
        <Text style={globalStyles.emptyText}>No hay tareas asignadas para el día de hoy.</Text>
      )}

      {!error && tareasDelDia.map((tarea) => (
        <View key={tarea._id} style={styles.tareaCard}>
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
  if (estado === 'pendiente') return '#FFA500';
  if (estado === 'en curso') return '#1E90FF';
  if (estado === 'terminada' || estado === 'finalizada') return '#32CD32';
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
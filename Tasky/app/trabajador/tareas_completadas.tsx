import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type Tarea={
  id: string;
  description: string;
  status: string;
  realStartTime: string;
  realEndTime: string;
};

const getStoredAuthData=async (): Promise<{ userId: string | null; token: string | null }> =>{
  try{
    const userId=await AsyncStorage.getItem('userId');
    const token=await AsyncStorage.getItem('userToken');
    return { userId, token };
  }catch (e){
    console.error("Error al obtener datos de auth:", e);
    return{ userId: null, token: null };
  }
};

export default function TareasCompletadas(){
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTareas = async () => {
      setLoading(true);
      const { userId, token } = await getStoredAuthData();
      if (!userId || !token) {
        setError("Usuario no autenticado.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`https://proyecto-ids.vercel.app/api/tasks/done/${userId}/today`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status}`);
        }
        const data: Tarea[] = await response.json();
        setTareas(data);
      } catch (err: any) {
        console.error("Error al obtener tareas completadas:", err);
        setError(err.message || "Error al cargar las tareas.");
      } finally {
        setLoading(false);
      }
    };
    fetchTareas();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Cargando tareas...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('/trabajador/ver-tareas')}
        activeOpacity={0.8}
      >
        <Ionicons name="chevron-back" size={20} color="#111827" />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Tareas completadas hoy</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={tareas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.estadoRow}>
              <Ionicons name="checkmark-circle-outline" size={20} color="green" style={{ marginRight: 6 }} />
            </View>
            <Text style={styles.descripcion}>{item.description}</Text>
            <Text style={styles.hora}>Inicio: {new Date(item.realStartTime).toLocaleTimeString()}</Text>
            <Text style={styles.hora}>Término: {new Date(item.realEndTime).toLocaleTimeString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No hay tareas completadas hoy.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#111827',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  descripcion: {
    fontSize: 16,
    color: '#374151',
    marginTop: 8,
  },
  estadoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hora: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  empty: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
  },
  backText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 4,
  },
});

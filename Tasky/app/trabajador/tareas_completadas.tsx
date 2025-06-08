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
        <Text style={styles.loadingText}>Cargando tareas...</Text>
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
        <Ionicons name="chevron-back" size={22} color="#111827" />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Tareas completadas hoy</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
          data={tareas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.flatListContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.estadoRow}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
              </View>
              <Text style={styles.descripcion}>{item.description}</Text>
              <Text style={styles.hora}>Inicio: {new Date(item.realStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <Text style={styles.hora}>Término: {new Date(item.realEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
  )}
  ListEmptyComponent={<Text style={styles.empty}>No has completado tareas hoy.</Text>}
/>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  flatListContent: {
    paddingBottom: 40,
    paddingHorizontal: 4,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    marginHorizontal: 8, // margen lateral para no pegarse al borde
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  descripcion: {
    fontSize: 16,
    color: '#374151',
    marginTop: 8,
    fontWeight: '500',
  },
  estadoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  estadoTexto: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 6,
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
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6B7280',
  },
  error: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    textAlign: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    fontWeight: '500',
  },
  empty: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 30,
    fontSize: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 12,
  },
  backText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 6,
  },
});

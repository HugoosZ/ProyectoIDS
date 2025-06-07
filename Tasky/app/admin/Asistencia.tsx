import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TopBar from '../../components/TopBar';
import BottomBar from '../../components/BottomBar';

type Asistencia = {
  asistenciaId: string;
  isPresent: boolean;
  date: { _seconds: number };
  user: {
    name: string;
    lastName: string;
    rut: string;
    email: string;
  } | null;
};

export default function Asistencia() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAsistencias = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'No se encontró el token. Inicia sesión nuevamente.');
        return;
      }

      const res = await fetch('https://proyecto-ids.vercel.app/api/admin/attendance?time=today', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });



      const data: Asistencia[] = await res.json();
      if (!res.ok) throw new Error(data as any || 'Error al obtener asistencia');

      const asistenciaMap = new Map<string, Asistencia>();

      data.forEach((registro: Asistencia) => {
        const key = registro.user?.rut || registro.user?.email;
        if (!key) return;

        const existente = asistenciaMap.get(key);
        if (!existente || registro.date._seconds > existente.date._seconds) {
          asistenciaMap.set(key, registro);
        }
      });

      setAsistencias(Array.from(asistenciaMap.values()));

    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchAsistencias();
  }, []);

  const formatearFecha = (timestamp: { _seconds: number }) => {
    const fecha = new Date(timestamp._seconds * 1000);
    return fecha.toLocaleString();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar />
      <View style={styles.container}>
        <Text style={styles.title}>Asistencia del día</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#8866c2" />
        ) : asistencias.length === 0 ? (
          <Text style={styles.noData}>No hay usuarios presentes hoy.</Text>
        ) : (
          <ScrollView>
            {asistencias.map((asistencia) => (
              <View key={asistencia.asistenciaId} style={styles.card}>
                <Text style={styles.nombre}>
                  {asistencia.user?.name} {asistencia.user?.lastName}
                </Text>
                <Text><Text style={styles.bold}>RUT:</Text> {asistencia.user?.rut}</Text>
                <Text><Text style={styles.bold}>Correo:</Text> {asistencia.user?.email}</Text>
                <Text><Text style={styles.bold}>Estado:</Text> {asistencia.isPresent ? 'Presente' : 'Ausente'}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: 'rgb(132, 106, 180)',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f3f3f3',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  nombre: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: 'rgb(132, 106, 180)',
  },
  bold: {
    fontWeight: 'bold',
  },
  noData: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});

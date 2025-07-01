import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  View,
  Dimensions,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import globalStyles from '../globalStyles';
import TopBar from '../../components/TopBar';
import BottomBar from '../../components/BottomBar';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Tarea = {
  id: string;
  title?: string;
  assignedTo?: string;
  status?: string;
  startTime?: { _seconds: number };
  endTime?: { _seconds: number };
};

export default function AdminMain() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [usuarios, setUsuarios] = useState<Record<string, string>>({});

  const screenWidth = Dimensions.get('window').width;

  const fetchUsuarios = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log(token);
      if (!token) {
        Alert.alert('Error', 'No se encontró el token. Inicia sesión nuevamente.');
        return;
      }

      const res = await fetch('https://proyecto-ids.vercel.app/api/users', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      const usuariosMap: Record<string, string> = {};
      data.forEach((usuario: any) => {
        usuariosMap[usuario.id] = `${usuario.name} ${usuario.lastName}`;
      });

      setUsuarios(usuariosMap);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  };

  const fetchTareas = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'No se encontró el token. Inicia sesión nuevamente.');
        return;
      }
  
      const res = await fetch('https://proyecto-ids.vercel.app/api/admin/tasks/detailed', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const data = await res.json();
      setTareas(data);
    } catch (error) {
      console.error('Error al obtener tareas:', error);
    }
  };
  

  useEffect(() => {
    fetchUsuarios();
    fetchTareas();
  }, []);


  const formatearFecha = (fecha: any) => {
    let dateObj;

    if (fecha?._seconds) {
      // Si es un timestamp de Firebase
      dateObj = new Date(fecha._seconds * 1000);
    } else if (typeof fecha === 'string') {
      // Si ya es un string de fecha
      dateObj = new Date(fecha);
    } else {
      return 'Fecha inválida';
    }

    if (isNaN(dateObj.getTime())) return 'Fecha inválida';

    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(dateObj);
  };
  
  const tareasFiltradas = tareas;
  

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
    <TopBar />
    <View style={globalStyles.adminContainer}>
        <View style={styles.header}>
          <Text style={globalStyles.title}>Bienvenido, Administrador</Text>

          <View style={styles.tituloYFiltro}>
            <Text style={globalStyles.adminSubtitle}>Lista de tareas</Text>
        </View>

        {tareasFiltradas.length === 0 ? (
          <Text>No hay tareas para mostrar</Text>
        ) : (
          <FlatList
            data={tareasFiltradas}
            keyExtractor={(item) => item.id || Math.random().toString()}
            renderItem={({ item: tarea }) => (
                <View style={[
                  styles.tareaCard,
                  tarea.status?.toLowerCase() === 'completada' && styles.completada,
                  tarea.status?.toLowerCase() === 'en curso' && styles.enCurso,
                  tarea.status?.toLowerCase() === 'pendiente' && styles.pendiente,
                ]}>

                <Text style={styles.tareaTitulo}>{tarea.assignments?.[0]?.individualTask || 'Tarea general'}</Text>
            
                <Text style={styles.detalle}>
                  <Text style={styles.label}>Inicio: </Text>
                  {formatearFecha(tarea.assignments?.[0]?.startTimeIndividualTask)}
                </Text>
                <Text style={styles.detalle}>
                  <Text style={styles.label}>Fin: </Text>
                  {formatearFecha(tarea.assignments?.[0]?.endTimeIndividualTask)}
                </Text>
                <Text style={styles.detalle}>
                  <Text style={styles.label}>Estado: </Text>
                  {tarea.status}
                </Text>

              </View>
            )}
            
          />
        )}
        </View>
      </View>
      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tareaCard: {
    backgroundColor: '#fdfcfe',
    padding: 18,
    borderRadius: 16,
    marginVertical: 10,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderLeftWidth: 6,
  },
  tareaTitulo: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#6a1b9a',
    marginBottom: 8,
  },
  detalle: {
    fontSize: 14.5,
    marginBottom: 5,
    color: '#555',
  },
  completada: {
    borderLeftColor: '#00c853',
  },
  pendiente: {
    borderLeftColor: '#bb33ff',
  },
  enCurso: {
    borderLeftColor: '#2962ff',
  },
  
  
});

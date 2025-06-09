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
  const [estadoFiltro, setEstadoFiltro] = useState('todas');
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

      const res = await fetch('https://proyecto-ids.vercel.app/api/tasks', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log(data);
      setTareas(data);
    } catch (error) {
      console.error('Error al obtener tareas:', error);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    fetchTareas();
  }, []);

/*   const formatearFecha = (timestamp?: { _seconds: number }) => {
    if (!timestamp?._seconds) return 'Fecha inválida';
    const fecha = new Date(timestamp._seconds * 1000);
    return fecha.toLocaleString();
  }; */


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
  
  const tareasFiltradas = tareas.filter((tarea) => {
    if (estadoFiltro === 'todas') return true;
    if (estadoFiltro === 'pendientes') {
      return (
        tarea.status?.toLowerCase() === 'pendiente' ||
        tarea.status?.toLowerCase() === 'en desarrollo'
      );
    }
    if (estadoFiltro === 'enDesarrollo') {
      return tarea.status?.toLowerCase() === 'en desarrollo' || tarea.status?.toLowerCase() === 'en curso';
    }
    if (estadoFiltro === 'finalizadas') {
      return ['completada', 'finalizada', 'finalizado'].includes(tarea.status?.toLowerCase() || '');
    }
    return true;
  });

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
    <TopBar />
    <View style={globalStyles.adminContainer}>
        <View style={styles.header}>
          <Text style={globalStyles.title}>Bienvenido, Administrador</Text>

          <View style={styles.tituloYFiltro}>
            <Text style={globalStyles.adminSubtitle}>Lista de tareas</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={estadoFiltro}
                onValueChange={(itemValue) => setEstadoFiltro(itemValue)}
                style={styles.picker}
                mode="dropdown"
              >
                <Picker.Item label="Filtrar por..." value="todas" />
                <Picker.Item label="Pendientes" value="pendientes" />
                <Picker.Item label="En desarrollo" value="enDesarrollo" />
                <Picker.Item label="Finalizadas" value="finalizadas" />
              </Picker>
            </View>
          </View>

        </View>

        {tareasFiltradas.length === 0 ? (
          <Text>No hay tareas para mostrar</Text>
        ) : (
          <FlatList
            data={tareasFiltradas}
            keyExtractor={(item) => item.id || Math.random().toString()}
            renderItem={({ item: tarea }) => (
              <View style={styles.tareaContainer}>
                <Text style={styles.nombre}>{tarea.title || 'Sin título'}</Text>
                <Text>
                  <Text style={styles.labelBold}>Asignado a:</Text>{' '}
                  {usuarios[tarea.assignedTo || ''] || 'Sin asignar'}
                </Text>
                <Text>
                  <Text style={styles.labelBold}>Desde:</Text> {formatearFecha(tarea.startTime)}
                </Text>
                <Text>
                  <Text style={styles.labelBold}>Hasta:</Text> {formatearFecha(tarea.endTime)}
                </Text>
                <Text>
                  <Text style={styles.labelBold}>Estado:</Text> {tarea.status}
                </Text>
              </View>
            )}
          />
        )}
      </View>
      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  filtroContainer: {
    marginBottom: 20,
  },
  tareaContainer: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  nombre: {
    fontSize: 16,
    color: 'rgb(132, 106, 180)',
    fontWeight: 'bold',
  },
  labelBold: {
    fontWeight: 'bold',
  },
  header: {
    marginBottom: 10,
  },
  filaFiltro: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 4,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    overflow: 'hidden',
    width: 120,
  },
  picker: {
    height: 30,
    width: '100%',
  },
  tituloYFiltro: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 4,
  },
  
});

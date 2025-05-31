import { useState, useRef, useEffect } from 'react';
import {
  Text,
  View,
  Dimensions,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ScrollView,
  Switch,
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
  const screenWidth = Dimensions.get('window').width;

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [estadoFiltro, setEstadoFiltro] = useState('todas');
  const [verPorUsuarios, setVerPorUsuarios] = useState(false);

  useEffect(() => {
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
          }
        });
        const data = await res.json();
        setTareas(data);
      } catch (error) {
        console.error("Error al obtener tareas:", error);
      }
    };

    fetchTareas();
  }, []);

  const formatearFecha = (timestamp?: { _seconds: number }) => {
    if (!timestamp?._seconds) return 'Fecha inválida';
    const fecha = new Date(timestamp._seconds * 1000);
    return fecha.toLocaleString();
  };

  const tareasFiltradas = tareas.filter((tarea) => {
    if (estadoFiltro === 'todas') return true;
    if (estadoFiltro === 'pendientes') {
      return (
        tarea.status === 'Pendiente' ||
        tarea.status === 'En curso' ||
        tarea.status === 'pendiente'
      );
    }
    if (estadoFiltro === 'finalizadas') {
      return (
        tarea.status === 'Completada' ||
        tarea.status === 'Finalizado' ||
        tarea.status === 'completada'
      );
    }
    return true;
  });

  const tareasPorUsuario = tareasFiltradas.reduce<Record<string, Tarea[]>>((acc, tarea) => {
    const usuario = tarea.assignedTo || 'Sin asignar';
    if (!acc[usuario]) acc[usuario] = [];
    acc[usuario].push(tarea);
    return acc;
  }, {});

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar />

      <View style={globalStyles.container}>
        <View style={styles.header}>
          <Text style={globalStyles.title}>Bienvenido, Administrador</Text>
          <View style={styles.switchContainer}>
            <Switch value={verPorUsuarios} onValueChange={() => setVerPorUsuarios(!verPorUsuarios)} />
          </View>
        </View>

        {!verPorUsuarios && (
          <View style={styles.filtroContainer}>
            <Text style={globalStyles.subtitle}>Lista de tareas</Text>
            <Text style={styles.label}>Filtrar por estado:</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={estadoFiltro}
                onValueChange={(itemValue) => setEstadoFiltro(itemValue)}
                style={styles.picker}
                mode="dropdown"
              >
                <Picker.Item label="Todas" value="todas" />
                <Picker.Item label="Pendientes" value="pendientes" />
                <Picker.Item label="Finalizadas" value="finalizadas" />
              </Picker>
            </View>
          </View>
        )}

        {tareasFiltradas.length === 0 ? (
          <Text>No hay tareas para mostrar</Text>
        ) : verPorUsuarios ? (
          <ScrollView>
            <Text style={globalStyles.subtitle}>Lista de usuarios</Text>
            {Object.keys(tareasPorUsuario).map((usuario) => (

              <View key={usuario} style={{ marginBottom: 20 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 6 }}>{usuario}</Text>
                {tareasPorUsuario[usuario].map((tarea) => (
                  <View key={tarea.id || Math.random().toString()} style={styles.tareaContainer}>

                    <Text style={styles.nombre}>{tarea.title || 'Sin título'}</Text>
                    <Text><Text style={styles.labelBold}>Desde:</Text> {formatearFecha(tarea.startTime)}</Text>
                    <Text><Text style={styles.labelBold}>Hasta:</Text> {formatearFecha(tarea.endTime)}</Text>
                    <Text><Text style={styles.labelBold}>Estado:</Text> {tarea.status}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        ) : (
          <FlatList
            data={tareasFiltradas}
            keyExtractor={(item) => item.id || Math.random().toString()}
            renderItem={({ item: tarea }) => (
              <View style={styles.tareaContainer}>
                <Text style={styles.nombre}>{tarea.title || 'Sin título'}</Text>
                <Text><Text style={styles.labelBold}>Asignado a:</Text> {tarea.assignedTo}</Text>
                <Text><Text style={styles.labelBold}>Desde:</Text> {formatearFecha(tarea.startTime)}</Text>
                <Text><Text style={styles.labelBold}>Hasta:</Text> {formatearFecha(tarea.endTime)}</Text>
                <Text><Text style={styles.labelBold}>Estado:</Text> {tarea.status}</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
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
    color: ' rgb(132, 106, 180)',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 12,
    marginBottom: 5,
  },
  labelBold: {
    fontWeight: 'bold',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 20,
    width: '100%',
  },

});
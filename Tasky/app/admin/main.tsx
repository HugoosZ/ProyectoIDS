import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
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

  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  //const screenWidth = Dimensions.get('window').width;

  const fetchUsuarios = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log(token);
      if (!token) {
        Alert.alert('Error', 'No se encontró el token. Inicia sesión nuevamente.');
        return;
      }

      const res = await fetch('https://proyecto-ids.vercel.app/api/admin/users', {
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

  const verDetalleTarea = (tarea: Tarea) => {
    setTareaSeleccionada(tarea);
    setModalVisible(true);
  };
  
  const cerrarModal = () => {
    setModalVisible(false);
    setTareaSeleccionada(null);
  };
  
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
                <TouchableOpacity
                  onPress={() => verDetalleTarea(tarea)}
                  style={[
                    styles.tareaCard,
                    tarea.status?.toLowerCase() === 'completada' && styles.completada,
                    tarea.status?.toLowerCase() === 'en curso' && styles.enCurso,
                    tarea.status?.toLowerCase() === 'pendiente' && styles.pendiente,
                  ]}
                >
                  <Text style={styles.tareaTitulo}>{tarea.taskName || 'Tarea general'}</Text>
              
                  <Text style={styles.detalle}>
                    <Text style={styles.label}>Inicio: </Text>
                    {formatearFecha(tarea.startTime)}
                  </Text>
              
                  <Text style={styles.detalle}>
                    <Text style={styles.label}>Fin: </Text>
                    {formatearFecha(tarea.endTime)}
                  </Text>
              
                  <Text style={styles.detalle}>
                    <Text style={styles.label}>Estado: </Text>
                    {tarea.status}
                  </Text>
              
                  <Text style={styles.detalle}>
                    <Text style={styles.label}>Relevo: </Text>
                    {tarea.requiereRelevo ? 'Sí' : 'No'}
                  </Text>
              
                  <Text style={styles.detalle}>
                    <Text style={styles.label}>Grupal: </Text>
                    {tarea.isGroupTask ? 'Sí' : 'No'}
                  </Text>
                </TouchableOpacity>
              )}              
            />
          )}
        </View>
      </View>
      <BottomBar />
  
      {tareaSeleccionada && (
      <Modal
              visible={modalVisible}
              animationType="slide"
              transparent
              onRequestClose={cerrarModal}
            >
              <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>{tareaSeleccionada.taskName}</Text>

                  <Text style={[styles.modalLabel, { marginTop: 10 }]}>Asignaciones:</Text>
                  {tareaSeleccionada.assignments?.map((a, i) => (
                    <View key={i} style={{ marginBottom: 10 }}>
                      <Text style={styles.modalItem}>
                        👤 {a.assignedToUser?.name} {a.assignedToUser?.lastName}
                      </Text>
                      <Text style={styles.modalItem}>📌 {a.individualTask}</Text>
                      <Text style={styles.modalItem}>
                        🕒 {formatearFecha(a.startTimeIndividualTask)} - {formatearFecha(a.endTimeIndividualTask)}
                      </Text>
                      <Text style={styles.modalItem}>📊 {a.status}</Text>
                    </View>
                  ))}

                  <Text
                    onPress={cerrarModal}
                    style={{ marginTop: 20, color: 'blue', textAlign: 'center' }}
                  >
                    Cerrar
                  </Text>
                </View>
              </View>
            </Modal>

      )}
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
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    width: '85%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#6a1b9a',
  },
  modalLabel: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#444',
  },
  modalItem: {
    fontSize: 14,
    color: '#333',
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
  },
  
  
  
});

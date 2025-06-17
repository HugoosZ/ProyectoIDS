import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import globalStyles from '../globalStyles';
import TopBar from '../../components/TopBar';
import { useRouter } from 'expo-router';

const AsignarTarea = () => {
  const router = useRouter();
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  
  
  const [isGroupTask, setIsGroupTask] = useState(false);
  const [requiereRelevo, setRequiereRelevo] = useState(false);
  const [priority, setPriority] = useState('normal');
  const [status, setStatus] = useState('pendiente');
  
  
  const [assignedTo, setAssignedTo] = useState('');
  
  
  const [participantAssignments, setParticipantAssignments] = useState<any[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState({
    userId: '',
    individualTask: '',
    startTimeIndividualTask: '',
    endTimeIndividualTask: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      try {
        
        const resTasks = await fetch('https://proyecto-ids.vercel.app/api/tasks', {
          headers: { Authorization: `Bearer ${token}` },
        });

        
        const resUsers = await fetch('https://proyecto-ids.vercel.app/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resTasks.ok || !resUsers.ok) {
          throw new Error('Error al obtener datos');
        }

        const tasksData = await resTasks.json();
        const usersData = await resUsers.json();

        setTasks(tasksData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos necesarios');
      }
    };

    fetchData();
  }, []);

  const handleAddParticipant = () => {
    if (!currentParticipant.userId || !currentParticipant.individualTask) {
      Alert.alert('Error', 'Debes seleccionar un usuario y especificar la tarea individual');
      return;
    }

    setParticipantAssignments([...participantAssignments, currentParticipant]);
    setCurrentParticipant({
      userId: '',
      individualTask: '',
      startTimeIndividualTask: selectedTask?.startTime || '',
      endTimeIndividualTask: selectedTask?.endTime || '',
    });
  };

  const handleRemoveParticipant = (index: number) => {
    const updatedParticipants = [...participantAssignments];
    updatedParticipants.splice(index, 1);
    setParticipantAssignments(updatedParticipants);
  };

  const handleAssignTask = async () => {
    if (!selectedTask) {
      Alert.alert('Error', 'Debes seleccionar una tarea');
      return;
    }

    if (isGroupTask || requiereRelevo) {
      if (participantAssignments.length < 2) {
        Alert.alert('Error', 'Debes agregar al menos 2 participantes para tareas grupales o con relevo');
        return;
      }
    } else {
      if (!assignedTo) {
        Alert.alert('Error', 'Debes seleccionar un usuario para asignar la tarea');
        return;
      }
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'No se encontró el token. Inicia sesión nuevamente.');
        return;
      }

      const requestBody: any = {
        isGroupTask,
        taskId: selectedTask.id,
        priority,
        status,
        requiereRelevo,
        startTime: selectedTask.startTime,
        endTime: selectedTask.endTime,
      };

      if (isGroupTask || requiereRelevo) {
        requestBody.participantAssignments = participantAssignments;
      } else {
        requestBody.assignedTo = assignedTo;
      }

      const response = await fetch('https://proyecto-ids.vercel.app/api/assignTask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Éxito', 'Tarea asignada correctamente');
        
        setSelectedTask(null);
        setIsGroupTask(false);
        setRequiereRelevo(false);
        setAssignedTo('');
        setParticipantAssignments([]);
      } else {
        console.error('Error en la respuesta del servidor:', data);
        Alert.alert('Error', data.message || 'No se pudo asignar la tarea');
      }
    } catch (error) {
      console.error('Error al asignar tarea:', error);
      Alert.alert('Error', 'Ocurrió un error al asignar la tarea');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.goBackContainer}>
          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => router.push('/admin/main')}
          >
            <Text style={styles.buttonText}>Volver</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Asignar Tarea</Text>
        </View>


        <Text style={styles.label}>Seleccionar Tarea:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedTask?.id || ''}
            onValueChange={(itemValue) => {
              const task = tasks.find(t => t.id === itemValue);
              setSelectedTask(task || null);
            }}
          >
            <Picker.Item label="Seleccione una tarea..." value="" />
            {tasks.map((task) => (
              <Picker.Item key={task.id} label={task.title} value={task.id} />
            ))}
          </Picker>
        </View>

        {selectedTask && (
          <>
          
            <View style={styles.taskDetails}>
              <Text style={styles.detailText}>Título: {selectedTask.title}</Text>
              <Text style={styles.detailText}>Descripción: {selectedTask.description}</Text>
              <Text style={styles.detailText}>Inicio: {new Date(selectedTask.startTime).toLocaleString()}</Text>
              <Text style={styles.detailText}>Fin: {new Date(selectedTask.endTime).toLocaleString()}</Text>
              <Text style={styles.detailText}>Prioridad: {selectedTask.priority}</Text>
            </View>


            <Text style={styles.label}>Tipo de Asignación:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={isGroupTask ? 'grupo' : requiereRelevo ? 'relevo' : 'individual'}
                onValueChange={(value) => {
                  setIsGroupTask(value === 'grupo');
                  setRequiereRelevo(value === 'relevo');
                  setParticipantAssignments([]);
                }}
              >
                <Picker.Item label="Individual" value="individual" />
                <Picker.Item label="Con Relevo" value="relevo" />
                <Picker.Item label="Grupal" value="grupo" />
              </Picker>
            </View>


            <Text style={styles.label}>Prioridad:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={priority}
                onValueChange={setPriority}
              >
                <Picker.Item label="Alta" value="alta" />
                <Picker.Item label="Normal" value="normal" />
                <Picker.Item label="Baja" value="baja" />
              </Picker>
            </View>

            <Text style={styles.label}>Estado:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={status}
                onValueChange={setStatus}
              >
                <Picker.Item label="Pendiente" value="pendiente" />
                <Picker.Item label="En progreso" value="en progreso" />
                <Picker.Item label="Completada" value="completada" />
              </Picker>
            </View>


            {!isGroupTask && !requiereRelevo && (
              <>
                <Text style={styles.label}>Asignar a:</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={assignedTo}
                    onValueChange={setAssignedTo}
                  >
                    <Picker.Item label="Seleccione un usuario..." value="" />
                    {users.map((user) => (
                      <Picker.Item key={user.id} label={`${user.name} ${user.lastName}`} value={user.id} />
                    ))}
                  </Picker>
                </View>
              </>
            )}

            {(isGroupTask || requiereRelevo) && (
              <>
                <Text style={styles.label}>Participantes:</Text>
                
                
                {participantAssignments.map((participant, index) => (
                  <View key={index} style={styles.participantItem}>
                    <Text style={styles.participantText}>
                      {users.find(u => u.id === participant.userId)?.name}: {participant.individualTask}
                    </Text>
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => handleRemoveParticipant(index)}
                    >
                      <Text style={styles.removeButtonText}>X</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <Text style={styles.subLabel}>Agregar Participante:</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={currentParticipant.userId}
                    onValueChange={(value) => setCurrentParticipant({...currentParticipant, userId: value})}
                  >
                    <Picker.Item label="Seleccione un usuario..." value="" />
                    {users.map((user) => (
                      <Picker.Item key={user.id} label={`${user.name} ${user.lastName}`} value={user.id} />
                    ))}
                  </Picker>
                </View>

                <TextInput
                  placeholder="Tarea individual"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={currentParticipant.individualTask}
                  onChangeText={(text) => setCurrentParticipant({...currentParticipant, individualTask: text})}
                />

                <TextInput
                  placeholder="Hora de inicio (ISO)"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={currentParticipant.startTimeIndividualTask}
                  onChangeText={(text) => setCurrentParticipant({...currentParticipant, startTimeIndividualTask: text})}
                />

                <TextInput
                  placeholder="Hora de fin (ISO)"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={currentParticipant.endTimeIndividualTask}
                  onChangeText={(text) => setCurrentParticipant({...currentParticipant, endTimeIndividualTask: text})}
                />

                <TouchableOpacity 
                  style={globalStyles.button} 
                  onPress={handleAddParticipant}
                >
                  <Text style={styles.buttonText}>Agregar Participante</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity 
              style={[globalStyles.button, { marginTop: 20 }]} 
              onPress={handleAssignTask}
            >
              <Text style={styles.buttonText}>Asignar Tarea</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f2f2f2',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  goBackContainer: {
    alignItems: 'flex-start',
    marginBottom: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    marginTop: 0,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(137, 113, 187, 1)',
    color: '#999',
  },
  label: {
    marginTop: 10,
    marginBottom: 4,
    fontWeight: '600',
  },
  subLabel: {
    marginTop: 5,
    marginBottom: 4,
    fontWeight: '500',
    fontSize: 14,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(137, 113, 187, 1)',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  goBackButton: {
    backgroundColor: 'rgba(137, 113, 187, 1)',
    padding: 4,
    borderRadius: 5,
    alignItems: 'center',
    marginRight: 10,
  },
  taskDetails: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(137, 113, 187, 0.5)',
  },
  detailText: {
    marginBottom: 5,
    color: '#555',
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  participantText: {
    flex: 1,
    color: '#555',
  },
  removeButton: {
    backgroundColor: '#ff4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AsignarTarea;
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
  const [users, setUsers] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [isGroupTask, setIsGroupTask] = useState(false);
  const [requiereRelevo, setRequiereRelevo] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  const [participantAssignments, setParticipantAssignments] = useState<any[]>([]);
  const [priority, setPriority] = useState('normal');
  const [status, setStatus] = useState('pendiente');

  useEffect(() => {
    const fetchData = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      try {
        // Obtener tareas
        const resTasks = await fetch('https://proyecto-ids.vercel.app/api/tasks', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resTasks.ok) throw new Error('Error al obtener tareas');
        const dataTasks = await resTasks.json();
        setTasks(dataTasks);

        // Obtener usuarios
        const resUsers = await fetch('https://proyecto-ids.vercel.app/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resUsers.ok) throw new Error('Error al obtener usuarios');
        const dataUsers = await resUsers.json();
        setUsers(dataUsers);

      } catch (error) {
        console.error('Error al obtener datos:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos necesarios.');
      }
    };

    fetchData();
  }, []);

  const handleAddParticipant = () => {
    setParticipantAssignments([
      ...participantAssignments,
      {
        userId: '',
        individualTask: '',
        startTimeIndividualTask: '',
        endTimeIndividualTask: ''
      }
    ]);
  };

  const handleParticipantChange = (index: number, field: string, value: string) => {
    const updatedParticipants = [...participantAssignments];
    updatedParticipants[index] = {
      ...updatedParticipants[index],
      [field]: value
    };
    setParticipantAssignments(updatedParticipants);
  };

  const handleRemoveParticipant = (index: number) => {
    const updatedParticipants = [...participantAssignments];
    updatedParticipants.splice(index, 1);
    setParticipantAssignments(updatedParticipants);
  };

  const handleAssignTask = async () => {
    if (!selectedTask) {
      Alert.alert('Error', 'Por favor selecciona una tarea');
      return;
    }

    if (isGroupTask && participantAssignments.length < 2) {
      Alert.alert('Error', 'Debes agregar al menos 2 participantes para una tarea grupal');
      return;
    }

    if (requiereRelevo && participantAssignments.length !== 2) {
      Alert.alert('Error', 'Debes agregar exactamente 2 participantes para un relevo');
      return;
    }

    if (!isGroupTask && !requiereRelevo && !assignedTo) {
      Alert.alert('Error', 'Debes seleccionar un usuario para asignar la tarea');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'No se encontró el token. Inicia sesión nuevamente.');
        return;
      }

      const selectedTaskData = tasks.find(task => task.id === selectedTask);
      if (!selectedTaskData) {
        Alert.alert('Error', 'No se encontró la tarea seleccionada');
        return;
      }

      const requestBody: any = {
        isGroupTask,
        taskId: selectedTask,
        priority,
        status,
        requiereRelevo,
        startTime: selectedTaskData.startTime,
        endTime: selectedTaskData.endTime
      };

      if (isGroupTask || (requiereRelevo && !isGroupTask)) {
        requestBody.participantAssignments = participantAssignments.map(participant => ({
          userId: participant.userId,
          individualTask: participant.individualTask,
          startTimeIndividualTask: participant.startTimeIndividualTask || selectedTaskData.startTime,
          endTimeIndividualTask: participant.endTimeIndividualTask || selectedTaskData.endTime
        }));
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
        // Reset form
        setSelectedTask('');
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

        <Text style={styles.label}>Selecciona la tarea:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedTask}
            onValueChange={(value) => setSelectedTask(value)}
          >
            <Picker.Item label="Seleccione una tarea..." value="" />
            {tasks.map((task) => (
              <Picker.Item key={task.id} label={task.title} value={task.id} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>¿Es una tarea grupal?</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={isGroupTask ? 'sí' : 'no'}
            onValueChange={(value) => setIsGroupTask(value === 'sí')}
          >
            <Picker.Item label="No" value="no" />
            <Picker.Item label="Sí" value="sí" />
          </Picker>
        </View>

        {!isGroupTask && (
          <>
            <Text style={styles.label}>¿Requiere relevo?</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={requiereRelevo ? 'sí' : 'no'}
                onValueChange={(value) => setRequiereRelevo(value === 'sí')}
              >
                <Picker.Item label="No" value="no" />
                <Picker.Item label="Sí" value="sí" />
              </Picker>
            </View>
          </>
        )}

        {(!isGroupTask && !requiereRelevo) && (
          <>
            <Text style={styles.label}>Asignar a:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={assignedTo}
                onValueChange={(value) => setAssignedTo(value)}
              >
                <Picker.Item label="Seleccione un usuario..." value="" />
                {users.map((user) => (
                  <Picker.Item key={user.id} label={`${user.name} ${user.lastName}`} value={user.id} />
                ))}
              </Picker>
            </View>
          </>
        )}

        {(isGroupTask || (requiereRelevo && !isGroupTask)) && (
          <>
            <Text style={styles.label}>Participantes:</Text>
            {participantAssignments.map((participant, index) => (
              <View key={index} style={styles.participantContainer}>
                <Text style={styles.participantLabel}>Participante {index + 1}</Text>
                
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={participant.userId}
                    onValueChange={(value) => handleParticipantChange(index, 'userId', value)}
                  >
                    <Picker.Item label="Seleccione usuario..." value="" />
                    {users.map((user) => (
                      <Picker.Item key={user.id} label={`${user.name} ${user.lastName}`} value={user.id} />
                    ))}
                  </Picker>
                </View>

                <TextInput
                  placeholder="Descripción individual"
                  placeholderTextColor="#999"
                  style={[styles.input, { borderColor: 'rgba(137, 113, 187, 1)', color: '#999' }]}
                  value={participant.individualTask}
                  onChangeText={(text) => handleParticipantChange(index, 'individualTask', text)}
                />

                <TextInput
                  placeholder="Hora inicio (opcional)"
                  placeholderTextColor="#999"
                  style={[styles.input, { borderColor: 'rgba(137, 113, 187, 1)', color: '#999' }]}
                  value={participant.startTimeIndividualTask}
                  onChangeText={(text) => handleParticipantChange(index, 'startTimeIndividualTask', text)}
                />

                <TextInput
                  placeholder="Hora fin (opcional)"
                  placeholderTextColor="#999"
                  style={[styles.input, { borderColor: 'rgba(137, 113, 187, 1)', color: '#999' }]}
                  value={participant.endTimeIndividualTask}
                  onChangeText={(text) => handleParticipantChange(index, 'endTimeIndividualTask', text)}
                />

                <TouchableOpacity 
                  style={styles.removeButton} 
                  onPress={() => handleRemoveParticipant(index)}
                >
                  <Text style={styles.removeButtonText}>Eliminar participante</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity 
              style={globalStyles.button} 
              onPress={handleAddParticipant}
            >
              <Text style={styles.buttonText}>Agregar participante</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.label}>Prioridad:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={priority}
            onValueChange={(value) => setPriority(value)}
          >
            <Picker.Item label="Normal" value="normal" />
            <Picker.Item label="Alta" value="alta" />
            <Picker.Item label="Baja" value="baja" />
          </Picker>
        </View>

        <Text style={styles.label}>Estado inicial:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={status}
            onValueChange={(value) => setStatus(value)}
          >
            <Picker.Item label="Pendiente" value="pendiente" />
            <Picker.Item label="En progreso" value="en progreso" />
            <Picker.Item label="Completada" value="completada" />
          </Picker>
        </View>

        <TouchableOpacity style={globalStyles.button} onPress={handleAssignTask}>
          <Text style={styles.buttonText}>Asignar Tarea</Text>
        </TouchableOpacity>
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
  },
  goBackButton: {
    backgroundColor: 'rgba(137, 113, 187, 1)',
    padding: 4,
    borderRadius: 5,
    alignItems: 'center',
    marginRight: 10,
  },
  participantContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  participantLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  removeButton: {
    backgroundColor: '#ff4444',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AsignarTarea;
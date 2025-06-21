import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  Picker
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import globalStyles from '../globalStyles';
import TopBar from '../../components/TopBar';
import { useRouter } from 'expo-router';

//Por mientras esta con formato ISO para probar del navegador del pc
//wueee

const AsignarTarea = () => {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isGroupTask, setIsGroupTask] = useState(false);
  const [requiereRelevo, setRequiereRelevo] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [individualTasks, setIndividualTasks] = useState({}); 

  const fetchUsersAndTasks = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) return Alert.alert('Error', 'Token no disponible');

    try {
      const [usersRes, tasksRes] = await Promise.all([
        fetch('https://proyecto-ids.vercel.app/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('https://proyecto-ids.vercel.app/api/tasks', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const usersData = await usersRes.json();
      const tasksData = await tasksRes.json();
      setUsers(usersData);
      setTasks(tasksData);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    }
  };

  useEffect(() => {
    fetchUsersAndTasks();
  }, []);

  const handleAssign = async () => {
    if (!selectedTaskId || !startTime || !endTime) {
      return Alert.alert('Error', 'Completa todos los campos principales.');
    }

    const token = await AsyncStorage.getItem('userToken');
    if (!token) return Alert.alert('Error', 'Token no disponible');

    let body: any = {
      isGroupTask,
      taskId: selectedTaskId,
      startTime,
      endTime,
      priority: 'normal',
      status: 'pendiente',
      requiereRelevo,
    };

    if (isGroupTask || requiereRelevo) {
      const participantAssignments = selectedUserIds.map((uid) => {
        const indTask = individualTasks[uid];
        if (!indTask || !indTask.task || !indTask.start || !indTask.end) {
          throw new Error(`Faltan datos para usuario ${uid}`);
        }
        return {
          userId: uid,
          individualTask: indTask.task,
          startTimeIndividualTask: indTask.start,
          endTimeIndividualTask: indTask.end,
        };
      });
      body.participantAssignments = participantAssignments;
    } else {
      if (!selectedUserIds[0]) return Alert.alert('Error', 'Selecciona un usuario');
      body.assignedTo = selectedUserIds[0];
    }

    try {
      const response = await fetch('https://proyecto-ids.vercel.app/api/assignTask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Éxito', 'Tarea asignada correctamente');
        router.push('/admin/main');
      } else {
        console.error(data);
        Alert.alert('Error', data.message || 'Error al asignar la tarea');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Error de red o del servidor');
    }
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.container}>

        <Text style={styles.title}>Asignar Tarea</Text>

        <Text style={styles.label}>Seleccionar Tarea:</Text>
        <Picker
          selectedValue={selectedTaskId}
          onValueChange={setSelectedTaskId}
          style={styles.input}
        >
          <Picker.Item label="Seleccione una tarea" value="" />
          {tasks.map((task: any) => (
            <Picker.Item key={task.id} label={task.title} value={task.id} />
          ))}
        </Picker>

        <Text style={styles.label}>¿Es Tarea Grupal?</Text>
        <Picker
          selectedValue={isGroupTask ? 'sí' : 'no'}
          onValueChange={(val) => setIsGroupTask(val === 'sí')}
          style={styles.input}
        >
          <Picker.Item label="No" value="no" />
          <Picker.Item label="Sí" value="sí" />
        </Picker>

        <Text style={styles.label}>¿Requiere Relevo?</Text>
        <Picker
          selectedValue={requiereRelevo ? 'sí' : 'no'}
          onValueChange={(val) => setRequiereRelevo(val === 'sí')}
          style={styles.input}
        >
          <Picker.Item label="No" value="no" />
          <Picker.Item label="Sí" value="sí" />
        </Picker>

        <Text style={styles.label}>Inicio Tarea General (ISO):</Text>
        <TextInput
          value={startTime}
          onChangeText={setStartTime}
          placeholder="2025-06-14T13:00:00.000Z"
          style={styles.input}
        />

        <Text style={styles.label}>Fin Tarea General (ISO):</Text>
        <TextInput
          value={endTime}
          onChangeText={setEndTime}
          placeholder="2025-06-14T15:00:00.000Z"
          style={styles.input}
        />

        <Text style={styles.label}>Seleccionar Usuarios:</Text>
        {users.map((user: any) => (
          <TouchableOpacity
            key={user.rut}
            onPress={() => handleUserSelection(user.rut)}
            style={{
              padding: 8,
              backgroundColor: selectedUserIds.includes(user.rut) ? '#a7c' : '#ddd',
              borderRadius: 5,
              marginBottom: 6,
            }}
          >
            <Text>{`${user.name} ${user.lastName} (${user.rut})`}</Text>
          </TouchableOpacity>
        ))}

        {(isGroupTask || requiereRelevo) && selectedUserIds.map((uid) => (
          <View key={uid} style={{ marginTop: 10 }}>
            <Text style={styles.label}>Tarea individual para {uid}</Text>
            <TextInput
              placeholder="Descripción"
              value={individualTasks[uid]?.task || ''}
              onChangeText={(text) =>
                setIndividualTasks((prev) => ({
                  ...prev,
                  [uid]: { ...prev[uid], task: text },
                }))
              }
              style={styles.input}
            />
            <TextInput
              placeholder="Inicio (ISO)"
              value={individualTasks[uid]?.start || ''}
              onChangeText={(text) =>
                setIndividualTasks((prev) => ({
                  ...prev,
                  [uid]: { ...prev[uid], start: text },
                }))
              }
              style={styles.input}
            />
            <TextInput
              placeholder="Fin (ISO)"
              value={individualTasks[uid]?.end || ''}
              onChangeText={(text) =>
                setIndividualTasks((prev) => ({
                  ...prev,
                  [uid]: { ...prev[uid], end: text },
                }))
              }
              style={styles.input}
            />
          </View>
        ))}

        <TouchableOpacity style={globalStyles.button} onPress={handleAssign}>
          <Text style={styles.buttonText}>Asignar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f2f2f2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#aaa',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AsignarTarea;

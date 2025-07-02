import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  StyleSheet,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import TopBar from '../../components/TopBar';
import { useRouter } from 'expo-router';

const AsignarTarea = () => {
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);

  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [assignmentType, setAssignmentType] = useState<'individual' | 'relevo' | 'grupal'>('individual');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [priority, setPriority] = useState('normal');
  const [status, setStatus] = useState('pendiente');

  const [participants, setParticipants] = useState([
    { userId: '', individualTask: '', startTimeIndividualTask: '', endTimeIndividualTask: '' },
  ]);

  const [assignedTo, setAssignedTo] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const [userRes, taskRes] = await Promise.all([
          fetch('https://proyecto-ids.vercel.app/api/admin/users', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('https://proyecto-ids.vercel.app/api/tasks', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const [userData, taskData] = await Promise.all([userRes.json(), taskRes.json()]);
        setUsers(userData);
        setTasks(taskData);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'No se pudieron cargar usuarios o tareas');
      }
    };

    fetchData();
  }, []);

  const handleAssign = async () => {
    const isGroupTask = assignmentType === 'grupal';
    const requiereRelevo = assignmentType === 'relevo';
    const token = await AsyncStorage.getItem('userToken');

    if (!selectedTaskId || !startTime || !endTime) {
      return Alert.alert('Error', 'Faltan campos obligatorios');
    }

    let payload: any = {
      isGroupTask,
      requiereRelevo,
      taskId: selectedTaskId,
      startTime,
      endTime,
      priority,
      status,
    };

    if (isGroupTask || requiereRelevo) {
      payload.participantAssignments = participants;
    } else {
      if (!assignedTo) return Alert.alert('Error', 'Selecciona un usuario');
      payload.assignedTo = assignedTo;
    }

    try {
      const res = await fetch('https://proyecto-ids.vercel.app/api/assignTask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 201) {
        Alert.alert('Éxito', 'Tarea asignada correctamente');
        router.push('/admin/main');
      } else {
        Alert.alert('Error', data.message || 'No se pudo asignar la tarea');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Error al hacer la asignación');
    }
  };

  const handleParticipantChange = (index: number, field: string, value: string) => {
    const updated = [...participants];
    updated[index][field] = value;
    setParticipants(updated);
  };

  const addParticipant = () => {
    setParticipants([...participants, {
      userId: '',
      individualTask: '',
      startTimeIndividualTask: '',
      endTimeIndividualTask: ''
    }]);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar />
      <ScrollView style={styles.container}>
        <TouchableOpacity onPress={() => router.push('/admin/main')} style={styles.goBackButton}>
          <Text style={styles.buttonText}>Volver</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Asignar Tarea</Text>

        <Text style={styles.label}>Seleccionar Tarea</Text>
        <View style={styles.picker}>
          <Picker
            selectedValue={selectedTaskId}
            onValueChange={(itemValue) => setSelectedTaskId(itemValue)}
          >
            <Picker.Item label="Seleccione una tarea..." value="" />
            {tasks.map((task: any) => (
              <Picker.Item key={task.id} label={task.title} value={task.id} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Tipo de Asignación</Text>
        <View style={styles.row}>
          {['individual', 'relevo', 'grupal'].map(type => (
            <TouchableOpacity
              key={type}
              onPress={() => setAssignmentType(type as any)}
              style={[
                styles.typeButton,
                assignmentType === type && styles.typeButtonSelected,
              ]}
            >
              <Text style={styles.buttonText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Inicio (ISO)</Text>
        <TextInput value={startTime} onChangeText={setStartTime} style={styles.input} />

        <Text style={styles.label}>Término (ISO)</Text>
        <TextInput value={endTime} onChangeText={setEndTime} style={styles.input} />

        {assignmentType === 'individual' && (
          <>
            <Text style={styles.label}>Seleccionar Usuario</Text>
            <View style={styles.picker}>
              <Picker
                selectedValue={assignedTo}
                onValueChange={(value) => setAssignedTo(value)}
              >
                <Picker.Item label="Seleccione un usuario..." value="" />
                {users.map((user: any) => (
                  <Picker.Item
                    key={user.uid}
                    label={`${user.name} ${user.lastName}`}
                    value={user.uid}
                  />
                ))}
              </Picker>
            </View>
          </>
        )}

        {(assignmentType === 'relevo' || assignmentType === 'grupal') && (
          <>
            <Text style={styles.label}>Participantes</Text>
            {participants.map((p, i) => (
              <View key={i} style={styles.participantBox}>
                <Text style={styles.label}>Usuario</Text>
                <View style={styles.picker}>
                  <Picker
                    selectedValue={p.userId}
                    onValueChange={(value) => handleParticipantChange(i, 'userId', value)}
                  >
                    <Picker.Item label="Seleccione un usuario..." value="" />
                    {users.map((user: any) => (
                      <Picker.Item
                        key={user.uid}
                        label={`${user.name} ${user.lastName}`}
                        value={user.uid}
                      />
                    ))}
                  </Picker>
                </View>

                <TextInput
                  placeholder="Tarea individual"
                  value={p.individualTask}
                  onChangeText={(text) => handleParticipantChange(i, 'individualTask', text)}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Inicio (ISO)"
                  value={p.startTimeIndividualTask}
                  onChangeText={(text) => handleParticipantChange(i, 'startTimeIndividualTask', text)}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Término (ISO)"
                  value={p.endTimeIndividualTask}
                  onChangeText={(text) => handleParticipantChange(i, 'endTimeIndividualTask', text)}
                  style={styles.input}
                />
              </View>
            ))}
            <TouchableOpacity onPress={addParticipant} style={styles.addBtn}>
              <Text style={styles.buttonText}>+ Agregar Participante</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={handleAssign} style={styles.submitBtn}>
          <Text style={styles.buttonText}>Asignar Tarea</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f2f2f2' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontWeight: 'bold', marginTop: 10 },
  input: {
    backgroundColor: '#fff',
    borderColor: '#8971BB',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  picker: {
    backgroundColor: '#fff',
    borderColor: '#8971BB',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  typeButton: {
    padding: 10,
    backgroundColor: '#bbb',
    borderRadius: 5,
  },
  typeButtonSelected: {
    backgroundColor: '#8971BB',
  },
 goBackButton: {
  backgroundColor: '#8971BB',         // morado
  height: 40,
  borderRadius: 50,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 15,
  alignSelf: 'flex-start',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 2,
  elevation: 2,
  marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: '#8971BB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addBtn: {
    backgroundColor: '#6c5ce7',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  participantBox: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
  fontSize: 15,
  fontWeight: '500',
  color: '#fff',
  textAlign: 'center',
  },
});

export default AsignarTarea;

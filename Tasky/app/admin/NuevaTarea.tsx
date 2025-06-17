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

import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Picker } from '@react-native-picker/picker';
import globalStyles from '../globalStyles';

import TopBar from '../../components/TopBar'; 
import { useRouter } from 'expo-router'; 

const NuevaTarea = () => {
  const router = useRouter(); 

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [createdBy, setCreatedBy] = useState('');

  const [isStartPickerVisible, setStartPickerVisible] = useState(false);
  const [isEndPickerVisible, setEndPickerVisible] = useState(false);

  const [requiereRelevo, setRequiereRelevo] = useState(false);
  const [trabajadorSaliente, setTrabajadorSaliente] = useState('');
  const [trabajadorEntrante, setTrabajadorEntrante] = useState('');
/*SOLO LOS PRESENTES
 useEffect(() => {
    const fetchUsers = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      try {
        const [resUsers, resAttendance] = await Promise.all([
          fetch('https://proyecto-ids.vercel.app/api/users', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('https://proyecto-ids.vercel.app/api/admin/attendance?isPresent=true&time=today', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!resUsers.ok || !resAttendance.ok) throw new Error('Error en alguna petición');

        const dataUsers = await resUsers.json();
        const attendanceDataRaw = await resAttendance.json();

        const attendanceData = Array.isArray(attendanceDataRaw)
          ? attendanceDataRaw
          : Object.values(attendanceDataRaw);

        const presentUserIds = new Set(attendanceData.map((att: any) => att.userId));
        const filteredUsers = dataUsers.filter((user: any) => presentUserIds.has(user.id));

        setUsers(filteredUsers);
      } catch (error) {
        console.error('Error al obtener usuarios presentes:', error);
        Alert.alert('Error', 'No se pudieron cargar los usuarios presentes.');
      }
    };

    fetchUsers();
  }, []);
*/

  useEffect(() => {
    const fetchUsers = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
  
      try {
        const resUsers = await fetch('https://proyecto-ids.vercel.app/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (!resUsers.ok) throw new Error('Error al obtener usuarios');
  
        const dataUsers = await resUsers.json();
        setUsers(dataUsers);
  
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
        Alert.alert('Error', 'No se pudieron cargar los usuarios.');
      }
    };
  
    fetchUsers();
  }, []);
  

  const handleConfirmStart = (date: Date) => {
    setStartTime(date.toISOString());
    setStartPickerVisible(false);
  };

  const handleConfirmEnd = (date: Date) => {
    setEndTime(date.toISOString());
    setEndPickerVisible(false);
  };

  const handleCreateTask = async () => {
    if (!title || !startTime || !endTime || !status || !priority || !description) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (requiereRelevo && (!trabajadorSaliente || !trabajadorEntrante)) {
      Alert.alert('Error', 'Debes seleccionar trabajador saliente y entrante');
      return;
    }
    if (!requiereRelevo && assignedTo.length === 0) {
      Alert.alert('Error', 'Debes seleccionar al menos un trabajador');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'No se encontró el token. Inicia sesión nuevamente.');
        return;
      }

      const commonFields = {
        title,
        description,
        startTime,
        endTime,
        priority,
        status,
        createdBy,
      };

      const body = {
        ...commonFields,
        requiereRelevo,
        assignedTo: requiereRelevo ? [trabajadorSaliente, trabajadorEntrante] : assignedTo,
        ...(requiereRelevo && {
          trabajadorSaliente,
          trabajadorEntrante,
          codigoRelevo: null,
          relevoValidado: false,
          relevoExpira: null,
          empresaId: 'ID_EMPRESA',
        }),
      };

      const response = await fetch('https://proyecto-ids.vercel.app/api/createTask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Éxito', 'Tarea creada correctamente');
        setTitle('');
        setDescription('');
        setStartTime('');
        setEndTime('');
        setPriority('');
        setStatus('');
        setAssignedTo([]);
        setRequiereRelevo(false);
        setTrabajadorSaliente('');
        setTrabajadorEntrante('');
      } else {
        console.error('Error en la respuesta del servidor:', data);
        Alert.alert('Error', data.message || 'No se pudo crear la tarea');
      }
    } catch (error) {
      console.error('Error al crear tarea:', error);
      Alert.alert('Error', 'Ocurrió un error al crear la tarea');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar /> 
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.goBackContainer}>
          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => router.push('/admin/main')} // Redirige a la página principal
          >
            <Text style={styles.buttonText}>Volver</Text>
          </TouchableOpacity>
        </View>


        <View style={styles.titleContainer}>
          <Text style={styles.title}>Crear Nueva Tarea</Text>
        </View>

        <TextInput
          placeholder="Título"
          placeholderTextColor="#999"
          style={[styles.input, { borderColor: 'rgba(137, 113, 187, 1)', color: '#999' }]}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          placeholder="Descripción"
          placeholderTextColor="#999"
          style={[styles.input, { borderColor: 'rgba(137, 113, 187, 1)', color: '#999' }]}
          value={description}
          onChangeText={setDescription}
        />
         {/*
         Version celu

        <TouchableOpacity style={styles.input} onPress={() => setStartPickerVisible(true)}>
          <Text style={[styles.pickerText, { color: '#999' }]}>
            {startTime ? new Date(startTime).toLocaleString() : 'Selecciona fecha y hora inicio'}
          </Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isStartPickerVisible}
          mode="datetime"
          onConfirm={handleConfirmStart}
          onCancel={() => setStartPickerVisible(false)}
        />

        <TouchableOpacity style={styles.input} onPress={() => setEndPickerVisible(true)}>
          <Text style={[styles.pickerText, { color: '#999' }]}>
            {endTime ? new Date(endTime).toLocaleString() : 'Selecciona fecha y hora fin'}
          </Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isEndPickerVisible}
          mode="datetime"
          onConfirm={handleConfirmEnd}
          onCancel={() => setEndPickerVisible(false)}
        />
*/}

<TextInput
          placeholder="Ingresa fecha y hora inicio"
          placeholderTextColor="#999"
          style={[styles.input, { borderColor: 'rgba(137, 113, 187, 1)', color: '#999' }]}
          value={startTime}
          onChangeText={setStartTime}
        />


<TextInput
          placeholder="Ingresa fecha y hora fin"
          placeholderTextColor="#999"
          style={[styles.input, { borderColor: 'rgba(137, 113, 187, 1)', color: '#999' }]}
          value={endTime}
          onChangeText={setEndTime}
        />


        <TextInput
          placeholder="Prioridad (alta, media, baja)"
          placeholderTextColor="#999"
          style={[styles.input, { borderColor: 'rgba(137, 113, 187, 1)', color: '#999' }]}
          value={priority}
          onChangeText={setPriority}
        />
        <TextInput
          placeholder="Estado (pendiente, completada, etc.)"
          placeholderTextColor="#999"
          style={[styles.input, { borderColor: 'rgba(137, 113, 187, 1)', color: '#999' }]}
          value={status}
          onChangeText={setStatus}
        />

        {!requiereRelevo && (
          <>
            <Text style={styles.label}>Selecciona trabajador:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={assignedTo[0] || ''}
                onValueChange={(value) => setAssignedTo([value])}
              >
                <Picker.Item label="Seleccione..." value="" />
                {users.map((user) => (
                  <Picker.Item key={user.id} label={`${user.name} ${user.lastName}`} value={user.id} />
                ))}
              </Picker>
            </View>
          </>
        )}

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

        {requiereRelevo && (
          <>
            <Text style={styles.label}>Trabajador saliente:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={trabajadorSaliente}
                onValueChange={setTrabajadorSaliente}
              >
                <Picker.Item label="Seleccione..." value="" />
                {users.map((user) => (
                  <Picker.Item key={user.id} label={`${user.name} ${user.lastName}`} value={user.id} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Trabajador entrante:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={trabajadorEntrante}
                onValueChange={setTrabajadorEntrante}
              >
                <Picker.Item label="Seleccione..." value="" />
                {users.map((user) => (
                  <Picker.Item key={user.id} label={`${user.name} ${user.lastName}`} value={user.id} />
                ))}
              </Picker>
            </View>
          </>
        )}

        <TouchableOpacity style={globalStyles.button} onPress={handleCreateTask}>
          <Text style={styles.buttonText}>Crear Tarea</Text>
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
  pickerText: {
    color: '#333',
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
});
export default NuevaTarea;
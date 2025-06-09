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

import TopBar from '../../components/TopBar'; // El TopBar ahora tendrá el icono para abrir el Drawer

const NuevaTarea = () => {

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

  useEffect(() => {
    const fetchUsers = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      try {
        const response = await fetch('https://proyecto-ids.vercel.app/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const getUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) setCreatedBy(storedUserId);
    };
    getUserId();
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

      const body = requiereRelevo
        ? {
            ...commonFields,
            requiereRelevo: true,
            assignedTo: [trabajadorSaliente, trabajadorEntrante],
            trabajadorSaliente,
            trabajadorEntrante,
            codigoRelevo: null,
            relevoValidado: false,
            relevoExpira: null,
            empresaId: 'ID_EMPRESA',
          }
        : {
            ...commonFields,
            requiereRelevo: false,
            assignedTo,
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
      <TopBar /> {/* TopBar con el icono para abrir el Drawer */}
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Crear Nueva Tarea</Text>

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
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    alignSelf: 'center',
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
  button: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default NuevaTarea;

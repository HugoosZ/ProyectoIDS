import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import globalStyles from '../globalStyles';

const AddUsers = () => {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rut, setRUT] = useState('');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const obtenerToken = async () => {
      const storedToken = await AsyncStorage.getItem('userToken');
      setToken(storedToken);
    };
    obtenerToken();
  }, []);

  const manejarEnvio = async () => {
    if (!nombre || !apellido || !email || !password || !rut) {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos.');
      return;
    }

    if (!token) {
      Alert.alert('Error de autenticación', 'Token no disponible. Inicia sesión nuevamente.');
      return;
    }

    try {
      const res = await fetch('https://proyecto-ids.vercel.app/api/createUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rut,
          email,
          password,
          name: nombre,
          lastName: apellido,
          role: 'user',
          isAdmin: false,
        }),
      });

      if (res.ok) {
        Alert.alert('Usuario creado', 'El trabajador fue registrado exitosamente.');
        setNombre('');
        setApellido('');
        setEmail('');
        setPassword('');
        setRUT('');
      } else {
        const error = await res.text();
        Alert.alert('Error', `No se pudo crear el usuario: ${error}`);
      }
    } catch (err) {
      console.error('Error al enviar:', err);
      Alert.alert('Error', 'Ocurrió un error al conectar con el servidor.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Agregar Nuevo Trabajador</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
      />
      <TextInput
        style={styles.input}
        placeholder="Apellido"
        value={apellido}
        onChangeText={setApellido}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="RUT"
        value={rut}
        onChangeText={setRUT}
      />

      <TouchableOpacity style={globalStyles.button} onPress={manejarEnvio}>
        <Text style={styles.buttonText}>Guardar Trabajador</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[globalStyles.button, { backgroundColor: '#999', marginTop: 16 }]}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>Volver</Text>
      </TouchableOpacity>
    </ScrollView>
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
    borderColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default AddUsers;

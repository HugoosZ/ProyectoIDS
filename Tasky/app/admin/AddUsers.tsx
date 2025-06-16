import React, { useState, useEffect } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import globalStyles from '../globalStyles';

import TopBar from '../../components/TopBar';

const AddUsers = () => {


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
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#f3f3f3', // Fondo sin el contenedor sombreado
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
          <TopBar />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ flex: 1 }}>
            
          

            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: -250}}>
              <Text style={[globalStyles.title, globalStyles.titleCentered]}>
                Agregar Nuevo Trabajador
              </Text>

              <View style={globalStyles.formContainer}>
                <TextInput
                  style={globalStyles.input}
                  placeholder="Nombre"
                  value={nombre}
                  onChangeText={setNombre}
                />
                <TextInput
                  style={globalStyles.input}
                  placeholder="Apellido"
                  value={apellido}
                  onChangeText={setApellido}
                />
                <TextInput
                  style={globalStyles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
                <TextInput
                  style={globalStyles.input}
                  placeholder="Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                <TextInput
                  style={globalStyles.input}
                  placeholder="RUT (Ej: 12345678-9)"
                  value={rut}
                  onChangeText={setRUT}
                />

                <TouchableOpacity style={globalStyles.button} onPress={manejarEnvio}>
                  <Text style={globalStyles.buttonText}>Guardar Trabajador</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddUsers;

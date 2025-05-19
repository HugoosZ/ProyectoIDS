import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import globalStyles from '../globalStyles';
import { useAuth } from '../../lib/context/AuthContext'; 

const AddUsers = () => {
  const { jwt } = useAuth(); 

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('');
  const [rut, setRUT] = useState('');

  const manejarEnvio = async () => {
    if (!nombre || !apellido || !email || !password || !rol || !rut) {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos.');
      return;
    }

    if (!jwt) {
      Alert.alert('Error de autenticación', 'Token no disponible. Inicia sesión nuevamente.');
      return;
    }

    try {
      const res = await fetch("https://proyecto-ids.vercel.app/api/createUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}` 
        },
        body: JSON.stringify({
          rut,
          email,
          password,
          name: nombre,
          lastName: apellido,
          role: rol,
          isAdmin: false 
        })
      });

      if (res.ok) {
        Alert.alert(
          'Usuario creado',
          'El trabajador fue registrado exitosamente.',
          [
            { text: 'OK', onPress: () => console.log('Popup cerrado') }
          ]
        );
        
        setNombre('');
        setApellido('');
        setEmail('');
        setPassword('');
        setRol('');
        setRUT('');
      } else {
        const error = await res.text();
        Alert.alert('Error', `No se pudo crear el usuario: ${error}`);
      }
    } catch (err) {
      console.error("Error al enviar:", err);
      Alert.alert('Error', 'Ocurrió un error al conectar con el servidor.');
    }
  };

  return (
    <ScrollView contentContainerStyle={globalStyles.container}>
      <Text style={globalStyles.title}>Agregar Nuevo Trabajador</Text>

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
          placeholder="Rol/Cargo"
          value={rol}
          onChangeText={setRol}
        />

        <TextInput
          style={globalStyles.input}
          placeholder="Rut"
          value={rut}
          onChangeText={setRUT}
        />

        <TouchableOpacity style={globalStyles.button} onPress={manejarEnvio}>
          <Text style={globalStyles.buttonText}>Guardar Trabajador</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[globalStyles.button, { backgroundColor: '#999', marginTop: 16 }]} onPress={() => router.back()}>
          <Text style={globalStyles.buttonText}>Volver</Text>
        </TouchableOpacity>
    </ScrollView>
  );
};

export default AddUsers;
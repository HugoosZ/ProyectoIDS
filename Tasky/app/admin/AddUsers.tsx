import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import globalStyles from '../globalStyles';

const AddUsers = () => {
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

    try {
      const res = await fetch("https://proyecto-ids.vercel.app/api/createUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          rut,
          name: nombre,
          lastName: apellido,
          role: rol
        })
      });

      if (res.ok) {
        Alert.alert('Éxito', 'Trabajador agregado correctamente.');
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

      <View style={globalStyles.formContainer}>
        <Text style={globalStyles.subtitle}>Nombre</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Nombre"
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={globalStyles.subtitle}>Apellido</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Apellido"
          value={apellido}
          onChangeText={setApellido}
        />

        <Text style={globalStyles.subtitle}>Correo electrónico</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Text style={globalStyles.subtitle}>Contraseña</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={globalStyles.subtitle}>Rol / Cargo</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Ej: Electricista, Supervisor"
          value={rol}
          onChangeText={setRol}
        />

        <Text style={globalStyles.subtitle}>RUT</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Ej: 12.345.678-9"
          value={rut}
          onChangeText={setRUT}
        />

        <TouchableOpacity style={globalStyles.button} onPress={manejarEnvio}>
          <Text style={globalStyles.buttonText}>Guardar Trabajador</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default AddUsers;

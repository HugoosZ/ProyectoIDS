import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import globalStyles from '../globalStyles';

const AddUsers = () => {
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('');
  const [rut, setRUT] = useState('');
  const [foto, setFoto] = useState(null);

  const seleccionarImagen = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.5 });
    if (!result.didCancel && result.assets && result.assets.length > 0) {
      setFoto(result.assets[0]);
    }
  };

  const manejarEnvio = () => {
    if (!nombre || !rol || !rut) {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos.');
      return;
    }

    // Aquí iría la lógica para enviar los datos al backend
    console.log({ nombre, rol, rut, foto });

    Alert.alert('Éxito', 'Trabajador agregado correctamente.');
    // Limpiar campos
    setNombre('');
    setRol('');
    setRUT('');
    setFoto(null);
  };

  return (
    <ScrollView contentContainerStyle={globalStyles.container}>
      <Text style={globalStyles.title}>Agregar Nuevo Trabajador</Text>

      <View style={globalStyles.formContainer}>
        <Text style={globalStyles.subtitle}>Nombre</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Nombre completo"
          value={nombre}
          onChangeText={setNombre}
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

        <Text style={globalStyles.subtitle}>Foto</Text>
        <TouchableOpacity style={globalStyles.button} onPress={seleccionarImagen}>
          <Text style={globalStyles.buttonText}>Seleccionar Imagen</Text>
        </TouchableOpacity>

        {foto && (
          <Image
            source={{ uri: foto.uri }}
            style={{ width: 100, height: 100, borderRadius: 15, marginVertical: 10 }}
          />
        )}

        <TouchableOpacity style={globalStyles.button} onPress={manejarEnvio}>
          <Text style={globalStyles.buttonText}>Guardar Trabajador</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default AddUsers;

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import globalStyles from '../globalStyles';
import { Picker } from '@react-native-picker/picker';

const NuevaTarea = () => {
  const [nombre, setNombre] = useState('');
  const [comentario, setComentario] = useState('');
  const [trabajador, setTrabajador] = useState('');
  const [desde, setDesde] = useState(new Date());
  const [hasta, setHasta] = useState(new Date());
  const [showDesde, setShowDesde] = useState(false);
  const [showHasta, setShowHasta] = useState(false);

  // Lista de trabajadores de ejemplo (deberías obtenerla desde tu backend)
  const trabajadores = [
    { id: '1', nombre: 'Carlos' },
    { id: '2', nombre: 'María' },
    { id: '3', nombre: 'Juan' },
  ];

  const guardarTarea = () => {
    // Aquí podrías hacer una petición al backend
    console.log({ nombre, desde, hasta, trabajador, comentario });
  };

  return (
    <ScrollView contentContainerStyle={globalStyles.container}>
      <Text style={globalStyles.title}>Nueva Tarea</Text>

      <View style={globalStyles.formContainer}>
        <Text style={globalStyles.subtitle}>Nombre de la tarea</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Ingresa el nombre"
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={globalStyles.subtitle}>Desde</Text>
        <TouchableOpacity onPress={() => setShowDesde(true)} style={globalStyles.input}>
          <Text>{desde.toLocaleString()}</Text>
        </TouchableOpacity>
        {showDesde && (
          <DateTimePicker
            value={desde}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowDesde(false);
              if (date) setDesde(date);
            }}
          />
        )}

        <Text style={globalStyles.subtitle}>Hasta</Text>
        <TouchableOpacity onPress={() => setShowHasta(true)} style={globalStyles.input}>
          <Text>{hasta.toLocaleString()}</Text>
        </TouchableOpacity>
        {showHasta && (
          <DateTimePicker
            value={hasta}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowHasta(false);
              if (date) setHasta(date);
            }}
          />
        )}

        <Text style={globalStyles.subtitle}>Asignar a trabajador</Text>
        <View style={[globalStyles.input, { padding: 0 }]}>
          <Picker
            selectedValue={trabajador}
            onValueChange={(itemValue) => setTrabajador(itemValue)}
            style={{ width: '100%', height: 40 }}
          >
            <Picker.Item label="Selecciona un trabajador" value="" />
            {trabajadores.map((trab) => (
              <Picker.Item key={trab.id} label={trab.nombre} value={trab.id} />
            ))}
          </Picker>
        </View>

        <Text style={globalStyles.subtitle}>Comentarios</Text>
        <TextInput
          style={[globalStyles.input, { height: 80 }]}
          multiline
          numberOfLines={4}
          placeholder="Escribe comentarios..."
          value={comentario}
          onChangeText={setComentario}
        />

        <TouchableOpacity style={globalStyles.button} onPress={guardarTarea}>
          <Text style={globalStyles.buttonText}>Guardar Tarea</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default NuevaTarea;

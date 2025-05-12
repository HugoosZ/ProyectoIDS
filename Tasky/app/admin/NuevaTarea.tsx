import { Picker } from '@react-native-picker/picker'; // asegurate de tenerlo instalado
import React, { useEffect, useState } from 'react';
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

const NuevaTarea = () => {
  const [trabajadores, setTrabajadores] = useState([]);
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState("");

  const [nombre, setNombre] = useState('');
  const [comentario, setComentario] = useState('');
  const [desde, setDesde] = useState(new Date());
  const [hasta, setHasta] = useState(new Date());
  const [showDesde, setShowDesde] = useState(false);
  const [showHasta, setShowHasta] = useState(false);

  // Lista de trabajadores de ejemplo (deberías obtenerla desde tu backend)
  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        const res = await fetch("https://proyecto-ids.vercel.app/api/users");
        const data = await res.json();
        setTrabajadores(data);
      } catch (err) {
        console.error("Error al obtener usuarios:", err);
      }
    };

    obtenerUsuarios();
  }, []);
  
  const guardarTarea = () => {
    // Aquí podrías hacer una petición al backend
    console.log({ nombre, desde, hasta, trabajadorSeleccionado, comentario });
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

        
                <View>
          <Text>Asignar a:</Text>
          <Picker
            selectedValue={trabajadorSeleccionado}
            onValueChange={(itemValue) => setTrabajadorSeleccionado(itemValue)}
            style={{ height: 50, width: '100%' }}
          >
            <Picker.Item label="Selecciona un trabajador" value="" />
            {trabajadores.map((usuario) => (
              <Picker.Item
                key={usuario.id}
                label={`${usuario.name} ${usuario.lastName}`}
                value={usuario.id}
              />
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

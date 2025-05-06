import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import globalStyles from '../globalStyles';

export default function WorkerMain() {
  return (
    <ScrollView contentContainerStyle={globalStyles.container}>
      <Text style={globalStyles.title}>Mis Tareas</Text>

      <View style={globalStyles.formContainer}>
        <TouchableOpacity style={styles.button}>
          <Text style={globalStyles.buttonText}>Ver Tareas Asignadas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={globalStyles.buttonText}>Actualizar Estado de Tarea</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  button: {
    ...globalStyles.button,
    marginVertical: 10,
  },
});

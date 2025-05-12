import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import globalStyles from '../globalStyles';

export default function WorkerMain() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={globalStyles.container}>
      <Text style={globalStyles.title}>Mis Tareas</Text>

      <View style={globalStyles.formContainer}>
      <TouchableOpacity
           style={styles.button}
             onPress={() => router.push('/trabajador/ver-tareas')}
>
        <Text style={globalStyles.buttonText}>Ver Tareas Asignadas</Text>
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

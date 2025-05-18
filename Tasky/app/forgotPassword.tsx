import { useState } from 'react'; 
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import globalStyles from './globalStyles';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPassword() {
  const [rut, setRut] = useState('');
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [showPasswordActual, setShowPasswordActual] = useState(false);
  const [showNuevaPassword, setShowNuevaPassword] = useState(false);
  const [showConfirmarPassword, setShowConfirmarPassword] = useState(false);
  const router = useRouter();

  const handleChangePassword = async () => {
    if (!rut.trim() || !passwordActual.trim() || !nuevaPassword.trim() || !confirmarPassword.trim()) {
      Alert.alert('Error', 'Todos los campos son requeridos');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      Alert.alert('Error', 'Las nuevas contraseñas no coinciden');
      return;
    }

    if (nuevaPassword.length < 6) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const response = await fetch('https://proyecto-ids.vercel.app/api/auth/cambiar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut, passwordActual, nuevaPassword, confirmarPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al cambiar la contraseña');
      }

      Alert.alert('Éxito', 'Tu contraseña ha sido actualizada correctamente', [
        { text: 'OK', onPress: () => router.push('/') },
      ]);
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      Alert.alert('Error', error.message || 'Ocurrió un error. Intenta más tarde.');
    }
  };

  const renderPasswordInput = (
    value: string,
    onChange: (text: string) => void,
    placeholder: string,
    show: boolean,
    toggle: () => void
  ) => (
    <View style={{ ...globalStyles.input, flexDirection: 'row', alignItems: 'center' }}>
      <TextInput
        style={{ flex: 1 }}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChange}
        secureTextEntry={!show}
        autoCapitalize="none"
      />
      <TouchableOpacity onPress={toggle}>
        <Ionicons
          name={show ? 'eye-off-outline' : 'eye-outline'}
          size={24}
          color="#666"
          style={{ paddingHorizontal: 8 }}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#e9e9e9' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[globalStyles.title, { textAlign: 'center' }]}>Cambiar Contraseña</Text>


          <View style={globalStyles.formContainer}>
            <Text style={globalStyles.subtitle}>
              Ingresa tu información para cambiar tu contraseña
            </Text>

            <TextInput
              style={globalStyles.input}
              placeholder="RUT (Ej: 12345678-9)"
              placeholderTextColor="#999"
              value={rut}
              onChangeText={setRut}
              autoCapitalize="none"
            />

            {renderPasswordInput(
              passwordActual,
              setPasswordActual,
              'Contraseña actual',
              showPasswordActual,
              () => setShowPasswordActual(!showPasswordActual)
            )}

            {renderPasswordInput(
              nuevaPassword,
              setNuevaPassword,
              'Nueva contraseña',
              showNuevaPassword,
              () => setShowNuevaPassword(!showNuevaPassword)
            )}

            {renderPasswordInput(
              confirmarPassword,
              setConfirmarPassword,
              'Confirmar nueva contraseña',
              showConfirmarPassword,
              () => setShowConfirmarPassword(!showConfirmarPassword)
            )}

            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <TouchableOpacity style={globalStyles.button} onPress={handleChangePassword}>
                <Text style={globalStyles.buttonText}>Cambiar contraseña</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => router.push('/')}>
              <Text style={globalStyles.registerLink}>Volver al inicio</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
});

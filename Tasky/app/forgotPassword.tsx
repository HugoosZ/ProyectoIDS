import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import globalStyles from './globalStyles';

export default function ForgotPassword() {
  const [rut, setRut] = useState('');
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const router = useRouter();

  const handleChangePassword = async () => {
    // Validaciones en el cliente
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rut,
          passwordActual,
          nuevaPassword,
          confirmarPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al cambiar la contraseña');
      }

      Alert.alert(
        'Éxito',
        'Tu contraseña ha sido actualizada correctamente',
        [
          {
            text: 'OK',
            onPress: () => router.push('/'),
          },
        ]
      );
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      Alert.alert('Error', error.message || 'Ocurrió un error al procesar tu solicitud. Por favor, intenta más tarde.');
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Cambiar Contraseña</Text>

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

        <TextInput
          style={globalStyles.input}
          placeholder="Contraseña actual"
          placeholderTextColor="#999"
          value={passwordActual}
          onChangeText={setPasswordActual}
          secureTextEntry={!showPasswords}
          autoCapitalize="none"
        />

        <TextInput
          style={globalStyles.input}
          placeholder="Nueva contraseña"
          placeholderTextColor="#999"
          value={nuevaPassword}
          onChangeText={setNuevaPassword}
          secureTextEntry={!showPasswords}
          autoCapitalize="none"
        />

        <TextInput
          style={globalStyles.input}
          placeholder="Confirmar nueva contraseña"
          placeholderTextColor="#999"
          value={confirmarPassword}
          onChangeText={setConfirmarPassword}
          secureTextEntry={!showPasswords}
          autoCapitalize="none"
        />

        <TouchableOpacity 
          style={globalStyles.button} 
          onPress={() => setShowPasswords(!showPasswords)}
        >
          <Text style={globalStyles.buttonText}>
            {showPasswords ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={globalStyles.button} onPress={handleChangePassword}>
          <Text style={globalStyles.buttonText}>Cambiar contraseña</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/')}>
          <Text style={globalStyles.registerLink}>
            Volver al inicio
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

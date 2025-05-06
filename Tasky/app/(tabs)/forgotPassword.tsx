import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import globalStyles from '../globalStyles'; // Usa los estilos globales que ya tienes

export default function ForgotPassword() {
  const [email, setEmail] = useState('');

  const handleResetPassword = () => {
    if (email.trim() === '') {
      alert('Por favor ingrese un correo electrónico.');
      return;
    }
    alert('Correo de recuperación enviado!');
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Recuperar Contraseña</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
      />
      <TouchableOpacity style={globalStyles.button} onPress={handleResetPassword}>
        <Text style={globalStyles.buttonText}>Recuperar contraseña</Text>
      </TouchableOpacity>
    </View>
  );
}

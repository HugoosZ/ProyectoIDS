import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import globalStyles from './globalStyles';

import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const db = getFirestore();

export default function ForgotPassword() {
  const [email, setEmail] = useState('');

  const handleResetPassword = async () => {
    if (email.trim() === '') {
      alert('Por favor ingrese un correo electrónico.');
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert('Este correo no está registrado en el sistema.');
        return;
      }

      await sendPasswordResetEmail(auth, email);
      alert('Correo de recuperación enviado. Revisa tu bandeja de entrada.');
    } catch (error) {
      console.error('Error al enviar correo de recuperación:', error);
      alert('Ocurrió un error al intentar recuperar la contraseña.');
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Recuperar Contraseña</Text>

      <TextInput
        style={globalStyles.input}
        placeholder="example@mail.com"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity style={globalStyles.button} onPress={handleResetPassword}>
        <Text style={globalStyles.buttonText}>Enviar correo</Text>
      </TouchableOpacity>
    </View>
  );
}

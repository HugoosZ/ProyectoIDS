import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, SafeAreaView, Platform, StatusBar,
  KeyboardAvoidingView, ScrollView} from 'react-native';
import globalStyles from './globalStyles';

import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

import { useNavigation } from '@react-navigation/native'; // 👈 para volver atrás

const db = getFirestore();

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const navigation = useNavigation();

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
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: 'rgba(137, 113, 187, 1)',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={globalStyles.backButton}
            >
              <Text style={globalStyles.backButtonText}>← Volver</Text>
            </TouchableOpacity>

            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={globalStyles.card}>
                <Text style={[globalStyles.title, globalStyles.titleCentered]}>
                  Recuperar Contraseña
                </Text>

                <View style={globalStyles.formContainer}>
                  <Text style={[globalStyles.subtitle, globalStyles.PurpleText]}>
                    Ingresa tu correo
                  </Text>

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
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
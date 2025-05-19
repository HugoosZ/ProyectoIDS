import React, { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import globalStyles from './globalStyles';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [userInputCode, setUserInputCode] = useState('');
  const [step, setStep] = useState(1); // 1: email, 2: code verification, 3: rut y nueva contraseña
  const [rut, setRut] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sendVerificationCode = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('https://proyecto-ids.vercel.app/api/email/password-recovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setVerificationCode(data.code);
        Alert.alert('Éxito', 'Se ha enviado un código de verificación a tu correo');
        setStep(2);
      } else {
        throw new Error(data.error || 'No se pudo enviar el código de verificación');
      }
    } catch (error: any) {
      console.error('Error al enviar código:', error);
      Alert.alert('Error', error.message || 'No se pudo enviar el código de verificación. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = () => {
    if (!userInputCode.trim()) {
      Alert.alert('Error', 'Por favor ingresa el código de verificación');
      return;
    }

    if (userInputCode === verificationCode) {
      setStep(3);
    } else {
      Alert.alert('Error', 'El código ingresado no es correcto');
    }
  };

  const handleChangePassword = async () => {
    // Validaciones en el cliente
    if (!rut.trim() || !nuevaPassword.trim() || !confirmarPassword.trim()) {
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
      setLoading(true);
      const response = await fetch('https://proyecto-ids.vercel.app/api/auth/cambiar-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rut,
          nuevaPassword,
          confirmarPassword,
          verificationCode, // Enviamos el código para verificación adicional
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
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      Alert.alert('Error', error.message || 'Ocurrió un error al procesar tu solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Recuperar Contraseña</Text>

      <View style={globalStyles.formContainer}>
        {step === 1 && (
          <>
            <Text style={globalStyles.subtitle}>
              Ingresa tu correo electrónico para recibir un código de verificación
            </Text>

            <TextInput
              style={globalStyles.input}
              placeholder="Correo electrónico"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />

            <TouchableOpacity 
              style={[globalStyles.button, loading && { opacity: 0.7 }]} 
              onPress={sendVerificationCode}
              disabled={loading}
            >
              <Text style={globalStyles.buttonText}>
                {loading ? 'Enviando...' : 'Enviar código'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={globalStyles.subtitle}>
              Ingresa el código de verificación enviado a tu correo
            </Text>

            <TextInput
              style={globalStyles.input}
              placeholder="Código de verificación"
              placeholderTextColor="#999"
              value={userInputCode}
              onChangeText={setUserInputCode}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
            />

            <TouchableOpacity 
              style={[globalStyles.button, loading && { opacity: 0.7 }]} 
              onPress={verifyCode}
              disabled={loading}
            >
              <Text style={globalStyles.buttonText}>Verificar código</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={globalStyles.subtitle}>
              Ingresa tus datos para cambiar la contraseña
            </Text>

            <TextInput
              style={globalStyles.input}
              placeholder="RUT (Ej: 12345678-9)"
              placeholderTextColor="#999"
              value={rut}
              onChangeText={setRut}
              autoCapitalize="none"
              editable={!loading}
            />

            <TextInput
              style={globalStyles.input}
              placeholder="Nueva contraseña"
              placeholderTextColor="#999"
              value={nuevaPassword}
              onChangeText={setNuevaPassword}
              secureTextEntry={!showPasswords}
              autoCapitalize="none"
              editable={!loading}
            />

            <TextInput
              style={globalStyles.input}
              placeholder="Confirmar nueva contraseña"
              placeholderTextColor="#999"
              value={confirmarPassword}
              onChangeText={setConfirmarPassword}
              secureTextEntry={!showPasswords}
              autoCapitalize="none"
              editable={!loading}
            />

            <TouchableOpacity 
              style={[globalStyles.button, loading && { opacity: 0.7 }]} 
              onPress={() => setShowPasswords(!showPasswords)}
              disabled={loading}
            >
              <Text style={globalStyles.buttonText}>
                {showPasswords ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[globalStyles.button, loading && { opacity: 0.7 }]} 
              onPress={handleChangePassword}
              disabled={loading}
            >
              <Text style={globalStyles.buttonText}>
                {loading ? 'Cambiando...' : 'Cambiar contraseña'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => router.push('/')} disabled={loading}>
          <Text style={[globalStyles.registerLink, loading && { opacity: 0.7 }]}>
            Volver al inicio
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

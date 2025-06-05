import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const router = useRouter();

const getStoredAuthData = async (): Promise<{ userId: string | null; token: string | null }> => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    const token = await AsyncStorage.getItem('userToken');
    return { userId, token };
  } catch (e) {
    console.error('Error al obtener datos de autenticación:', e);
    return { userId: null, token: null };
  }
};

const Relevo = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { userId, token } = await getStoredAuthData();
      if (!userId || !token) {
        Alert.alert('Error', 'Usuario no autenticado');
      } else {
        setUserId(userId);
        setToken(token);
      }
    };

    fetchUserData();
  }, []);

  const handleValidateCode = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!userId || !token) return;

    try {
      const response = await fetch('https://proyecto-ids.vercel.app/api/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code, userId }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok && data.success) {
        setSuccessMsg('Relevo exitoso.');
        setCode('');
      } else {
        setErrorMsg('Código inválido.');
      }
    } catch (error) {
      setLoading(false);
      setErrorMsg('No se pudo conectar con el servidor.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/trabajador/ver-tareas')}
          activeOpacity={0.8}
        >
          <Icon name="chevron-back" size={20} color="#111827" />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.title}>Relevo de Tarea</Text>
          <Text style={styles.subtitle}>Ingresa el código de 6 dígitos.</Text>

          <View style={styles.inputWrapper}>
            <Icon name="key-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.codeInput}
              placeholder="******"
              value={code}
              onChangeText={text => {
                if (/^\d{0,6}$/.test(text)) setCode(text);
              }}
              keyboardType="number-pad"
              maxLength={6}
              placeholderTextColor="#bbb"
            />
          </View>

          {errorMsg !== '' && <Text style={styles.errorText}>{errorMsg}</Text>}
          {successMsg !== '' && <Text style={styles.successText}>{successMsg}</Text>}

          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary ,loading && { opacity: 0.7 }]}
            onPress={handleValidateCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Validar Código</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Relevo;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 16 : 16,
    marginLeft: 0,
    zIndex: 1,
  },
  backText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 4,
  },
  card: {
    marginTop: 100,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  buttonPrimary: {
  backgroundColor: 'rgba(137, 113, 187, 1)',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  codeInput: {
    flex: 1,
    height: 48,
    fontSize: 24,
    letterSpacing: 12,
    textAlign: 'center',
    fontWeight: '500',
    color: '#111827',
  },
  button: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  successText: {
    color: '#10b981',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
});

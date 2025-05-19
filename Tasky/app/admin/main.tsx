import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import {
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Animated,
  Dimensions,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import globalStyles from '../globalStyles';

export default function AdminMain() {
  const router = useRouter();
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const slideAnim = useRef(new Animated.Value(-screenWidth)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;

  const openMenu = () => {
    setModalVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -screenWidth,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setModalVisible(false);
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* TopBar */}
      <View style={globalStyles.topBar}>
        <TouchableOpacity onPress={openMenu}>
          <Ionicons name="menu" size={32} color="#6508c8" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => console.log('Notificaciones')}>
          <Ionicons name="notifications-outline" size={32} color="#6508c8" />
        </TouchableOpacity>
      </View>

      {/* Contenido principal*/}
      <View style={{ flex: 1 }}>
        <View style={globalStyles.adminContainer}>
          <Text style={globalStyles.title}>Bienvenido, Administrador</Text>
          
        </View>
      </View>

      {/* BottomBar */}
      <View style={globalStyles.bottomBar}>
        <TouchableOpacity onPress={() => console.log('Calendario')}>
          <Ionicons name="calendar-outline" size={28} color="#6508c8" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => console.log('Tarea')}>
          <Ionicons name="add" size={28} color="#6508c8" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => console.log('Inicio')}>
          <Ionicons name="home-outline" size={28} color="#6508c8" />
        </TouchableOpacity>
      </View>

      {/* Modal de menú lateral */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="none"
        onRequestClose={closeMenu}
      >
        <TouchableWithoutFeedback onPress={closeMenu}>
          <Animated.View
            style={[
              globalStyles.modalBackground,
              {
                backgroundColor: backgroundOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.36)'],
                }),
              },
            ]}
          >
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  globalStyles.modalContainer,
                  { transform: [{ translateX: slideAnim }] },
                ]}
              >
                <TouchableOpacity style={globalStyles.closeButton} onPress={closeMenu}>
                  <Ionicons name="close" size={32} color="#6508c8" />
                </TouchableOpacity>

                <View style={globalStyles.menuOptions}>
                  <TouchableOpacity style={globalStyles.menuOption} onPress={() => router.push('/admin/VistaDiaria')}>
                    <Text style={globalStyles.menuText}>Vista diaria</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={globalStyles.menuOption} onPress={() => router.push('/admin/NuevaTarea')}>
                    <Text style={globalStyles.menuText}>Nueva tarea</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={globalStyles.menuOption} onPress={() => router.push('/admin/AddUsers')}>
                    <Text style={globalStyles.menuText}>Añadir usuarios</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={globalStyles.menuOption} onPress={() => router.push('/admin/Analisis')}>
                    <Text style={globalStyles.menuText}>Análisis</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={globalStyles.menuOption} onPress={() => router.push('/admin/Asistencia')}>
                    <Text style={globalStyles.menuText}>Asistencia</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

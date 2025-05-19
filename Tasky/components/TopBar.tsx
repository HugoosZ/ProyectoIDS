// components/TopBar.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Text,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import globalStyles from '../app/globalStyles';
import { useRouter } from 'expo-router';

const TopBar: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const slideAnim = useRef(new Animated.Value(-screenWidth)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const router = useRouter();

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

  const handleRoute = (route: string) => {
    closeMenu();
    router.push(route);
  };

  return (
    <>
      {/* TopBar visible */}
      <View style={globalStyles.topBar}>
        <TouchableOpacity onPress={openMenu}>
          <Ionicons name="menu" size={32} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => console.log('Notificaciones')}>
          <Ionicons name="notifications-outline" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Menú lateral */}
      <Modal
        transparent
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
                  <TouchableOpacity style={globalStyles.menuOption} onPress={() => handleRoute('/admin/main')}>
                    <Text style={globalStyles.menuText}>Vista diaria</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={globalStyles.menuOption} onPress={() => handleRoute('/admin/NuevaTarea')}>
                    <Text style={globalStyles.menuText}>Nueva tarea</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={globalStyles.menuOption} onPress={() => handleRoute('/admin/AddUsers')}>
                    <Text style={globalStyles.menuText}>Añadir usuarios</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={globalStyles.menuOption} onPress={() => handleRoute('/admin/ReasignarTarea')}>
                    <Text style={globalStyles.menuText}>Reasignar tareas</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={globalStyles.menuOption} onPress={() => handleRoute('/admin/Asistencia')}>
                    <Text style={globalStyles.menuText}>Asistencia</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

export default TopBar;

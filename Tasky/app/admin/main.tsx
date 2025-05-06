import { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import globalStyles from '../globalStyles'; // Usando los estilos globales

export default function AdminMain() {
  const [modalVisible, setModalVisible] = useState(false);

  // Función para mostrar el menú deslizante
  const toggleMenu = () => {
    setModalVisible(!modalVisible);
  };

  return (
    <ScrollView contentContainerStyle={globalStyles.container}>
      {/* Contenedor general */}
      <View style={globalStyles.formContainer}>
        {/* Header con el botón de menú y el texto al lado */}
        <View style={globalStyles.headerContainer}>
          {/* Contenedor para el botón */}
          <View style={globalStyles.menuButtonContainer}>
            <TouchableOpacity style={globalStyles.menuButton} onPress={toggleMenu}>
              <Text style={globalStyles.buttonText}>☰</Text> {/* Icono de 3 rayas */}
            </TouchableOpacity>
          </View>

          {/* Contenedor para el texto */}
          <View style={globalStyles.welcomeTextContainer}>
            <Text style={[globalStyles.welcomeText, { fontSize: 16 }]}>Bienvenido, Administrador</Text> {/* Texto al lado del botón */}
          </View>
        </View>

        {/* Opciones del menú */}
        <Modal
          transparent={true}
          visible={modalVisible}
          animationType="slide"
          onRequestClose={toggleMenu}
        >
          <TouchableWithoutFeedback onPress={toggleMenu}>
            <View style={globalStyles.modalBackground}>
              <TouchableWithoutFeedback>
                <View style={globalStyles.modalContainer}>
                  {/* Cerrar el menú */}
                  <TouchableOpacity style={globalStyles.closeButton} onPress={toggleMenu}>
                    <Text style={globalStyles.closeButtonText}>Cerrar</Text>
                  </TouchableOpacity>

                  {/* Opciones del menú */}
                  <View style={globalStyles.menuOptions}>
                    <TouchableOpacity style={globalStyles.menuOption}>
                      <Text style={globalStyles.menuText}>Crear/Editar Roles de Usuario</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={globalStyles.menuOption}>
                      <Text style={globalStyles.menuText}>Crear Tarea</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={globalStyles.menuOption}>
                      <Text style={globalStyles.menuText}>Asignar Tareas a Trabajadores</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={globalStyles.menuOption}>
                      <Text style={globalStyles.menuText}>Seguimiento de Tareas</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </ScrollView>
  );
}

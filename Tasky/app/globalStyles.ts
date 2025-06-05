import { StyleSheet } from 'react-native';

const globalStyles = StyleSheet.create({
  container: {
    paddingTop: 40,
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(137, 113, 187, 1)',
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center', 
  },
  formContainer: {
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff', 
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'rgba(137, 113, 187, 1)',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: 'rgba(210, 210, 210, 1)',
  },
  registerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 40,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(137, 113, 187, 1)',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  registerLink: {
    color: '#fff', // Cambiado a blanco para el link
    fontWeight: '500',
  },

  // NUEVOS ESTILOS AGREGADOS
 card: {
    backgroundColor: 'rgba(233, 233, 233, 1)', 
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    width: '90%',
    maxWidth: 400,
  },

  ajustableCard: {
  backgroundColor: 'rgba(233, 233, 233, 1)',
  padding: 24,
  borderRadius: 16,
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 4,
  width: '90%',
  maxWidth: 400,
  height: 600, // 👈 altura fija (puedes ajustar este valor)
  justifyContent: 'center', // centra el contenido verticalmente
},

backButton: {
  position: 'absolute',
  top: 10,
  left: 10,
  zIndex: 1,
  padding: 10,
  backgroundColor: 'rgba(233, 233, 233, 1)',
  borderRadius: 20,
},

backButtonText: {
  color: '#000',
},


  logo: {
  width: 150,
  height: 150,
  alignSelf: 'center',
  marginBottom: 20,
  resizeMode: 'contain',
  borderRadius: 15,  // borde redondeado total (círculo)
},


  forgotPasswordText: {
    textAlign: 'center',
    textDecorationLine: 'underline',
    color: 'rgba(137, 113, 187, 1)',
    fontWeight: '500',
    marginTop: 10,
  },

  titleCentered: {
    textAlign: 'center',
  },

  whiteText: {
    color: '#fff',
  },

  PurpleText: {
    color: 'rgba(137, 113, 187, 1)',
  },

 // Estilos adicionales para Header y DateTime
 headerContainer: {
  flexDirection: 'row', // Alinea los elementos en fila (horizontales)
  justifyContent: 'space-between', // Distribuye el espacio entre los elementos
  alignItems: 'center', // Alinea verticalmente al centro
  width: '100%', // Ocupa todo el ancho disponible
  paddingHorizontal: 20, // Añade un poco de espacio a los lados del header
  marginTop: 30, // Aumentamos el margen superior para bajarlo
  marginBottom: 10, // Podemos añadir un poco de margen inferior si lo deseas
},
  welcomeText: {
    fontSize: 16, // Ajusta el tamaño de la fuente para que quepa bien
    fontWeight: 'bold',
    color: '#333', // Color oscuro para que resalte
  },
  dateTime: {
    width: '100%',
    padding: 10,
    backgroundColor: 'rgba(234, 234, 234, 1)',
    alignItems: 'center',
    borderRadius: 15,
    marginTop: 20,
  },
  menuButtonContainer: {
    // No necesitamos estilos específicos aquí si usamos space-between en headerContainer
  },
  welcomeTextContainer: {
    // No necesitamos estilos específicos aquí si usamos space-between en headerContainer
  },
  menuButton: {
    // Los estilos del botón en sí, como el tamaño del texto, se mantienen
  },

  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },

  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.36)', // Fondo oscuro semi-transparente
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    
  },
  
  closeButton: {
    alignItems: 'flex-end',
  },
  closeButtonText: {
    fontSize: 18,
    color: 'blue',
    marginBottom: 20,
  },
  menuOptions: {
    marginTop: 15,
  },
  menuOption: {
    marginBottom: 15,
  },

  menuText: {
    fontSize: 20,
    color: 'black',
  },
  topBar: {
    backgroundColor: 'rgb(90, 22, 163)', 
    paddingTop: 15, 
    paddingBottom: 15,
    paddingHorizontal: 15,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBar: {
    paddingTop: 15, 
    paddingBottom: 25,
    paddingHorizontal: 35,
    width: '100%',
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adminContainer: {
    flexGrow: 1, // Necesario para ScrollView
    justifyContent: 'center', // o 'flex-start', según tu diseño
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgb(255, 255, 255)',
  },  

});

export default globalStyles;
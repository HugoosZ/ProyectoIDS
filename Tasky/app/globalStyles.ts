import { StyleSheet } from 'react-native';

const globalStyles = StyleSheet.create({
  container: {
    paddingTop: 40,
    flex: 1,
    justifyContent: 'flex-start', // Cambiado a flex-start para alinear desde la parte superior
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgb(236, 236, 236)', // Fondo claro
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
    maxWidth: 300, // Ancho del formulario
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: ' rgb(109, 82, 160)',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 40, // Hicimos los inputs más delgados verticalmente
    borderColor: 'rgba(137, 113, 187, 1)', // Borde morado
    borderWidth: 1,
    borderRadius: 15, // Bordes redondeados
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: 'rgba(210, 210, 210, 1)', // Fondo más claro
  },
  registerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 40, // Hicimos los botones más delgados verticalmente
    borderRadius: 25, // Bordes redondeados
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(137, 113, 187, 1)', // Establece el color morado
    elevation: 5, // Sombra en Android
    shadowColor: '#000', // Sombra en iOS
    shadowOffset: { width: 0, height: 2 }, // Desplazamiento de la sombra
    shadowOpacity: 0.3, // Opacidad de la sombra
    shadowRadius: 5, // Radio de la sombra
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  registerLink: {
    color: 'rgba(137, 113, 187, 1)',
    fontWeight: '500',
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
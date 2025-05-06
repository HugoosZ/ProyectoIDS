import { Text, View } from 'react-native';
import globalStyles from '../globalStyles';

export default function Sent() {
  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>¡Tu correo fue enviado con éxito!</Text>
    </View>
  );
}

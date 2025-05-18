// components/BottomBar.tsx
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import globalStyles from '../app/globalStyles';
import { useRouter } from 'expo-router';

const BottomBar = () => {
  const router = useRouter();

  return (
    <View style={globalStyles.bottomBar}>
      <TouchableOpacity onPress={() => console.log('Calendario')}>
        <Ionicons name="calendar-outline" size={28} color="#6508c8" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/admin/NuevaTarea')}>
        <Ionicons name="add" size={28} color="#6508c8" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/admin/main')}>
        <Ionicons name="home-outline" size={28} color="#6508c8" />
      </TouchableOpacity>
    </View>
  );
};

export default BottomBar;

// Archivo: app/(tabs)/_layout.tsx
import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import AdminMain from '../admin/main';

const Drawer = createDrawerNavigator();

export default function Layout() {
  return (
    <Drawer.Navigator
      initialRouteName="AdminMain"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Drawer.Screen
        name="AdminMain"
        component={AdminMain}
        options={{
          title: 'Panel Administrativo',
        }}
      />
    </Drawer.Navigator>
  );
}

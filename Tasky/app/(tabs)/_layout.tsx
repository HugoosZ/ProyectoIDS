// Archivo: (tabs)/_layout.tsx
import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import AdminMain from '../admin/main';
import ForgotPassword from './forgotPassword';

const Drawer = createDrawerNavigator();

export default function Layout() {
  return (
    <Drawer.Navigator
      initialRouteName="AdminMain"
      screenOptions={{
        headerShown: false, // Puedes ajustar esto según tus necesidades
      }}
    >
      <Drawer.Screen
        name="AdminMain"
        component={AdminMain}
        options={{
          title: 'Panel Administrativo',
        }}
      />
      <Drawer.Screen
        name="ForgotPassword"
        component={ForgotPassword}
        options={{
          title: 'Recuperar Contraseña',
        }}
      />
    </Drawer.Navigator>
  );
}

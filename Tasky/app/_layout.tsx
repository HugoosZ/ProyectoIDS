import { AuthProvider } from '../lib/context/AuthContext';
import { Slot } from 'expo-router';

export default function Layout() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
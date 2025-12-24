import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './src/lib/supabase';

// Importação das Telas
import LoginScreen from './src/screens/LoginScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import RoomScreen from './src/screens/RoomScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdminPanel from './src/screens/AdminPanel';
import ChatPrivado from './src/screens/ChatPrivado'; // Tela de chat entre usuários

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Verifica a sessão atual ao abrir o app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Escuta mudanças no estado de autenticação (Login/Logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session && session.user ? (
          // Rotas para usuários logados
          <>
            <Stack.Screen name="Lobby" component={LobbyScreen} />
            <Stack.Screen name="Room" component={RoomScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Admin" component={AdminPanel} />
            <Stack.Screen name="ChatPrivado" component={ChatPrivado} />
          </>
        ) : (
          // Rota para usuários não autenticados
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

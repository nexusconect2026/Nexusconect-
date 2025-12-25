import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './src/lib/supabase';

// Importação das Telas (Certifique-se que os arquivos existem nestes caminhos)
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import RoomScreen from './src/screens/RoomScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen'; // Tela de Edição
import AdminPanel from './src/screens/AdminPanel';
import ChatPrivado from './src/screens/ChatPrivado';
import FriendsScreen from './src/screens/FriendsScreen'; // Nova tela de Amigos
import StoreScreen from './src/screens/StoreScreen';     // Nova tela da Loja
import TasksScreen from './src/screens/TasksScreen';     // Nova tela de Missões

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
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animation: 'fade_from_bottom' // Transição suave estilo Premium
        }}
      >
        {session && session.user ? (
          // --- ÁREA LOGADA (NEXUS ECOSYSTEM) ---
          <>
            <Stack.Screen name="Lobby" component={LobbyScreen} />
            <Stack.Screen name="Room" component={RoomScreen} />
            
            {/* Telas de Perfil e Social */}
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Friends" component={FriendsScreen} />
            <Stack.Screen name="ChatPrivado" component={ChatPrivado} />
            
            {/* Telas de Economia e Gamificação */}
            <Stack.Screen name="Store" component={StoreScreen} />
            <Stack.Screen name="Tasks" component={TasksScreen} />
            
            {/* Gestão */}
            <Stack.Screen name="Admin" component={AdminPanel} />
          </>
        ) : (
          // --- ÁREA DE ACESSO ---
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

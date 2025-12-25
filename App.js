import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { supabase } from './src/lib/supabase';
import { Feather } from '@expo/vector-icons';

// Importação das Telas
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import StoreScreen from './src/screens/StoreScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import DailyTasksScreen from './src/screens/DailyTasksScreen';
import RoomDetailScreen from './src/screens/RoomDetailScreen';
import ChatPrivado from './src/screens/ChatPrivado';
import MatchScreen from './src/screens/MatchScreen';
import AdminPanel from './src/screens/AdminPanel';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: '#0F0F0F', 
          borderTopColor: '#1A1A1A',
          paddingBottom: 5,
          height: 60
        },
        tabBarActiveTintColor: '#8E44AD',
        tabBarInactiveTintColor: '#444',
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Lobby') iconName = 'grid';
          else if (route.name === 'Discovery') iconName = 'zap';
          else if (route.name === 'Loja') iconName = 'shopping-bag';
          else if (route.name === 'Social') iconName = 'users';
          return <Feather name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Lobby" component={LobbyScreen} />
      <Tab.Screen name="Discovery" component={MatchScreen} />
      <Tab.Screen name="Loja" component={StoreScreen} />
      <Tab.Screen name="Social" component={FriendsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="DailyTasks" component={DailyTasksScreen} />
            <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
            <Stack.Screen name="ChatPrivado" component={ChatPrivado} />
            <Stack.Screen name="AdminPanel" component={AdminPanel} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

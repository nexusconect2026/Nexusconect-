import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function LobbyScreen({ navigation }) {
  const [rooms, setRooms] = useState([]);
  const [userRole, setUserRole] = useState('user');

  useEffect(() => {
    fetchRooms();
    checkRole();
  }, []);

  async function checkRole() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    setUserRole(data?.role || 'user');
  }

  async function fetchRooms() {
    const { data } = await supabase.from('rooms').select('*');
    setRooms(data || []);
  }

  async function handleCreateRoom() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (userRole !== 'admin') {
      const { data: mine } = await supabase.from('rooms').select('id').eq('owner_id', user.id);
      if (mine && mine.length >= 1) return Alert.alert("Aviso", "Usuários comuns só podem ter 1 sala.");
    }

    Alert.prompt("Nova Sala", "Nome da sala:", async (name) => {
      if (!name) return;
      const roomId = `room_${Date.now()}`;
      const { error } = await supabase.from('rooms').insert({ id: roomId, owner_id: user.id, title: name });
      if (!error) {
        const seats = Array.from({length: 8}, (_, i) => ({ room_id: roomId, seat_index: i }));
        await supabase.from('room_seats').insert(seats);
        navigation.navigate('Room', { roomId, title: name });
      }
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>NEXUS</Text>
        <View style={{flexDirection: 'row'}}>
          {userRole === 'admin' && (
            <TouchableOpacity onPress={() => navigation.navigate('Admin')} style={{marginRight: 15}}>
              <Ionicons name="shield-checkmark" size={28} color="#FFD700" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle" size={30} color="#00D4FF" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList 
        data={rooms}
        keyExtractor={i => i.id}
        renderItem={({item}) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Room', { roomId: item.id, title: item.title })}>
            <Text style={styles.cardText}>{item.title}</Text>
            <Ionicons name="chevron-forward" size={20} color="#00D4FF" />
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={handleCreateRoom}>
        <Ionicons name="add" size={35} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  logo: { color: '#00D4FF', fontSize: 24, fontWeight: 'bold', letterSpacing: 2 },
  card: { backgroundColor: '#111', padding: 20, marginHorizontal: 20, marginBottom: 10, borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between' },
  cardText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#00D4FF', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' }
});

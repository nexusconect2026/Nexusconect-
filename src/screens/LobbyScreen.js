import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather, MaterialIcons } from '@expo/vector-icons';

export default function LobbyScreen({ navigation }) {
  const [rooms, setRooms] = useState([]);
  const [profile, setProfile] = useState({ nexus_coins: 0, level: 1 });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: roomsData } = await supabase.from('rooms').select('*');
    if (roomsData) setRooms(roomsData);

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profileData) setProfile(profileData);
  }

  const renderRoom = ({ item }) => (
    <TouchableOpacity style={styles.roomCard} onPress={() => navigation.navigate('Room', { roomId: item.id })}>
      <View style={styles.roomInfo}>
        <Text style={styles.roomTitle}>{item.title || 'Sala de Conferência'}</Text>
        <View style={styles.roomMeta}>
          <Text style={styles.roomTag}>#Networking</Text>
          <Text style={styles.roomParticipants}>• 15 conectados</Text>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color="#333" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.welcome}>Painel Principal</Text>
          <View style={styles.stats}>
            <MaterialIcons name="account-balance-wallet" size={14} color="#8E44AD" />
            <Text style={styles.statsText}> {profile.nexus_coins} NC</Text>
            <Text style={styles.divider}>|</Text>
            <Text style={styles.statsText}>Nível {profile.level}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Image source={{ uri: `https://api.dicebear.com/7.x/initials/svg?seed=N` }} style={styles.avatar} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={rooms}
        renderItem={renderRoom}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.sectionLabel}>Canais de Áudio Ativos</Text>}
      />

      <TouchableOpacity style={styles.fab}>
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0A0A' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 25, borderBottomWidth: 1, borderBottomColor: '#111' },
  welcome: { color: '#fff', fontSize: 22, fontWeight: '700' },
  stats: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  statsText: { color: '#555', fontSize: 12, fontWeight: '600' },
  divider: { color: '#222', marginHorizontal: 10 },
  avatar: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#111' },
  list: { padding: 25 },
  sectionLabel: { color: '#333', fontSize: 13, fontWeight: '800', letterSpacing: 1, marginBottom: 20, textTransform: 'uppercase' },
  roomCard: { backgroundColor: '#121212', padding: 20, borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#1A1A1A' },
  roomTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  roomMeta: { flexDirection: 'row', marginTop: 5 },
  roomTag: { color: '#8E44AD', fontSize: 11, fontWeight: '700' },
  roomParticipants: { color: '#444', fontSize: 11, marginLeft: 10 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 20, backgroundColor: '#8E44AD', justifyContent: 'center', alignItems: 'center', elevation: 5 }
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, SafeAreaView, Dimensions, ScrollView, StatusBar } from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather, MaterialIcons } from '@expo/vector-icons'; 

const { width } = Dimensions.get('window');

export default function LobbyScreen({ navigation }) {
  const [rooms, setRooms] = useState([]);
  const [profile, setProfile] = useState({ nexus_coins: 0, level: 1, role: 'user', is_verified: false });

  useEffect(() => {
    fetchData();
    // Realtime para atualizar moedas e selos se o Admin mudar
    const sub = supabase.channel('lobby_sync').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, fetchData).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  async function fetchData() {
    const { data: roomsData } = await supabase.from('rooms').select('*, profiles(custom_id)');
    if (roomsData) setRooms(roomsData);

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profileData) setProfile(profileData);
  }

  const renderRoom = ({ item }) => (
    <TouchableOpacity 
      style={styles.roomCard}
      onPress={() => navigation.navigate('RoomDetail', { roomId: item.id, title: item.title, ownerId: item.owner_id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.statusBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.statusText}>AO VIVO</Text>
        </View>
        {item.is_private && <Feather name="lock" size={16} color="#8E44AD" />}
      </View>

      <Text style={styles.roomTitle} numberOfLines={2}>{item.title}</Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.userCount}>
          <Feather name="user" size={14} color="#8E44AD" />
          <Text style={styles.userCountText}>Host: {item.profiles?.custom_id}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        
        {/* Top Bar Profissional - Com Selo de Staff */}
        <View style={styles.topBar}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.brandName}>NEXUS</Text>
              {profile.role === 'admin' && <View style={styles.staffBadge}><Text style={styles.staffText}>STAFF</Text></View>}
              {profile.is_verified && <MaterialIcons name="verified" size={16} color="#00d4ff" style={{ marginLeft: 5 }} />}
            </View>
            <View style={styles.statsRow}>
              <MaterialIcons name="stars" size={14} color="#F1C40F" />
              <Text style={styles.statsText}> Nível {profile.level}</Text>
              <Text style={styles.statsDivider}>|</Text>
              <MaterialIcons name="account-balance-wallet" size={14} color="#8E44AD" />
              <Text style={styles.statsText}> {profile.nexus_coins} NC</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Image source={{ uri: `https://api.dicebear.com/7.x/initials/svg?seed=${profile.custom_id}` }} style={styles.profileImage} />
          </TouchableOpacity>
        </View>

        {/* Menu de Atalhos (Store, Task, Friends) */}
        <View style={styles.shortcutRow}>
          <TouchableOpacity style={styles.shortBtn} onPress={() => navigation.navigate('Store')}>
            <Feather name="shopping-bag" size={20} color="#8E44AD" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortBtn} onPress={() => navigation.navigate('DailyTasks')}>
            <Feather name="check-square" size={20} color="#8E44AD" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortBtn} onPress={() => navigation.navigate('Friend')}>
            <Feather name="users" size={20} color="#8E44AD" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={rooms}
          renderItem={renderRoom}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listPadding}
          ListHeaderComponent={<Text style={styles.sectionTitle}>Explorar Comunidade</Text>}
        />

        <TouchableOpacity style={styles.createButton} activeOpacity={0.9} onPress={() => Alert.alert("Em breve", "Criação de salas disponível na v1.1")}>
          <Feather name="plus" size={24} color="#fff" />
          <Text style={styles.createButtonText}>Nova Sala de Voz</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F0F0F' },
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  brandName: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  staffBadge: { backgroundColor: '#E74C3C', paddingHorizontal: 6, borderRadius: 4, marginLeft: 8 },
  staffText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statsText: { color: '#AAA', fontSize: 11, fontWeight: '600' },
  statsDivider: { color: '#333', marginHorizontal: 8 },
  profileImage: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#8E44AD' },
  shortcutRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginVertical: 15 },
  shortBtn: { backgroundColor: '#161616', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#222' },
  listPadding: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginVertical: 15 },
  roomCard: { backgroundColor: '#161616', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(46, 204, 113, 0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ECC71', marginRight: 8 },
  statusText: { color: '#2ECC71', fontSize: 10, fontWeight: 'bold' },
  roomTitle: { color: '#fff', fontSize: 20, fontWeight: '600', lineHeight: 28 },
  cardFooter: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#222' },
  userCountText: { color: '#888', fontSize: 13, marginLeft: 6 },
  userCount: { flexDirection: 'row', alignItems: 'center' },
  createButton: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#8E44AD', flexDirection: 'row', height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  createButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 }
});

import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Image, SafeAreaView, Dimensions, ScrollView 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather, MaterialIcons } from '@expo/vector-icons'; 

const { width } = Dimensions.get('window');

export default function LobbyScreen({ navigation }) {
  const [rooms, setRooms] = useState([]);
  const [profile, setProfile] = useState({ nexus_coins: 0, level: 1 });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    // Busca salas
    const { data: roomsData } = await supabase.from('rooms').select('*');
    if (roomsData) setRooms(roomsData);

    // Busca dados básicos do perfil logado
    const user = (await supabase.auth.getUser()).data.user;
    const { data: profileData } = await supabase
      .from('profiles')
      .select('nexus_coins, level')
      .eq('id', user.id)
      .single();
    if (profileData) setProfile(profileData);
  }

  const renderRoom = ({ item }) => (
    <TouchableOpacity 
      style={styles.roomCard}
      onPress={() => navigation.navigate('Room', { roomId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.statusBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.statusText}>AO VIVO</Text>
        </View>
        <Feather name="more-horizontal" size={20} color="#666" />
      </View>

      <Text style={styles.roomTitle} numberOfLines={2}>{item.title || 'Sala de Conferência'}</Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.userCount}>
          <Feather name="users" size={14} color="#8E44AD" />
          <Text style={styles.userCountText}>24 participantes</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Top Bar Profissional */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.brandName}>NEXUS</Text>
            <View style={styles.statsRow}>
              <MaterialIcons name="stars" size={14} color="#F1C40F" />
              <Text style={styles.statsText}> Nível {profile.level}</Text>
              <Text style={styles.statsDivider}>|</Text>
              <MaterialIcons name="account-balance-wallet" size={14} color="#8E44AD" />
              <Text style={styles.statsText}> {profile.nexus_coins} NC</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Image 
              source={{ uri: `https://api.dicebear.com/7.x/initials/svg?seed=User` }} 
              style={styles.profileImage} 
            />
          </TouchableOpacity>
        </View>

        {/* Filtros de Categoria */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {['Todas as Salas', 'Reuniões', 'Eventos', 'Networking'].map((cat, i) => (
              <TouchableOpacity key={i} style={[styles.filterBtn, i === 0 && styles.filterBtnActive]}>
                <Text style={[styles.filterBtnText, i === 0 && styles.filterBtnTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Lista de Conteúdo */}
        <FlatList
          data={rooms}
          renderItem={renderRoom}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<Text style={styles.sectionTitle}>Salas Disponíveis</Text>}
        />

        {/* Ação Principal: Criar Sala */}
        <TouchableOpacity style={styles.createButton} activeOpacity={0.9}>
          <Feather name="plus" size={24} color="#fff" />
          <Text style={styles.createButtonText}>Criar Nova Sala</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F0F0F' },
  container: { flex: 1 },
  topBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A'
  },
  brandName: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statsText: { color: '#AAA', fontSize: 11, fontWeight: '600' },
  statsDivider: { color: '#333', marginHorizontal: 8 },
  profileImage: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1A1A1A' },

  filterSection: { marginVertical: 20 },
  filterBtn: { 
    marginRight: 10, 
    paddingVertical: 10, 
    paddingHorizontal: 18, 
    borderRadius: 12, 
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#222'
  },
  filterBtnActive: { backgroundColor: '#8E44AD', borderColor: '#8E44AD' },
  filterBtnText: { color: '#888', fontWeight: '600', fontSize: 13 },
  filterBtnTextActive: { color: '#fff' },

  listPadding: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 15 },
  roomCard: { 
    backgroundColor: '#161616', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#222'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(46, 204, 113, 0.1)', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6 
  },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2ECC71', marginRight: 6 },
  statusText: { color: '#2ECC71', fontSize: 10, fontWeight: 'bold' },
  roomTitle: { color: '#fff', fontSize: 18, fontWeight: '600', lineHeight: 24 },
  cardFooter: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#222' },
  userCountText: { color: '#666', fontSize: 12, marginLeft: 6 },
  userCount: { flexDirection: 'row', alignItems: 'center' },

  createButton: { 
    position: 'absolute', 
    bottom: 30, 
    left: 20, 
    right: 20, 
    backgroundColor: '#8E44AD', 
    flexDirection: 'row',
    height: 55, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#8E44AD',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  createButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 }
});

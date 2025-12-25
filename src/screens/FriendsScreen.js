import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Image, SafeAreaView, ActivityIndicator, TextInput, StatusBar 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather, MaterialIcons } from '@expo/vector-icons';

export default function FriendsScreen({ navigation }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFriends();
    
    // Realtime para atualizar status de amizade
    const channel = supabase.channel('friends_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, fetchFriends)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchFriends() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      // Busca amigos e traz os dados do perfil (incluindo role e se é verificado)
      const { data, error } = await supabase
        .from('friends')
        .select(`
          friend_id,
          profiles:friend_id (id, custom_id, level, role, is_verified)
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (error) throw error;
      setFriends(data || []);
    } catch (error) {
      console.error('Erro ao carregar amigos:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredFriends = friends.filter(f => 
    f.profiles.custom_id.toLowerCase().includes(search.toLowerCase())
  );

  const renderFriend = ({ item }) => (
    <TouchableOpacity 
      style={styles.friendCard}
      onPress={() => navigation.navigate('ChatPrivado', { 
        recipientId: item.profiles.id, 
        recipientName: item.profiles.custom_id 
      })}
    >
      <View style={styles.avatarContainer}>
        <Image 
          source={{ uri: `https://api.dicebear.com/7.x/initials/svg?seed=${item.profiles.custom_id}` }} 
          style={[
            styles.avatar, 
            item.profiles.role === 'admin' && { borderColor: '#E74C3C', borderWidth: 2 }
          ]} 
        />
        <View style={styles.onlineBadge} />
      </View>
      
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>@{item.profiles.custom_id}</Text>
          {item.profiles.is_verified && <MaterialIcons name="verified" size={14} color="#00D4FF" style={{marginLeft: 5}} />}
          {item.profiles.role === 'admin' && (
            <View style={styles.staffTag}><Text style={styles.staffTagText}>STAFF</Text></View>
          )}
        </View>
        <Text style={styles.subInfo}>Nível {item.profiles.level} • Conectado</Text>
      </View>

      <View style={styles.chatIcon}>
        <Feather name="message-square" size={20} color="#8E44AD" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NETWORKING</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddFriend')} style={styles.addBtn}>
          <Feather name="user-plus" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Feather name="search" size={18} color="#444" style={{marginRight: 10}} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Procurar nos seus contatos..."
          placeholderTextColor="#444"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#8E44AD" size="large" /></View>
      ) : (
        <FlatList 
          data={filteredFriends}
          keyExtractor={item => item.friend_id}
          renderItem={renderFriend}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="users" size={50} color="#222" />
              <Text style={styles.emptyText}>Sua lista de elite está vazia.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 3 },
  backBtn: { width: 40 },
  addBtn: { backgroundColor: '#8E44AD', padding: 8, borderRadius: 12 },
  searchBar: { 
    flexDirection: 'row', 
    backgroundColor: '#161616', 
    marginHorizontal: 20, 
    marginBottom: 20,
    padding: 15, 
    borderRadius: 16, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222'
  },
  searchInput: { color: '#FFF', flex: 1, fontSize: 15 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  friendCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#161616', 
    padding: 15, 
    borderRadius: 22, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222'
  },
  avatarContainer: { width: 55, height: 55, borderRadius: 20, position: 'relative' },
  avatar: { width: '100%', height: '100%', borderRadius: 20, backgroundColor: '#222' },
  onlineBadge: { 
    width: 14, 
    height: 14, 
    borderRadius: 7, 
    backgroundColor: '#2ECC71', 
    position: 'absolute', 
    bottom: -2, 
    right: -2,
    borderWidth: 3,
    borderColor: '#161616'
  },
  info: { flex: 1, marginLeft: 15 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  staffTag: { backgroundColor: '#E74C3C', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  staffTagText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  subInfo: { color: '#666', fontSize: 12, marginTop: 4 },
  chatIcon: { backgroundColor: '#8E44AD15', padding: 10, borderRadius: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#444', textAlign: 'center', marginTop: 15, fontSize: 16 }
});

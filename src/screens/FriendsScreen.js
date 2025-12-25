import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Image, SafeAreaView, ActivityIndicator, TextInput 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function FriendsScreen({ navigation }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFriends();
  }, []);

  async function fetchFriends() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      // Busca amigos onde o status é 'accepted'
      const { data, error } = await supabase
        .from('friends')
        .select(`
          friend_id,
          profiles:friend_id (id, custom_id, level, personality_type)
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
          style={styles.avatar} 
        />
        <View style={styles.onlineBadge} />
      </View>
      
      <View style={styles.info}>
        <Text style={styles.name}>@{item.profiles.custom_id}</Text>
        <Text style={styles.subInfo}>Nível {item.profiles.level} • {item.profiles.personality_type}</Text>
      </View>

      <TouchableOpacity style={styles.chatIcon}>
        <Feather name="message-circle" size={20} color="#8E44AD" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AMIGOS</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddFriend')}>
          <Feather name="user-plus" size={24} color="#8E44AD" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Feather name="search" size={18} color="#444" style={{marginRight: 10}} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Procurar nos teus amigos..."
          placeholderTextColor="#444"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator color="#8E44AD" style={{marginTop: 50}} />
      ) : (
        <FlatList 
          data={filteredFriends}
          keyExtractor={item => item.friend_id}
          renderItem={renderFriend}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Ainda não tens amigos adicionados.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  searchBar: { 
    flexDirection: 'row', 
    backgroundColor: '#111', 
    margin: 20, 
    padding: 12, 
    borderRadius: 15, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#161616'
  },
  searchInput: { color: '#FFF', flex: 1, fontSize: 14 },
  list: { paddingHorizontal: 20 },
  friendCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#121212', 
    padding: 15, 
    borderRadius: 18, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1A1A1A'
  },
  avatarContainer: { width: 50, height: 50, borderRadius: 15, position: 'relative' },
  avatar: { width: '100%', height: '100%', borderRadius: 15 },
  onlineBadge: { 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    backgroundColor: '#2ECC71', 
    position: 'absolute', 
    bottom: -2, 
    right: -2,
    borderWidth: 2,
    borderColor: '#121212'
  },
  info: { flex: 1, marginLeft: 15 },
  name: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  subInfo: { color: '#444', fontSize: 11, marginTop: 2 },
  chatIcon: { padding: 10 },
  emptyText: { color: '#444', textAlign: 'center', marginTop: 50 }
});

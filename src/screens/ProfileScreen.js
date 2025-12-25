import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather, MaterialIcons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(data);
    setLoading(false);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.replace('Login');
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator color="#8E44AD" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
            <Feather name="edit-3" size={22} color="#8E44AD" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.avatarWrapper}>
             <Image 
              source={{ uri: `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.custom_id}` }} 
              style={[styles.avatar, profile?.role === 'aristocracy_king' && styles.goldBorder]} 
            />
            {profile?.is_verified && <MaterialIcons name="verified" size={24} color="#00d4ff" style={styles.verifiedBadge} />}
          </View>
          
          <Text style={styles.username}>@{profile?.custom_id}</Text>
          {profile?.role === 'admin' && <View style={styles.staffTag}><Text style={styles.tagText}>STAFF</Text></View>}
          
          <Text style={styles.bio}>{profile?.profile_bio || "Explorando o Nexus..."}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{profile?.level}</Text>
            <Text style={styles.statLabel}>NÍVEL</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{profile?.nexus_coins}</Text>
            <Text style={styles.statLabel}>COINS</Text>
          </View>
        </View>

        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Store')}>
            <Feather name="shopping-bag" size={20} color="#8E44AD" />
            <Text style={styles.menuText}>Meu Inventário</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
            <Feather name="log-out" size={20} color="#FF3B30" />
            <Text style={[styles.menuText, { color: '#FF3B30' }]}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  loader: { flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  profileInfo: { alignItems: 'center', marginTop: 10 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 110, height: 110, borderRadius: 40, backgroundColor: '#161616', borderWidth: 2, borderColor: '#8E44AD' },
  goldBorder: { borderColor: '#F1C40F', borderWidth: 3 },
  verifiedBadge: { position: 'absolute', bottom: -5, right: -5 },
  username: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 15 },
  staffTag: { backgroundColor: '#E74C3C', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 5, marginTop: 5 },
  tagText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  bio: { color: '#888', textAlign: 'center', paddingHorizontal: 40, marginTop: 10, fontSize: 14 },
  statsRow: { flexDirection: 'row', backgroundColor: '#161616', margin: 25, borderRadius: 20, padding: 20 },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: '#666', fontSize: 10, marginTop: 5 },
  menu: { paddingHorizontal: 25 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  menuText: { color: '#fff', marginLeft: 15, fontSize: 16, fontWeight: '500' }
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, ActivityIndicator, Animated } from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function MatchScreen({ navigation }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchDiscovery();
  }, []);

  async function fetchDiscovery() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Busca perfis que não são o meu e que eu ainda não sigo
    const { data: followed } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
    const followedIds = followed?.map(f => f.following_id) || [];

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .not('id', 'in', `(${followedIds.join(',') || '00000000-0000-0000-0000-000000000000'})`)
      .limit(10);

    setProfiles(data || []);
    setLoading(false);
  }

  async function handleLike(targetId) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
    nextProfile();
  }

  const nextProfile = () => {
    setCurrentIndex(prev => prev + 1);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#8E44AD" size="large" /></View>;

  if (currentIndex >= profiles.length) {
    return (
      <View style={styles.center}>
        <Feather name="zap" size={50} color="#222" />
        <Text style={styles.emptyText}>A elite local foi toda explorada.</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchDiscovery}>
          <Text style={styles.refreshText}>Recarregar Discovery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const current = profiles[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DISCOVERY</Text>
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Image 
            source={{ uri: `https://api.dicebear.com/7.x/initials/svg?seed=${current.custom_id}&backgroundColor=0f0f0f` }} 
            style={styles.cardImage} 
          />
          <View style={styles.infoOverlay}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>@{current.custom_id}, {current.level}</Text>
              {current.is_verified && <MaterialIcons name="verified" size={20} color="#00D4FF" />}
            </View>
            <Text style={styles.bio} numberOfLines={2}>{current.profile_bio || "Explorando o Nexus Conect..."}</Text>
            
            <View style={styles.tagRow}>
              <View style={styles.tag}><Text style={styles.tagText}>Nível {current.level}</Text></View>
              {current.role === 'admin' && <View style={[styles.tag, {backgroundColor: '#E74C3C'}]}><Text style={styles.tagText}>STAFF</Text></View>}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={nextProfile}>
          <Feather name="x" size={32} color="#E74C3C" />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionBtn, styles.likeBtn]} onPress={() => handleLike(current.id)}>
          <Ionicons name="heart" size={38} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { padding: 20, alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 4 },
  center: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center', padding: 40 },
  cardContainer: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },
  card: { flex: 1, backgroundColor: '#161616', borderRadius: 35, overflow: 'hidden', borderWidth: 1, borderColor: '#222', position: 'relative' },
  cardImage: { width: '100%', height: '100%', opacity: 0.8 },
  infoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 30, backgroundColor: 'rgba(15,15,15,0.9)' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  bio: { color: '#AAA', marginTop: 8, fontSize: 15, lineHeight: 22 },
  tagRow: { flexDirection: 'row', marginTop: 15, gap: 10 },
  tag: { backgroundColor: '#8E44AD22', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#8E44AD44' },
  tagText: { color: '#8E44AD', fontSize: 10, fontWeight: 'bold' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 40, paddingBottom: 40 },
  actionBtn: { width: 75, height: 75, borderRadius: 38, backgroundColor: '#161616', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  likeBtn: { backgroundColor: '#8E44AD', borderColor: '#8E44AD' },
  emptyText: { color: '#444', textAlign: 'center', marginTop: 20, fontSize: 16 },
  refreshBtn: { marginTop: 30, paddingVertical: 12, paddingHorizontal: 25, borderRadius: 15, backgroundColor: '#161616', borderWidth: 1, borderColor: '#8E44AD' },
  refreshText: { color: '#8E44AD', fontWeight: 'bold' }
});

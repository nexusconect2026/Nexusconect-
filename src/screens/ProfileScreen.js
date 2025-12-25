import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileScreen({ route, navigation }) {
  const targetId = route.params?.userId;
  const [profile, setProfile] = useState(null);
  const [myId, setMyId] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, [targetId]);

  async function fetchAll() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setMyId(user.id);
    const id = targetId || user.id;

    const { data: p } = await supabase.from('profiles').select('*').eq('id', id).single();
    setProfile(p);

    const { count: fers } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id);
    const { count: fing } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id);
    setCounts({ followers: fers || 0, following: fing || 0 });

    if (targetId && targetId !== user.id) {
      const { data: f } = await supabase.from('follows').select('*').match({ follower_id: user.id, following_id: id }).single();
      setIsFollowing(!!f);
      const { data: fr } = await supabase.from('friends').select('*').match({ user_id: user.id, friend_id: id }).single();
      setIsFriend(!!fr);
    }
    setLoading(false);
  }

  async function toggleFollow() {
    if (isFollowing) {
      await supabase.from('follows').delete().match({ follower_id: myId, following_id: targetId });
    } else {
      await supabase.from('follows').insert({ follower_id: myId, following_id: targetId });
    }
    fetchAll();
  }

  async function toggleFriend() {
    if (isFriend) {
      await supabase.from('friends').delete().or(`and(user_id.eq.${myId},friend_id.eq.${targetId}),and(user_id.eq.${targetId},friend_id.eq.${myId})`);
    } else {
      await supabase.from('friends').insert([{ user_id: myId, friend_id: targetId }, { user_id: targetId, friend_id: myId }]);
    }
    fetchAll();
  }

  if (loading) return <View style={styles.container}><ActivityIndicator color="#8E44AD" size="large" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Feather name="arrow-left" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>PERFIL</Text>
          <TouchableOpacity onPress={() => !targetId && navigation.navigate('EditProfile')}>
            <Feather name={targetId ? "more-horizontal" : "settings"} size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <Image source={{ uri: `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.custom_id}` }} style={styles.avatar} />
          <Text style={styles.name}>@{profile?.custom_id}</Text>
          <Text style={styles.levelBadge}>LEVEL {profile?.level}</Text>

          {targetId && targetId !== myId && (
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.mainBtn, isFollowing && styles.btnActive]} onPress={toggleFollow}>
                <Text style={styles.btnText}>{isFollowing ? "SEGUINDO" : "SEGUIR"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, isFriend && styles.btnActive]} onPress={toggleFriend}>
                <Feather name={isFriend ? "user-check" : "user-plus"} size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('ChatPrivado', { recipientId: targetId, recipientName: profile.custom_id })}>
                <Feather name="mail" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}><Text style={styles.statVal}>{counts.followers}</Text><Text style={styles.statLabel}>SEGUIDORES</Text></View>
            <View style={styles.statItem}><Text style={styles.statVal}>{counts.following}</Text><Text style={styles.statLabel}>SEGUINDO</Text></View>
            <View style={styles.statItem}><Text style={styles.statVal}>{profile?.nexus_coins}</Text><Text style={styles.statLabel}>COINS</Text></View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { color: '#FFF', fontWeight: 'bold', letterSpacing: 1 },
  profileSection: { alignItems: 'center', marginTop: 20 },
  avatar: { width: 100, height: 100, borderRadius: 35, borderWidth: 2, borderColor: '#8E44AD' },
  name: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginTop: 15 },
  levelBadge: { color: '#8E44AD', fontSize: 10, fontWeight: '900', marginTop: 5, backgroundColor: '#111', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5 },
  actions: { flexDirection: 'row', marginTop: 25, gap: 10 },
  mainBtn: { backgroundColor: '#1A1A1A', paddingHorizontal: 30, borderRadius: 12, height: 48, justifyContent: 'center', borderWidth: 1, borderColor: '#333' },
  iconBtn: { backgroundColor: '#1A1A1A', width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  btnActive: { backgroundColor: '#8E44AD', borderColor: '#8E44AD' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  statsRow: { flexDirection: 'row', marginTop: 40, width: '90%', backgroundColor: '#111', padding: 20, borderRadius: 20, justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statVal: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: '#444', fontSize: 8, fontWeight: '900', marginTop: 4 }
});

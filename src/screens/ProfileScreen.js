import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation, route }) {
  // Se vier um ID via rota, visualizamos outro perfil, se não, é o nosso
  const userIdToShow = route.params?.userId;
  const [isMyProfile, setIsMyProfile] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [profile, setProfile] = useState({
    id: '',
    custom_id: '',
    profile_bio: '',
    nexus_coins: 0,
    level: 1,
    role: 'user'
  });

  useEffect(() => {
    fetchData();
  }, [userIdToShow]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const targetId = userIdToShow || authUser.id;
      setIsMyProfile(targetId === authUser.id);

      // 1. Busca Dados do Perfil
      const { data: profData } = await supabase.from('profiles').select('*').eq('id', targetId).single();
      if (profData) setProfile(profData);

      // 2. Busca Seguidores (Contagem na tabela friendships)
      const { count: followersCount } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('user_id_2', targetId); // Quem me segue

      const { count: followingCount } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('user_id_1', targetId); // Quem eu sigo

      setStats({ followers: followersCount || 0, following: followingCount || 0 });

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    setLoading(true);
    const { error } = await supabase.from('profiles')
      .update({ profile_bio: profile.profile_bio })
      .eq('id', profile.id);
    
    if (!error) Alert.alert("Sucesso", "Perfil atualizado!");
    setLoading(false);
  }

  if (loading) return <View style={styles.loading}><ActivityIndicator color="#00D4FF" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Estilizado */}
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#00D4FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>@{profile.custom_id}</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Foto e Info Principal */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarBorder}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>#{profile.custom_id}</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lv.{profile.level}</Text>
            </View>
          </View>
          
          <Text style={styles.userName}>Nexus User</Text>
          <Text style={styles.userRole}>{profile.role.toUpperCase()}</Text>
        </View>

        {/* Contador Social (Seguidores/Seguindo) */}
        <View style={styles.socialBar}>
          <View style={styles.socialItem}>
            <Text style={styles.socialNumber}>{stats.followers}</Text>
            <Text style={styles.socialLabel}>Seguidores</Text>
          </View>
          <View style={styles.socialDivider} />
          <View style={styles.socialItem}>
            <Text style={styles.socialNumber}>{stats.following}</Text>
            <Text style={styles.socialLabel}>Seguindo</Text>
          </View>
          <View style={styles.socialDivider} />
          <View style={styles.socialItem}>
            <Text style={styles.socialNumber}>{profile.nexus_coins}</Text>
            <Text style={styles.socialLabel}>Moedas</Text>
          </View>
        </View>

        {/* Ações de Amizade (Só aparece se não for o MEU perfil) */}
        {!isMyProfile && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.followBtn}>
              <Text style={styles.followBtnText}>Seguir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.friendBtn}>
              <Ionicons name="person-add" size={20} color="#00D4FF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Bio Editável ou Fixa */}
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Sobre mim</Text>
          <TextInput
            style={[styles.bioInput, !isMyProfile && { borderBottomWidth: 0 }]}
            value={profile.profile_bio}
            onChangeText={(t) => isMyProfile && setProfile({...profile, profile_bio: t})}
            multiline
            editable={isMyProfile}
            placeholder="Nenhuma bio definida..."
            placeholderTextColor="#444"
          />
        </View>

        {isMyProfile && (
          <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
            <Text style={styles.saveBtnText}>SALVAR PERFIL</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  loading: { flex: 1, backgroundColor: '#050505', justifyContent: 'center' },
  headerNav: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  content: { alignItems: 'center', paddingBottom: 40 },
  
  profileHeader: { alignItems: 'center', marginTop: 10 },
  avatarBorder: { width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderColor: '#00D4FF', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarInner: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#00D4FF', fontWeight: 'bold', fontSize: 18 },
  levelBadge: { position: 'absolute', bottom: 0, backgroundColor: '#00D4FF', paddingHorizontal: 8, borderRadius: 10 },
  levelText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  
  userName: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  userRole: { color: '#00D4FF', fontSize: 10, letterSpacing: 2, marginTop: 5 },

  socialBar: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 20, padding: 20, width: '90%', marginTop: 30, justifyContent: 'space-around', alignItems: 'center' },
  socialItem: { alignItems: 'center' },
  socialNumber: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  socialLabel: { color: '#666', fontSize: 11, marginTop: 4 },
  socialDivider: { width: 1, height: 30, backgroundColor: '#222' },

  actionRow: { flexDirection: 'row', width: '90%', marginTop: 20, justifyContent: 'space-between' },
  followBtn: { flex: 1, backgroundColor: '#00D4FF', height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  followBtnText: { color: '#000', fontWeight: 'bold' },
  friendBtn: { width: 45, height: 45, borderRadius: 12, borderWidth: 1, borderColor: '#00D4FF', justifyContent: 'center', alignItems: 'center' },

  bioSection: { width: '90%', marginTop: 30 },
  sectionTitle: { color: '#444', fontSize: 12, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
  bioInput: { color: '#BBB', fontSize: 14, lineHeight: 20, borderBottomWidth: 1, borderBottomColor: '#222', paddingBottom: 10 },
  
  saveBtn: { backgroundColor: '#111', width: '90%', height: 55, borderRadius: 15, marginTop: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  saveBtnText: { color: '#00D4FF', fontWeight: 'bold' }
});

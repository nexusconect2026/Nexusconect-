import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather, MaterialIcons } from '@expo/vector-icons';

export default function AdminPanel({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('level', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  }

  async function handleVerify(userId, currentStatus) {
    const { error } = await supabase.from('profiles').update({ is_verified: !currentStatus }).eq('id', userId);
    if (!error) fetchUsers();
  }

  async function handleBan(userId, username) {
    Alert.alert(
      "BANIMENTO", 
      `Tem certeza que deseja expulsar @${username} do Nexus?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "BANIR", style: "destructive", onPress: async () => {
            // Lógica de Ban (Deletar ou desativar na sua tabela)
            await supabase.from('profiles').delete().eq('id', userId);
            fetchUsers();
          }
        }
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Feather name="arrow-left" size={24} color="#FFF" /></TouchableOpacity>
        <Text style={styles.headerTitle}>PAINEL DE CONTROLE</Text>
        <TouchableOpacity onPress={fetchUsers}><Feather name="refresh-cw" size={20} color="#8E44AD" /></TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#8E44AD" style={{marginTop: 50}} />
      ) : (
        <FlatList 
          data={users}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={{flex: 1}}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>@{item.custom_id}</Text>
                  {item.role === 'admin' && <View style={styles.staffBadge}><Text style={styles.staffText}>STAFF</Text></View>}
                </View>
                <Text style={styles.userMeta}>Nível {item.level} • {item.nexus_coins} Coins</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity 
                  style={[styles.btn, item.is_verified && styles.btnActive]} 
                  onPress={() => handleVerify(item.id, item.is_verified)}
                >
                  <MaterialIcons name="verified" size={20} color={item.is_verified ? "#00D4FF" : "#444"} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.btn} 
                  onPress={() => handleBan(item.id, item.custom_id)}
                >
                  <Feather name="trash-2" size={20} color="#E74C3C" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  userCard: { backgroundColor: '#161616', padding: 15, borderRadius: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  userName: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  staffBadge: { backgroundColor: '#E74C3C', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, marginLeft: 8 },
  staffText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },
  userMeta: { color: '#555', fontSize: 11, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  btnActive: { borderColor: '#00D4FF33' }
});

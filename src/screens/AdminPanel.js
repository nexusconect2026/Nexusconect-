import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function AdminPanel({ navigation }) {
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');

  async function handleBan() {
    if (!targetId) return;
    
    const { error } = await supabase.from('blacklist_network').insert({
      network_value: targetId,
      type: 'user_ban',
      reason: reason
    });

    if (error) Alert.alert("Erro", "Falha ao banir: " + error.message);
    else Alert.alert("Sucesso", "Usuário enviado para a Blacklist!");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={28} color="#FFD700" /></TouchableOpacity>
        <Text style={styles.title}>MODERAÇÃO NEXUS</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>ID DO USUÁRIO OU IP</Text>
        <TextInput style={styles.input} value={targetId} onChangeText={setTargetId} placeholder="Ex: 205" placeholderTextColor="#444" />
        
        <Text style={styles.label}>MOTIVO DO BANIMENTO</Text>
        <TextInput style={[styles.input, {height: 80}]} value={reason} onChangeText={setReason} multiline placeholder="Violação de termos..." placeholderTextColor="#444" />

        <TouchableOpacity style={styles.banBtn} onPress={handleBan}>
          <Text style={styles.banText}>APLICAR BANIMENTO</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: { flexDirection: 'row', padding: 20, alignItems: 'center' },
  title: { color: '#FFD700', fontSize: 18, fontWeight: 'bold', marginLeft: 20 },
  form: { padding: 20 },
  label: { color: '#FFD700', fontSize: 12, import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  SafeAreaView, ScrollView, ActivityIndicator, Alert 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather, MaterialIcons } from '@expo/vector-icons';

export default function AdminPanel({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, reports: 0, rooms: 0 });
  const [reports, setReports] = useState([]);
  const [tab, setTab] = useState('reports'); // 'reports' | 'logs' | 'users'

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    setLoading(true);
    try {
      // 1. Contagem rápida para o Dashboard
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: reportCount } = await supabase.from('user_reports').select('*', { count: 'exact', head: true });
      const { count: roomCount } = await supabase.from('rooms').select('*', { count: 'exact', head: true });

      setStats({ users: userCount || 0, reports: reportCount || 0, rooms: roomCount || 0 });

      // 2. Busca denúncias pendentes
      const { data: reportsData } = await supabase
        .from('user_reports')
        .select('*, reporter:reporter_id(custom_id), reported:reported_id(custom_id)')
        .order('created_at', { ascending: false });

      setReports(reportsData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const resolveReport = async (reportId) => {
    const { error } = await supabase
      .from('user_reports')
      .update({ status: 'resolved' })
      .eq('id', reportId);

    if (!error) {
      Alert.alert('Sucesso', 'Denúncia marcada como resolvida.');
      fetchAdminData();
    }
  };

  const renderReport = ({ item }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
        </View>
        <Text style={styles.reportTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      
      <Text style={styles.reportContent}>
        <Text style={styles.bold}>De:</Text> @{item.reporter?.custom_id} {'\n'}
        <Text style={styles.bold}>Alvo:</Text> @{item.reported?.custom_id}
      </Text>
      
      <Text style={styles.reasonText}>"{item.reason}: {item.details}"</Text>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.banBtn]}
          onPress={() => Alert.alert('Banir', 'Deseja banir este usuário?')}
        >
          <Text style={styles.actionBtnText}>BANIR</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.resolveBtn]}
          onPress={() => resolveReport(item.id)}
        >
          <Text style={styles.actionBtnText}>RESOLVER</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#8E44AD" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PAINEL DE CONTROLE</Text>
        <TouchableOpacity onPress={fetchAdminData}>
          <Feather name="refresh-cw" size={20} color="#8E44AD" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Dashboard Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.users}</Text>
            <Text style={styles.statLabel}>USUÁRIOS</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#E74C3C' }]}>{stats.reports}</Text>
            <Text style={styles.statLabel}>DENÚNCIAS</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.rooms}</Text>
            <Text style={styles.statLabel}>SALAS</Text>
          </View>
        </View>

        {/* Tabs de Navegação Interna */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, tab === 'reports' && styles.tabActive]} 
            onPress={() => setTab('reports')}
          >
            <Text style={[styles.tabText, tab === 'reports' && styles.tabTextActive]}>DENÚNCIAS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, tab === 'logs' && styles.tabActive]} 
            onPress={() => setTab('logs')}
          >
            <Text style={[styles.tabText, tab === 'logs' && styles.tabTextActive]}>LOGS</Text>
          </TouchableOpacity>
        </View>

        {/* Conteúdo Dinâmico */}
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator color="#8E44AD" style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              scrollEnabled={false}
              data={reports}
              renderItem={renderReport}
              keyExtractor={item => item.id}
              ListEmptyComponent={<Text style={styles.empty}>Nenhuma atividade pendente.</Text>}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  
  statsRow: { flexDirection: 'row', padding: 20, justifyContent: 'space-between' },
  statItem: { flex: 1, backgroundColor: '#121212', padding: 15, borderRadius: 15, alignItems: 'center', marginHorizontal: 5, borderWidth: 1, borderColor: '#1A1A1A' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: '#444', fontSize: 9, fontWeight: '900', marginTop: 5 },

  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20 },
  tab: { marginRight: 20, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#8E44AD' },
  tabText: { color: '#444', fontWeight: 'bold', fontSize: 13 },
  tabTextActive: { color: '#8E44AD' },

  content: { paddingHorizontal: 20, paddingBottom: 40 },
  reportCard: { backgroundColor: '#121212', borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#1A1A1A' },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  badge: { backgroundColor: 'rgba(142, 68, 173, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#8E44AD', fontSize: 10, fontWeight: 'bold' },
  reportTime: { color: '#333', fontSize: 11 },
  reportContent: { color: '#fff', fontSize: 14, lineHeight: 20 },
  bold: { color: '#8E44AD', fontWeight: 'bold' },
  reasonText: { color: '#666', fontSize: 13, fontStyle: 'italic', marginTop: 10 },

  actionRow: { flexDirection: 'row', marginTop: 20, gap: 10 },
  actionBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  banBtn: { backgroundColor: '#E74C3C' },
  resolveBtn: { backgroundColor: '#27AE60' },
  empty: { color: '#333', textAlign: 'center', marginTop: 50, fontWeight: 'bold' }
});
marginBottom: 10, fontWeight: 'bold' },
  input: { backgroundColor: '#111', color: '#FFF', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  banBtn: { backgroundColor: '#FF4444', padding: 18, borderRadius: 10, alignItems: 'center' },
  banText: { color: '#FFF', fontWeight: 'bold' }
});

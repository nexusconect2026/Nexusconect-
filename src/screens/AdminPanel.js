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
  label: { color: '#FFD700', fontSize: 12, marginBottom: 10, fontWeight: 'bold' },
  input: { backgroundColor: '#111', color: '#FFF', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  banBtn: { backgroundColor: '#FF4444', padding: 18, borderRadius: 10, alignItems: 'center' },
  banText: { color: '#FFF', fontWeight: 'bold' }
});

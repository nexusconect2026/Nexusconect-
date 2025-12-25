import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather } from '@expo/vector-icons';

export default function EditProfileScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) {
      setUsername(data.custom_id);
      setBio(data.profile_bio || '');
    }
  }

  async function handleSave() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('profiles')
      .update({ custom_id: username.toLowerCase(), profile_bio: bio })
      .eq('id', user.id);

    if (error) {
      Alert.alert("Erro", "Nome de usuário já em uso ou inválido.");
    } else {
      Alert.alert("Sucesso", "Perfil atualizado!");
      navigation.goBack();
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Feather name="x" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Editar Perfil</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveText, loading && { opacity: 0.5 }]}>Salvar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>NOME DE USUÁRIO</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />
        
        <Text style={styles.label}>BIOGRAFIA</Text>
        <TextInput 
          style={[styles.input, styles.bioInput]} 
          value={bio} 
          onChangeText={setBio} 
          multiline 
          placeholder="Conte um pouco sobre você..."
          placeholderTextColor="#444"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  saveText: { color: '#8E44AD', fontWeight: 'bold', fontSize: 16 },
  form: { padding: 25 },
  label: { color: '#8E44AD', fontSize: 11, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  input: { backgroundColor: '#161616', color: '#fff', padding: 15, borderRadius: 12, marginBottom: 25, borderWidth: 1, borderColor: '#222' },
  bioInput: { height: 100, textAlignVertical: 'top' }
});

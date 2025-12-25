import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TextInput, 
  TouchableOpacity, Alert, ActivityIndicator 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather } from '@expo/vector-icons';

export default function EditProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('profiles')
        .select('custom_id, profile_bio')
        .eq('id', user.id)
        .single();

      if (data) {
        setUsername(data.custom_id);
        setBio(data.profile_bio || '');
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function updateProfile() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const updates = {
      id: user.id,
      custom_id: username,
      profile_bio: bio,
      updated_at: new Date(),
    };

    const { error } = await supabase.from('profiles').upsert(updates);

    if (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
    } else {
      Alert.alert('Sucesso', 'Perfil atualizado!');
      navigation.goBack();
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="x" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EDITAR PERFIL</Text>
        <TouchableOpacity onPress={updateProfile} disabled={loading}>
          {loading ? <ActivityIndicator color="#8E44AD" /> : <Feather name="check" size={24} color="#8E44AD" />}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>NOME DE USUÁRIO (NEXUS ID)</Text>
        <TextInput 
          style={styles.input} 
          value={username} 
          onChangeText={setUsername} 
          placeholder="Seu ID..." 
          placeholderTextColor="#333"
        />

        <Text style={styles.label}>BIO</Text>
        <TextInput 
          style={[styles.input, styles.bioInput]} 
          value={bio} 
          onChangeText={setBio} 
          placeholder="Fale sobre você..." 
          placeholderTextColor="#333"
          multiline
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { color: '#FFF', fontWeight: 'bold' },
  content: { padding: 20 },
  label: { color: '#444', fontSize: 10, fontWeight: '900', marginBottom: 10, letterSpacing: 1 },
  input: { backgroundColor: '#111', color: '#FFF', padding: 15, borderRadius: 12, marginBottom: 25, borderWidth: 1, borderColor: '#1A1A1A' },
  bioInput: { height: 100, textAlignVertical: 'top' }
});

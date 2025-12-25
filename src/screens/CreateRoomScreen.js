import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  SafeAreaView, Alert, ActivityIndicator 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather } from '@expo/vector-icons';

export default function CreateRoomScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!title.trim()) {
      return Alert.alert('Erro', 'Dê um nome para sua sala.');
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Gerando um ID amigável para a sala (ex: room_12345)
      const roomId = `room_${Math.floor(Math.random() * 90000) + 10000}`;

      // 1. Criar a sala na tabela 'rooms'
      const { error: roomError } = await supabase
        .from('rooms')
        .insert([
          { 
            id: roomId, 
            owner_id: user.id, 
            title: title 
          }
        ]);

      if (roomError) throw roomError;

      // 2. Criar os assentos iniciais (8 assentos padrão como no seu RoomScreen)
      const seats = Array.from({ length: 8 }, (_, i) => ({
        room_id: roomId,
        seat_index: i,
        user_id: null,
        is_muted: false,
        is_locked: false
      }));

      const { error: seatError } = await supabase
        .from('room_seats')
        .insert(seats);

      if (seatError) throw seatError;

      Alert.alert('Sucesso!', 'Sua sala foi criada.');
      navigation.navigate('Lobby'); // Volta para o lobby para ver a sala nova

    } catch (error) {
      Alert.alert('Erro ao criar sala', error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="x" size={24} color="#8E44AD" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NOVA SALA</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>NOME DA SALA</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Networking e Tech"
          placeholderTextColor="#444"
          value={title}
          onChangeText={setTitle}
          maxLength={40}
        />
        <Text style={styles.hint}>Sua sala ficará visível para todos no Lobby.</Text>

        <TouchableOpacity 
          style={styles.createBtn} 
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createBtnText}>PUBLICAR SALA</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  content: { padding: 25, flex: 1, justifyContent: 'center' },
  label: { color: '#8E44AD', fontSize: 12, fontWeight: 'bold', marginBottom: 15 },
  input: { 
    backgroundColor: '#121212', 
    color: '#FFF', 
    fontSize: 22, 
    fontWeight: 'bold',
    padding: 20, 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: '#1A1A1A' 
  },
  hint: { color: '#444', fontSize: 13, marginTop: 15, textAlign: 'center' },
  createBtn: { 
    backgroundColor: '#8E44AD', 
    padding: 20, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginTop: 40 
  },
  createBtnText: { color: '#FFF', fontWeight: 'bold', letterSpacing: 1 }
});

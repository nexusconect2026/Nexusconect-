import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, SafeAreaView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather } from '@expo/vector-icons';

export default function RoomScreen({ route, navigation }) {
  const { roomId, title } = route.params;
  const [seats, setSeats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [myUser, setMyUser] = useState(null);
  const flatListRef = useRef();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setMyUser(user);
      await fetchSeats();
      await fetchMessages();
      await notifyEntry(user);
    };
    init();

    const sub = supabase.channel(`room_${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_seats', filter: `room_id=eq.${roomId}` }, () => fetchSeats())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}` }, (p) => handleMsg(p.new))
      .subscribe();

    const xpTimer = setInterval(() => gainXP(), 60000);
    return () => { supabase.removeChannel(sub); clearInterval(xpTimer); };
  }, []);

  async function notifyEntry(user) {
    // Busca se alguém que ME segue está na sala ou se eu sigo alguém
    const { data: followers } = await supabase.from('follows').select('follower_id').eq('following_id', user.id);
    if (followers?.length > 0) {
      await supabase.from('room_messages').insert({ room_id: roomId, user_id: user.id, content: "entrou na sala e está online! 👋" });
    }
  }

  async function gainXP() {
    if (!myUser) return;
    const { data: p } = await supabase.from('profiles').select('xp, level, nexus_coins').eq('id', myUser.id).single();
    let { xp, level, nexus_coins } = p;
    xp += 10;
    if (xp >= level * 100) { xp = 0; level += 1; nexus_coins += 200; Alert.alert("Level Up!", `Você agora é nível ${level}!`); }
    await supabase.from('profiles').update({ xp, level, nexus_coins }).eq('id', myUser.id);
  }

  async function fetchSeats() {
    const { data } = await supabase.from('room_seats').select('*, profiles:user_id(custom_id)').eq('room_id', roomId).order('seat_index');
    setSeats(data || []);
  }

  async function fetchMessages() {
    const { data } = await supabase.from('room_messages').select('*, profiles:user_id(custom_id)').eq('room_id', roomId).order('created_at', { ascending: true }).limit(50);
    setMessages(data || []);
  }

  async function handleMsg(msg) {
    const { data: p } = await supabase.from('profiles').select('custom_id').eq('id', msg.user_id).single();
    setMessages(prev => [...prev, { ...msg, profiles: { custom_id: p?.custom_id } }]);
  }

  async function send() {
    if (!newMessage.trim()) return;
    await supabase.from('room_messages').insert({ room_id: roomId, user_id: myUser.id, content: newMessage });
    setNewMessage('');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{color:'#E74C3C'}}>SAIR</Text></TouchableOpacity>
      </View>

      <View style={styles.seatGrid}>
        {seats.map(s => (
          <TouchableOpacity key={s.seat_index} style={styles.seat} onPress={() => s.user_id ? navigation.navigate('Profile', { userId: s.user_id }) : null}>
            <View style={[styles.circle, s.user_id && styles.activeCircle]}>
              <Text style={{color: s.user_id ? '#8E44AD' : '#333'}}>{s.profiles?.custom_id?.[0] || '+'}</Text>
            </View>
            <Text style={styles.seatName}>{s.profiles?.custom_id || 'Livre'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.chat}>
        <FlatList data={messages} keyExtractor={item => item.id} renderItem={({item}) => (
          <Text style={styles.chatLine}><Text style={{color:'#8E44AD', fontWeight:'bold'}}>{item.profiles?.custom_id}:</Text> {item.content}</Text>
        )} onContentSizeChange={() => flatListRef.current?.scrollToEnd()} />
      </View>

      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={newMessage} onChangeText={setNewMessage} placeholder="Conversar..." placeholderTextColor="#444" />
        <TouchableOpacity onPress={send}><Feather name="send" size={24} color="#8E44AD" /></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  title: { color: '#FFF', fontWeight: 'bold' },
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 10 },
  seat: { width: '23%', alignItems: 'center', margin: 4 },
  circle: { width: 55, height: 55, borderRadius: 20, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1A1A1A' },
  activeCircle: { borderColor: '#8E44AD' },
  seatName: { color: '#444', fontSize: 10, marginTop: 4 },
  chat: { flex: 1, backgroundColor: '#0D0D0D', margin: 15, borderRadius: 15, padding: 10 },
  chatLine: { color: '#CCC', marginBottom: 5, fontSize: 13 },
  inputRow: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#111', color: '#FFF', borderRadius: 10, padding: 12, marginRight: 10 }
});

import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  Alert, SafeAreaView, TextInput, KeyboardAvoidingView, 
  Platform, StatusBar 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather, MaterialIcons } from '@expo/vector-icons';

export default function RoomDetailScreen({ route, navigation }) {
  const { roomId, title } = route.params;
  const [seats, setSeats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [myUser, setMyUser] = useState(null);
  const flatListRef = useRef();

  useEffect(() => {
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setMyUser(user);
      fetchSeats();
      fetchMessages();
    };
    setup();

    const channel = supabase.channel(`room_${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_seats', filter: `room_id=eq.${roomId}` }, fetchSeats)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    const xpInterval = setInterval(() => handleXP(), 60000); // 1 minuto

    return () => {
      supabase.removeChannel(channel);
      clearInterval(xpInterval);
    };
  }, []);

  async function fetchSeats() {
    const { data } = await supabase.from('room_seats').select('*, profiles:user_id(custom_id, role)').eq('room_id', roomId).order('seat_index');
    setSeats(data || []);
  }

  async function fetchMessages() {
    const { data } = await supabase.from('room_messages').select('*, profiles:user_id(custom_id)').eq('room_id', roomId).order('created_at', { ascending: true }).limit(50);
    setMessages(data || []);
  }

  async function handleXP() {
    if (!myUser) return;
    const { data: p } = await supabase.from('profiles').select('xp, level, nexus_coins').eq('id', myUser.id).single();
    let { xp, level, nexus_coins } = p;
    xp += 15;
    if (xp >= level * 100) { xp = 0; level += 1; nexus_coins += 500; Alert.alert("LEVEL UP!", `Você subiu para o nível ${level}!`); }
    await supabase.from('profiles').update({ xp, level, nexus_coins }).eq('id', myUser.id);
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;
    await supabase.from('room_messages').insert({ room_id: roomId, user_id: myUser.id, content: newMessage });
    setNewMessage('');
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Feather name="chevron-down" size={28} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.goBack()}><Text style={styles.exitText}>SAIR</Text></TouchableOpacity>
      </View>

      <View style={styles.seatGrid}>
        {seats.map((s, i) => (
          <View key={i} style={styles.seatContainer}>
            <TouchableOpacity style={[styles.seat, s.user_id && styles.seatOccupied]}>
              <Text style={styles.seatChar}>{s.profiles?.custom_id?.[0] || '+'}</Text>
            </TouchableOpacity>
            <Text style={styles.seatName}>{s.profiles?.custom_id || 'Livre'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.chatArea}>
        <FlatList 
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => (
            <Text style={styles.msgText}><Text style={styles.msgUser}>{item.profiles?.custom_id}:</Text> {item.content}</Text>
          )}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inputBar}>
        <TextInput style={styles.input} placeholder="Diga algo..." placeholderTextColor="#666" value={newMessage} onChangeText={setNewMessage} />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}><Feather name="send" size={20} color="#fff" /></TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  exitBtn: { backgroundColor: '#E74C3C22', padding: 8, borderRadius: 10 },
  exitText: { color: '#E74C3C', fontWeight: 'bold', fontSize: 12 },
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 10 },
  seatContainer: { width: '25%', alignItems: 'center', marginBottom: 15 },
  seat: { width: 55, height: 55, borderRadius: 20, backgroundColor: '#161616', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  seatOccupied: { borderColor: '#8E44AD', backgroundColor: '#8E44AD11' },
  seatChar: { color: '#8E44AD', fontWeight: 'bold' },
  seatName: { color: '#666', fontSize: 10, marginTop: 5 },
  chatArea: { flex: 1, backgroundColor: '#0A0A0A', margin: 15, borderRadius: 20, padding: 15 },
  msgText: { color: '#ccc', marginBottom: 8, fontSize: 13 },
  msgUser: { color: '#8E44AD', fontWeight: 'bold' },
  inputBar: { flexDirection: 'row', padding: 20, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#161616', color: '#fff', borderRadius: 12, padding: 12, marginRight: 10 },
  sendBtn: { backgroundColor: '#8E44AD', width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }
});

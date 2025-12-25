import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  Alert, SafeAreaView, TextInput, KeyboardAvoidingView, 
  Platform, Image, StatusBar 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather, MaterialIcons } from '@expo/vector-icons';

export default function RoomScreen({ route, navigation }) {
  const { roomId, title } = route.params;
  const [seats, setSeats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [myUser, setMyUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const flatListRef = useRef();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setMyUser(user);
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setMyProfile(profile);

      await fetchSeats();
      await fetchMessages();
      await notifyEntry(user, profile);
    };
    init();

    const sub = supabase.channel(`room_${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_seats', filter: `room_id=eq.${roomId}` }, () => fetchSeats())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}` }, (p) => handleMsg(p.new))
      .subscribe();

    // Sua lógica de XP original aprimorada
    const xpTimer = setInterval(() => gainXP(), 60000); 

    return () => { 
      supabase.removeChannel(sub); 
      clearInterval(xpTimer); 
    };
  }, []);

  async function notifyEntry(user, profile) {
    // Notifica no chat que o usuário entrou
    await supabase.from('room_messages').insert({ 
      room_id: roomId, 
      user_id: user.id, 
      content: "entrou na elite da sala! 👋",
      is_system: true 
    });
  }

  async function gainXP() {
    if (!myUser) return;
    const { data: p } = await supabase.from('profiles').select('xp, level, nexus_coins').eq('id', myUser.id).single();
    let { xp, level, nexus_coins } = p;
    
    xp += 15; // Aumentei um pouco o XP por minuto
    if (xp >= level * 120) { 
      xp = 0; 
      level += 1; 
      nexus_coins += 500; // Bónus de Level UP
      Alert.alert("LEVEL UP!", `Parabéns! Alcançaste o nível ${level} e ganhaste 500 NC!`); 
    }
    await supabase.from('profiles').update({ xp, level, nexus_coins }).eq('id', myUser.id);
  }

  async function fetchSeats() {
    const { data } = await supabase.from('room_seats')
      .select('*, profiles:user_id(custom_id, role, is_verified)')
      .eq('room_id', roomId)
      .order('seat_index');
    setSeats(data || []);
  }

  async function fetchMessages() {
    const { data } = await supabase.from('room_messages')
      .select('*, profiles:user_id(custom_id, role)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(50);
    setMessages(data || []);
  }

  async function handleMsg(msg) {
    const { data: p } = await supabase.from('profiles').select('custom_id, role').eq('id', msg.user_id).single();
    setMessages(prev => [...prev, { ...msg, profiles: { custom_id: p?.custom_id, role: p?.role } }]);
  }

  async function send() {
    if (!newMessage.trim()) return;
    await supabase.from('room_messages').insert({ room_id: roomId, user_id: myUser.id, content: newMessage });
    setNewMessage('');
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER PREMIUM */}
      <View style={styles.header}>
        <View>
          <Text style={styles.roomLabel}>SALA ATIVA</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.exitText}>SAIR</Text>
        </TouchableOpacity>
      </View>

      {/* GRID DE ASSENTOS COM SELOS */}
      <View style={styles.seatGrid}>
        {seats.map(s => (
          <TouchableOpacity 
            key={s.seat_index} 
            style={styles.seat} 
            onPress={() => s.user_id ? navigation.navigate('Profile', { userId: s.user_id }) : null}
          >
            <View style={[styles.circle, s.user_id && styles.activeCircle, s.profiles?.role === 'admin' && styles.adminCircle]}>
              {s.user_id ? (
                <Text style={styles.initialText}>{s.profiles?.custom_id?.[0].toUpperCase()}</Text>
              ) : (
                <Feather name="plus" size={18} color="#222" />
              )}
              {s.profiles?.role === 'admin' && <View style={styles.miniStaffBadge} />}
            </View>
            <Text style={[styles.seatName, s.user_id && {color: '#fff'}]} numberOfLines={1}>
              {s.profiles?.custom_id || 'Livre'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ÁREA DE CHAT DARK */}
      <View style={styles.chatContainer}>
        <FlatList 
          ref={flatListRef}
          data={messages} 
          keyExtractor={item => item.id} 
          renderItem={({item}) => (
            <View style={styles.messageRow}>
              <Text style={[styles.chatName, item.profiles?.role === 'admin' && {color: '#FF3B30'}]}>
                {item.profiles?.custom_id}:
              </Text>
              <Text style={styles.chatContent}> {item.content}</Text>
            </View>
          )} 
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()} 
        />
      </View>

      {/* INPUT ROXO NEXUS */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputRow}>
          <TextInput 
            style={styles.input} 
            value={newMessage} 
            onChangeText={setNewMessage} 
            placeholder="Diga algo para a elite..." 
            placeholderTextColor="#444" 
          />
          <TouchableOpacity style={styles.sendBtn} onPress={send}>
            <Feather name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#161616' },
  roomLabel: { color: '#8E44AD', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  exitBtn: { backgroundColor: 'rgba(231, 76, 60, 0.1)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  exitText: { color: '#E74C3C', fontWeight: 'bold', fontSize: 12 },
  
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 10, marginTop: 10 },
  seat: { width: '23%', alignItems: 'center', margin: 4 },
  circle: { width: 65, height: 65, borderRadius: 24, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1A1A1A', position: 'relative' },
  activeCircle: { borderColor: '#8E44AD', backgroundColor: '#161616' },
  adminCircle: { borderColor: '#FF3B30' },
  miniStaffBadge: { position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF3B30', borderWidth: 2, borderColor: '#0A0A0A' },
  initialText: { color: '#8E44AD', fontWeight: 'bold', fontSize: 20 },
  seatName: { color: '#444', fontSize: 11, marginTop: 6, fontWeight: '500' },
  
  chatContainer: { flex: 1, backgroundColor: '#0D0D0D', marginHorizontal: 20, margin

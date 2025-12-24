import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  Alert, SafeAreaView, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function RoomScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { roomId, title } = route.params;

  // Estados
  const [seats, setSeats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [myUser, setMyUser] = useState(null);
  
  const flatListRef = useRef();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setMyUser(user);
      await fetchSeats();
      await fetchMessages();
    };
    init();

    // Inscrição Realtime para Assentos e Mensagens
    const roomChannel = supabase.channel(`room_interaction_${roomId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_seats', 
        filter: `room_id=eq.${roomId}` 
      }, () => fetchSeats())
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'room_messages', 
        filter: `room_id=eq.${roomId}` 
      }, (payload) => {
        handleNewMessage(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(roomChannel); };
  }, []);

  async function fetchSeats() {
    const { data } = await supabase
      .from('room_seats')
      .select(`seat_index, user_id, is_muted, is_locked, profiles:user_id (custom_id, avatar_url, level)`)
      .eq('room_id', roomId)
      .order('seat_index', { ascending: true });
    setSeats(data || []);
    setLoading(false);
  }

  async function fetchMessages() {
    const { data } = await supabase
      .from('room_messages')
      .select('id, content, user_id, created_at, profiles:user_id (custom_id)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(50);
    setMessages(data || []);
  }

  async function handleNewMessage(msg) {
    // Busca o custom_id do remetente para exibir corretamente no chat
    const { data } = await supabase.from('profiles').select('custom_id').eq('id', msg.user_id).single();
    const fullMsg = { ...msg, profiles: { custom_id: data?.custom_id || '...' } };
    setMessages(prev => [...prev, fullMsg]);
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;
    const { error } = await supabase.from('room_messages').insert({
      room_id: roomId,
      user_id: myUser.id,
      content: newMessage
    });
    if (!error) setNewMessage('');
  }

  async function handleSeatPress(seat) {
    if (seat.is_locked) return Alert.alert("Bloqueado", "Este assento está trancado.");
    
    if (seat.user_id === myUser?.id) {
      // Sair do assento
      await supabase.from('room_seats').update({ user_id: null, is_muted: false })
        .match({ room_id: roomId, seat_index: seat.seat_index });
    } else {
      if (seat.user_id) {
        // Abrir perfil de quem está sentado
        navigation.navigate('Profile', { userId: seat.user_id });
      } else {
        // Sentar (Levanta de outros antes)
        await supabase.from('room_seats').update({ user_id: null }).match({ room_id: roomId, user_id: myUser?.id });
        await supabase.from('room_seats').update({ user_id: myUser?.id }).match({ room_id: roomId, seat_index: seat.seat_index });
      }
    }
  }

  const renderSeat = (seat) => (
    <View style={styles.seatWrapper} key={seat.seat_index}>
      <TouchableOpacity 
        style={[styles.seatCircle, seat.user_id ? styles.seatOccupied : styles.seatEmpty]} 
        onPress={() => handleSeatPress(seat)}
      >
        {seat.is_locked ? (
          <Ionicons name="lock-closed" size={18} color="#444" />
        ) : seat.user_id ? (
          <View style={styles.avatarInner}>
            <Text style={styles.avatarText}>{seat.profiles?.custom_id?.[0]?.toUpperCase() || '?'}</Text>
            {seat.is_muted && <View style={styles.muteIcon}><Ionicons name="mic-off" size={10} color="white" /></View>}
          </View>
        ) : (
          <Text style={styles.seatNumber}>{seat.seat_index + 1}</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.seatName} numberOfLines={1}>
        {seat.user_id ? `@${seat.profiles?.custom_id}` : "Livre"}
      </Text>
    </View>
  );

  return (
    <LinearGradient colors={['#0F0F0F', '#050505']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-down" size={30} color="#00D4FF" /></TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.roomTitle}>{title}</Text>
              <Text style={styles.roomID}>ID: {roomId.split('_')[1] || roomId}</Text>
            </View>
            <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.goBack()}><Text style={styles.exitText}>SAIR</Text></TouchableOpacity>
          </View>

          {/* Grid de Assentos (Palco) */}
          <View style={styles.gridSection}>
            <View style={styles.row}>{seats.slice(0, 4).map(renderSeat)}</View>
            <View style={styles.row}>{seats.slice(4, 8).map(renderSeat)}</View>
          </View>

          {/* Chat da Sala */}
          <View style={styles.chatArea}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.msgLine}>
                  <Text style={styles.msgUser}>{item.profiles?.custom_id}: </Text>
                  <Text style={styles.msgText}>{item.content}</Text>
                </View>
              )}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Barra de Ferramentas */}
          <View style={styles.footer}>
            <View style={styles.inputContainer}>
              <TextInput 
                style={styles.input} 
                placeholder="Enviar mensagem..." 
                placeholderTextColor="#666" 
                value={newMessage}
                onChangeText={setNewMessage}
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity onPress={sendMessage}><Ionicons name="send" size={20} color="#00D4FF" /></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.iconCircle}><Ionicons name="mic" size={24} color="#FFF" /></TouchableOpacity>
            <TouchableOpacity style={styles.iconCircle}><Ionicons name="gift" size={24} color="#00D4FF" /></TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  roomTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  roomID: { color: '#444', fontSize: 10 },
  exitBtn: { backgroundColor: '#FF4444', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 15 },
  exitText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  
  gridSection: { paddingVertical: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 25 },
  seatWrapper: { alignItems: 'center', width: '22%' },
  seatCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  seatEmpty: { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: '#222', borderStyle: 'dashed' },
  seatOccupied: { backgroundColor: '#111', borderColor: '#00D4FF', borderWidth: 2 },
  seatNumber: { color: '#333', fontSize: 14, fontWeight: 'bold' },
  seatName: { color: '#666', fontSize: 9, marginTop: 5, fontWeight: 'bold' },
  avatarInner: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#00D4FF', fontSize: 18, fontWeight: 'bold' },
  muteIcon: { position: 'absolute', bottom: -10, right: -10, backgroundColor: 'red', borderRadius: 10, padding: 2 },

  chatArea: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', marginHorizontal: 15, borderRadius: 15, padding: 10, marginBottom: 10 },
  msgLine: { flexDirection: 'row', marginBottom: 4, flexWrap: 'wrap' },
  msgUser: { color: '#00D4FF', fontWeight: 'bold', fontSize: 12 },
  msgText: { color: '#EEE', fontSize: 12 },

  footer: { flexDirection: 'row', alignItems: 'center', padding: 10, paddingBottom: 20, justifyContent: 'space-between' },
  inputContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#111', borderRadius: 20, alignItems: 'center', paddingHorizontal: 15, height: 40, marginRight: 10 },
  input: { flex: 1, color: '#FFF', fontSize: 13 },
  iconCircle: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', marginLeft: 5 }
});

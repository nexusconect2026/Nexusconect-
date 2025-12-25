import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, 
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather } from '@expo/vector-icons';

export default function ChatPrivado({ route, navigation }) {
  const { recipientId, recipientName } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [myId, setMyId] = useState(null);
  const [canSend, setCanSend] = useState(true);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef();

  useEffect(() => {
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setMyId(user.id);
      await fetchMessages(user.id);
      setLoading(false);
    };
    setup();

    const channel = supabase.channel(`chat_${recipientId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        if ((msg.sender_id === myId && msg.receiver_id === recipientId) || 
            (msg.sender_id === recipientId && msg.receiver_id === myId)) {
          setMessages(prev => [...prev, msg]);
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myId]);

  // Re-checa limites toda vez que a lista de mensagens mudar
  useEffect(() => {
    if (myId) checkLimits();
  }, [messages]);

  async function fetchMessages(userId) {
    const { data } = await supabase.from('messages').select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  }

  async function checkLimits() {
    // 1. Amizade?
    const { data: friend } = await supabase.from('friends')
      .select('*').match({ user_id: myId, friend_id: recipientId }).single();

    // 2. Seguidores Mútuos?
    const { data: f1 } = await supabase.from('follows').select('*').match({ follower_id: myId, following_id: recipientId }).single();
    const { data: f2 } = await supabase.from('follows').select('*').match({ follower_id: recipientId, following_id: myId }).single();

    if (friend || (f1 && f2)) {
      setCanSend(true);
    } else {
      const mySentCount = messages.filter(m => m.sender_id === myId).length;
      if (mySentCount >= 3) setCanSend(false);
      else setCanSend(true);
    }
  }

  async function sendMessage() {
    if (!text.trim() || !canSend) return;

    const { error } = await supabase.from('messages').insert({ 
      sender_id: myId, 
      receiver_id: recipientId, 
      content: text 
    });
    
    if (!error) setText('');
    else Alert.alert("Erro", "Não foi possível enviar a mensagem.");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Feather name="arrow-left" size={24} color="#8E44AD" /></TouchableOpacity>
        <View style={{alignItems: 'center'}}>
           <Text style={styles.headerTitle}>@{recipientName}</Text>
           {!canSend && <Text style={styles.limitLabel}>LIMITE ALCANÇADO (Siga de volta para liberar)</Text>}
        </View>
        <View style={{width: 24}} />
      </View>

      {loading ? <ActivityIndicator style={{flex:1}} color="#8E44AD" /> : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.sender_id === myId ? styles.myBubble : styles.theirBubble]}>
              <Text style={[styles.msgText, { color: item.sender_id === myId ? '#fff' : '#ccc' }]}>{item.content}</Text>
            </View>
          )}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputArea}>
          <TextInput 
            style={[styles.input, !canSend && styles.inputDisabled]} 
            value={text} 
            onChangeText={setText} 
            placeholder={canSend ? "Escreva aqui..." : "Chat bloqueado"} 
            placeholderTextColor="#444"
            editable={canSend}
          />
          <TouchableOpacity onPress={sendMessage} style={[styles.sendBtn, !canSend && { backgroundColor: '#222' }]} disabled={!canSend}>
            <Feather name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', padding: 20, alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#161616' },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  limitLabel: { color: '#E74C3C', fontSize: 9, fontWeight: 'bold', marginTop: 2 },
  bubble: { maxWidth: '75%', padding: 14, borderRadius: 16, marginVertical: 4, marginHorizontal: 20 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#8E44AD', borderBottomRightRadius: 4 },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: '#161616', borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 20 },
  inputArea: { flexDirection: 'row', padding: 15, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#161616' },
  input: { flex: 1, backgroundColor: '#121212', color: '#FFF', borderRadius: 12, paddingHorizontal: 15, height: 48, marginRight: 10 },
  inputDisabled: { opacity: 0.3 },
  sendBtn: { backgroundColor: '#8E44AD', width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }
});

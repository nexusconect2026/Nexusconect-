import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ChatPrivado({ route, navigation }) {
  const { recipientId, recipientName } = route.params; // Recebe de quem você abriu o chat
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [myId, setMyId] = useState(null);
  const flatListRef = useRef();

  useEffect(() => {
    setupChat();
    
    // Realtime para mensagens privadas
    const channel = supabase.channel(`private_${recipientId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages'
      }, (payload) => {
        // Verifica se a mensagem é entre esses dois usuários específicos
        const msg = payload.new;
        if ((msg.sender_id === myId && msg.receiver_id === recipientId) || 
            (msg.sender_id === recipientId && msg.receiver_id === myId)) {
          setMessages(prev => [...prev, msg]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myId]);

  async function setupChat() {
    const { data: { user } } = await supabase.auth.getUser();
    setMyId(user.id);

    // Busca histórico de mensagens
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    
    setMessages(data || []);
  }

  async function sendMessage() {
    if (!text.trim()) return;
    const { error } = await supabase.from('messages').insert({
      sender_id: myId,
      receiver_id: recipientId,
      content: text
    });
    if (!error) setText('');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#00D4FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{recipientName}</Text>
        <View style={{width: 24}} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.sender_id === myId ? styles.myBubble : styles.theirBubble]}>
            <Text style={styles.msgText}>{item.content}</Text>
          </View>
        )}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Mensagem privada..."
          placeholderTextColor="#444"
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <Ionicons name="send" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: { flexDirection: 'row', padding: 20, alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#111' },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 15, marginVertical: 5, marginHorizontal: 15 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#00D4FF', borderBottomRightRadius: 2 },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: '#1A1A1A', borderBottomLeftRadius: 2 },
  msgText: { color: '#000', fontWeight: '500' },
  inputArea: { flexDirection: 'row', padding: 15, alignItems: 'center', backgroundColor: '#0A0A0A' },
  input: { flex: 1, backgroundColor: '#111', color: '#FFF', borderRadius: 25, paddingHorizontal: 20, height: 45, marginRight: 10 },
  sendBtn: { backgroundColor: '#00D4FF', width: 45, height: 45, borderRadius: 23, justifyContent: 'center', alignItems: 'center' }
});

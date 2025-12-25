import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, 
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather, MaterialIcons } from '@expo/vector-icons';

export default function ChatPrivado({ route, navigation }) {
  const { recipientId, recipientName } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [myProfile, setMyProfile] = useState(null);
  const [canSend, setCanSend] = useState(true);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef();

  useEffect(() => {
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setMyProfile(profile);
      await fetchMessages(user.id);
      setLoading(false);
    };
    setup();

    const channel = supabase.channel(`chat_${recipientId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        if ((msg.sender_id === myProfile?.id && msg.receiver_id === recipientId) || 
            (msg.sender_id === recipientId && msg.receiver_id === myProfile?.id)) {
          setMessages(prev => [...prev, msg]);
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myProfile?.id]);

  useEffect(() => {
    if (myProfile) checkLimits();
  }, [messages, myProfile]);

  async function fetchMessages(userId) {
    const { data } = await supabase.from('messages').select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  }

  async function checkLimits() {
    // 1. Staff e Aristocracia não têm limites
    if (myProfile.role === 'admin' || myProfile.role === 'aristocracy_king') {
      setCanSend(true);
      return;
    }

    // 2. Checar amizade ou seguidores mútuos
    const { data: friend } = await supabase.from('friends')
      .select('*').match({ user_id: myProfile.id, friend_id: recipientId, status: 'accepted' }).single();

    const { data: f1 } = await supabase.from('follows').select('*').match({ follower_id: myProfile.id, following_id: recipientId }).single();
    const { data: f2 } = await supabase.from('follows').select('*').match({ follower_id: recipientId, following_id: myProfile.id }).single();

    if (friend || (f1 && f2)) {
      setCanSend(true);
    } else {
      const mySentCount = messages.filter(m => m.sender_id === myProfile.id).length;
      setCanSend(mySentCount < 3);
    }
  }

  async function sendMessage() {
    if (!text.trim() || !canSend) return;

    const { error } = await supabase.from('messages').insert({ 
      sender_id: myProfile.id, 
      receiver_id: recipientId, 
      content: text 
    });
    
    if (!error) {
      setText('');
      fetchMessages(myProfile.id);
    } else {
      Alert.alert("Erro", "Falha na conexão.");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
           <Text style={styles.headerTitle}>@{recipientName.toUpperCase()}</Text>
           {!canSend && (
             <View style={styles.limitBadge}>
               <Text style={styles.limitText}>LIMITE ATINGIDO</Text>
             </View>
           )}
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: recipientId })}>
          <Feather name="user" size={22} color="#8E44AD" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#8E44AD" /></View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.sender_id === myProfile.id ? styles.myBubble : styles.theirBubble]}>
              <Text style={[styles.msgText, item.sender_id === myProfile.id ? styles.myText : styles.theirText]}>
                {item.content}
              </Text>
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
            placeholder={canSend ? "Envie uma mensagem..." : "Siga de volta para liberar"} 
            placeholderTextColor="#444"
            editable={canSend}
          />
          <TouchableOpacity 
            onPress={sendMessage} 
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]} 
            disabled={!canSend}
          >
            <Feather name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', padding: 20, alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0F0F0F', borderBottomWidth: 1, borderBottomColor: '#161616' },
  headerInfo: { alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  limitBadge: { backgroundColor: '#E74C3C22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, marginTop: 4 },
  limitText: { color: '#E74C3C', fontSize: 8, fontWeight: 'bold' },
  list: { padding: 20 },
  center: { flex: 1, justifyContent: 'center' },
  bubble: { maxWidth: '80%', padding: 14, borderRadius: 18, marginBottom: 12 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#8E44AD', borderBottomRightRadius: 2 },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: '#161616', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#222' },
  msgText: { fontSize: 14, lineHeight: 20 },
  myText: { color: '#FFF' },
  theirText: { color: '#BBB' },
  inputArea: { flexDirection: 'row', padding: 20, alignItems: 'center', backgroundColor: '#0F0F0F' },
  input: { flex: 1, backgroundColor: '#161616', color: '#FFF', borderRadius: 15, paddingHorizontal: 15, height: 50, marginRight: 10, borderWidth: 1, borderColor: '#222' },
  inputDisabled: { opacity: 0.5 },
  sendBtn: { backgroundColor: '#8E44AD', width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#222' }
});

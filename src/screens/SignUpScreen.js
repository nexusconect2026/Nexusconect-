import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather } from '@expo/vector-icons';

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!email || !password || !username) return Alert.alert("Aviso", "Preencha tudo.");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.user) {
        await supabase.from('profiles').insert([{ 
          id: data.user.id, 
          custom_id: username.toLowerCase().trim(), 
          nexus_coins: 500, 
          level: 1,
          role: 'user',
          is_verified: false
        }]);
        Alert.alert("Sucesso", "Bem-vindo ao Nexus!");
        navigation.navigate('Login');
      }
    } catch (e) { Alert.alert("Erro", e.message); }
    finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Feather name="arrow-left" size={24} color="#8E44AD" />
        </TouchableOpacity>
        <Text style={styles.title}>Membro da Elite</Text>
        <Text style={styles.subtitle}>Crie sua identidade digital no Nexus.</Text>

        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Username" placeholderTextColor="#444" value={username} onChangeText={setUsername} />
          <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#444" value={email} onChangeText={setEmail} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#444" value={password} onChangeText={setPassword} secureTextEntry />
          
          <TouchableOpacity style={styles.btn} onPress={handleSignUp} disabled={loading}>
            <Text style={styles.btnText}>{loading ? "REGISTRANDO..." : "FINALIZAR CADASTRO"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  content: { padding: 30, flexGrow: 1, justifyContent: 'center' },
  back: { marginBottom: 20 },
  title: { color: '#fff', fontSize: 32, fontWeight: '800' },
  subtitle: { color: '#666', fontSize: 16, marginBottom: 40 },
  input: { backgroundColor: '#161616', color: '#fff', padding: 20, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  btn: { backgroundColor: '#8E44AD', padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold' }
});

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return Alert.alert("Atenção", "Preencha as credenciais.");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert("Erro", "E-mail ou senha incorretos.");
    else navigation.replace('Lobby');
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>NEXUS</Text>
          <Text style={styles.tagline}>A elite da conectividade.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Feather name="mail" size={20} color="#666" style={styles.icon} />
            <TextInput 
              style={styles.input} 
              placeholder="E-mail" 
              placeholderTextColor="#444" 
              value={email} 
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather name="lock" size={20} color="#666" style={styles.icon} />
            <TextInput 
              style={styles.input} 
              placeholder="Senha" 
              placeholderTextColor="#444" 
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry 
            />
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            <Text style={styles.loginBtnText}>{loading ? "AUTENTICANDO..." : "ENTRAR"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.footerLink}>
            <Text style={styles.footerText}>Não possui conta? <Text style={styles.highlight}>Cadastre-se</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  header: { alignItems: 'center', marginBottom: 60 },
  brand: { color: '#fff', fontSize: 42, fontWeight: '900', letterSpacing: 8 },
  tagline: { color: '#8E44AD', fontSize: 12, fontWeight: 'bold', letterSpacing: 2, marginTop: 5 },
  form: { gap: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161616', borderRadius: 12, borderWidth: 1, borderColor: '#222', paddingHorizontal: 15 },
  icon: { marginRight: 10 },
  input: { flex: 1, color: '#fff', paddingVertical: 18, fontSize: 16 },
  loginBtn: { backgroundColor: '#8E44AD', padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  footerLink: { marginTop: 25, alignItems: 'center' },
  footerText: { color: '#666', fontSize: 14 },
  highlight: { color: '#8E44AD', fontWeight: 'bold' }
});

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Erro', error.message);
    setLoading(false);
  }

  async function handleSignUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert('Erro', 'Verifique seu e-mail para confirmar o cadastro!');
    else Alert.alert('Sucesso', 'Conta criada! Confirme seu e-mail.');
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NEXUS CONECT</Text>
      <TextInput 
        style={styles.input} 
        placeholder="E-mail" 
        placeholderTextColor="#999"
        value={email} 
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput 
        style={styles.input} 
        placeholder="Senha" 
        placeholderTextColor="#999"
        secureTextEntry 
        value={password} 
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Carregando...' : 'ENTRAR'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleSignUp}>
        <Text style={styles.linkText}>Criar nova conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#050505' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#00D4FF', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#1A1A1A', color: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15 },
  button: { backgroundColor: '#00D4FF', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  linkText: { color: '#00D4FF', textAlign: 'center', marginTop: 20 }
});

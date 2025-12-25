import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, SafeAreaView, ScrollView, ActivityIndicator 
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function SignUpScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customId, setCustomId] = useState('');
  const [personality, setPersonality] = useState('');

  async function handleSignUp() {
    if (!customId || !personality) return Alert.alert('Atenção', 'Complete seu perfil.');
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      Alert.alert('Erro', authError.message);
      setLoading(false);
      return;
    }
    const { error: profileError } = await supabase.from('profiles').insert([
      { id: data.user.id, custom_id: customId, personality_type: personality, nexus_coins: 500, level: 1 }
    ]);
    if (profileError) Alert.alert('Erro', 'ID já existe.');
    else navigation.navigate('Lobby');
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand}>NEXUS</Text>
        {step === 1 ? (
          <View style={styles.card}>
            <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#555" onChangeText={setEmail}/>
            <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#555" secureTextEntry onChangeText={setPassword}/>
            <TouchableOpacity style={styles.mainBtn} onPress={() => setStep(2)}><Text style={styles.mainBtnText}>PRÓXIMO</Text></TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <TextInput style={styles.input} placeholder="@SeuID" placeholderTextColor="#555" onChangeText={setCustomId}/>
            <View style={styles.grid}>
              {['Explorador', 'Líder', 'Criativo'].map(t => (
                <TouchableOpacity key={t} style={[styles.chip, personality === t && styles.chipActive]} onPress={() => setPersonality(t)}>
                  <Text style={[styles.chipText, personality === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.mainBtn} onPress={handleSignUp} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>FINALIZAR</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0A0A' },
  container: { padding: 25, alignItems: 'center' },
  brand: { color: '#8E44AD', fontSize: 32, fontWeight: '800', letterSpacing: 5, marginVertical: 40 },
  card: { backgroundColor: '#121212', padding: 25, borderRadius: 20, width: '100%', borderWidth: 1, borderColor: '#1A1A1A' },
  input: { backgroundColor: '#1A1A1A', color: '#fff', padding: 15, borderRadius: 12, marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  chip: { padding: 10, borderRadius: 10, backgroundColor: '#1A1A1A' },
  chipActive: { backgroundColor: '#8E44AD' },
  chipText: { color: '#666' },
  chipTextActive: { color: '#fff' },
  mainBtn: { backgroundColor: '#8E44AD', padding: 18, borderRadius: 12, alignItems: 'center' },
  mainBtnText: { color: '#fff', fontWeight: 'bold' }
});

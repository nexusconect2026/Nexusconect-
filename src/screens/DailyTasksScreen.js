import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function DailyTasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [completed, setCompleted] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    const { data: t } = await supabase.from('daily_tasks').select('*');
    const { data: { user } } = await supabase.auth.getUser();
    const { data: c } = await supabase.from('user_tasks_completed').select('task_key').eq('user_id', user.id);
    setTasks(t || []);
    setCompleted(c?.map(item => item.task_key) || []);
  }

  async function claimTask(task) {
    if (completed.includes(task.task_key)) return;
    const { data: { user } } = await supabase.auth.getUser();
    
    // Simulação de check (num app real você verificaria se o requisito foi atendido)
    await supabase.from('user_tasks_completed').insert({ user_id: user.id, task_key: task.task_key });
    const { data: p } = await supabase.from('profiles').select('nexus_coins').eq('id', user.id).single();
    await supabase.from('profiles').update({ nexus_coins: p.nexus_coins + task.coin_reward }).eq('id', user.id);
    
    Alert.alert("Sucesso!", `Você resgatou ${task.coin_reward} NC!`);
    fetchTasks();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Missões Diárias</Text>
        <Text style={styles.subtitle}>Obtenha Nexus Coins para a loja</Text>
      </View>

      <FlatList 
        data={tasks}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({item}) => (
          <View style={styles.card}>
            <MaterialCommunityIcons name="trophy-outline" size={30} color="#8E44AD" />
            <View style={{flex:1, marginLeft: 15}}>
              <Text style={styles.taskName}>{item.task_name}</Text>
              <Text style={styles.reward}>{item.coin_reward} NC</Text>
            </View>
            <TouchableOpacity 
              style={[styles.btn, completed.includes(item.task_key) && styles.btnDone]} 
              onPress={() => claimTask(item)}
            >
              <Text style={styles.btnText}>{completed.includes(item.task_key) ? 'RESGATADO' : 'RESGATAR'}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  header: { padding: 25 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: '#666', marginTop: 5 },
  card: { backgroundColor: '#161616', padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  taskName: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  reward: { color: '#F1C40F', fontSize: 12, fontWeight: '800', marginTop: 3 },
  btn: { backgroundColor: '#8E44AD', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  btnDone: { backgroundColor: '#333' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 10 }
});

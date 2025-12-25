import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, ActivityIndicator, Alert 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function TasksScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [userCoins, setUserCoins] = useState(0);

  useEffect(() => {
    fetchTasksAndBalance();
  }, []);

  async function fetchTasksAndBalance() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Busca saldo do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('nexus_coins')
        .eq('id', user.id)
        .single();
      
      setUserCoins(profile?.nexus_coins || 0);

      // 2. Busca tarefas diárias
      const { data: tasksData } = await supabase
        .from('daily_tasks')
        .select('*')
        .order('reward_coins', { ascending: false });

      setTasks(tasksData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function claimTask(task) {
    // Aqui simulamos a coleta da recompensa
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Atualiza as moedas no perfil do usuário
      const { error } = await supabase.rpc('increment_coins', { 
        user_id: user.id, 
        amount: task.reward_coins 
      });

      // Se você não tiver a função RPC acima, usamos o update comum:
      if (error) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ nexus_coins: userCoins + task.reward_coins })
          .eq('id', user.id);
        
        if (updateError) throw updateError;
      }

      Alert.alert('Parabéns!', `Você recebeu ${task.reward_coins} Nexus Coins.`);
      fetchTasksAndBalance(); // Atualiza a tela
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível coletar a recompensa.');
    } finally {
      setLoading(false);
    }
  }

  const renderTask = ({ item }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskInfo}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name="target" size={24} color="#8E44AD" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.taskTitle}>{item.task_name || 'Tarefa Diária'}</Text>
          <Text style={styles.taskReward}>+{item.reward_coins} NC</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.claimBtn} 
        onPress={() => claimTask(item)}
      >
        <Text style={styles.claimBtnText}>COLETAR</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Profissional */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#8E44AD" />
        </TouchableOpacity>
        <View style={styles.balanceBadge}>
          <MaterialCommunityIcons name="database" size={16} color="#F1C40F" />
          <Text style={styles.balanceText}>{userCoins} NC</Text>
        </View>
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>Missões Nexus</Text>
        <Text style={styles.subtitle}>Complete objetivos e ganhe recompensas.</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#8E44AD" size="large" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhuma tarefa disponível hoje.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20, 
    alignItems: 'center' 
  },
  balanceBadge: { 
    flexDirection: 'row', 
    backgroundColor: '#121212', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 20, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A1A1A'
  },
  balanceText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 14 },
  titleSection: { paddingHorizontal: 25, marginBottom: 30 },
  mainTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: '#444', fontSize: 14, marginTop: 5, fontWeight: '600' },
  list: { paddingHorizontal: 20 },
  taskCard: { 
    backgroundColor: '#121212', 
    padding: 20, 
    borderRadius: 18, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#1A1A1A'
  },
  taskInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconBox: { 
    width: 50, 
    height: 50, 
    borderRadius: 15, 
    backgroundColor: '#1A1A1A', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 15
  },
  taskTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  taskReward: { color: '#8E44AD', fontSize: 13, fontWeight: 'bold', marginTop: 2 },
  claimBtn: { 
    backgroundColor: '#8E44AD', 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    borderRadius: 10 
  },
  claimBtnText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  empty: { color: '#333', textAlign: 'center', marginTop: 50, fontWeight: 'bold' }
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const ITEMS = [
  { id: 'frame_neon', name: 'Moldura Neon', price: 1000, type: 'frame', icon: 'border-all' },
  { id: 'vip_silver', name: 'VIP Prata', price: 5000, type: 'role', icon: 'crown' },
  { id: 'aristocracy_king', name: 'Aristocracia Rei', price: 20000, type: 'role', icon: 'chess-king' }
];

export default function StoreScreen() {
  const [coins, setCoins] = useState(0);

  useEffect(() => { fetchCoins(); }, []);

  async function fetchCoins() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('profiles').select('nexus_coins').eq('id', user.id).single();
    setCoins(data?.nexus_coins || 0);
  }

  async function handleBuy(item) {
    if (coins < item.price) return Alert.alert("Saldo Insuficiente", "Ganhe mais coins em missões!");

    const { data: { user } } = await supabase.auth.getUser();
    
    // Deduzir moedas
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ nexus_coins: coins - item.price, role: item.type === 'role' ? item.id : undefined })
      .eq('id', user.id);

    if (updateError) return Alert.alert("Erro na transação");

    if (item.type === 'frame') {
      await supabase.from('user_inventory').insert([{ user_id: user.id, item_id: item.id, item_type: 'frame' }]);
    }

    Alert.alert("Sucesso!", `Você adquiriu ${item.name}`);
    fetchCoins();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nexus Store</Text>
        <View style={styles.coinBadge}>
          <Text style={styles.coinText}>💰 {coins}</Text>
        </View>
      </View>

      <FlatList
        data={ITEMS}
        numColumns={2}
        contentContainerStyle={{ padding: 15 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <MaterialCommunityIcons name={item.icon} size={40} color="#8E44AD" />
            <Text style={styles.itemName}>{item.name}</Text>
            <TouchableOpacity style={styles.buyBtn} onPress={() => handleBuy(item)}>
              <Text style={styles.buyBtnText}>{item.price} NC</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 25, alignItems: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  coinBadge: { backgroundColor: '#161616', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#8E44AD' },
  coinText: { color: '#fff', fontWeight: 'bold' },
  card: { flex: 1, backgroundColor: '#161616', margin: 8, padding: 20, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  itemName: { color: '#fff', fontWeight: '600', marginVertical: 12, fontSize: 13, textAlign: 'center' },
  buyBtn: { backgroundColor: '#8E44AD', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  buyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 }
});

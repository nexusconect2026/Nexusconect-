import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function StoreScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>LOJA NEXUS</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView contentContainerStyle={styles.center}>
        <MaterialCommunityIcons name="shopping-outline" size={80} color="#1A1A1A" />
        <Text style={styles.title}>EM BREVE</Text>
        <Text style={styles.subtitle}>Novas molduras e itens de personalização estão chegando.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { color: '#FFF', fontWeight: 'bold', letterSpacing: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  title: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 20 },
  subtitle: { color: '#444', textAlign: 'center', marginTop: 10 }
});

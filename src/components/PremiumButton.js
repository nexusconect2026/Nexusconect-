import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function PremiumButton({ title, onPress, icon, loading = false, variant = 'primary', style }) {
  const isSecondary = variant === 'secondary';

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={loading}
      activeOpacity={0.8}
      style={[
        styles.button, 
        isSecondary ? styles.secondaryBtn : styles.primaryBtn,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <>
          {icon && <Feather name={icon} size={18} color="#FFF" style={{ marginRight: 10 }} />}
          <Text style={styles.text}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 55,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 10,
    // Efeito de profundidade
    shadowColor: '#8E44AD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryBtn: {
    backgroundColor: '#8E44AD',
    borderWidth: 1,
    borderColor: '#A569BD',
  },
  secondaryBtn: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#333',
  },
  text: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});

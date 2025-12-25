import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

export default function Badge({ type, size = 'small' }) {
  // Configurações de estilos por tipo
  const badgeConfig = {
    staff: {
      label: 'STAFF',
      color: '#FF3B30',
      icon: 'shield-alt',
      iconLib: 'FontAwesome5'
    },
    vip: {
      label: 'VIP',
      color: '#FFD700',
      icon: 'crown',
      iconLib: 'FontAwesome5'
    },
    aristocracy: {
      label: 'REI',
      color: '#8E44AD',
      icon: 'gem',
      iconLib: 'FontAwesome5'
    },
    verified: {
      label: null,
      color: '#00D4FF',
      icon: 'verified',
      iconLib: 'MaterialIcons'
    }
  };

  const config = badgeConfig[type];
  if (!config) return null;

  return (
    <View style={[styles.container, { borderColor: config.color }, size === 'large' && styles.largePadding]}>
      {config.iconLib === 'FontAwesome5' ? (
        <FontAwesome5 name={config.icon} size={size === 'large' ? 14 : 10} color={config.color} />
      ) : (
        <MaterialIcons name={config.icon} size={size === 'large' ? 16 : 12} color={config.color} />
      )}
      {config.label && (
        <Text style={[styles.text, { color: config.color }, size === 'large' && { fontSize: 12 }]}>
          {config.label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginHorizontal: 4,
  },
  largePadding: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  text: {
    fontSize: 9,
    fontWeight: '900',
    marginLeft: 4,
    letterSpacing: 0.5,
  }
});

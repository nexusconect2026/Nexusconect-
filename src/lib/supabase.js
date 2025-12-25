import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Tenta pegar das variáveis de ambiente do EAS, se não, usa o fallback
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 'https://wudbjohhxzqqxxwhoche.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1ZGJqb2hoeHpxcXh4d2hvY2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MzY2MDksImV4cCI6MjA4MjAxMjYwOX0.6aee2ndvapz9LDheNpIzTIZ-B8TKYcXheDHmjKdIySQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

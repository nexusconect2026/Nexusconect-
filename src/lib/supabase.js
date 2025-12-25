import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wudbjohhxzqqxxwhoche.supabase.co';
// IMPORTANTE: Se o login falhar com a chave 'sb_', substitua-a pela 
// chave que começa com 'eyJ...' encontrada em Settings -> API no seu painel.
const supabaseAnonKey = 'sb_publishable_yLkb1C_IVOqiQ-yfxdi7hA_wgqfcJdz';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});


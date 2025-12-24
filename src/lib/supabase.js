import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wudbjohhxzqqxxwhoche.supabase.co';
const supabaseAnonKey = 'sb_publishable_yLkb1C_IVOqiQ-yfxdi7hA_wgqfcJdz';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

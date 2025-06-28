import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CONFIG } from '../utils/constants.js'
import type { Database } from '../types/database.js'

export const supabase: SupabaseClient<Database> = createClient<Database>(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_SERVICE_KEY
);

export default supabase; 
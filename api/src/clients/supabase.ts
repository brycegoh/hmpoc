import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CONFIG } from '../constants';
import type { Database } from '../models/database';

export const supabase: SupabaseClient<Database> = createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_SERVICE_KEY
);

export default supabase; 
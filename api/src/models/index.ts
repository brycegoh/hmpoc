// Import Supabase generated types
import type { Database, Tables, TablesInsert, TablesUpdate } from './database';

// Re-export the main types for convenience
export type { Database, Tables, TablesInsert, TablesUpdate };

// Database Response Models
export interface DatabaseResponse<T = any> {
  data: T[] | null;
  error?: string;
}

// User data from auth middleware
export interface UserData {
  user_id: string;
  email?: string;
  role?: string;
  payload?: Record<string, any>;
} 
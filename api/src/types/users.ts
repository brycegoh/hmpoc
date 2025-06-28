import type { Database } from '../models/database'

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export interface CreateUserRequest {
  first_name: string
  last_name: string
  birthdate: string // YYYY-MM-DD format
  gender: 'M' | 'F' | 'O'
  tz_name?: string // defaults to 'Asia/Singapore'
  linkedin_url?: string // for triggering LinkedIn data extraction
  skills_to_teach?: string[]
  skills_to_learn?: string[]
}

export interface CreateUserResponse {
  user: User
}

export interface LinkedInJobPayload {
  user_id: string
  linkedin_url: string
}

export interface UserProfile extends User {
  is_onboarded: boolean
} 
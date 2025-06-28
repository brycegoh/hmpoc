import { supabase } from '../../../clients/supabase'
import type { UserInsert, User, UserProfile } from '../../../types/users'

/**
 * Create a new user in the database
 */
export async function createUser(userData: UserInsert): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`)
  }

  return data
}

/**
 * Create a LinkedIn data record
 */
export async function createLinkedInDataRecord(userId: string, linkedinUrl: string): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('linkedin_data')
    .insert({
      user_id: userId,
      linkedin_url: linkedinUrl,
      state: 'in_queue'
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create LinkedIn data record: ${error.message}`)
  }

  return data
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // User not found
    }
    throw new Error(`Failed to get user: ${error.message}`)
  }

  return data
}

/**
 * Update user by ID
 */
export async function updateUser(userId: string, updates: Partial<UserInsert>): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`)
  }

  return data
}

/**
 * Get user profile with onboarding status
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  // Get the user data from users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  console.log('userData', userData, userId)

  if (userError) {
    if (userError.code === 'PGRST116') {
      // User not found in users table - return minimal profile with onboarded = false
      return {
        id: userId,
        is_onboarded: false
      } as UserProfile
    }
    throw new Error(`Failed to get user: ${userError.message}`)
  }

  // User is onboarded if they exist in the users table
  const isOnboarded = true

  return {
    ...userData,
    is_onboarded: isOnboarded
  }
} 
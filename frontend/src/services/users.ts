import axiosClient from './axiosClient'

export interface CreateUserRequest {
  first_name: string
  last_name: string
  birthdate: string
  gender: 'M' | 'F' | 'O'
  tz_name?: string
  linkedin_url?: string
  skills_to_teach?: string[]
  skills_to_learn?: string[]
}

export interface User {
  id: string
  first_name: string
  last_name: string
  birthdate: string
  gender: 'M' | 'F' | 'O'
  tz_name: string
  linkedin_url?: string
  created_at: string
  updated_at: string
}

export interface CreateUserResponse {
  user: User
  linkedin_job_queued?: boolean
}

export interface UserProfile {
  id: string
  first_name: string
  last_name: string
  birthdate: string
  gender: 'M' | 'F' | 'O'
  tz_name: string
  linkedin_url?: string
  created_at: string
  updated_at: string
  is_onboarded: boolean
}

/**
 * Create a new user profile
 */
export const createUser = async (userData: CreateUserRequest): Promise<CreateUserResponse> => {
  const response = await axiosClient.post('/users', userData)
  return response.data
}

/**
 * Get user by ID
 */
export const getUserById = async (id: string): Promise<{ user: User }> => {
  const response = await axiosClient.get(`/users/${id}`)
  return response.data
}

/**
 * Get current user profile with onboarding status
 */
export const getCurrentUserProfile = async (): Promise<{ user: UserProfile }> => {
  const response = await axiosClient.get('/users/me')
  return response.data
} 
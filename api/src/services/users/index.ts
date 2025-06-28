import * as usersData from './data'
import * as skillsService from '../skills'
import type { CreateUserRequest, CreateUserResponse, UserInsert, UserProfile } from '../../types/users'

/**
 * Create a new user
 */
export async function createUser(id: string, userData: CreateUserRequest): Promise<CreateUserResponse> {
  const { linkedin_url, skills_to_teach, skills_to_learn, ...userFields } = userData

  // Prepare user data for database insertion
  const userInsert: UserInsert = {
    ...userFields,
    tz_name: 'Asia/Singapore',
    id: id
  }

  // Create user in database
  const user = await usersData.createUser(userInsert)

  // Create user skills if provided
  if (skills_to_teach && skills_to_teach.length > 0 || skills_to_learn && skills_to_learn.length > 0) {
    await skillsService.createUserSkills(
      user.id,
      skills_to_teach || [],
      skills_to_learn || []
    )
  }

  return {user}
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  return usersData.getUserById(userId)
}

/**
 * Create a LinkedIn data record
 */
export async function createLinkedInDataRecord(userId: string, linkedinUrl: string): Promise<{ id: string }> {
  return usersData.createLinkedInDataRecord(userId, linkedinUrl)
}

/**
 * Update user
 */
export async function updateUser(userId: string, updates: Partial<UserInsert>) {
  return usersData.updateUser(userId, updates)
}

/**
 * Get user profile with onboarding status
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  return usersData.getUserProfile(userId)
} 
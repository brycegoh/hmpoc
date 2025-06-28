import axiosClient from './axiosClient'

export interface Skill {
  id: string
  name: string
}

export interface SkillsResponse {
  skills: Skill[]
}

/**
 * Get all available skills
 */
export const getAllSkills = async (): Promise<Skill[]> => {
  try {
    const response = await axiosClient.get<SkillsResponse>('/skills')
    return response.data.skills
  } catch (error) {
    console.error('Error fetching skills:', error)
    throw error
  }
} 
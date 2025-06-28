import * as skillsData from './data'

export interface Skill {
  id: string
  name: string
}

/**
 * Get all available skills
 */
export async function getAllSkills(): Promise<Skill[]> {
  return skillsData.getAllSkills()
}

/**
 * Ensure skills exist in database (create if they don't exist)
 * Returns the skill IDs for the given skill names
 */
export async function ensureSkillsExist(skillNames: string[]): Promise<{ [name: string]: string }> {
  return skillsData.ensureSkillsExist(skillNames)
}

/**
 * Create user skills entries
 */
export async function createUserSkills(userId: string, teachSkills: string[], learnSkills: string[]): Promise<void> {
  // First ensure all skills exist
  const allSkillNames = [...new Set([...teachSkills, ...learnSkills])]
  const skillIdMap = await ensureSkillsExist(allSkillNames)

  // Create user_skills entries
  await skillsData.createUserSkills(userId, skillIdMap, teachSkills, learnSkills)
} 
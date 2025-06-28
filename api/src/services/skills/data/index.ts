import { supabase } from '../../../clients/supabase'
import type { Database } from '../../../models/database'

type Skill = Database['public']['Tables']['skills']['Row']
type SkillInsert = Database['public']['Tables']['skills']['Insert']
type UserSkillInsert = Database['public']['Tables']['user_skills']['Insert']

/**
 * Get all skills from database
 */
export async function getAllSkills(): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch skills: ${error.message}`)
  }

  return data || []
}

/**
 * Ensure skills exist in database, create them if they don't
 * Returns a map of skill name to skill ID
 */
export async function ensureSkillsExist(skillNames: string[]): Promise<{ [name: string]: string }> {
  if (skillNames.length === 0) return {}

  // First, try to get existing skills
  const { data: existingSkills, error: fetchError } = await supabase
    .from('skills')
    .select('id, name')
    .in('name', skillNames)

  if (fetchError) {
    throw new Error(`Failed to fetch existing skills: ${fetchError.message}`)
  }

  const existingSkillMap: { [name: string]: string } = {}
  const existingNames = new Set<string>()
  
  existingSkills?.forEach(skill => {
    existingSkillMap[skill.name] = skill.id
    existingNames.add(skill.name)
  })

  // Find skills that need to be created
  const newSkillNames = skillNames.filter(name => !existingNames.has(name))

  if (newSkillNames.length > 0) {
    // Create new skills
    const skillInserts: SkillInsert[] = newSkillNames.map(name => ({ name }))
    
    const { data: newSkills, error: insertError } = await supabase
      .from('skills')
      .insert(skillInserts)
      .select('id, name')

    if (insertError) {
      throw new Error(`Failed to create new skills: ${insertError.message}`)
    }

    // Add new skills to the map
    newSkills?.forEach(skill => {
      existingSkillMap[skill.name] = skill.id
    })
  }

  return existingSkillMap
}

/**
 * Create user skills entries for both teaching and learning
 */
export async function createUserSkills(
  userId: string, 
  skillIdMap: { [name: string]: string }, 
  teachSkills: string[], 
  learnSkills: string[]
): Promise<void> {
  const userSkillInserts: UserSkillInsert[] = []

  // Add teaching skills
  teachSkills.forEach(skillName => {
    const skillId = skillIdMap[skillName]
    if (skillId) {
      userSkillInserts.push({
        user_id: userId,
        skill_id: skillId,
        role: 'teach'
      })
    }
  })

  // Add learning skills
  learnSkills.forEach(skillName => {
    const skillId = skillIdMap[skillName]
    if (skillId) {
      userSkillInserts.push({
        user_id: userId,
        skill_id: skillId,
        role: 'learn'
      })
    }
  })

  if (userSkillInserts.length > 0) {
    const { error } = await supabase
      .from('user_skills')
      .insert(userSkillInserts)

    if (error) {
      throw new Error(`Failed to create user skills: ${error.message}`)
    }
  }
} 
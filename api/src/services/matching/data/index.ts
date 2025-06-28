import { supabase } from '../../../clients/supabase';
import type { 
  SearchCandidate, 
  User, 
  UserSkill, 
  SwipeHistory, 
} from '../../../types/matching';

/**
 * Search for mutual skill candidates using the database RPC function
 */
export async function findMutualSkillCandidates(viewerId: string, limit: number): Promise<SearchCandidate[]> {
  const { data, error } = await supabase.rpc('find_mutual_skill_candidates', {
    p_viewer: viewerId,
    p_limit: limit
  });

  if (error) {
    throw new Error(`Search phase failed: ${error.message}`);
  }

  return data || [];
}

/**
 * Get viewer's profile data for matching algorithm
 */
export async function getViewerData(viewerId: string): Promise<Pick<User, 'birthdate' | 'gender' | 'tz_name'>> {
  const { data, error } = await supabase
    .from('users')
    .select('birthdate, gender, tz_name')
    .eq('id', viewerId)
    .single();

  if (error || !data) {
    throw new Error(`Failed to get viewer data: ${error?.message || 'User not found'}`);
  }

  return data;
}

/**
 * Get candidate users data in batch
 */
export async function getCandidateUsers(candidateIds: string[]): Promise<Pick<User, 'id' | 'birthdate' | 'gender' | 'tz_name'>[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, birthdate, gender, tz_name')
    .in('id', candidateIds);

  if (error) {
    throw new Error(`Failed to get candidate users: ${error.message}`);
  }

  return data || [];
}

/**
 * Get swipe history for reliability calculations (30-day window)
 */
export async function getSwipeHistory(candidateIds: string[]): Promise<Pick<SwipeHistory, 'candidate_id' | 'status' | 'created_at'>[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('swipe_history')
    .select('candidate_id, status, created_at')
    .in('candidate_id', candidateIds)
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (error) {
    console.error('Error fetching swipe history:', error);
    return [];
  }

  return data || [];
}

/**
 * Get viewer's swipe history for preference analysis
 */
export async function getViewerSwipeHistory(viewerId: string, limit: number): Promise<Array<{ candidate_id: string; status: string; created_at: string; candidate_age: number; candidate_gender: string }>> {
  const { data, error } = await supabase
    .from('swipe_history')
    .select(`
      candidate_id,
      status,
      created_at,
      users!inner(birthdate, gender)
    `)
    .eq('user_id', viewerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching viewer swipe history:', error);
    return [];
  }

  // Transform the data to include calculated age and filter out null values
  return (data || [])
    .filter(swipe => swipe.candidate_id && swipe.created_at && swipe.users)
    .map(swipe => ({
      candidate_id: swipe.candidate_id!,
      status: swipe.status,
      created_at: swipe.created_at!,
      candidate_age: calculateAge((swipe.users as any).birthdate),
      candidate_gender: (swipe.users as any).gender
    }));
}

/**
 * Helper function to calculate age from birthdate
 */
function calculateAge(birthdate: string): number {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Get detailed candidate information
 */
export async function getCandidateDetails(candidateId: string): Promise<Pick<User, 'id' | 'first_name' | 'last_name' | 'birthdate' | 'gender' | 'tz_name' | 'created_at'>> {
  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, birthdate, gender, tz_name, created_at')
    .eq('id', candidateId)
    .single();

  if (error || !data) {
    throw new Error(`Candidate not found: ${error?.message || 'User not found'}`);
  }

  return data;
}

/**
 * Get user skills with skill names
 */
export async function getUserSkills(userId: string): Promise<Array<{ skill_id: string | null; role: 'teach' | 'learn'; level: string | null; skills: { name: string } }>> {
  const { data, error } = await supabase
    .from('user_skills')
    .select(`
      skill_id,
      role,
      level,
      skills!inner(name)
    `)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to fetch user skills: ${error.message}`);
  }

  return data || [];
}

/**
 * Get LinkedIn embedding similarities between viewer and candidates (optimized)
 */
export async function getLinkedInEmbeddingSimilarities(
  viewerId: string, 
  candidateIds: string[]
): Promise<Array<{ candidate_id: string; similarity: number }>> {
  if (candidateIds.length === 0) {
    return [];
  }

  try {
    // Use the efficient RPC function for a single database call
    const { data, error } = await supabase.rpc('get_linkedin_embedding_similarities' as any, {
      p_viewer_id: viewerId,
      p_candidate_ids: candidateIds
    });

    if (error) {
      console.error('Error fetching embedding similarities:', error);
      // Fallback to neutral scores for all candidates
      return candidateIds.map(id => ({ candidate_id: id, similarity: 0.5 }));
    }

    // Convert the RPC result to our expected format
    const similarities: Array<{ candidate_id: string; similarity: number }> = [];
    const resultMap = new Map<string, number>();
    
    // Process RPC results safely
    if (data && Array.isArray(data)) {
      data.forEach((item: any) => {
        const candidateId = String(item.candidate_id);
        const similarity = typeof item.similarity === 'number' ? item.similarity : 0.5;
        resultMap.set(candidateId, similarity);
      });
    }
    
    // Ensure we have a result for every candidate (fallback to neutral if missing)
    candidateIds.forEach(candidateId => {
      const similarity = resultMap.get(candidateId) ?? 0.5;
      similarities.push({ candidate_id: candidateId, similarity });
    });

    return similarities;
  } catch (error) {
    console.error('Error in getLinkedInEmbeddingSimilarities:', error);
    // Fallback to neutral scores for all candidates
    return candidateIds.map(id => ({ candidate_id: id, similarity: 0.5 }));
  }
}

/**
 * Record a swipe action in the swipe_history table
 */
export async function recordSwipe(viewerId: string, candidateId: string, status: 'declined' | 'offered'): Promise<void> {
  const { error } = await supabase
    .from('swipe_history')
    .insert({
      viewer_id: viewerId,
      candidate_id: candidateId,
      status
    });

  if (error) {
    throw new Error(`Failed to record swipe: ${error.message}`);
  }
}
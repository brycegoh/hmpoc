import * as matchingData from './data';
import { TimezoneUtils } from '../../utils/timezoneUtils';
import { MathUtils } from '../../utils/mathUtils';
import type { 
  SearchCandidate, 
  RankedCandidate, 
  MatchingFeatures, 
  CandidateDetails,
  MatchingParams,
  MatchingResponse,
  SkillInfo,
  User,
  SwipeHistory
} from '../../types/matching';

/**
 * Main two-phase matching algorithm
 */
export async function findMatches(params: MatchingParams): Promise<MatchingResponse> {
  const searchLimit = Math.max(params.limit * 3, 100); // Get more for reranking

  // Phase 1: Search for mutual skill candidates
  const searchCandidates = await matchingData.findMutualSkillCandidates(
    params.viewerId, 
    searchLimit
  );
  
  if (searchCandidates.length === 0) {
    return {
      candidates: [],
      total: 0,
      search_pool_size: 0
    };
  }

  // Phase 2: Rerank with behavioral and preference features
  const rankedCandidates = await rerankCandidates(params.viewerId, searchCandidates);

  // Return top N candidates
  const finalCandidates = rankedCandidates
    .slice(0, params.limit)
    .map(candidate => ({
      user_id: candidate.user_id,
      teaches_me: candidate.teaches_me,
      learns_from_me: candidate.learns_from_me,
      overlap_score: candidate.overlap_score,
      final_score: candidate.final_score,
      features: candidate.features
    }));

  return {
    candidates: finalCandidates,
    total: finalCandidates.length,
    search_pool_size: searchCandidates.length
  };
}

/**
 * Get detailed information about a specific candidate
 */
export async function getCandidateDetails(candidateId: string, viewerId: string): Promise<CandidateDetails> {
  // Get candidate's full profile and skills in parallel
  const [candidate, candidateSkills, viewerSkills] = await Promise.all([
    matchingData.getCandidateDetails(candidateId),
    matchingData.getUserSkills(candidateId),
    matchingData.getUserSkills(viewerId)
  ]);

  // Calculate mutual skill overlap
  const viewerTeaches = new Set(
    viewerSkills.filter(s => s.role === 'teach').map(s => s.skill_id)
  );
  const viewerLearns = new Set(
    viewerSkills.filter(s => s.role === 'learn').map(s => s.skill_id)
  );

  const teachesMe = candidateSkills
    .filter(skill => skill.role === 'teach' && viewerLearns.has(skill.skill_id))
    .map(skill => ({
      skill_name: skill.skills.name,
      level: skill.level
    }));

  const learnsFromMe = candidateSkills
    .filter(skill => skill.role === 'learn' && viewerTeaches.has(skill.skill_id))
    .map(skill => ({
      skill_name: skill.skills.name,
      level: skill.level
    }));

  const allSkillsTeaches = candidateSkills
    .filter(s => s.role === 'teach')
    .map(skill => ({
      skill_name: skill.skills.name,
      level: skill.level
    }));

  const allSkillsLearns = candidateSkills
    .filter(s => s.role === 'learn')
    .map(skill => ({
      skill_name: skill.skills.name,
      level: skill.level
    }));

  return {
    candidate: {
      id: candidate.id,
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      age: MathUtils.calculateAge(candidate.birthdate),
      gender: candidate.gender,
      timezone: candidate.tz_name,
      member_since: candidate.created_at
    },
    mutual_skills: {
      teaches_me: teachesMe,
      learns_from_me: learnsFromMe
    },
    all_skills: {
      teaches: allSkillsTeaches,
      wants_to_learn: allSkillsLearns
    }
  };
}

/**
 * Phase 2: Rerank candidates using behavioral and preference features
 */
async function rerankCandidates(viewerId: string, candidates: SearchCandidate[]): Promise<RankedCandidate[]> {
  const candidateIds = candidates.map(c => c.user_id);
  
  // Get all data needed for reranking in parallel
  const [viewerData, candidateUsers, swipeHistory, viewerSwipeHistory, embeddingSimilarities] = await Promise.all([
    matchingData.getViewerData(viewerId),
    matchingData.getCandidateUsers(candidateIds),
    matchingData.getSwipeHistory(candidateIds),
    matchingData.getViewerSwipeHistory(viewerId, 3),
    matchingData.getLinkedInEmbeddingSimilarities(viewerId, candidateIds)
  ]);

  const weights = {
    mutual: 0.35,
    reliability: 0.25,
    timezone: 0.15,
    age: 0.10,
    gender: 0.05,
    embedding: 0.10
  }

  // Convert arrays to maps
  const candidateUsersMap = new Map(candidateUsers.map((u: any) => [u.id, u]));
  const embeddingSimilaritiesMap = new Map(embeddingSimilarities.map(e => [e.candidate_id, e.similarity]));

  const swipeHistoryMap = new Map<string, any[]>();
  swipeHistory.forEach((swipe: any) => {
    if (!swipeHistoryMap.has(swipe.candidate_id)) {
      swipeHistoryMap.set(swipe.candidate_id, []);
    }
    swipeHistoryMap.get(swipe.candidate_id)!.push(swipe);
  });

  // Calculate features for each candidate
  const rankedCandidates: RankedCandidate[] = candidates.map(candidate => {
    const candidateUser = candidateUsersMap.get(candidate.user_id);
    const candidateSwipes = swipeHistoryMap.get(candidate.user_id) || [];
    const embeddingSimilarity = embeddingSimilaritiesMap.get(candidate.user_id) || 0.5;

    if (!candidateUser) {
      throw new Error(`Candidate user data not found for ${candidate.user_id}`);
    }

    // Calculate individual features
    const features = calculateFeatures(
      viewerData,
      candidateUser,
      candidateSwipes,
      viewerSwipeHistory,
      embeddingSimilarity
    );

    // Normalize overlap_score to 0-1 range (max 10 overlaps = 1.0)
    const normalizedOverlapScore = Math.min(candidate.overlap_score / 10, 1.0);

    // Calculate weighted final score (all features now 0-1)
    const final_score = 
      normalizedOverlapScore * weights.mutual +
      features.f_reliability * weights.reliability +
      features.f_tz * weights.timezone +
      features.f_age * weights.age +
      features.f_gender * weights.gender +
      features.f_embedding * weights.embedding;
    
    console.log('candidate.overlap_score (raw):', candidate.overlap_score);
    console.log('normalizedOverlapScore:', normalizedOverlapScore);
    console.log('features.f_reliability:', features.f_reliability);
    console.log('features.f_tz:', features.f_tz);
    console.log('features.f_age:', features.f_age);
    console.log('features.f_gender:', features.f_gender);
    console.log('features.f_embedding:', features.f_embedding);
    console.log('final_score:', final_score);
    return {
      ...candidate,
      final_score,
      features
    };
  });

  // Sort by final score descending
  return rankedCandidates.sort((a, b) => b.final_score - a.final_score);
}

/**
 * Record a swipe action in the swipe_history table
 */
export async function recordSwipe(viewerId: string, candidateId: string, action: 'declined' | 'offered'): Promise<void> {
  await matchingData.recordSwipe(viewerId, candidateId, action);
}

/**
 * Calculate all matching features for a candidate
 */
function calculateFeatures(
  viewer: Pick<User, 'birthdate' | 'gender' | 'tz_name'>,
  candidate: Pick<User, 'id' | 'birthdate' | 'gender' | 'tz_name'>,
  candidateSwipes: Pick<SwipeHistory, 'candidate_id' | 'status' | 'created_at'>[],
  viewerSwipeHistory: Array<{ candidate_id: string; status: string; created_at: string; candidate_age: number; candidate_gender: string }>,
  embeddingSimilarity: number
): MatchingFeatures {
  return {
    f_reliability: calculateReliability(candidateSwipes),
    f_tz: TimezoneUtils.calculateTimezoneOverlap(viewer.tz_name, candidate.tz_name),
    f_age: calculateAgeAffinity(candidate, viewerSwipeHistory),
    f_gender: calculateGenderMatch(candidate.gender, viewerSwipeHistory),
    f_embedding: embeddingSimilarity
  };
}

/**
 * F_reliability: A proxy for how active the user is in terms of meeting with people.
 * Higher score for candidates who accept offers more often.
 */
function calculateReliability(swipes: any[]): number {
  if (!swipes || swipes.length === 0) {
    return 0.5; // Default for newcomers (neutral)
  }

  const accepted = swipes.filter(s => s.status === 'accepted').length;
  const offered = swipes.filter(s => s.status === 'offered').length;
  const total = accepted + offered;

  if (total === 0) {
    return 0.5; // Default for users with no offers yet (neutral)
  }

  // Laplace smoothing: (accepted + 1) / (total + 2)
  // This prevents extreme scores and handles small sample sizes better
  return (accepted + 1) / (total + 2);
}

/**
 * F_age: Score based on how close candidate's age is to viewer's historical preference average
 */
function calculateAgeAffinity(candidate: Pick<User, 'birthdate'>, viewerSwipeHistory: Array<{ candidate_age: number }>): number {
  // If less than 30 swipes, return 0
  if (viewerSwipeHistory.length < 3) {
    return 0;
  }

  // Calculate average age from viewer's historical swipes
  const averageAge = viewerSwipeHistory.reduce((sum, swipe) => sum + swipe.candidate_age, 0) / viewerSwipeHistory.length;
  
  const candidateAge = MathUtils.calculateAge(candidate.birthdate);
  const ageDifference = Math.abs(candidateAge - averageAge);
  
  // Score based on proximity to historical average
  if (ageDifference <= 2) return 1.0;
  if (ageDifference <= 5) return 0.8;
  if (ageDifference <= 10) return 0.5;
  if (ageDifference <= 15) return 0.2;
  return 0.1;
}

/**
 * F_gender: Score based on viewer's historical gender preference
 */
function calculateGenderMatch(candidateGender: string, viewerSwipeHistory: Array<{ candidate_gender: string }>): number {
  // If less than 30 swipes, return 0
  if (viewerSwipeHistory.length < 3) {
    return 0;
  }

  // Count gender preferences from historical swipes
  const genderCounts: { [key: string]: number } = {};
  viewerSwipeHistory.forEach(swipe => {
    if (swipe.candidate_gender) { // Skip null/undefined genders
      genderCounts[swipe.candidate_gender] = (genderCounts[swipe.candidate_gender] || 0) + 1;
    }
  });

  // If no valid gender data, return neutral
  if (Object.keys(genderCounts).length === 0) {
    return 0;
  }

  // Find the maximum count
  const maxCount = Math.max(...Object.values(genderCounts));
  
  // Check if there's a tie (multiple genders with max count)
  const gendersWithMaxCount = Object.keys(genderCounts).filter(gender => genderCounts[gender] === maxCount);
  
  // If there's a tie, return 0 (no clear preference)
  if (gendersWithMaxCount.length > 1) {
    return 0;
  }
  
  // If there's a clear winner, return 1 if candidate matches, 0 otherwise
  const mostPreferredGender = gendersWithMaxCount[0];
  return candidateGender === mostPreferredGender ? 1 : 0;
} 
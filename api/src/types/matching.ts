import type { Database } from '../models/database';

// Core types from database
export type SearchCandidate = Database['public']['Functions']['find_mutual_skill_candidates']['Returns'][0];
export type User = Database['public']['Tables']['users']['Row'];
export type UserSkill = Database['public']['Tables']['user_skills']['Row'];
export type SwipeHistory = Database['public']['Tables']['swipe_history']['Row'];

// Enhanced types for matching algorithm
export interface RankedCandidate extends SearchCandidate {
  final_score: number;
  features: MatchingFeatures;
}

export interface MatchingFeatures {
  f_reliability: number;
  f_tz: number;
  f_age: number;
  f_gender: number;
  f_embedding: number;
}

export interface CandidateDetails {
  candidate: {
    id: string;
    first_name: string;
    last_name: string;
    age: number;
    gender: string;
    timezone: string;
    member_since: string | null;
  };
  mutual_skills: {
    teaches_me: SkillInfo[];
    learns_from_me: SkillInfo[];
  };
  all_skills: {
    teaches: SkillInfo[];
    wants_to_learn: SkillInfo[];
  };
}

export interface SkillInfo {
  skill_name: string;
  level: string | null;
}

export interface MatchingParams {
  viewerId: string;
  limit: number;
}

export interface MatchingResponse {
  candidates: Array<{
    user_id: string;
    teaches_me: number;
    learns_from_me: number;
    overlap_score: number;
    final_score: number;
    features: MatchingFeatures;
  }>;
  total: number;
  search_pool_size: number;
}

export interface ViewerSwipeWithAge {
  candidate_id: string;
  status: string;
  created_at: string;
  candidate_birthdate: string;
} 
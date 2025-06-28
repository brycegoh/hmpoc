import axiosClient from './axiosClient'

export interface Candidate {
  user_id: string
  teaches_me: Array<{ skill_name: string; level?: string }>
  learns_from_me: Array<{ skill_name: string; level?: string }>
  overlap_score: number
  final_score: number
  features: {
    f_reliability: number
    f_tz: number
    f_age: number
    f_gender: number
    f_embedding: number
  }
}

export interface CandidateDetails {
  candidate: {
    id: string
    first_name: string
    last_name: string
    age: number
    gender: string
    timezone: string
    member_since: string
  }
  mutual_skills: {
    teaches_me: Array<{ skill_name: string; level?: string }>
    learns_from_me: Array<{ skill_name: string; level?: string }>
  }
  all_skills: {
    teaches: Array<{ skill_name: string; level?: string }>
    wants_to_learn: Array<{ skill_name: string; level?: string }>
  }
}

export interface MatchingResponse {
  candidates: Candidate[]
  total: number
  search_pool_size: number
  message?: string
}

export const getCandidates = async (viewerId: string, limit = 30): Promise<MatchingResponse> => {
  const response = await axiosClient.get('/matches/candidates', {
    params: {
      viewer_id: viewerId,
      limit
    }
  })
  return response.data
}

export const getCandidateDetails = async (candidateId: string, viewerId: string): Promise<CandidateDetails> => {
  const response = await axiosClient.get(`/matches/candidates/${candidateId}/details`, {
    params: {
      viewer_id: viewerId
    }
  })
  return response.data
}

export const recordSwipe = async (viewerId: string, candidateId: string, action: 'declined' | 'offered'): Promise<{ success: boolean; message: string }> => {
  const response = await axiosClient.post('/matches/swipe', {
    viewer_id: viewerId,
    candidate_id: candidateId,
    action
  })
  return response.data
} 
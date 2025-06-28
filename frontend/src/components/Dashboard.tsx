import { useState, useEffect } from 'react'
import { useAuth } from '../hooks'
import { getCandidates, getCandidateDetails, recordSwipe, type Candidate, type CandidateDetails } from '../services'

interface CandidateCard {
  candidate: Candidate
  details?: CandidateDetails
}

export const Dashboard = () => {
  const { user } = useAuth()
  const [candidates, setCandidates] = useState<CandidateCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [swipeLoading, setSwipeLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCandidates = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const response = await getCandidates(user.id, 10)
      
      if (response.candidates.length === 0) {
        setError(response.message || 'No matches found')
        return
      }

      // Fetch details for first few candidates
      const candidatesWithDetails = await Promise.all(
        response.candidates.map(async (candidate) => {
          try {
            const details = await getCandidateDetails(candidate.user_id, user.id)
            return { candidate, details }
          } catch (err) {
            console.error(`Failed to fetch details for ${candidate.user_id}:`, err)
            return { candidate }
          }
        })
      )

      // Add remaining candidates without details
      const remainingCandidates = response.candidates.slice(3).map(candidate => ({ candidate }))
      
      setCandidates([...candidatesWithDetails, ...remainingCandidates])
      setCurrentIndex(0)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch candidates:', err)
      setError('Failed to load matches. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSwipe = async (action: 'declined' | 'offered') => {
    if (!user?.id || currentIndex >= candidates.length) return

    const currentCandidate = candidates[currentIndex]
    const isLastCandidate = currentIndex === candidates.length - 1
    
    try {
      setSwipeLoading(true)
      await recordSwipe(user.id, currentCandidate.candidate.user_id, action)
      
      // Move to next candidate
      setCurrentIndex(prev => prev + 1)
      
      // If this was the last candidate, fetch more
      if (isLastCandidate) {
        try {
          const response = await getCandidates(user.id, 10)
          
          if (response.candidates.length > 0) {
            // Add new candidates with details
            const newCandidatesWithDetails = await Promise.all(
              response.candidates.map(async (candidate) => {
                try {
                  const details = await getCandidateDetails(candidate.user_id, user.id)
                  return { candidate, details }
                } catch (err) {
                  console.error(`Failed to fetch details for ${candidate.user_id}:`, err)
                  return { candidate }
                }
              })
            )
            
            setCandidates(prev => [...prev, ...newCandidatesWithDetails])
          }
        } catch (err) {
          console.error('Failed to fetch more candidates:', err)
          // Don't set error here as the swipe was successful
        }
      } else {
        // Fetch details for upcoming candidate if not already loaded
        const upcomingIndex = currentIndex + 2
        if (upcomingIndex < candidates.length && !candidates[upcomingIndex].details) {
          try {
            const details = await getCandidateDetails(candidates[upcomingIndex].candidate.user_id, user.id)
            setCandidates(prev => prev.map((c, i) => 
              i === upcomingIndex ? { ...c, details } : c
            ))
          } catch (err) {
            console.error(`Failed to preload details for candidate ${upcomingIndex}:`, err)
          }
        }
      }
    } catch (err) {
      console.error('Failed to record swipe:', err)
      setError('Failed to record your choice. Please try again.')
    } finally {
      setSwipeLoading(false)
    }
  }

  useEffect(() => {
    fetchCandidates()
  }, [user?.id])

  const currentCandidate = candidates[currentIndex]
  const hasMoreCandidates = currentIndex < candidates.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">

      <div className="container mx-auto p-4 max-w-md lg:max-w-4xl xl:max-w-6xl">
        {loading && (
          <div className="flex justify-center items-center h-96">
            <div className="loading loading-spinner loading-lg text-purple-600"></div>
          </div>
        )}

        {error && (
          <div className="alert alert-warning mb-4 max-w-md lg:max-w-2xl mx-auto">
            <span>{error}</span>
            <button className="btn btn-sm btn-outline" onClick={fetchCandidates}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && !hasMoreCandidates && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-600 mb-4">No More Matches!</h2>
            <p className="text-gray-500 mb-6">You've seen all available candidates for now.</p>
            <button className="btn btn-primary" onClick={fetchCandidates}>
              Refresh Matches
            </button>
          </div>
        )}

        {!loading && !error && hasMoreCandidates && currentCandidate && (
          <div className="relative max-w-md lg:max-w-4xl mx-auto">
            {/* Card Stack Effect */}
            <div className="relative h-96 lg:h-[500px] mb-8">
              {candidates.slice(currentIndex, currentIndex + 3).map((candidateCard, index) => (
                <div
                  key={candidateCard.candidate.user_id}
                  className={`absolute inset-0 bg-white rounded-2xl shadow-xl border transition-all duration-300 ${
                    index === 0 ? 'z-30' : index === 1 ? 'z-20 scale-95 opacity-80' : 'z-10 scale-90 opacity-60'
                  }`}
                  style={{
                    transform: `translateY(${index * 8}px) scale(${1 - index * 0.05})`
                  }}
                >
                  <div className="p-6 lg:p-8 h-full flex flex-col lg:flex-row lg:gap-8">
                    {/* Profile Header - Mobile: column, Desktop: left side */}
                    <div className="lg:w-1/3 lg:flex-shrink-0">
                      <div className="flex lg:flex-col items-center lg:items-start mb-4 lg:mb-6">
                        <div className="w-16 h-16 lg:w-24 lg:h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xl lg:text-3xl font-bold lg:mx-auto lg:mb-4">
                          {candidateCard.details?.candidate?.first_name?.[0] || 'U'}
                        </div>
                        <div className="ml-4 lg:ml-0 lg:text-center flex-1">
                          <h3 className="text-xl lg:text-2xl font-semibold">
                            {candidateCard.details?.candidate?.first_name || 'Loading...'} {candidateCard.details?.candidate?.last_name || ''}
                          </h3>
                          {candidateCard.details?.candidate?.age && (
                            <p className="text-gray-500 lg:text-lg">Age {candidateCard.details.candidate.age}</p>
                          )}
                        </div>
                        <div className="ml-auto lg:hidden">
                          <div className="badge badge-primary">{Math.round(candidateCard.candidate.final_score * 100)}% Match</div>
                        </div>
                      </div>
                    </div>

                    {/* Skills Section - Mobile: full width, Desktop: right side */}
                    <div className="flex-1 overflow-y-auto lg:w-2/3">
                      {candidateCard.details ? (
                        <div className="lg:grid lg:grid-cols-1 lg:gap-6">
                          {candidateCard.details.mutual_skills.teaches_me.length > 0 && (
                            <div className="mb-4 lg:mb-6">
                              <h4 className="font-semibold text-green-600 mb-2 lg:text-lg">✓ Can teach you:</h4>
                              <div className="flex flex-wrap gap-2">
                                {candidateCard.details.mutual_skills.teaches_me.map((skill, idx) => (
                                  <span key={idx} className="badge badge-success badge-outline lg:badge-lg">
                                    {skill.skill_name} {skill.level && `(${skill.level})`}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {candidateCard.details.mutual_skills.learns_from_me.length > 0 && (
                            <div className="mb-4 lg:mb-6">
                              <h4 className="font-semibold text-blue-600 mb-2 lg:text-lg">✓ Wants to learn from you:</h4>
                              <div className="flex flex-wrap gap-2">
                                {candidateCard.details.mutual_skills.learns_from_me.map((skill, idx) => (
                                  <span key={idx} className="badge badge-info badge-outline lg:badge-lg">
                                    {skill.skill_name} {skill.level && `(${skill.level})`}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {candidateCard.details.all_skills.teaches.length > 0 && (
                            <div className="mb-4 lg:mb-6">
                              <h4 className="font-semibold text-gray-600 mb-2 lg:text-lg">Other skills they teach:</h4>
                              <div className="flex flex-wrap gap-2">
                                {candidateCard.details.all_skills.teaches.slice(0, 8).map((skill, idx) => (
                                  <span key={idx} className="badge badge-ghost lg:badge-lg">
                                    {skill.skill_name}
                                  </span>
                                ))}
                                {candidateCard.details.all_skills.teaches.length > 8 && (
                                  <span className="badge badge-ghost lg:badge-lg">+{candidateCard.details.all_skills.teaches.length - 8} more</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Desktop-only: Show learning skills */}
                          {candidateCard.details.all_skills.wants_to_learn.length > 0 && (
                            <div className="hidden lg:block mb-6">
                              <h4 className="font-semibold text-purple-600 mb-2 text-lg">Skills they want to learn:</h4>
                              <div className="flex flex-wrap gap-2">
                                {candidateCard.details.all_skills.wants_to_learn.slice(0, 8).map((skill, idx) => (
                                  <span key={idx} className="badge badge-secondary badge-outline badge-lg">
                                    {skill.skill_name}
                                  </span>
                                ))}
                                {candidateCard.details.all_skills.wants_to_learn.length > 8 && (
                                  <span className="badge badge-secondary badge-outline badge-lg">+{candidateCard.details.all_skills.wants_to_learn.length - 8} more</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex justify-center items-center h-32">
                          <div className="loading loading-spinner text-purple-600"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-6 lg:space-x-12">
              <button
                className="btn btn-circle btn-error btn-lg lg:btn-xl shadow-lg hover:scale-110 transition-transform"
                onClick={() => handleSwipe('declined')}
                disabled={swipeLoading}
              >
                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <button
                className="btn btn-circle btn-success btn-lg lg:btn-xl shadow-lg hover:scale-110 transition-transform"
                onClick={() => handleSwipe('offered')}
                disabled={swipeLoading}
              >
                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
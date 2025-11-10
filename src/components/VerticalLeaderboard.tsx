'use client'

import { useState, useEffect, useRef } from 'react'
import { GameResult, Participant } from '@/types/types'
import { AvatarDisplay } from '@/components/AvatarPicker'

interface VerticalLeaderboardProps {
  gameResults: GameResult[]
  participants: Participant[]
  maxDisplay?: number
}

interface RankWithAnimation extends GameResult {
  previousRank?: number
  currentRank: number
  animationState?: 'up' | 'down' | 'none'
}

export default function VerticalLeaderboard({
  gameResults,
  participants,
  maxDisplay = 10
}: VerticalLeaderboardProps) {
  const [rankedResults, setRankedResults] = useState<RankWithAnimation[]>([])
  const previousRanksRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    // Sort by total_score and create rankings
    const sorted = [...gameResults].sort((a, b) => b.total_score - a.total_score)

    // Add rank information and detect changes
    const withRanks: RankWithAnimation[] = sorted.map((result, index) => {
      const currentRank = index + 1
      const previousRank = previousRanksRef.current.get(result.participant_id || '')

      let animationState: 'up' | 'down' | 'none' = 'none'
      if (previousRank !== undefined && previousRank !== currentRank) {
        animationState = previousRank > currentRank ? 'up' : 'down'
      }

      return {
        ...result,
        currentRank,
        previousRank,
        animationState
      }
    })

    setRankedResults(withRanks)

    // Update previous ranks for next comparison
    const newRanksMap = new Map<string, number>()
    withRanks.forEach(result => {
      if (result.participant_id) {
        newRanksMap.set(result.participant_id, result.currentRank)
      }
    })
    previousRanksRef.current = newRanksMap
  }, [gameResults])

  // Get participant info
  const getParticipantInfo = (participantId: string | null) => {
    if (!participantId) return null
    return participants.find(p => p.id === participantId)
  }

  // Get rank display with emoji
  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `${rank}`
    }
  }

  // Display limited results
  const displayResults = rankedResults.slice(0, maxDisplay)

  return (
    <div className="w-full max-w-3xl mx-auto">
      <style jsx>{`
        @keyframes bounce-up {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-20px); }
          50% { transform: translateY(-10px); }
          75% { transform: translateY(-15px); }
        }

        @keyframes bounce-down {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(20px); }
          50% { transform: translateY(10px); }
          75% { transform: translateY(15px); }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .rank-item {
          animation: slide-in 0.5s ease-out;
        }

        .rank-item.bounce-up {
          animation: bounce-up 0.8s ease-out, slide-in 0.5s ease-out;
        }

        .rank-item.bounce-down {
          animation: bounce-down 0.8s ease-out, slide-in 0.5s ease-out;
        }

        .rank-badge-up {
          animation: bounce-up 0.8s ease-out;
        }

        .rank-badge-down {
          animation: bounce-down 0.8s ease-out;
        }
      `}</style>

      <div className="bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-md rounded-2xl shadow-2xl border-4 border-yellow-400/30 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-4">
          <h3 className="text-white text-2xl sm:text-3xl font-black text-center flex items-center justify-center gap-3">
            <span>🏆</span>
            <span>LEADERBOARD</span>
            <span>🏆</span>
          </h3>
          <p className="text-white/90 text-center text-sm mt-1">Cumulative Scores</p>
        </div>

        {/* Leaderboard List */}
        <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
          {displayResults.length === 0 ? (
            <div className="text-white/60 text-center py-8">
              <p className="text-4xl mb-2">📊</p>
              <p>No results yet</p>
            </div>
          ) : (
            displayResults.map((result, index) => {
              const participant = getParticipantInfo(result.participant_id)
              const isTopThree = result.currentRank <= 3

              return (
                <div
                  key={result.participant_id || index}
                  className={`rank-item ${
                    result.animationState === 'up' ? 'bounce-up' :
                    result.animationState === 'down' ? 'bounce-down' : ''
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div
                    className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition-all ${
                      isTopThree
                        ? 'bg-gradient-to-r from-yellow-500/90 to-orange-500/90 shadow-lg border-2 border-yellow-300'
                        : 'bg-white/10 hover:bg-white/15'
                    }`}
                  >
                    {/* Rank Badge */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-black text-xl sm:text-2xl ${
                        isTopThree
                          ? 'bg-white text-gray-800'
                          : 'bg-purple-700 text-white'
                      } ${
                        result.animationState === 'up' ? 'rank-badge-up' :
                        result.animationState === 'down' ? 'rank-badge-down' : ''
                      }`}
                    >
                      {getRankEmoji(result.currentRank)}
                    </div>

                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className={`rounded-full ${
                        isTopThree ? 'ring-4 ring-white' : 'ring-2 ring-purple-400'
                      }`}>
                        <AvatarDisplay
                          avatarId={(participant as any)?.avatar_id}
                          size="md"
                        />
                      </div>
                    </div>

                    {/* Player Info */}
                    <div className="flex-grow min-w-0">
                      <div className={`font-bold text-base sm:text-lg truncate ${
                        isTopThree ? 'text-white' : 'text-white/90'
                      }`}>
                        {result.nickname}
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <span className={isTopThree ? 'text-white/80' : 'text-white/60'}>
                          {result.correct_answers}/{result.total_questions} correct
                        </span>
                        {result.animationState === 'up' && (
                          <span className="text-green-300 font-bold flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>UP</span>
                          </span>
                        )}
                        {result.animationState === 'down' && (
                          <span className="text-red-300 font-bold flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>DOWN</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex-shrink-0 text-right">
                      <div className={`font-black text-2xl sm:text-3xl ${
                        isTopThree ? 'text-white' : 'text-yellow-400'
                      }`}>
                        {result.total_score}
                      </div>
                      <div className={`text-xs ${
                        isTopThree ? 'text-white/70' : 'text-white/50'
                      }`}>
                        points
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer - Show if there are more results */}
        {rankedResults.length > maxDisplay && (
          <div className="bg-purple-800/50 px-4 py-3 text-center">
            <p className="text-white/70 text-sm">
              +{rankedResults.length - maxDisplay} more players
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

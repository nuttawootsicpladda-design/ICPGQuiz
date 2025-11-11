'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/types/types'
import { getTeam } from '@/utils/teams'
import TeamBadge from './TeamBadge'

interface TeamScore {
  team_id: string
  team_member_count: number
  total_team_score: number
  correct_answers: number
  total_answers: number
  rank: number
}

interface TeamLeaderboardProps {
  gameId: string
  currentQuestionIndex?: number
  totalQuestions?: number
}

export default function TeamLeaderboard({
  gameId,
  currentQuestionIndex,
  totalQuestions
}: TeamLeaderboardProps) {
  const [teamScores, setTeamScores] = useState<TeamScore[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTeamScores()

    // Subscribe to answer changes
    const channel = supabase
      .channel(`team-leaderboard:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'answers',
        },
        () => {
          loadTeamScores()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId])

  const loadTeamScores = async () => {
    try {
      const { data, error } = await supabase
        .from('team_leaderboard')
        .select('*')
        .eq('game_id', gameId)
        .order('total_team_score', { ascending: false })

      if (error) throw error

      // Filter and transform data to match TeamScore interface
      const scores = (data || [])
        .filter(item => item.team_id !== null)
        .map(item => ({
          team_id: item.team_id as string,
          team_member_count: item.team_member_count || 0,
          total_team_score: item.total_team_score || 0,
          correct_answers: item.correct_answers || 0,
          total_answers: item.total_answers || 0,
          rank: item.rank || 0
        }))

      setTeamScores(scores)
    } catch (error) {
      console.error('Error loading team scores:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (teamScores.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center text-gray-500">
        <p className="text-lg">Waiting for teams to answer...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
        <h2 className="text-3xl font-bold mb-2">Team Leaderboard</h2>
        {currentQuestionIndex !== undefined && totalQuestions !== undefined && (
          <p className="text-purple-100">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </p>
        )}
      </div>

      {/* Team Scores */}
      <div className="p-4 space-y-3">
        {teamScores.map((teamScore, index) => {
          const team = getTeam(teamScore.team_id)
          if (!team) return null

          const isWinning = index === 0
          const accuracy = teamScore.total_answers > 0
            ? ((teamScore.correct_answers / teamScore.total_answers) * 100).toFixed(1)
            : '0.0'

          return (
            <div
              key={teamScore.team_id}
              className={`
                relative p-4 rounded-xl transition-all duration-300
                ${isWinning ? 'scale-105 shadow-2xl ring-4 ring-yellow-400' : 'shadow-lg'}
              `}
              style={{
                backgroundColor: `${team.color}15`,
                borderLeft: `6px solid ${team.color}`
              }}
            >
              {/* Rank Badge */}
              <div
                className="absolute -top-2 -left-2 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                style={{ backgroundColor: team.color }}
              >
                {index === 0 ? '🏆' : index + 1}
              </div>

              <div className="flex items-center justify-between ml-6">
                {/* Team Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">{team.emoji}</span>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">
                        {team.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {teamScore.team_member_count} {teamScore.team_member_count === 1 ? 'player' : 'players'}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">Accuracy:</span>
                      <span className="font-semibold text-gray-800">{accuracy}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">Answers:</span>
                      <span className="font-semibold text-gray-800">
                        {teamScore.correct_answers}/{teamScore.total_answers}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-4xl font-bold" style={{ color: team.color }}>
                    {teamScore.total_team_score.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">points</div>
                </div>
              </div>

              {/* Winning Banner */}
              {isWinning && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                    🥇 LEADING
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

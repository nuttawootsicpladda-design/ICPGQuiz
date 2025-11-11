'use client'

import { useState, useEffect } from 'react'
import { Team, getTeamsByCount, TEAMS } from '@/utils/teams'
import { supabase } from '@/types/types'

interface TeamSelectorProps {
  gameId: string
  maxTeams: 2 | 3 | 4
  onTeamSelected: (teamId: string) => void
  selectedTeam?: string
}

interface TeamStats {
  teamId: string
  memberCount: number
}

export default function TeamSelector({
  gameId,
  maxTeams,
  onTeamSelected,
  selectedTeam
}: TeamSelectorProps) {
  const [teamStats, setTeamStats] = useState<TeamStats[]>([])
  const [loading, setLoading] = useState(true)
  const availableTeams = getTeamsByCount(maxTeams)

  useEffect(() => {
    loadTeamStats()

    // Subscribe to participant changes
    const channel = supabase
      .channel(`team-stats:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          loadTeamStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId])

  const loadTeamStats = async () => {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('team_id')
        .eq('game_id', gameId)
        .not('team_id', 'is', null)

      if (error) throw error

      // Count members per team
      const stats: Record<string, number> = {}
      availableTeams.forEach(team => {
        stats[team.id] = 0
      })

      data?.forEach(p => {
        if (p.team_id && stats[p.team_id] !== undefined) {
          stats[p.team_id]++
        }
      })

      const statsArray = Object.entries(stats).map(([teamId, count]) => ({
        teamId,
        memberCount: count
      }))

      setTeamStats(statsArray)
    } catch (error) {
      console.error('Error loading team stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTeamMemberCount = (teamId: string): number => {
    return teamStats.find(s => s.teamId === teamId)?.memberCount || 0
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Team!</h3>
        <p className="text-gray-600">Select a team to join the battle</p>
      </div>

      <div className={`grid gap-4 ${
        maxTeams === 2 ? 'grid-cols-2' :
        maxTeams === 3 ? 'grid-cols-3' :
        'grid-cols-2 md:grid-cols-4'
      }`}>
        {availableTeams.map((team) => {
          const memberCount = getTeamMemberCount(team.id)
          const isSelected = selectedTeam === team.id

          return (
            <button
              key={team.id}
              onClick={() => onTeamSelected(team.id)}
              disabled={loading}
              className={`
                relative p-6 rounded-xl transition-all duration-200 active:scale-95
                ${isSelected
                  ? `${team.bgColor} text-white shadow-2xl scale-105 ring-4 ring-${team.id}-300`
                  : `bg-white hover:shadow-xl border-4 ${team.borderColor}`
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              style={{
                borderColor: team.color,
                ...(isSelected && { backgroundColor: team.color })
              }}
            >
              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-white text-gray-800 rounded-full p-2 shadow-lg">
                  ✓
                </div>
              )}

              {/* Team Emoji */}
              <div className="text-6xl mb-3 animate-bounce">
                {team.emoji}
              </div>

              {/* Team Name */}
              <h4 className={`text-xl font-bold mb-2 ${
                isSelected ? 'text-white' : 'text-gray-800'
              }`}>
                {team.name}
              </h4>

              {/* Team Description */}
              <p className={`text-sm mb-3 ${
                isSelected ? 'text-white text-opacity-90' : 'text-gray-600'
              }`}>
                {team.description}
              </p>

              {/* Member Count */}
              <div className={`flex items-center justify-center gap-2 text-sm font-semibold ${
                isSelected ? 'text-white' : 'text-gray-700'
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>{memberCount} {memberCount === 1 ? 'player' : 'players'}</span>
              </div>
            </button>
          )
        })}
      </div>

      {selectedTeam && (
        <div className="text-center mt-6 p-4 bg-green-50 border-2 border-green-400 rounded-lg">
          <p className="text-green-800 font-semibold">
            ✅ You&apos;re on <span className="font-bold">{TEAMS[selectedTeam].name}</span>!
          </p>
        </div>
      )}
    </div>
  )
}

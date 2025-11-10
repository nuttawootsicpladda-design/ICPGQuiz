// Team configurations and utilities

export interface Team {
  id: string
  name: string
  color: string
  bgColor: string
  borderColor: string
  emoji: string
  description: string
}

export const TEAMS: Record<string, Team> = {
  red: {
    id: 'red',
    name: 'Red Dragons',
    color: '#EF4444',
    bgColor: 'bg-red-500',
    borderColor: 'border-red-500',
    emoji: '🐉',
    description: 'Fierce and unstoppable'
  },
  blue: {
    id: 'blue',
    name: 'Blue Sharks',
    color: '#3B82F6',
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-500',
    emoji: '🦈',
    description: 'Smart and strategic'
  },
  green: {
    id: 'green',
    name: 'Green Ninjas',
    color: '#10B981',
    bgColor: 'bg-green-500',
    borderColor: 'border-green-500',
    emoji: '🥷',
    description: 'Swift and stealthy'
  },
  yellow: {
    id: 'yellow',
    name: 'Yellow Lightning',
    color: '#F59E0B',
    bgColor: 'bg-yellow-500',
    borderColor: 'border-yellow-500',
    emoji: '⚡',
    description: 'Fast and energetic'
  }
}

export const ALL_TEAMS = Object.values(TEAMS)

export function getTeam(teamId: string): Team | undefined {
  return TEAMS[teamId]
}

export function getTeamsByCount(count: 2 | 3 | 4): Team[] {
  const teamOrder = ['red', 'blue', 'green', 'yellow']
  return teamOrder.slice(0, count).map(id => TEAMS[id])
}

export function getTeamColor(teamId: string | null | undefined): string {
  if (!teamId) return '#6B7280'
  return TEAMS[teamId]?.color || '#6B7280'
}

export function getTeamName(teamId: string | null | undefined): string {
  if (!teamId) return 'No Team'
  return TEAMS[teamId]?.name || 'Unknown Team'
}

export function getTeamEmoji(teamId: string | null | undefined): string {
  if (!teamId) return '❓'
  return TEAMS[teamId]?.emoji || '❓'
}

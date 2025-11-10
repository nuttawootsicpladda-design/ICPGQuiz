'use client'

import { getTeam } from '@/utils/teams'

interface TeamBadgeProps {
  teamId: string | null | undefined
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  className?: string
}

export default function TeamBadge({
  teamId,
  size = 'md',
  showName = true,
  className = ''
}: TeamBadgeProps) {
  if (!teamId) return null

  const team = getTeam(teamId)
  if (!team) return null

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const emojiSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold text-white ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: team.color }}
    >
      <span className={emojiSizes[size]}>{team.emoji}</span>
      {showName && <span>{team.name}</span>}
    </span>
  )
}

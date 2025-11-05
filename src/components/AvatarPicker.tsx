'use client'

import { AVATARS, Avatar, getAvatarById, DEFAULT_AVATAR } from '@/utils/avatars'
import { useState } from 'react'

interface AvatarPickerProps {
  selectedAvatarId?: string
  onSelect: (avatarId: string) => void
}

export default function AvatarPicker({ selectedAvatarId, onSelect }: AvatarPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedAvatar = selectedAvatarId ? getAvatarById(selectedAvatarId) || DEFAULT_AVATAR : DEFAULT_AVATAR

  return (
    <div className="relative">
      {/* Selected Avatar Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full"
      >
        <div className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:border-blue-400 transition-colors bg-white">
          <div className={`w-12 h-12 rounded-full ${selectedAvatar.bgColor} border-2 ${selectedAvatar.borderColor} flex items-center justify-center text-2xl`}>
            {selectedAvatar.emoji}
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-semibold text-gray-700">
              {selectedAvatar.name}
            </div>
            <div className="text-xs text-gray-500">
              Click to change avatar
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Avatar Grid Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute z-20 mt-2 w-full md:w-96 bg-white border-2 border-gray-300 rounded-lg shadow-2xl max-h-96 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Choose your avatar
              </h3>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => {
                      onSelect(avatar.id)
                      setIsOpen(false)
                    }}
                    className={`
                      aspect-square rounded-lg ${avatar.bgColor} border-2 ${
                        selectedAvatarId === avatar.id
                          ? `${avatar.borderColor} ring-2 ring-blue-500 ring-offset-2`
                          : `${avatar.borderColor} hover:ring-2 hover:ring-gray-300`
                      }
                      flex items-center justify-center text-3xl md:text-4xl
                      transition-all hover:scale-110 cursor-pointer
                    `}
                    title={avatar.name}
                  >
                    {avatar.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Avatar Display Component (for showing avatar in other places)
interface AvatarDisplayProps {
  avatarId?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showName?: boolean
  className?: string
}

export function AvatarDisplay({ avatarId, size = 'md', showName = false, className = '' }: AvatarDisplayProps) {
  const avatar = avatarId ? getAvatarById(avatarId) || DEFAULT_AVATAR : DEFAULT_AVATAR

  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
    xl: 'w-24 h-24 text-5xl',
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full ${avatar.bgColor} border-2 ${avatar.borderColor} flex items-center justify-center flex-shrink-0`}>
        {avatar.emoji}
      </div>
      {showName && (
        <span className="text-sm font-medium text-gray-700">
          {avatar.name}
        </span>
      )}
    </div>
  )
}

'use client'

import { QUIZ_THEMES, QuizTheme, getThemeById, DEFAULT_THEME } from '@/utils/themes'
import { useState } from 'react'

interface ThemePickerProps {
  selectedThemeId?: string
  onSelect: (themeId: string) => void
}

export default function ThemePicker({ selectedThemeId, onSelect }: ThemePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedTheme = selectedThemeId ? getThemeById(selectedThemeId) || DEFAULT_THEME : DEFAULT_THEME

  return (
    <div className="relative">
      {/* Selected Theme Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full"
      >
        <div className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:border-blue-400 transition-colors bg-white">
          {/* Theme Preview */}
          <div className={`w-16 h-16 rounded-lg ${selectedTheme.lobbyBg} flex items-center justify-center text-3xl border-2 ${selectedTheme.cardBorder}`}>
            {selectedTheme.preview}
          </div>

          {/* Theme Info */}
          <div className="flex-1 text-left">
            <div className="text-sm font-semibold text-gray-700">
              {selectedTheme.name} Theme
            </div>
            <div className="text-xs text-gray-500">
              {selectedTheme.description}
            </div>
          </div>

          {/* Dropdown Arrow */}
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

      {/* Theme Grid Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute z-20 mt-2 w-full bg-white border-2 border-gray-300 rounded-lg shadow-2xl max-h-96 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Choose a theme for your quiz
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {QUIZ_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      onSelect(theme.id)
                      setIsOpen(false)
                    }}
                    className={`
                      p-3 rounded-lg border-2 transition-all
                      ${selectedThemeId === theme.id
                        ? 'border-blue-500 ring-2 ring-blue-300'
                        : 'border-gray-200 hover:border-gray-400'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {/* Theme Preview */}
                      <div className={`w-12 h-12 rounded-lg ${theme.lobbyBg} flex items-center justify-center text-2xl flex-shrink-0`}>
                        {theme.preview}
                      </div>

                      {/* Theme Details */}
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-800 text-sm">
                          {theme.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {theme.description}
                        </div>
                      </div>

                      {/* Selected Check */}
                      {selectedThemeId === theme.id && (
                        <svg
                          className="w-5 h-5 text-blue-500 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Color Preview */}
                    <div className="mt-2 flex gap-1">
                      <div className={`h-2 flex-1 rounded ${theme.answerColors.color1.split(' ')[0]}`}></div>
                      <div className={`h-2 flex-1 rounded ${theme.answerColors.color2.split(' ')[0]}`}></div>
                      <div className={`h-2 flex-1 rounded ${theme.answerColors.color3.split(' ')[0]}`}></div>
                      <div className={`h-2 flex-1 rounded ${theme.answerColors.color4.split(' ')[0]}`}></div>
                    </div>
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

// Theme Preview Component (for showing theme in other places)
interface ThemePreviewProps {
  themeId?: string
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  className?: string
}

export function ThemePreview({ themeId, size = 'md', showName = false, className = '' }: ThemePreviewProps) {
  const theme = themeId ? getThemeById(themeId) || DEFAULT_THEME : DEFAULT_THEME

  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-lg ${theme.lobbyBg} flex items-center justify-center border-2 ${theme.cardBorder} flex-shrink-0`}>
        {theme.preview}
      </div>
      {showName && (
        <div>
          <div className="text-sm font-medium text-gray-700">
            {theme.name}
          </div>
          <div className="text-xs text-gray-500">
            {theme.description}
          </div>
        </div>
      )}
    </div>
  )
}

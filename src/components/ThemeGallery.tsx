'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/types/types'

interface Theme {
  id: string
  name: string
  description?: string
  background_type: 'gradient' | 'image' | 'video' | 'solid'
  background_value: string
  text_color: string
  accent_color: string
  font_family: string
  is_premium: boolean
  preview_image_url?: string
}

interface ThemeGalleryProps {
  selectedThemeId?: string
  onSelect: (theme: Theme) => void
  showCustomTheme?: boolean
}

// Default themes (used if database themes not available)
const DEFAULT_THEMES: Theme[] = [
  {
    id: 'classic',
    name: 'Classic Purple',
    description: 'Default purple gradient theme',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    text_color: '#FFFFFF',
    accent_color: '#FFD700',
    font_family: 'Inter',
    is_premium: false,
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'Calm ocean-inspired theme',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
    text_color: '#FFFFFF',
    accent_color: '#FCD34D',
    font_family: 'Inter',
    is_premium: false,
  },
  {
    id: 'forest',
    name: 'Forest Green',
    description: 'Nature-inspired green theme',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    text_color: '#FFFFFF',
    accent_color: '#FBBF24',
    font_family: 'Inter',
    is_premium: false,
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    description: 'Warm sunset colors',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
    text_color: '#FFFFFF',
    accent_color: '#FEF3C7',
    font_family: 'Inter',
    is_premium: false,
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dark elegant theme',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
    text_color: '#FFFFFF',
    accent_color: '#60A5FA',
    font_family: 'Inter',
    is_premium: false,
  },
  {
    id: 'corporate',
    name: 'Corporate Blue',
    description: 'Professional business theme',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
    text_color: '#FFFFFF',
    accent_color: '#FCD34D',
    font_family: 'Inter',
    is_premium: false,
  },
  {
    id: 'rose',
    name: 'Rose Gold',
    description: 'Elegant rose gold theme',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #FB7185 0%, #F472B6 100%)',
    text_color: '#FFFFFF',
    accent_color: '#FEF3C7',
    font_family: 'Inter',
    is_premium: false,
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Vibrant neon colors',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
    text_color: '#FFFFFF',
    accent_color: '#F0ABFC',
    font_family: 'Inter',
    is_premium: false,
  },
  {
    id: 'cyber',
    name: 'Cyber Punk',
    description: 'Futuristic cyber theme',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #D946EF 0%, #0D9488 100%)',
    text_color: '#FFFFFF',
    accent_color: '#FACC15',
    font_family: 'Inter',
    is_premium: true,
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    description: 'Northern lights inspired',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #22C55E 0%, #14B8A6 50%, #6366F1 100%)',
    text_color: '#FFFFFF',
    accent_color: '#FDE047',
    font_family: 'Inter',
    is_premium: true,
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    description: 'Deep space galaxy theme',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #312E81 0%, #581C87 50%, #0F172A 100%)',
    text_color: '#FFFFFF',
    accent_color: '#A78BFA',
    font_family: 'Inter',
    is_premium: true,
  },
  {
    id: 'minimal-light',
    name: 'Minimal Light',
    description: 'Clean light theme',
    background_type: 'solid',
    background_value: '#F8FAFC',
    text_color: '#1E293B',
    accent_color: '#7C3AED',
    font_family: 'Inter',
    is_premium: false,
  },
]

export default function ThemeGallery({
  selectedThemeId,
  onSelect,
  showCustomTheme = false,
}: ThemeGalleryProps) {
  const [themes, setThemes] = useState<Theme[]>(DEFAULT_THEMES)
  const [customTheme, setCustomTheme] = useState<Theme>({
    id: 'custom',
    name: 'Custom Theme',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    text_color: '#FFFFFF',
    accent_color: '#FFD700',
    font_family: 'Inter',
    is_premium: false,
  })
  const [showCustomizer, setShowCustomizer] = useState(false)

  // Load themes from database
  useEffect(() => {
    const loadThemes = async () => {
      const { data, error } = await (supabase as any)
        .from('presentation_themes')
        .select('*')
        .eq('is_public', true)
        .order('is_premium')

      if (!error && data && data.length > 0) {
        setThemes(data)
      }
    }

    loadThemes()
  }, [])

  const handleCustomThemeUpdate = (field: keyof Theme, value: string) => {
    setCustomTheme(prev => ({ ...prev, [field]: value }))
  }

  const applyCustomTheme = () => {
    onSelect(customTheme)
    setShowCustomizer(false)
  }

  return (
    <div>
      {/* Theme Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onSelect(theme)}
            className={`relative group rounded-xl overflow-hidden transition-all ${
              selectedThemeId === theme.id
                ? 'ring-4 ring-purple-500 scale-105'
                : 'hover:scale-105'
            }`}
          >
            {/* Theme Preview */}
            <div
              className="h-24 sm:h-32 flex items-center justify-center"
              style={{
                background: theme.background_type === 'image'
                  ? `url(${theme.background_value}) center/cover`
                  : theme.background_value,
              }}
            >
              <div
                className="text-2xl font-bold"
                style={{ color: theme.text_color }}
              >
                Aa
              </div>
            </div>

            {/* Theme Info */}
            <div className="p-2 bg-white">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm truncate">{theme.name}</span>
                {theme.is_premium && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                    ✨
                  </span>
                )}
              </div>
            </div>

            {/* Selected indicator */}
            {selectedThemeId === theme.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        ))}

        {/* Custom Theme Button */}
        {showCustomTheme && (
          <button
            onClick={() => setShowCustomizer(true)}
            className="rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-purple-500 transition-all h-24 sm:h-32 flex flex-col items-center justify-center text-gray-500 hover:text-purple-500"
          >
            <span className="text-2xl">🎨</span>
            <span className="text-sm mt-1">สร้างธีมเอง</span>
          </button>
        )}
      </div>

      {/* Custom Theme Modal */}
      {showCustomizer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">🎨 สร้างธีมของคุณ</h3>

            {/* Preview */}
            <div
              className="h-32 rounded-xl mb-4 flex items-center justify-center"
              style={{ background: customTheme.background_value }}
            >
              <span className="text-2xl font-bold" style={{ color: customTheme.text_color }}>
                Preview
              </span>
            </div>

            {/* Color 1 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                สีที่ 1
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value="#7C3AED"
                  onChange={(e) => {
                    const color1 = e.target.value
                    const match = customTheme.background_value.match(/#[A-Fa-f0-9]{6}/g)
                    const color2 = match?.[1] || '#EC4899'
                    handleCustomThemeUpdate(
                      'background_value',
                      `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`
                    )
                  }}
                  className="w-12 h-12 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Color 2 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                สีที่ 2
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value="#EC4899"
                  onChange={(e) => {
                    const color2 = e.target.value
                    const match = customTheme.background_value.match(/#[A-Fa-f0-9]{6}/g)
                    const color1 = match?.[0] || '#7C3AED'
                    handleCustomThemeUpdate(
                      'background_value',
                      `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`
                    )
                  }}
                  className="w-12 h-12 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Text Color */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                สีข้อความ
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCustomThemeUpdate('text_color', '#FFFFFF')}
                  className={`px-4 py-2 rounded ${
                    customTheme.text_color === '#FFFFFF' ? 'ring-2 ring-purple-500' : ''
                  } bg-gray-800 text-white`}
                >
                  ขาว
                </button>
                <button
                  onClick={() => handleCustomThemeUpdate('text_color', '#1E293B')}
                  className={`px-4 py-2 rounded ${
                    customTheme.text_color === '#1E293B' ? 'ring-2 ring-purple-500' : ''
                  } bg-white text-gray-800 border`}
                >
                  ดำ
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={applyCustomTheme}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700"
              >
                ใช้ธีมนี้
              </button>
              <button
                onClick={() => setShowCustomizer(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Export individual theme component for use in games
export function ThemedBackground({
  theme,
  children,
}: {
  theme?: Theme
  children: React.ReactNode
}) {
  const defaultStyle = {
    background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    color: '#FFFFFF',
  }

  const style = theme
    ? {
        background: theme.background_type === 'image'
          ? `url(${theme.background_value}) center/cover`
          : theme.background_value,
        color: theme.text_color,
      }
    : defaultStyle

  return (
    <div className="min-h-screen" style={style}>
      {children}
    </div>
  )
}

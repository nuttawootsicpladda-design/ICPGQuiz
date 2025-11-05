// Theme system for quiz customization
export interface QuizTheme {
  id: string
  name: string
  description: string
  preview: string // Emoji for preview

  // Background gradients
  lobbyBg: string
  gameBg: string
  resultsBg: string

  // Answer button colors (for 4 choices)
  answerColors: {
    color1: string // Red/First
    color2: string // Blue/Second
    color3: string // Yellow/Third
    color4: string // Green/Fourth
  }

  // UI colors
  primaryColor: string
  secondaryColor: string
  accentColor: string
  textColor: string

  // Card/panel styling
  cardBg: string
  cardBorder: string
}

export const QUIZ_THEMES: QuizTheme[] = [
  // Classic Kahoot Style
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional Kahoot style',
    preview: '🎮',
    lobbyBg: 'bg-gradient-to-br from-purple-600 to-pink-500',
    gameBg: 'bg-slate-900',
    resultsBg: 'bg-black',
    answerColors: {
      color1: 'bg-red-500 hover:bg-red-600',
      color2: 'bg-blue-500 hover:bg-blue-600',
      color3: 'bg-yellow-500 hover:bg-yellow-600',
      color4: 'bg-green-500 hover:bg-green-600',
    },
    primaryColor: 'bg-purple-600',
    secondaryColor: 'bg-pink-500',
    accentColor: 'bg-white',
    textColor: 'text-white',
    cardBg: 'bg-white',
    cardBorder: 'border-purple-400',
  },

  // Ocean Theme
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep sea vibes',
    preview: '🌊',
    lobbyBg: 'bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400',
    gameBg: 'bg-gradient-to-b from-blue-900 to-cyan-900',
    resultsBg: 'bg-gradient-to-br from-blue-950 to-cyan-950',
    answerColors: {
      color1: 'bg-cyan-500 hover:bg-cyan-600',
      color2: 'bg-blue-500 hover:bg-blue-600',
      color3: 'bg-teal-500 hover:bg-teal-600',
      color4: 'bg-sky-500 hover:bg-sky-600',
    },
    primaryColor: 'bg-blue-600',
    secondaryColor: 'bg-cyan-500',
    accentColor: 'bg-teal-400',
    textColor: 'text-white',
    cardBg: 'bg-white bg-opacity-95',
    cardBorder: 'border-cyan-400',
  },

  // Forest Theme
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural and fresh',
    preview: '🌳',
    lobbyBg: 'bg-gradient-to-br from-green-700 via-emerald-600 to-lime-500',
    gameBg: 'bg-gradient-to-b from-green-900 to-emerald-900',
    resultsBg: 'bg-gradient-to-br from-green-950 to-emerald-950',
    answerColors: {
      color1: 'bg-green-500 hover:bg-green-600',
      color2: 'bg-emerald-500 hover:bg-emerald-600',
      color3: 'bg-lime-500 hover:bg-lime-600',
      color4: 'bg-teal-500 hover:bg-teal-600',
    },
    primaryColor: 'bg-green-700',
    secondaryColor: 'bg-emerald-600',
    accentColor: 'bg-lime-500',
    textColor: 'text-white',
    cardBg: 'bg-white bg-opacity-95',
    cardBorder: 'border-green-400',
  },

  // Sunset Theme
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm and vibrant',
    preview: '🌅',
    lobbyBg: 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-500',
    gameBg: 'bg-gradient-to-b from-orange-900 to-red-900',
    resultsBg: 'bg-gradient-to-br from-orange-950 to-red-950',
    answerColors: {
      color1: 'bg-orange-500 hover:bg-orange-600',
      color2: 'bg-red-500 hover:bg-red-600',
      color3: 'bg-yellow-500 hover:bg-yellow-600',
      color4: 'bg-pink-500 hover:bg-pink-600',
    },
    primaryColor: 'bg-orange-600',
    secondaryColor: 'bg-red-500',
    accentColor: 'bg-yellow-400',
    textColor: 'text-white',
    cardBg: 'bg-white bg-opacity-95',
    cardBorder: 'border-orange-400',
  },

  // Space Theme
  {
    id: 'space',
    name: 'Space',
    description: 'Cosmic adventure',
    preview: '🚀',
    lobbyBg: 'bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700',
    gameBg: 'bg-gradient-to-b from-indigo-950 to-purple-950',
    resultsBg: 'bg-black',
    answerColors: {
      color1: 'bg-purple-500 hover:bg-purple-600',
      color2: 'bg-indigo-500 hover:bg-indigo-600',
      color3: 'bg-pink-500 hover:bg-pink-600',
      color4: 'bg-violet-500 hover:bg-violet-600',
    },
    primaryColor: 'bg-indigo-900',
    secondaryColor: 'bg-purple-800',
    accentColor: 'bg-pink-500',
    textColor: 'text-white',
    cardBg: 'bg-white bg-opacity-90',
    cardBorder: 'border-purple-400',
  },

  // Neon Theme
  {
    id: 'neon',
    name: 'Neon',
    description: 'Electric and bright',
    preview: '⚡',
    lobbyBg: 'bg-gradient-to-br from-fuchsia-600 via-purple-600 to-cyan-500',
    gameBg: 'bg-gradient-to-b from-gray-900 to-black',
    resultsBg: 'bg-black',
    answerColors: {
      color1: 'bg-fuchsia-500 hover:bg-fuchsia-600 ring-2 ring-fuchsia-400',
      color2: 'bg-cyan-500 hover:bg-cyan-600 ring-2 ring-cyan-400',
      color3: 'bg-yellow-400 hover:bg-yellow-500 ring-2 ring-yellow-300',
      color4: 'bg-green-400 hover:bg-green-500 ring-2 ring-green-300',
    },
    primaryColor: 'bg-fuchsia-600',
    secondaryColor: 'bg-cyan-500',
    accentColor: 'bg-yellow-400',
    textColor: 'text-white',
    cardBg: 'bg-gray-900 bg-opacity-90',
    cardBorder: 'border-fuchsia-500',
  },

  // Candy Theme
  {
    id: 'candy',
    name: 'Candy',
    description: 'Sweet and colorful',
    preview: '🍭',
    lobbyBg: 'bg-gradient-to-br from-pink-400 via-rose-400 to-fuchsia-400',
    gameBg: 'bg-gradient-to-b from-pink-200 to-purple-200',
    resultsBg: 'bg-gradient-to-br from-pink-300 to-purple-300',
    answerColors: {
      color1: 'bg-pink-500 hover:bg-pink-600',
      color2: 'bg-purple-500 hover:bg-purple-600',
      color3: 'bg-yellow-400 hover:bg-yellow-500',
      color4: 'bg-rose-500 hover:bg-rose-600',
    },
    primaryColor: 'bg-pink-500',
    secondaryColor: 'bg-purple-500',
    accentColor: 'bg-yellow-400',
    textColor: 'text-gray-800',
    cardBg: 'bg-white',
    cardBorder: 'border-pink-400',
  },

  // Dark Mode
  {
    id: 'dark',
    name: 'Dark',
    description: 'Sleek and modern',
    preview: '🌙',
    lobbyBg: 'bg-gradient-to-br from-gray-800 to-gray-900',
    gameBg: 'bg-gray-950',
    resultsBg: 'bg-black',
    answerColors: {
      color1: 'bg-gray-700 hover:bg-gray-600 border border-gray-600',
      color2: 'bg-slate-700 hover:bg-slate-600 border border-slate-600',
      color3: 'bg-zinc-700 hover:bg-zinc-600 border border-zinc-600',
      color4: 'bg-neutral-700 hover:bg-neutral-600 border border-neutral-600',
    },
    primaryColor: 'bg-gray-800',
    secondaryColor: 'bg-gray-700',
    accentColor: 'bg-gray-600',
    textColor: 'text-white',
    cardBg: 'bg-gray-800',
    cardBorder: 'border-gray-700',
  },

  // Rainbow Theme
  {
    id: 'rainbow',
    name: 'Rainbow',
    description: 'All the colors!',
    preview: '🌈',
    lobbyBg: 'bg-gradient-to-br from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500',
    gameBg: 'bg-gradient-to-b from-purple-900 to-pink-900',
    resultsBg: 'bg-gradient-to-br from-indigo-900 to-purple-900',
    answerColors: {
      color1: 'bg-red-500 hover:bg-red-600',
      color2: 'bg-blue-500 hover:bg-blue-600',
      color3: 'bg-yellow-400 hover:bg-yellow-500',
      color4: 'bg-green-500 hover:bg-green-600',
    },
    primaryColor: 'bg-purple-600',
    secondaryColor: 'bg-pink-500',
    accentColor: 'bg-yellow-400',
    textColor: 'text-white',
    cardBg: 'bg-white',
    cardBorder: 'border-purple-400',
  },

  // Fire Theme
  {
    id: 'fire',
    name: 'Fire',
    description: 'Hot and intense',
    preview: '🔥',
    lobbyBg: 'bg-gradient-to-br from-red-600 via-orange-600 to-yellow-500',
    gameBg: 'bg-gradient-to-b from-red-950 to-orange-950',
    resultsBg: 'bg-gradient-to-br from-red-950 to-black',
    answerColors: {
      color1: 'bg-red-600 hover:bg-red-700',
      color2: 'bg-orange-600 hover:bg-orange-700',
      color3: 'bg-yellow-500 hover:bg-yellow-600',
      color4: 'bg-amber-600 hover:bg-amber-700',
    },
    primaryColor: 'bg-red-600',
    secondaryColor: 'bg-orange-600',
    accentColor: 'bg-yellow-500',
    textColor: 'text-white',
    cardBg: 'bg-white bg-opacity-90',
    cardBorder: 'border-red-500',
  },

  // Ice Theme
  {
    id: 'ice',
    name: 'Ice',
    description: 'Cool and fresh',
    preview: '❄️',
    lobbyBg: 'bg-gradient-to-br from-cyan-300 via-blue-300 to-indigo-300',
    gameBg: 'bg-gradient-to-b from-cyan-950 to-blue-950',
    resultsBg: 'bg-gradient-to-br from-blue-950 to-indigo-950',
    answerColors: {
      color1: 'bg-cyan-400 hover:bg-cyan-500',
      color2: 'bg-blue-400 hover:bg-blue-500',
      color3: 'bg-sky-400 hover:bg-sky-500',
      color4: 'bg-indigo-400 hover:bg-indigo-500',
    },
    primaryColor: 'bg-cyan-500',
    secondaryColor: 'bg-blue-500',
    accentColor: 'bg-sky-300',
    textColor: 'text-gray-900',
    cardBg: 'bg-white',
    cardBorder: 'border-cyan-400',
  },

  // Nature Theme
  {
    id: 'nature',
    name: 'Nature',
    description: 'Earth tones',
    preview: '🍂',
    lobbyBg: 'bg-gradient-to-br from-amber-700 via-green-700 to-emerald-600',
    gameBg: 'bg-gradient-to-b from-amber-950 to-green-950',
    resultsBg: 'bg-gradient-to-br from-green-950 to-emerald-950',
    answerColors: {
      color1: 'bg-amber-600 hover:bg-amber-700',
      color2: 'bg-green-600 hover:bg-green-700',
      color3: 'bg-yellow-600 hover:bg-yellow-700',
      color4: 'bg-emerald-600 hover:bg-emerald-700',
    },
    primaryColor: 'bg-green-700',
    secondaryColor: 'bg-amber-700',
    accentColor: 'bg-yellow-600',
    textColor: 'text-white',
    cardBg: 'bg-white bg-opacity-90',
    cardBorder: 'border-green-500',
  },
]

// Get theme by ID
export function getThemeById(id: string): QuizTheme | undefined {
  return QUIZ_THEMES.find(theme => theme.id === id)
}

// Default theme
export const DEFAULT_THEME = QUIZ_THEMES[0] // Classic

// Get answer button class by index and theme
export function getAnswerButtonClass(index: number, themeId?: string): string {
  const theme = themeId ? getThemeById(themeId) || DEFAULT_THEME : DEFAULT_THEME

  switch (index) {
    case 0:
      return theme.answerColors.color1
    case 1:
      return theme.answerColors.color2
    case 2:
      return theme.answerColors.color3
    case 3:
      return theme.answerColors.color4
    default:
      return theme.answerColors.color1
  }
}

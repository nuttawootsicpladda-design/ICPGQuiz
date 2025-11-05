// Avatar data for player selection
export interface Avatar {
  id: string
  emoji: string
  name: string
  bgColor: string
  borderColor: string
}

export const AVATARS: Avatar[] = [
  // Animals
  { id: 'cat', emoji: '🐱', name: 'Cat', bgColor: 'bg-orange-100', borderColor: 'border-orange-400' },
  { id: 'dog', emoji: '🐶', name: 'Dog', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-400' },
  { id: 'bear', emoji: '🐻', name: 'Bear', bgColor: 'bg-amber-100', borderColor: 'border-amber-400' },
  { id: 'panda', emoji: '🐼', name: 'Panda', bgColor: 'bg-gray-100', borderColor: 'border-gray-400' },
  { id: 'lion', emoji: '🦁', name: 'Lion', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-500' },
  { id: 'tiger', emoji: '🐯', name: 'Tiger', bgColor: 'bg-orange-100', borderColor: 'border-orange-500' },
  { id: 'fox', emoji: '🦊', name: 'Fox', bgColor: 'bg-red-100', borderColor: 'border-red-400' },
  { id: 'koala', emoji: '🐨', name: 'Koala', bgColor: 'bg-gray-100', borderColor: 'border-gray-500' },
  { id: 'monkey', emoji: '🐵', name: 'Monkey', bgColor: 'bg-amber-100', borderColor: 'border-amber-500' },
  { id: 'pig', emoji: '🐷', name: 'Pig', bgColor: 'bg-pink-100', borderColor: 'border-pink-400' },
  { id: 'frog', emoji: '🐸', name: 'Frog', bgColor: 'bg-green-100', borderColor: 'border-green-400' },
  { id: 'rabbit', emoji: '🐰', name: 'Rabbit', bgColor: 'bg-gray-100', borderColor: 'border-gray-400' },

  // Sea Creatures
  { id: 'octopus', emoji: '🐙', name: 'Octopus', bgColor: 'bg-purple-100', borderColor: 'border-purple-400' },
  { id: 'fish', emoji: '🐠', name: 'Fish', bgColor: 'bg-blue-100', borderColor: 'border-blue-400' },
  { id: 'dolphin', emoji: '🐬', name: 'Dolphin', bgColor: 'bg-cyan-100', borderColor: 'border-cyan-400' },
  { id: 'shark', emoji: '🦈', name: 'Shark', bgColor: 'bg-blue-100', borderColor: 'border-blue-500' },

  // Birds
  { id: 'chicken', emoji: '🐔', name: 'Chicken', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-400' },
  { id: 'penguin', emoji: '🐧', name: 'Penguin', bgColor: 'bg-cyan-100', borderColor: 'border-cyan-500' },
  { id: 'owl', emoji: '🦉', name: 'Owl', bgColor: 'bg-amber-100', borderColor: 'border-amber-400' },
  { id: 'eagle', emoji: '🦅', name: 'Eagle', bgColor: 'bg-stone-100', borderColor: 'border-stone-500' },

  // Fantasy & Fun
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn', bgColor: 'bg-pink-100', borderColor: 'border-pink-500' },
  { id: 'dragon', emoji: '🐉', name: 'Dragon', bgColor: 'bg-red-100', borderColor: 'border-red-500' },
  { id: 'alien', emoji: '👽', name: 'Alien', bgColor: 'bg-green-100', borderColor: 'border-green-500' },
  { id: 'robot', emoji: '🤖', name: 'Robot', bgColor: 'bg-gray-100', borderColor: 'border-gray-500' },

  // Objects
  { id: 'rocket', emoji: '🚀', name: 'Rocket', bgColor: 'bg-blue-100', borderColor: 'border-blue-500' },
  { id: 'star', emoji: '⭐', name: 'Star', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-500' },
  { id: 'fire', emoji: '🔥', name: 'Fire', bgColor: 'bg-orange-100', borderColor: 'border-orange-500' },
  { id: 'lightning', emoji: '⚡', name: 'Lightning', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-600' },
  { id: 'rainbow', emoji: '🌈', name: 'Rainbow', bgColor: 'bg-gradient-to-r from-red-100 to-purple-100', borderColor: 'border-purple-400' },
  { id: 'crown', emoji: '👑', name: 'Crown', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-600' },

  // Food
  { id: 'pizza', emoji: '🍕', name: 'Pizza', bgColor: 'bg-red-100', borderColor: 'border-red-400' },
  { id: 'donut', emoji: '🍩', name: 'Donut', bgColor: 'bg-pink-100', borderColor: 'border-pink-500' },
  { id: 'icecream', emoji: '🍦', name: 'Ice Cream', bgColor: 'bg-pink-100', borderColor: 'border-pink-400' },
  { id: 'cake', emoji: '🎂', name: 'Cake', bgColor: 'bg-pink-100', borderColor: 'border-pink-500' },

  // Sports & Activities
  { id: 'soccer', emoji: '⚽', name: 'Soccer', bgColor: 'bg-green-100', borderColor: 'border-green-500' },
  { id: 'basketball', emoji: '🏀', name: 'Basketball', bgColor: 'bg-orange-100', borderColor: 'border-orange-500' },
  { id: 'trophy', emoji: '🏆', name: 'Trophy', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-600' },
  { id: 'medal', emoji: '🏅', name: 'Medal', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-500' },

  // Nature
  { id: 'tree', emoji: '🌳', name: 'Tree', bgColor: 'bg-green-100', borderColor: 'border-green-500' },
  { id: 'flower', emoji: '🌸', name: 'Flower', bgColor: 'bg-pink-100', borderColor: 'border-pink-400' },
  { id: 'sun', emoji: '☀️', name: 'Sun', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-500' },
  { id: 'moon', emoji: '🌙', name: 'Moon', bgColor: 'bg-blue-100', borderColor: 'border-blue-400' },
]

// Get avatar by ID
export function getAvatarById(id: string): Avatar | undefined {
  return AVATARS.find(avatar => avatar.id === id)
}

// Get random avatar
export function getRandomAvatar(): Avatar {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)]
}

// Default avatar for fallback
export const DEFAULT_AVATAR: Avatar = {
  id: 'default',
  emoji: '😊',
  name: 'Default',
  bgColor: 'bg-gray-100',
  borderColor: 'border-gray-400'
}

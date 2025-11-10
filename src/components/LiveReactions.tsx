'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/types/types'
import { RealtimeChannel } from '@supabase/supabase-js'

interface Reaction {
  id: string
  game_id: string
  participant_id: string
  emoji: string
  created_at: string
  // For animation
  x?: number
  y?: number
  animationId?: number
}

interface LiveReactionsProps {
  gameId: string
  participantId: string
  showPicker?: boolean
}

const EMOJI_OPTIONS = [
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '👍', label: 'Like' },
  { emoji: '👏', label: 'Clap' },
  { emoji: '🎉', label: 'Party' },
]

export default function LiveReactions({
  gameId,
  participantId,
  showPicker = true
}: LiveReactionsProps) {
  const [floatingReactions, setFloatingReactions] = useState<Reaction[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const reactionsChannelRef = useRef<RealtimeChannel | null>(null)
  const animationIdCounter = useRef(0)

  // Subscribe to reactions
  useEffect(() => {
    const channel = supabase
      .channel(`reactions:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reactions',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const newReaction = payload.new as Reaction

          // Add random position for floating animation
          const reaction: Reaction = {
            ...newReaction,
            x: Math.random() * 80 + 10, // 10-90% from left
            y: 100, // Start from bottom
            animationId: animationIdCounter.current++
          }

          setFloatingReactions(prev => [...prev, reaction])

          // Remove reaction after animation (5 seconds)
          setTimeout(() => {
            setFloatingReactions(prev =>
              prev.filter(r => r.id !== newReaction.id)
            )
          }, 5000)
        }
      )
      .subscribe()

    reactionsChannelRef.current = channel

    return () => {
      if (reactionsChannelRef.current) {
        supabase.removeChannel(reactionsChannelRef.current)
      }
    }
  }, [gameId])

  // Send reaction
  const sendReaction = async (emoji: string) => {
    try {
      await supabase
        .from('reactions')
        .insert({
          game_id: gameId,
          participant_id: participantId,
          emoji: emoji,
        })

      setShowEmojiPicker(false)
    } catch (error) {
      console.error('Error sending reaction:', error)
    }
  }

  return (
    <>
      {/* Floating Reactions Overlay */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {floatingReactions.map((reaction) => (
          <div
            key={`${reaction.id}-${reaction.animationId}`}
            className="absolute text-4xl sm:text-5xl animate-float-up"
            style={{
              left: `${reaction.x}%`,
              bottom: `${reaction.y}%`,
              animation: 'float-up 5s ease-out forwards',
            }}
          >
            {reaction.emoji}
          </div>
        ))}
      </div>

      {/* Emoji Picker Button & Panel */}
      {showPicker && (
        <div className="fixed bottom-4 right-4 z-50">
          {/* Emoji Panel */}
          {showEmojiPicker && (
            <div className="absolute bottom-16 right-0 bg-white rounded-xl shadow-2xl p-3 border-2 border-purple-400 animate-scale-in">
              <div className="grid grid-cols-4 gap-2">
                {EMOJI_OPTIONS.map((option) => (
                  <button
                    key={option.emoji}
                    onClick={() => sendReaction(option.emoji)}
                    className="text-3xl p-2 hover:bg-gray-100 rounded-lg transition active:scale-90"
                    title={option.label}
                  >
                    {option.emoji}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Click to react!
              </p>
            </div>
          )}

          {/* Toggle Button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition active:scale-90 ${
              showEmojiPicker ? 'ring-4 ring-purple-300' : ''
            }`}
            title="Send Reaction"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(-50px) scale(1);
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-400px) scale(1.5);
            opacity: 0;
          }
        }

        .animate-float-up {
          animation: float-up 5s ease-out forwards;
        }

        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  )
}

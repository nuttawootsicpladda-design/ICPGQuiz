'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/types/types'
import { RealtimeChannel } from '@supabase/supabase-js'

interface WordCloudProps {
  gameId: string
  questionId: string
  isHost?: boolean
  participantId?: string
  onSubmit?: (response: string) => void
}

interface WordResponse {
  id: string
  response: string
  participant_id: string
}

// Generate random color
const getRandomColor = () => {
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Count word frequency
const countWords = (responses: WordResponse[]): Map<string, { count: number; color: string }> => {
  const wordMap = new Map<string, { count: number; color: string }>()

  responses.forEach(r => {
    const word = r.response.trim().toLowerCase()
    if (word) {
      if (wordMap.has(word)) {
        const existing = wordMap.get(word)!
        wordMap.set(word, { count: existing.count + 1, color: existing.color })
      } else {
        wordMap.set(word, { count: 1, color: getRandomColor() })
      }
    }
  })

  return wordMap
}

export default function WordCloud({
  gameId,
  questionId,
  isHost = false,
  participantId,
  onSubmit,
}: WordCloudProps) {
  const [responses, setResponses] = useState<WordResponse[]>([])
  const [inputValue, setInputValue] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate word frequencies
  const wordCounts = useMemo(() => countWords(responses), [responses])

  // Get max count for scaling
  const maxCount = useMemo(() => {
    let max = 1
    wordCounts.forEach(({ count }) => {
      if (count > max) max = count
    })
    return max
  }, [wordCounts])

  // Load existing responses and set up real-time listener
  useEffect(() => {
    const loadResponses = async () => {
      const { data, error } = await (supabase as any)
        .from('word_cloud_responses')
        .select('*')
        .eq('game_id', gameId)
        .eq('question_id', questionId)

      if (!error && data) {
        setResponses(data)

        // Check if current participant has already submitted
        if (participantId) {
          const hasSubmit = data.some((r: WordResponse) => r.participant_id === participantId)
          setHasSubmitted(hasSubmit)
        }
      }
    }

    loadResponses()

    // Real-time subscription
    const channel: RealtimeChannel = supabase
      .channel(`wordcloud-${questionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'word_cloud_responses',
          filter: `question_id=eq.${questionId}`,
        },
        (payload) => {
          setResponses(prev => [...prev, payload.new as WordResponse])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, questionId, participantId])

  // Submit response
  const handleSubmit = async () => {
    if (!inputValue.trim() || !participantId || hasSubmitted) return

    setIsSubmitting(true)

    const { error } = await (supabase as any).from('word_cloud_responses').insert({
      game_id: gameId,
      question_id: questionId,
      participant_id: participantId,
      response: inputValue.trim(),
    })

    if (!error) {
      setHasSubmitted(true)
      setInputValue('')
      onSubmit?.(inputValue.trim())
    }

    setIsSubmitting(false)
  }

  // Calculate font size based on count
  const getFontSize = (count: number) => {
    const minSize = 14
    const maxSize = 64
    const scale = count / maxCount
    return minSize + (maxSize - minSize) * Math.sqrt(scale)
  }

  // Convert map to sorted array
  const sortedWords = useMemo(() => {
    const arr = Array.from(wordCounts.entries()).map(([word, { count, color }]) => ({
      word,
      count,
      color,
      size: getFontSize(count),
    }))
    // Sort by count descending
    arr.sort((a, b) => b.count - a.count)
    return arr
  }, [wordCounts, maxCount])

  return (
    <div className="w-full">
      {/* Word Cloud Display */}
      <div className="bg-white rounded-2xl p-6 min-h-[300px] flex flex-wrap items-center justify-center gap-3 mb-4">
        {sortedWords.length === 0 ? (
          <div className="text-gray-400 text-lg">
            {isHost ? 'รอคำตอบจากผู้เล่น...' : 'ยังไม่มีคำตอบ'}
          </div>
        ) : (
          sortedWords.map(({ word, count, color, size }) => (
            <div
              key={word}
              className="transition-all duration-300 hover:scale-110 cursor-default animate-fade-in"
              style={{
                fontSize: `${size}px`,
                color: color,
                fontWeight: count > 1 ? 'bold' : 'normal',
                opacity: 0.7 + 0.3 * (count / maxCount),
              }}
              title={`${word}: ${count} คน`}
            >
              {word}
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="text-center text-white mb-4">
        <span className="bg-white/20 px-4 py-2 rounded-full">
          📝 {responses.length} คำตอบ • {wordCounts.size} คำไม่ซ้ำ
        </span>
      </div>

      {/* Input (for players only) */}
      {!isHost && participantId && (
        <div className="bg-white rounded-xl p-4">
          {hasSubmitted ? (
            <div className="text-center text-green-600 font-bold py-4">
              ✅ ส่งคำตอบแล้ว! รอดูผลลัพธ์...
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="พิมพ์คำตอบของคุณ..."
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                maxLength={50}
                disabled={isSubmitting}
              />
              <button
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isSubmitting}
                className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '...' : 'ส่ง'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Export a simpler Word Cloud visualization component
export function WordCloudDisplay({ words }: { words: { text: string; count: number }[] }) {
  const maxCount = Math.max(...words.map(w => w.count), 1)

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 p-4">
      {words.map(({ text, count }) => {
        const size = 14 + (64 - 14) * Math.sqrt(count / maxCount)
        return (
          <span
            key={text}
            style={{
              fontSize: `${size}px`,
              color: getRandomColor(),
              fontWeight: count > 1 ? 'bold' : 'normal',
            }}
          >
            {text}
          </span>
        )
      })}
    </div>
  )
}

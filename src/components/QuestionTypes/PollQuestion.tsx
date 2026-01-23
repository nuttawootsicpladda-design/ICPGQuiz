'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/types/types'

interface PollOption {
  id: string
  body: string
}

interface PollQuestionProps {
  gameId: string
  questionId: string
  question: string
  options: PollOption[]
  isHost?: boolean
  participantId?: string
  onVote?: (optionId: string) => void
}

interface PollResult {
  optionId: string
  count: number
}

const COLORS = [
  'from-red-500 to-red-600',
  'from-blue-500 to-blue-600',
  'from-yellow-500 to-yellow-600',
  'from-green-500 to-green-600',
  'from-purple-500 to-purple-600',
  'from-pink-500 to-pink-600',
]

export default function PollQuestion({
  gameId,
  questionId,
  question,
  options,
  isHost = false,
  participantId,
  onVote,
}: PollQuestionProps) {
  const [results, setResults] = useState<PollResult[]>([])
  const [hasVoted, setHasVoted] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const [totalVotes, setTotalVotes] = useState(0)

  // Calculate results
  const pollResults = useMemo(() => {
    const total = results.reduce((sum, r) => sum + r.count, 0)
    setTotalVotes(total)

    return options.map(option => {
      const result = results.find(r => r.optionId === option.id)
      const count = result?.count || 0
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0
      return { ...option, count, percentage }
    })
  }, [results, options])

  // Load existing votes
  useEffect(() => {
    const loadVotes = async () => {
      const { data, error } = await (supabase as any)
        .from('poll_responses')
        .select('choice_id')
        .eq('game_id', gameId)
        .eq('question_id', questionId)

      if (!error && data) {
        // Count votes per option
        const voteCounts: { [key: string]: number } = {}
        data.forEach((vote: any) => {
          voteCounts[vote.choice_id] = (voteCounts[vote.choice_id] || 0) + 1
        })

        setResults(
          Object.entries(voteCounts).map(([optionId, count]) => ({
            optionId,
            count,
          }))
        )

        // Check if current participant has voted
        if (participantId) {
          const hasVoted = data.some((v: any) => v.participant_id === participantId)
          setHasVoted(hasVoted)
        }
      }
    }

    loadVotes()

    // Real-time subscription
    const channel = supabase
      .channel(`poll-${questionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'poll_responses',
          filter: `question_id=eq.${questionId}`,
        },
        (payload: any) => {
          const choiceId = payload.new.choice_id
          setResults(prev => {
            const existing = prev.find(r => r.optionId === choiceId)
            if (existing) {
              return prev.map(r =>
                r.optionId === choiceId ? { ...r, count: r.count + 1 } : r
              )
            }
            return [...prev, { optionId: choiceId, count: 1 }]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, questionId, participantId])

  const handleVote = async (optionId: string) => {
    if (hasVoted || isVoting || !participantId) return

    setIsVoting(true)
    setSelectedOption(optionId)

    const { error } = await (supabase as any).from('poll_responses').insert({
      game_id: gameId,
      question_id: questionId,
      participant_id: participantId,
      choice_id: optionId,
    })

    if (!error) {
      setHasVoted(true)
      onVote?.(optionId)
    }

    setIsVoting(false)
  }

  return (
    <div className="w-full">
      {/* Question */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg text-center">
        <div className="text-3xl mb-2">📊</div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{question}</h2>
        <p className="text-gray-500 mt-2">{totalVotes} โหวต</p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {pollResults.map((option, index) => (
          <div key={option.id} className="relative">
            <button
              onClick={() => handleVote(option.id)}
              disabled={hasVoted || isVoting || isHost}
              className={`w-full p-4 rounded-xl text-left transition-all ${
                hasVoted || isHost
                  ? 'cursor-default'
                  : 'hover:scale-[1.02] cursor-pointer'
              } ${
                selectedOption === option.id
                  ? 'ring-4 ring-white/50'
                  : ''
              }`}
            >
              {/* Background progress bar */}
              <div
                className={`absolute inset-0 rounded-xl bg-gradient-to-r ${COLORS[index % COLORS.length]} transition-all duration-500`}
                style={{
                  width: hasVoted || isHost ? `${option.percentage}%` : '100%',
                  opacity: hasVoted || isHost ? 1 : 0.8,
                }}
              />

              {/* Content */}
              <div className="relative z-10 flex justify-between items-center text-white">
                <span className="font-bold text-lg">{option.body}</span>
                {(hasVoted || isHost) && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{option.percentage}%</span>
                    <span className="text-sm opacity-80">({option.count})</span>
                  </div>
                )}
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Status */}
      {!isHost && (
        <div className="mt-6 text-center">
          {hasVoted ? (
            <div className="bg-green-100 text-green-800 py-3 px-6 rounded-xl inline-block">
              ✅ คุณได้โหวตแล้ว
            </div>
          ) : (
            <div className="bg-white/20 text-white py-3 px-6 rounded-xl inline-block">
              เลือกตัวเลือกที่คุณต้องการ
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/types/types'

interface BrainstormQuestionProps {
  gameId: string
  questionId: string
  question: string
  isHost?: boolean
  participantId?: string
  allowMultiple?: boolean
  maxIdeas?: number
}

interface Idea {
  id: string
  text: string
  participant_id: string
  nickname?: string
  votes: number
  hasVoted?: boolean
}

const CARD_COLORS = [
  'bg-yellow-200',
  'bg-pink-200',
  'bg-blue-200',
  'bg-green-200',
  'bg-purple-200',
  'bg-orange-200',
]

export default function BrainstormQuestion({
  gameId,
  questionId,
  question,
  isHost = false,
  participantId,
  allowMultiple = true,
  maxIdeas = 3,
}: BrainstormQuestionProps) {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [myIdeasCount, setMyIdeasCount] = useState(0)

  // Sort ideas by votes
  const sortedIdeas = useMemo(() => {
    return [...ideas].sort((a, b) => b.votes - a.votes)
  }, [ideas])

  // Load ideas
  useEffect(() => {
    const loadIdeas = async () => {
      // Using word_cloud_responses table for brainstorm as well
      const { data, error } = await (supabase as any)
        .from('word_cloud_responses')
        .select(`
          id,
          response,
          participant_id,
          participant:participants(nickname)
        `)
        .eq('game_id', gameId)
        .eq('question_id', questionId)

      if (!error && data) {
        const ideasWithVotes = await Promise.all(
          data.map(async (item: any) => {
            // Get vote count (you could create a separate votes table)
            return {
              id: item.id,
              text: item.response,
              participant_id: item.participant_id,
              nickname: item.participant?.nickname,
              votes: 0, // Would need a separate votes table for real voting
              hasVoted: false,
            }
          })
        )

        setIdeas(ideasWithVotes)

        if (participantId) {
          const count = data.filter((i: any) => i.participant_id === participantId).length
          setMyIdeasCount(count)
        }
      }
    }

    loadIdeas()

    // Real-time subscription
    const channel = supabase
      .channel(`brainstorm-${questionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'word_cloud_responses',
          filter: `question_id=eq.${questionId}`,
        },
        (payload: any) => {
          setIdeas(prev => [
            ...prev,
            {
              id: payload.new.id,
              text: payload.new.response,
              participant_id: payload.new.participant_id,
              votes: 0,
              hasVoted: false,
            },
          ])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, questionId, participantId])

  const handleSubmit = async () => {
    if (!inputValue.trim() || !participantId) return
    if (!allowMultiple && myIdeasCount >= 1) return
    if (myIdeasCount >= maxIdeas) return

    setIsSubmitting(true)

    const { error } = await (supabase as any).from('word_cloud_responses').insert({
      game_id: gameId,
      question_id: questionId,
      participant_id: participantId,
      response: inputValue.trim(),
    })

    if (!error) {
      setInputValue('')
      setMyIdeasCount(prev => prev + 1)
    }

    setIsSubmitting(false)
  }

  const handleVote = async (ideaId: string) => {
    // Toggle vote (simplified - would need a proper votes table)
    setIdeas(prev =>
      prev.map(idea =>
        idea.id === ideaId
          ? {
              ...idea,
              votes: idea.hasVoted ? idea.votes - 1 : idea.votes + 1,
              hasVoted: !idea.hasVoted,
            }
          : idea
      )
    )
  }

  const canSubmitMore = allowMultiple ? myIdeasCount < maxIdeas : myIdeasCount < 1

  return (
    <div className="w-full">
      {/* Question */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg text-center">
        <div className="text-3xl mb-2">💡</div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{question}</h2>
        <p className="text-gray-500 mt-2">{ideas.length} ไอเดีย</p>
      </div>

      {/* Ideas Board - Sticky Note Style */}
      <div className="bg-gray-100 rounded-2xl p-4 mb-4 min-h-[300px]">
        {ideas.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-gray-400">
            รอไอเดียจากผู้เล่น...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sortedIdeas.map((idea, index) => (
              <div
                key={idea.id}
                className={`${CARD_COLORS[index % CARD_COLORS.length]} p-4 rounded-lg shadow-md transform hover:scale-105 transition cursor-pointer`}
                style={{
                  transform: `rotate(${Math.random() * 6 - 3}deg)`,
                }}
                onClick={() => !isHost && handleVote(idea.id)}
              >
                <p className="text-gray-800 font-medium text-sm sm:text-base mb-2 line-clamp-3">
                  {idea.text}
                </p>
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>{idea.nickname || 'ไม่ระบุ'}</span>
                  <span className={`flex items-center gap-1 ${idea.hasVoted ? 'text-red-500' : ''}`}>
                    ❤️ {idea.votes}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input - Players only */}
      {!isHost && participantId && (
        <div className="bg-white rounded-xl p-4">
          {canSubmitMore ? (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="แชร์ไอเดียของคุณ..."
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                  maxLength={100}
                  disabled={isSubmitting}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!inputValue.trim() || isSubmitting}
                  className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? '...' : '💡'}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2 text-center">
                คุณส่งได้อีก {maxIdeas - myIdeasCount} ไอเดีย
              </p>
            </>
          ) : (
            <div className="text-center py-4 text-green-600">
              ✅ คุณส่งไอเดียครบแล้ว! กดที่ไอเดียเพื่อโหวต
            </div>
          )}
        </div>
      )}

      {/* Host controls */}
      {isHost && (
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-gray-600">
            กดที่ไอเดียเพื่อดูรายละเอียด หรือจัดกลุ่มไอเดีย
          </p>
        </div>
      )}
    </div>
  )
}

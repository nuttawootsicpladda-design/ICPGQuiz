'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/types/types'

interface OpenEndedQuestionProps {
  gameId: string
  questionId: string
  question: string
  isHost?: boolean
  participantId?: string
  onSubmit?: (response: string) => void
}

interface Response {
  id: string
  participant_id: string
  response_text: string
  nickname?: string
  score?: number
  feedback?: string
}

export default function OpenEndedQuestion({
  gameId,
  questionId,
  question,
  isHost = false,
  participantId,
  onSubmit,
}: OpenEndedQuestionProps) {
  const [responses, setResponses] = useState<Response[]>([])
  const [inputValue, setInputValue] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null)
  const [scoreInput, setScoreInput] = useState(0)
  const [feedbackInput, setFeedbackInput] = useState('')

  // Load existing responses
  useEffect(() => {
    const loadResponses = async () => {
      const { data, error } = await (supabase as any)
        .from('open_ended_responses')
        .select(`
          *,
          participant:participants(nickname)
        `)
        .eq('game_id', gameId)
        .eq('question_id', questionId)

      if (!error && data) {
        setResponses(
          data.map((r: any) => ({
            ...r,
            nickname: r.participant?.nickname,
          }))
        )

        if (participantId) {
          const hasSubmit = data.some((r: any) => r.participant_id === participantId)
          setHasSubmitted(hasSubmit)
        }
      }
    }

    loadResponses()

    // Real-time subscription
    const channel = supabase
      .channel(`open-ended-${questionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'open_ended_responses',
          filter: `question_id=eq.${questionId}`,
        },
        () => {
          loadResponses()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, questionId, participantId])

  const handleSubmit = async () => {
    if (!inputValue.trim() || !participantId || hasSubmitted) return

    setIsSubmitting(true)

    const { error } = await (supabase as any).from('open_ended_responses').insert({
      game_id: gameId,
      question_id: questionId,
      participant_id: participantId,
      response_text: inputValue.trim(),
    })

    if (!error) {
      setHasSubmitted(true)
      setInputValue('')
      onSubmit?.(inputValue.trim())
    }

    setIsSubmitting(false)
  }

  const handleScore = async (responseId: string) => {
    const { error } = await (supabase as any)
      .from('open_ended_responses')
      .update({
        score: scoreInput,
        feedback: feedbackInput,
      })
      .eq('id', responseId)

    if (!error) {
      setSelectedResponse(null)
      setScoreInput(0)
      setFeedbackInput('')
    }
  }

  // Host view - show all responses
  if (isHost) {
    return (
      <div className="w-full">
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg text-center">
          <div className="text-3xl mb-2">✍️</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{question}</h2>
          <p className="text-gray-500 mt-2">{responses.length} คำตอบ</p>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {responses.length === 0 ? (
            <div className="bg-white/80 rounded-xl p-8 text-center text-gray-500">
              รอคำตอบจากผู้เล่น...
            </div>
          ) : (
            responses.map((response) => (
              <div
                key={response.id}
                className="bg-white rounded-xl p-4 shadow-md"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-purple-600">
                    {response.nickname || 'ไม่ระบุชื่อ'}
                  </span>
                  {response.score !== undefined && response.score !== null && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      {response.score} คะแนน
                    </span>
                  )}
                </div>
                <p className="text-gray-800 mb-3">{response.response_text}</p>

                {selectedResponse === response.id ? (
                  <div className="border-t pt-3 mt-3">
                    <div className="flex gap-2 mb-2">
                      <input
                        type="number"
                        value={scoreInput}
                        onChange={(e) => setScoreInput(parseInt(e.target.value) || 0)}
                        min="0"
                        max="1000"
                        className="w-24 px-3 py-2 border rounded-lg"
                        placeholder="คะแนน"
                      />
                      <input
                        type="text"
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg"
                        placeholder="Feedback (ถ้ามี)"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleScore(response.id)}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        บันทึก
                      </button>
                      <button
                        onClick={() => setSelectedResponse(null)}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedResponse(response.id)
                      setScoreInput(response.score || 0)
                      setFeedbackInput(response.feedback || '')
                    }}
                    className="text-sm text-purple-600 hover:underline"
                  >
                    ให้คะแนน
                  </button>
                )}

                {response.feedback && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                    <strong>Feedback:</strong> {response.feedback}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // Player view
  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg text-center">
        <div className="text-3xl mb-2">✍️</div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{question}</h2>
      </div>

      {hasSubmitted ? (
        <div className="bg-white rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-green-600 font-bold text-lg">ส่งคำตอบแล้ว!</p>
          <p className="text-gray-500 mt-2">รอผลจาก Host</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-4">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="พิมพ์คำตอบของคุณที่นี่..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
            rows={4}
            maxLength={500}
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-sm text-gray-500">
              {inputValue.length}/500 ตัวอักษร
            </span>
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim() || isSubmitting}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50"
            >
              {isSubmitting ? '...' : 'ส่งคำตอบ'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

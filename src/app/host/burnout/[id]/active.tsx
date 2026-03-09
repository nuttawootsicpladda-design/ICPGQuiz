'use client'

import { Participant, supabase } from '@/types/types'
import { useEffect, useState } from 'react'
import BurnoutChart from '@/components/BurnoutChart'

const EMOJI_LEVELS = [
  { emoji: '😄', label: 'ดีมาก', value: '5', color: 'bg-green-500' },
  { emoji: '🙂', label: 'ดี', value: '4', color: 'bg-lime-500' },
  { emoji: '😐', label: 'ปานกลาง', value: '3', color: 'bg-yellow-500' },
  { emoji: '😟', label: 'น่าเป็นห่วง', value: '2', color: 'bg-orange-500' },
  { emoji: '😫', label: 'เหนื่อยมาก', value: '1', color: 'bg-red-500' },
]

interface SurveyQuestion {
  id: string
  question_text: string
  order_index: number
}

interface SurveyResponse {
  id: string
  question_id: string
  participant_id: string
  response_value: string
}

export default function BurnoutActive({
  gameId,
  surveyId,
  questions,
  currentQuestionIndex,
  participants,
  identityMode,
}: {
  gameId: string
  surveyId: string
  questions: SurveyQuestion[]
  currentQuestionIndex: number
  participants: Participant[]
  identityMode: 'anonymous' | 'revealed'
}) {
  const currentQuestion = questions[currentQuestionIndex]
  const [responses, setResponses] = useState<SurveyResponse[]>([])

  useEffect(() => {
    if (!currentQuestion) return

    // Reset and load responses for current question
    const loadResponses = async () => {
      const { data } = await (supabase as any)
        .from('survey_responses')
        .select('*')
        .eq('question_id', currentQuestion.id)

      if (data) {
        setResponses(data)
      } else {
        setResponses([])
      }
    }
    loadResponses()

    // Subscribe to new responses in realtime
    const channel = supabase
      .channel(`burnout_responses_${currentQuestion.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'survey_responses',
          filter: `question_id=eq.${currentQuestion.id}`,
        },
        (payload) => {
          setResponses((prev) => [...prev, payload.new as SurveyResponse])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentQuestion?.id])

  if (!currentQuestion) return null

  // Filter out host from participant count
  const participantCount = participants.length

  // Aggregate responses for chart
  const aggregated = EMOJI_LEVELS.map((level) => ({
    ...level,
    count: responses.filter((r) => r.response_value === level.value).length,
  }))
  const maxCount = Math.max(...aggregated.map((a) => a.count), 1)

  const goToNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      await supabase
        .from('games')
        .update({ current_question_sequence: currentQuestionIndex + 1 } as any)
        .eq('id', gameId)
    } else {
      // Last question - go to results
      await supabase
        .from('games')
        .update({ phase: 'result' } as any)
        .eq('id', gameId)
    }
  }

  // Revealed mode: show who answered what
  const getRespondentName = (participantId: string) => {
    const p = participants.find((p) => p.id === participantId)
    return p?.nickname || 'ไม่ทราบ'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ci-700 via-ci-500 to-ci-400 p-4 sm:p-8">
      {/* Question header */}
      <div className="text-center mb-8">
        <div className="text-white/70 text-sm mb-2">
          คำถาม {currentQuestionIndex + 1} / {questions.length}
        </div>
        <h2 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold bg-white/10 backdrop-blur rounded-2xl p-6 max-w-3xl mx-auto">
          {currentQuestion.question_text}
        </h2>
      </div>

      {/* Response counter */}
      <div className="text-center mb-6">
        <span className="bg-white/20 text-white px-6 py-2 rounded-full text-lg font-bold">
          📊 {responses.length} / {participantCount} ตอบแล้ว
        </span>
      </div>

      {/* Live Chart */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 shadow-2xl mb-6">
        <BurnoutChart aggregated={aggregated} maxCount={maxCount} />
      </div>

      {/* Revealed mode: show individual responses */}
      {identityMode === 'revealed' && responses.length > 0 && (
        <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur rounded-2xl p-4 mb-6">
          <h3 className="text-white font-bold mb-3 text-sm">ผู้ตอบล่าสุด:</h3>
          <div className="flex flex-wrap gap-2">
            {responses.slice(-10).map((r) => {
              const level = EMOJI_LEVELS.find((l) => l.value === r.response_value)
              return (
                <div
                  key={r.id}
                  className="bg-white/20 rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm text-white"
                >
                  <span>{level?.emoji}</span>
                  <span>{getRespondentName(r.participant_id)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Next button */}
      <div className="text-center mt-8">
        <button
          onClick={goToNextQuestion}
          className="bg-white text-ci font-bold px-8 py-3 rounded-xl text-lg hover:bg-gray-100 transition shadow-lg active:scale-95"
        >
          {currentQuestionIndex < questions.length - 1
            ? 'คำถามถัดไป ➡️'
            : 'ดูผลรวม 📊'}
        </button>
      </div>
    </div>
  )
}

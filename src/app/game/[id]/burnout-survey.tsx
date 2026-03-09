'use client'

import { supabase } from '@/types/types'
import { useEffect, useState } from 'react'

const EMOJI_LEVELS = [
  { emoji: '😫', label: 'เหนื่อยมาก', value: '1', color: 'bg-red-500', hoverColor: 'hover:bg-red-50', borderColor: 'border-red-500' },
  { emoji: '😟', label: 'น่าเป็นห่วง', value: '2', color: 'bg-orange-500', hoverColor: 'hover:bg-orange-50', borderColor: 'border-orange-500' },
  { emoji: '😐', label: 'ปานกลาง', value: '3', color: 'bg-yellow-500', hoverColor: 'hover:bg-yellow-50', borderColor: 'border-yellow-500' },
  { emoji: '🙂', label: 'ดี', value: '4', color: 'bg-lime-500', hoverColor: 'hover:bg-lime-50', borderColor: 'border-lime-500' },
  { emoji: '😄', label: 'ดีมาก', value: '5', color: 'bg-green-500', hoverColor: 'hover:bg-green-50', borderColor: 'border-green-500' },
]

interface SurveyQuestion {
  id: string
  question_text: string
  order_index: number
}

export default function BurnoutSurvey({
  gameId,
  participantId,
}: {
  gameId: string
  participantId: string
}) {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [surveyId, setSurveyId] = useState<string>('')

  useEffect(() => {
    const loadSurvey = async () => {
      // Get survey for this game
      const { data: survey } = await (supabase as any)
        .from('surveys')
        .select('id, survey_questions(*)')
        .eq('game_id', gameId)
        .eq('survey_type', 'burnout')
        .single()

      if (survey) {
        setSurveyId(survey.id)
        const sorted = [...survey.survey_questions].sort(
          (a: SurveyQuestion, b: SurveyQuestion) => a.order_index - b.order_index
        )
        setQuestions(sorted)
      }

      // Check if already answered (localStorage persistence)
      const answeredKey = `burnout_answered_${gameId}`
      if (localStorage.getItem(answeredKey)) {
        setIsComplete(true)
      }
    }
    loadSurvey()
  }, [gameId])

  const selectAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const submitCurrentAndNext = async () => {
    if (!questions[currentIndex]) return
    const q = questions[currentIndex]
    const value = answers[q.id]
    if (!value) return

    setIsSubmitting(true)

    // Insert response
    await (supabase as any).from('survey_responses').insert({
      survey_id: surveyId,
      question_id: q.id,
      participant_id: participantId,
      response_value: value,
    })

    setIsSubmitting(false)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // All done
      localStorage.setItem(`burnout_answered_${gameId}`, 'true')
      setIsComplete(true)
    }
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md w-full">
          <div className="text-5xl mb-4">🙏</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ขอบคุณครับ/ค่ะ!</h2>
          <p className="text-gray-600 mb-4">คำตอบของคุณถูกบันทึกเรียบร้อยแล้ว</p>
          <p className="text-gray-500 text-sm">
            องค์กรให้ความสำคัญกับสุขภาพจิตของคุณ ❤️
          </p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">กำลังโหลดแบบประเมิน...</div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const selectedValue = answers[currentQuestion.id]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl w-full max-w-lg">
        {/* Progress */}
        <div className="flex gap-1 mb-6">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all ${
                i < currentIndex
                  ? 'bg-green-500'
                  : i === currentIndex
                  ? 'bg-orange-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Question */}
        <div className="mb-8">
          <span className="text-sm text-gray-500 mb-2 block">
            คำถาม {currentIndex + 1} / {questions.length}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            {currentQuestion.question_text}
          </h2>
        </div>

        {/* Emoji Buttons */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-8">
          {EMOJI_LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => selectAnswer(currentQuestion.id, level.value)}
              className={`flex flex-col items-center p-3 sm:p-4 rounded-xl transition-all border-2 ${
                selectedValue === level.value
                  ? `${level.color} text-white border-transparent scale-110 shadow-lg`
                  : `bg-white border-gray-200 ${level.hoverColor}`
              }`}
            >
              <span className="text-3xl sm:text-4xl">{level.emoji}</span>
            </button>
          ))}
        </div>

        {/* Submit / Next Button */}
        <button
          onClick={submitCurrentAndNext}
          disabled={!selectedValue || isSubmitting}
          className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg rounded-xl hover:from-orange-600 hover:to-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95"
        >
          {isSubmitting
            ? 'กำลังส่ง...'
            : currentIndex < questions.length - 1
            ? 'ถัดไป ➡️'
            : 'ส่งคำตอบ ✅'}
        </button>
      </div>
    </div>
  )
}

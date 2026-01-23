'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/types/types'

interface NPSSurveyProps {
  surveyId?: string
  gameId?: string
  participantId?: string
  quizName?: string
  onComplete?: () => void
  showResults?: boolean
}

interface NPSScore {
  promoters: number
  passives: number
  detractors: number
  total: number
  score: number
}

export default function NPSSurvey({
  surveyId,
  gameId,
  participantId,
  quizName,
  onComplete,
  showResults = false,
}: NPSSurveyProps) {
  const [selectedScore, setSelectedScore] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [npsResults, setNpsResults] = useState<NPSScore | null>(null)

  // Load NPS results for host view
  useEffect(() => {
    if (showResults && surveyId) {
      loadResults()
    }
  }, [showResults, surveyId])

  const loadResults = async () => {
    if (!surveyId) return

    const { data, error } = await (supabase as any)
      .from('survey_responses')
      .select('response_value')
      .eq('survey_id', surveyId)

    if (!error && data) {
      const scores = data.map((r: any) => parseInt(r.response_value))
      const promoters = scores.filter((s: number) => s >= 9).length
      const passives = scores.filter((s: number) => s >= 7 && s <= 8).length
      const detractors = scores.filter((s: number) => s <= 6).length
      const total = scores.length

      const npsScore = total > 0
        ? Math.round(((promoters / total) - (detractors / total)) * 100)
        : 0

      setNpsResults({
        promoters,
        passives,
        detractors,
        total,
        score: npsScore,
      })
    }
  }

  const handleSubmit = async () => {
    if (selectedScore === null) return

    setIsSubmitting(true)

    // Create survey if not exists
    let currentSurveyId = surveyId
    if (!currentSurveyId) {
      const { data: newSurvey, error: surveyError } = await (supabase as any)
        .from('surveys')
        .insert({
          title: `NPS Survey - ${quizName || 'Quiz'}`,
          survey_type: 'nps',
          game_id: gameId,
        })
        .select()
        .single()

      if (surveyError || !newSurvey) {
        setIsSubmitting(false)
        return
      }

      currentSurveyId = newSurvey.id

      // Create NPS question
      const { data: question, error: qError } = await (supabase as any)
        .from('survey_questions')
        .insert({
          survey_id: currentSurveyId,
          question_text: 'คุณจะแนะนำ Quiz นี้ให้เพื่อนหรือเพื่อนร่วมงานมากแค่ไหน?',
          question_type: 'nps',
        })
        .select()
        .single()

      if (qError || !question) {
        setIsSubmitting(false)
        return
      }

      // Save response
      await (supabase as any).from('survey_responses').insert({
        survey_id: currentSurveyId,
        question_id: question.id,
        participant_id: participantId,
        response_value: selectedScore.toString(),
      })
    } else {
      // Get existing question
      const { data: questions } = await (supabase as any)
        .from('survey_questions')
        .select('id')
        .eq('survey_id', currentSurveyId)
        .eq('question_type', 'nps')
        .single()

      if (questions) {
        await (supabase as any).from('survey_responses').insert({
          survey_id: currentSurveyId,
          question_id: questions.id,
          participant_id: participantId,
          response_value: selectedScore.toString(),
        })
      }
    }

    // Save feedback if provided
    if (feedback.trim()) {
      // Could save to a separate feedback table
    }

    setIsSubmitting(false)
    setIsSubmitted(true)
    onComplete?.()
  }

  // Results view for host
  if (showResults && npsResults) {
    const scoreColor = npsResults.score >= 50 ? 'text-green-600' :
                       npsResults.score >= 0 ? 'text-yellow-600' : 'text-red-600'

    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-6 text-center">📊 ผล NPS Survey</h2>

        {/* NPS Score */}
        <div className="text-center mb-8">
          <div className={`text-6xl font-bold ${scoreColor}`}>
            {npsResults.score}
          </div>
          <div className="text-gray-500 mt-2">NPS Score</div>
          <div className="text-sm text-gray-400">({npsResults.total} responses)</div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{npsResults.promoters}</div>
            <div className="text-sm text-green-800">Promoters</div>
            <div className="text-xs text-green-600">(9-10)</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{npsResults.passives}</div>
            <div className="text-sm text-yellow-800">Passives</div>
            <div className="text-xs text-yellow-600">(7-8)</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{npsResults.detractors}</div>
            <div className="text-sm text-red-800">Detractors</div>
            <div className="text-xs text-red-600">(0-6)</div>
          </div>
        </div>

        {/* Progress bars */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-gray-600">Promoters</span>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${npsResults.total > 0 ? (npsResults.promoters / npsResults.total) * 100 : 0}%` }}
              />
            </div>
            <span className="w-12 text-sm text-gray-600 text-right">
              {npsResults.total > 0 ? Math.round((npsResults.promoters / npsResults.total) * 100) : 0}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-gray-600">Passives</span>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 transition-all"
                style={{ width: `${npsResults.total > 0 ? (npsResults.passives / npsResults.total) * 100 : 0}%` }}
              />
            </div>
            <span className="w-12 text-sm text-gray-600 text-right">
              {npsResults.total > 0 ? Math.round((npsResults.passives / npsResults.total) * 100) : 0}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-gray-600">Detractors</span>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all"
                style={{ width: `${npsResults.total > 0 ? (npsResults.detractors / npsResults.total) * 100 : 0}%` }}
              />
            </div>
            <span className="w-12 text-sm text-gray-600 text-right">
              {npsResults.total > 0 ? Math.round((npsResults.detractors / npsResults.total) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Thank you screen
  if (isSubmitted) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
        <div className="text-5xl mb-4">🙏</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">ขอบคุณสำหรับความคิดเห็น!</h2>
        <p className="text-gray-600">ข้อมูลของคุณจะช่วยให้เราปรับปรุงต่อไป</p>
      </div>
    )
  }

  // NPS Survey form
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-xl font-bold mb-2 text-center">ช่วยให้คะแนนหน่อย! 📝</h2>
      <p className="text-gray-600 text-center mb-6">
        คุณจะแนะนำ {quizName || 'Quiz นี้'} ให้เพื่อนหรือเพื่อนร่วมงานมากแค่ไหน?
      </p>

      {/* Score buttons */}
      <div className="flex justify-center gap-1 sm:gap-2 mb-4">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
          <button
            key={score}
            onClick={() => setSelectedScore(score)}
            className={`w-8 h-10 sm:w-10 sm:h-12 rounded-lg font-bold text-sm sm:text-base transition-all ${
              selectedScore === score
                ? score <= 6
                  ? 'bg-red-500 text-white scale-110'
                  : score <= 8
                  ? 'bg-yellow-500 text-white scale-110'
                  : 'bg-green-500 text-white scale-110'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {score}
          </button>
        ))}
      </div>

      {/* Labels */}
      <div className="flex justify-between text-sm text-gray-500 mb-6 px-2">
        <span>ไม่แนะนำเลย</span>
        <span>แนะนำอย่างแน่นอน</span>
      </div>

      {/* Feedback */}
      {selectedScore !== null && (
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            {selectedScore <= 6 ? 'อะไรที่เราควรปรับปรุง?' :
             selectedScore <= 8 ? 'มีอะไรที่จะทำให้ดีขึ้นไหม?' :
             'อะไรที่คุณชอบมากที่สุด?'}
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            rows={3}
            placeholder="ความคิดเห็นของคุณ (ไม่บังคับ)..."
          />
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={selectedScore === null || isSubmitting}
        className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition disabled:opacity-50"
      >
        {isSubmitting ? 'กำลังส่ง...' : 'ส่งความคิดเห็น'}
      </button>
    </div>
  )
}

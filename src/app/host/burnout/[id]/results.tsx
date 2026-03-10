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

export default function BurnoutResults({
  gameId,
  surveyId,
  questions,
  participants,
  identityMode,
}: {
  gameId: string
  surveyId: string
  questions: SurveyQuestion[]
  participants: Participant[]
  identityMode: 'anonymous' | 'revealed'
}) {
  const [allResponses, setAllResponses] = useState<SurveyResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showBreakdown, setShowBreakdown] = useState(false)

  useEffect(() => {
    const loadAllResponses = async () => {
      const { data } = await (supabase as any)
        .from('survey_responses')
        .select('*')
        .eq('survey_id', surveyId)

      if (data) {
        setAllResponses(data)
      }
      setIsLoading(false)
    }
    loadAllResponses()

    // Realtime subscription for new responses
    const channel = supabase
      .channel(`burnout_results_${surveyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'survey_responses',
          filter: `survey_id=eq.${surveyId}`,
        },
        (payload) => {
          setAllResponses((prev) => [...prev, payload.new as SurveyResponse])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [surveyId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ci flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">กำลังโหลดผลลัพธ์...</div>
      </div>
    )
  }

  // Calculate overall burnout score
  const allValues = allResponses.map((r) => parseInt(r.response_value)).filter((v) => !isNaN(v))
  const overallScore = allValues.length > 0
    ? allValues.reduce((sum, v) => sum + v, 0) / allValues.length
    : 0

  const getScoreColor = (score: number) => {
    if (score >= 4) return { text: 'text-green-600', bg: 'bg-green-50', label: 'สุขภาพดี', emoji: '😄' }
    if (score >= 3) return { text: 'text-yellow-600', bg: 'bg-yellow-50', label: 'ปานกลาง', emoji: '😐' }
    if (score >= 2) return { text: 'text-orange-600', bg: 'bg-orange-50', label: 'น่าเป็นห่วง', emoji: '😟' }
    return { text: 'text-red-600', bg: 'bg-red-50', label: 'ต้องดูแลเร่งด่วน', emoji: '😫' }
  }

  const scoreInfo = getScoreColor(overallScore)

  // Get unique respondent count
  const uniqueRespondents = new Set(allResponses.map((r) => r.participant_id)).size

  // Get per-question aggregation
  const getQuestionAggregation = (questionId: string) => {
    const questionResponses = allResponses.filter((r) => r.question_id === questionId)
    const aggregated = EMOJI_LEVELS.map((level) => ({
      ...level,
      count: questionResponses.filter((r) => r.response_value === level.value).length,
    }))
    const maxCount = Math.max(...aggregated.map((a) => a.count), 1)
    return { aggregated, maxCount }
  }

  // Revealed mode: get per-participant breakdown
  const getParticipantBreakdown = () => {
    const breakdown: Array<{
      nickname: string
      participantId: string
      answers: Array<{ questionIndex: number; value: string; emoji: string }>
    }> = []

    const respondentIds = Array.from(new Set(allResponses.map((r) => r.participant_id)))

    for (const pId of respondentIds) {
      const participant = participants.find((p) => p.id === pId)
      const pResponses = allResponses.filter((r) => r.participant_id === pId)
      const answers = questions.map((q, i) => {
        const response = pResponses.find((r) => r.question_id === q.id)
        const level = EMOJI_LEVELS.find((l) => l.value === response?.response_value)
        return {
          questionIndex: i,
          value: response?.response_value || '-',
          emoji: level?.emoji || '❓',
        }
      })

      breakdown.push({
        nickname: participant?.nickname || 'ไม่ทราบ',
        participantId: pId,
        answers,
      })
    }

    return breakdown
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ci-700 via-ci-500 to-ci-400 p-3 sm:p-6">
      {/* Header + Overall Score - inline */}
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 mb-5">
        <div className="text-center sm:text-left">
          <h1 className="text-white text-2xl sm:text-3xl font-bold">
            📊 ผลการประเมิน R U OK ?
          </h1>
          <p className="text-white/70 text-sm">
            ผู้ตอบแบบประเมิน {uniqueRespondents} คน
          </p>
        </div>

        {/* Overall Score - compact */}
        <div className={`${scoreInfo.bg} rounded-xl px-6 py-3 shadow-xl flex items-center gap-4`}>
          <div className="text-center">
            <div className="text-xs text-gray-500">คะแนนรวม</div>
            <div className={`text-4xl font-bold ${scoreInfo.text}`}>
              {overallScore.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">จาก 5.0</div>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="text-3xl">{scoreInfo.emoji}</div>
            <div className={`px-3 py-0.5 rounded-full text-xs font-bold ${scoreInfo.text} ${scoreInfo.bg} border`}>
              {scoreInfo.label}
            </div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((v) => (
                <div
                  key={v}
                  className={`w-6 h-1.5 rounded-full ${
                    v <= Math.round(overallScore)
                      ? v >= 4 ? 'bg-green-500' : v >= 3 ? 'bg-yellow-500' : v >= 2 ? 'bg-orange-500' : 'bg-red-500'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Per-question Charts */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {questions.map((question, i) => {
          const { aggregated, maxCount } = getQuestionAggregation(question.id)
          return (
            <div key={question.id} className="bg-white rounded-xl p-4 shadow-xl">
              <div className="text-xs text-gray-400 mb-0.5">คำถามที่ {i + 1}</div>
              <h3 className="text-xs font-bold text-gray-800 mb-3 min-h-[2.5rem] leading-relaxed">
                {question.question_text}
              </h3>
              <BurnoutChart aggregated={aggregated} maxCount={maxCount} compact />
            </div>
          )
        })}
      </div>

      {/* Revealed Mode: Individual Breakdown */}
      {identityMode === 'revealed' && (
        <div className="max-w-5xl mx-auto mb-6">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full bg-white/10 backdrop-blur text-white font-bold py-2.5 px-6 rounded-xl hover:bg-white/20 transition mb-3 text-sm"
          >
            {showBreakdown ? 'ซ่อนรายละเอียดรายบุคคล ▲' : 'แสดงรายละเอียดรายบุคคล ▼'}
          </button>

          {showBreakdown && (
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-2 px-3 text-xs font-bold text-gray-700">
                      ชื่อ
                    </th>
                    {questions.map((_, i) => (
                      <th
                        key={i}
                        className="text-center py-2 px-3 text-xs font-bold text-gray-700"
                      >
                        Q{i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getParticipantBreakdown().map((row) => (
                    <tr key={row.participantId} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium text-gray-800 text-xs">
                        {row.nickname}
                      </td>
                      {row.answers.map((answer, i) => (
                        <td key={i} className="text-center py-2 px-3 text-xl">
                          {answer.emoji}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Back button */}
      <div className="text-center pb-4">
        <button
          onClick={() => window.close()}
          className="bg-white/20 text-white font-bold px-6 py-2 rounded-xl hover:bg-white/30 transition text-sm"
        >
          ปิดหน้านี้
        </button>
      </div>
    </div>
  )
}

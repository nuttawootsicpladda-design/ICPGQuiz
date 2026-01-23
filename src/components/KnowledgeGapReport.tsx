'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/types/types'

interface QuestionAnalysis {
  id: string
  body: string
  order: number
  totalAnswers: number
  correctAnswers: number
  incorrectAnswers: number
  accuracy: number
  avgTimeMs: number
  difficulty: 'easy' | 'medium' | 'hard'
}

interface ParticipantAnalysis {
  id: string
  nickname: string
  avatar_id: string
  totalScore: number
  correctAnswers: number
  totalAnswers: number
  accuracy: number
  avgTimeMs: number
  weakTopics: string[]
  strengths: string[]
}

interface KnowledgeGapReportProps {
  gameId: string
  quizSetId: string
  onClose?: () => void
}

export default function KnowledgeGapReport({
  gameId,
  quizSetId,
  onClose,
}: KnowledgeGapReportProps) {
  const [loading, setLoading] = useState(true)
  const [questionAnalysis, setQuestionAnalysis] = useState<QuestionAnalysis[]>([])
  const [participantAnalysis, setParticipantAnalysis] = useState<ParticipantAnalysis[]>([])
  const [overallStats, setOverallStats] = useState({
    totalParticipants: 0,
    avgScore: 0,
    avgAccuracy: 0,
    hardestQuestion: '',
    easiestQuestion: '',
  })
  const [activeTab, setActiveTab] = useState<'questions' | 'participants'>('questions')

  useEffect(() => {
    loadAnalysis()
  }, [gameId, quizSetId])

  const loadAnalysis = async () => {
    setLoading(true)

    try {
      // Load questions
      const { data: questions } = await supabase
        .from('questions')
        .select('id, body, order')
        .eq('quiz_set_id', quizSetId)
        .order('order')

      // Load participants
      const { data: participants } = await supabase
        .from('participants')
        .select('id, nickname, avatar_id')
        .eq('game_id', gameId)

      // Load answers with choice info
      const { data: answers } = await supabase
        .from('answers')
        .select(`
          id,
          participant_id,
          question_id,
          choice_id,
          score,
          created_at,
          choices!answers_choice_id_fkey(is_correct)
        `)
        .in('participant_id', participants?.map(p => p.id) || [])

      if (!questions || !participants || !answers) {
        setLoading(false)
        return
      }

      // Analyze questions
      const qAnalysis: QuestionAnalysis[] = questions.map(q => {
        const qAnswers = answers.filter(a => a.question_id === q.id)
        const correct = qAnswers.filter(a => (a as any).choices?.is_correct).length
        const total = qAnswers.length
        const accuracy = total > 0 ? (correct / total) * 100 : 0

        let difficulty: 'easy' | 'medium' | 'hard' = 'medium'
        if (accuracy >= 70) difficulty = 'easy'
        else if (accuracy < 40) difficulty = 'hard'

        return {
          id: q.id,
          body: q.body,
          order: q.order,
          totalAnswers: total,
          correctAnswers: correct,
          incorrectAnswers: total - correct,
          accuracy: Math.round(accuracy),
          avgTimeMs: 0, // Would need time_taken field
          difficulty,
        }
      })

      // Analyze participants
      const pAnalysis: ParticipantAnalysis[] = participants.map(p => {
        const pAnswers = answers.filter(a => a.participant_id === p.id)
        const correct = pAnswers.filter(a => (a as any).choices?.is_correct).length
        const total = pAnswers.length
        const accuracy = total > 0 ? (correct / total) * 100 : 0
        const totalScore = pAnswers.reduce((sum, a) => sum + (a.score || 0), 0)

        // Find weak topics (questions answered incorrectly)
        const wrongAnswers = pAnswers.filter(a => !(a as any).choices?.is_correct)
        const weakTopics = wrongAnswers
          .map(a => questions.find(q => q.id === a.question_id)?.body || '')
          .filter(Boolean)
          .slice(0, 3)

        // Find strengths (questions answered correctly)
        const rightAnswers = pAnswers.filter(a => (a as any).choices?.is_correct)
        const strengths = rightAnswers
          .map(a => questions.find(q => q.id === a.question_id)?.body || '')
          .filter(Boolean)
          .slice(0, 3)

        return {
          id: p.id,
          nickname: p.nickname,
          avatar_id: (p as any).avatar_id || 'cat',
          totalScore,
          correctAnswers: correct,
          totalAnswers: total,
          accuracy: Math.round(accuracy),
          avgTimeMs: 0,
          weakTopics,
          strengths,
        }
      })

      // Sort by accuracy (worst first for gap analysis)
      pAnalysis.sort((a, b) => a.accuracy - b.accuracy)

      // Calculate overall stats
      const avgAccuracy = pAnalysis.length > 0
        ? Math.round(pAnalysis.reduce((sum, p) => sum + p.accuracy, 0) / pAnalysis.length)
        : 0
      const avgScore = pAnalysis.length > 0
        ? Math.round(pAnalysis.reduce((sum, p) => sum + p.totalScore, 0) / pAnalysis.length)
        : 0

      const hardest = [...qAnalysis].sort((a, b) => a.accuracy - b.accuracy)[0]
      const easiest = [...qAnalysis].sort((a, b) => b.accuracy - a.accuracy)[0]

      setQuestionAnalysis(qAnalysis)
      setParticipantAnalysis(pAnalysis)
      setOverallStats({
        totalParticipants: participants.length,
        avgScore,
        avgAccuracy,
        hardestQuestion: hardest?.body || '',
        easiestQuestion: easiest?.body || '',
      })
    } catch (error) {
      console.error('Error loading analysis:', error)
    }

    setLoading(false)
  }

  const exportToCSV = () => {
    let csv = 'ชื่อ,คะแนน,ตอบถูก,ความแม่นยำ,จุดอ่อน\n'

    participantAnalysis.forEach(p => {
      csv += `${p.nickname},${p.totalScore},${p.correctAnswers}/${p.totalAnswers},${p.accuracy}%,"${p.weakTopics.join('; ')}"\n`
    })

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `knowledge-gap-report-${gameId}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <div className="text-gray-600">กำลังวิเคราะห์ข้อมูล...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">📊 รายงานวิเคราะห์ผู้เล่น</h2>
              <p className="opacity-90">Knowledge Gap Report</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{overallStats.totalParticipants}</div>
              <div className="text-sm opacity-90">ผู้เล่น</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{overallStats.avgScore}</div>
              <div className="text-sm opacity-90">คะแนนเฉลี่ย</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{overallStats.avgAccuracy}%</div>
              <div className="text-sm opacity-90">ความแม่นยำ</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{questionAnalysis.length}</div>
              <div className="text-sm opacity-90">คำถาม</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex-1 py-3 font-medium transition ${
              activeTab === 'questions'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📝 วิเคราะห์คำถาม
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`flex-1 py-3 font-medium transition ${
              activeTab === 'participants'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            👥 วิเคราะห์ผู้เล่น
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'questions' ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-500 mb-4">
                คำถามที่ยากที่สุด: <span className="font-medium text-red-600">{overallStats.hardestQuestion.slice(0, 50)}...</span>
              </div>

              {questionAnalysis.map((q, index) => (
                <div
                  key={q.id}
                  className={`border rounded-lg p-4 ${
                    q.difficulty === 'hard'
                      ? 'border-red-300 bg-red-50'
                      : q.difficulty === 'easy'
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium">
                      คำถาม {q.order + 1}: {q.body.slice(0, 80)}...
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        q.difficulty === 'hard'
                          ? 'bg-red-500 text-white'
                          : q.difficulty === 'easy'
                            ? 'bg-green-500 text-white'
                            : 'bg-yellow-500 text-white'
                      }`}
                    >
                      {q.difficulty === 'hard' ? 'ยาก' : q.difficulty === 'easy' ? 'ง่าย' : 'ปานกลาง'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span>ความแม่นยำ</span>
                        <span className="font-bold">{q.accuracy}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            q.accuracy >= 70 ? 'bg-green-500' : q.accuracy >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${q.accuracy}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-600 font-bold">{q.correctAnswers}</div>
                      <div className="text-xs text-gray-500">ถูก</div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-600 font-bold">{q.incorrectAnswers}</div>
                      <div className="text-xs text-gray-500">ผิด</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {participantAnalysis.map((p, index) => (
                <div
                  key={p.id}
                  className={`border rounded-lg p-4 ${
                    p.accuracy < 50 ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{index + 1}.</div>
                      <div>
                        <div className="font-bold">{p.nickname}</div>
                        <div className="text-sm text-gray-500">
                          คะแนน: {p.totalScore} | ถูก: {p.correctAnswers}/{p.totalAnswers}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        p.accuracy >= 70 ? 'text-green-600' : p.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}
                    >
                      {p.accuracy}%
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full ${
                        p.accuracy >= 70 ? 'bg-green-500' : p.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${p.accuracy}%` }}
                    />
                  </div>

                  {/* Weak Topics */}
                  {p.weakTopics.length > 0 && (
                    <div className="mb-2">
                      <div className="text-sm font-medium text-red-600 mb-1">⚠️ จุดที่ควรปรับปรุง:</div>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {p.weakTopics.map((topic, i) => (
                          <li key={i} className="truncate">{topic.slice(0, 60)}...</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Strengths */}
                  {p.strengths.length > 0 && p.accuracy >= 50 && (
                    <div>
                      <div className="text-sm font-medium text-green-600 mb-1">✅ จุดแข็ง:</div>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {p.strengths.slice(0, 2).map((topic, i) => (
                          <li key={i} className="truncate">{topic.slice(0, 60)}...</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-3">
          <button
            onClick={exportToCSV}
            className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition"
          >
            📥 Export CSV
          </button>
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  )
}

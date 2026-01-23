'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/types/types'

interface ModeratedQAProps {
  gameId: string
  isHost?: boolean
  participantId?: string
  participantName?: string
}

interface Question {
  id: string
  question_text: string
  is_anonymous: boolean
  status: 'pending' | 'approved' | 'answered' | 'rejected'
  upvotes: number
  created_at: string
  answer_text?: string
  participant_name?: string
  hasUpvoted?: boolean
}

export default function ModeratedQA({
  gameId,
  isHost = false,
  participantId,
  participantName,
}: ModeratedQAProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [newQuestion, setNewQuestion] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'answered'>('all')
  const [answerText, setAnswerText] = useState('')
  const [answeringId, setAnsweringId] = useState<string | null>(null)

  // Load questions
  useEffect(() => {
    loadQuestions()

    // Real-time subscription
    const channel = supabase
      .channel(`qa-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qa_questions',
        },
        () => {
          loadQuestions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId])

  const loadQuestions = async () => {
    // First check if qa_session exists
    let { data: session } = await (supabase as any)
      .from('qa_sessions')
      .select('id')
      .eq('game_id', gameId)
      .single()

    if (!session) {
      // Create session if not exists
      const { data: newSession } = await (supabase as any)
        .from('qa_sessions')
        .insert({
          game_id: gameId,
          is_active: true,
        })
        .select()
        .single()
      session = newSession
    }

    if (!session) return

    const { data, error } = await (supabase as any)
      .from('qa_questions')
      .select(`
        *,
        participant:participants(nickname)
      `)
      .eq('session_id', session.id)
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: true })

    if (!error && data) {
      setQuestions(
        data.map((q: any) => ({
          ...q,
          participant_name: q.participant?.nickname,
        }))
      )
    }
  }

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim() || !participantId) return

    setIsSubmitting(true)

    // Get session
    const { data: session } = await (supabase as any)
      .from('qa_sessions')
      .select('id, require_moderation')
      .eq('game_id', gameId)
      .single()

    if (!session) {
      setIsSubmitting(false)
      return
    }

    const { error } = await (supabase as any).from('qa_questions').insert({
      session_id: session.id,
      participant_id: participantId,
      question_text: newQuestion.trim(),
      is_anonymous: isAnonymous,
      status: session.require_moderation ? 'pending' : 'approved',
    })

    if (!error) {
      setNewQuestion('')
    }

    setIsSubmitting(false)
  }

  const handleUpvote = async (questionId: string) => {
    if (!participantId) return

    const question = questions.find(q => q.id === questionId)
    if (!question) return

    if (question.hasUpvoted) {
      // Remove upvote
      await (supabase as any)
        .from('qa_upvotes')
        .delete()
        .eq('question_id', questionId)
        .eq('participant_id', participantId)

      await (supabase as any)
        .from('qa_questions')
        .update({ upvotes: Math.max(0, question.upvotes - 1) })
        .eq('id', questionId)
    } else {
      // Add upvote
      await (supabase as any).from('qa_upvotes').insert({
        question_id: questionId,
        participant_id: participantId,
      })

      await (supabase as any)
        .from('qa_questions')
        .update({ upvotes: question.upvotes + 1 })
        .eq('id', questionId)
    }

    loadQuestions()
  }

  const handleModerate = async (questionId: string, status: 'approved' | 'rejected') => {
    await (supabase as any)
      .from('qa_questions')
      .update({ status })
      .eq('id', questionId)

    loadQuestions()
  }

  const handleAnswer = async (questionId: string) => {
    if (!answerText.trim()) return

    await (supabase as any)
      .from('qa_questions')
      .update({
        status: 'answered',
        answer_text: answerText.trim(),
        answered_at: new Date().toISOString(),
      })
      .eq('id', questionId)

    setAnsweringId(null)
    setAnswerText('')
    loadQuestions()
  }

  const filteredQuestions = questions.filter(q => {
    if (filter === 'all') return isHost || q.status !== 'pending'
    return q.status === filter
  })

  const pendingCount = questions.filter(q => q.status === 'pending').length

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          ❓ ถาม-ตอบ
        </h2>
        {isHost && pendingCount > 0 && (
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
            {pendingCount} รอตรวจสอบ
          </span>
        )}
      </div>

      {/* Filter tabs (Host only) */}
      {isHost && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {(['all', 'pending', 'approved', 'answered'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                filter === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'ทั้งหมด' :
               f === 'pending' ? `รอตรวจ (${pendingCount})` :
               f === 'approved' ? 'อนุมัติแล้ว' : 'ตอบแล้ว'}
            </button>
          ))}
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {filter === 'pending' ? 'ไม่มีคำถามที่รอตรวจสอบ' : 'ยังไม่มีคำถาม'}
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div
              key={q.id}
              className={`p-4 rounded-xl border-2 ${
                q.status === 'answered' ? 'border-green-200 bg-green-50' :
                q.status === 'pending' ? 'border-yellow-200 bg-yellow-50' :
                q.status === 'rejected' ? 'border-red-200 bg-red-50 opacity-50' :
                'border-gray-200'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {q.is_anonymous ? '🥷 ไม่ระบุตัวตน' : `👤 ${q.participant_name || 'ผู้เข้าร่วม'}`}
                  </span>
                  {q.status === 'pending' && (
                    <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-0.5 rounded">
                      รอตรวจสอบ
                    </span>
                  )}
                </div>
                {!isHost && q.status === 'approved' && (
                  <button
                    onClick={() => handleUpvote(q.id)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      q.hasUpvoted
                        ? 'bg-pink-100 text-pink-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    ❤️ {q.upvotes}
                  </button>
                )}
              </div>

              {/* Question Text */}
              <p className="text-gray-800 font-medium mb-2">{q.question_text}</p>

              {/* Answer (if answered) */}
              {q.status === 'answered' && q.answer_text && (
                <div className="bg-white rounded-lg p-3 mt-2">
                  <p className="text-sm text-gray-500 mb-1">💬 คำตอบ:</p>
                  <p className="text-gray-800">{q.answer_text}</p>
                </div>
              )}

              {/* Host Actions */}
              {isHost && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {q.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleModerate(q.id, 'approved')}
                        className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm hover:bg-green-600"
                      >
                        ✓ อนุมัติ
                      </button>
                      <button
                        onClick={() => handleModerate(q.id, 'rejected')}
                        className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600"
                      >
                        ✕ ปฏิเสธ
                      </button>
                    </div>
                  )}

                  {q.status === 'approved' && (
                    answeringId === q.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="พิมพ์คำตอบ..."
                          className="w-full px-3 py-2 border rounded-lg resize-none"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAnswer(q.id)}
                            className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm"
                          >
                            ส่งคำตอบ
                          </button>
                          <button
                            onClick={() => setAnsweringId(null)}
                            className="px-4 py-2 bg-gray-200 rounded-lg text-sm"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAnsweringId(q.id)}
                        className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm hover:bg-purple-700"
                      >
                        💬 ตอบคำถามนี้
                      </button>
                    )
                  )}

                  {q.status === 'answered' && (
                    <div className="text-center text-green-600 text-sm">
                      ✓ ตอบแล้ว
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Submit Question (Players only) */}
      {!isHost && participantId && (
        <div className="border-t pt-4">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="พิมพ์คำถามของคุณ..."
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              maxLength={200}
              disabled={isSubmitting}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitQuestion()}
            />
            <button
              onClick={handleSubmitQuestion}
              disabled={!newQuestion.trim() || isSubmitting}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50"
            >
              {isSubmitting ? '...' : 'ส่ง'}
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded"
            />
            ส่งแบบไม่ระบุตัวตน
          </label>
        </div>
      )}
    </div>
  )
}

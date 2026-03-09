'use client'

import { supabase } from '@/types/types'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

const BURNOUT_QUESTIONS = [
  {
    text: 'ในช่วง 2 สัปดาห์ที่ผ่านมา คุณรู้สึกหมดแรงหรือเหนื่อยล้าจากการทำงานมากแค่ไหน?',
    type: 'emoji_scale',
    order_index: 0,
  },
  {
    text: 'คุณรู้สึกมีแรงจูงใจและกระตือรือร้นในการทำงานในระดับไหน?',
    type: 'emoji_scale',
    order_index: 1,
  },
  {
    text: 'คุณรู้สึกว่าตัวเองทำงานได้อย่างมีประสิทธิภาพและมีคุณค่ามากแค่ไหน?',
    type: 'emoji_scale',
    order_index: 2,
  },
]

const EMOJI_OPTIONS = {
  emojis: ['😄', '🙂', '😐', '😟', '😫'],
  labels: ['ดีมาก', 'ดี', 'ปานกลาง', 'น่าเป็นห่วง', 'เหนื่อยมาก'],
  values: ['5', '4', '3', '2', '1'],
}

interface PastSurvey {
  id: string
  title: string
  created_at: string
  game_id: string
  description: string
  response_count?: number
}

export default function BurnoutDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [identityMode, setIdentityMode] = useState<'anonymous' | 'revealed'>('anonymous')
  const [pastSurveys, setPastSurveys] = useState<PastSurvey[]>([])
  const [creating, setCreating] = useState(false)
  const [loadingSurveys, setLoadingSurveys] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }
    if (user) {
      loadPastSurveys()
    }
  }, [user, loading, router])

  const loadPastSurveys = async () => {
    setLoadingSurveys(true)
    const { data, error } = await (supabase as any)
      .from('surveys')
      .select('id, title, created_at, game_id, description')
      .eq('user_id', user?.id)
      .eq('survey_type', 'burnout')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setPastSurveys(data)
    }
    setLoadingSurveys(false)
  }

  const createBurnoutSession = async () => {
    if (!user?.id) return
    setCreating(true)

    try {
      // 1. Ensure a burnout placeholder quiz_set exists for this user
      let quizSetId: string
      const { data: existing } = await supabase
        .from('quiz_sets')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', '__burnout_placeholder__')
        .maybeSingle()

      if (existing) {
        quizSetId = existing.id
      } else {
        const { data: newQS, error } = await supabase
          .from('quiz_sets')
          .insert({ name: '__burnout_placeholder__', user_id: user.id } as any)
          .select()
          .single()
        if (error || !newQS) {
          alert('สร้าง session ไม่สำเร็จ')
          setCreating(false)
          return
        }
        quizSetId = newQS.id
      }

      // 2. Create a game record with standard 'lobby' phase
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          quiz_set_id: quizSetId,
        } as any)
        .select()
        .single()

      if (gameError || !game) {
        alert('สร้างเกม session ไม่สำเร็จ')
        setCreating(false)
        return
      }

      // 3. Create survey record linked to game
      const { data: survey, error: surveyError } = await (supabase as any)
        .from('surveys')
        .insert({
          user_id: user.id,
          title: `R U O K - ${new Date().toLocaleDateString('th-TH')}`,
          description: JSON.stringify({ identity_mode: identityMode }),
          survey_type: 'burnout',
          game_id: game.id,
          is_active: true,
        })
        .select()
        .single()

      if (surveyError || !survey) {
        alert('สร้าง survey ไม่สำเร็จ')
        setCreating(false)
        return
      }

      // 4. Create the 3 survey questions
      for (const q of BURNOUT_QUESTIONS) {
        await (supabase as any).from('survey_questions').insert({
          survey_id: survey.id,
          question_text: q.text,
          question_type: q.type,
          options: EMOJI_OPTIONS,
          order_index: q.order_index,
          is_required: true,
        })
      }

      // 5. Open host view in new tab
      setCreating(false)
      window.open(`/host/burnout/${game.id}`, '_blank', 'noopener,noreferrer')
      loadPastSurveys()
    } catch (err) {
      console.error(err)
      alert('เกิดข้อผิดพลาด')
      setCreating(false)
    }
  }

  const getIdentityModeLabel = (description: string) => {
    try {
      const parsed = JSON.parse(description)
      return parsed.identity_mode === 'revealed' ? 'เปิดเผยตัวตน' : 'ปกปิดตัวตน'
    } catch {
      return 'ปกปิดตัวตน'
    }
  }

  if (loading || loadingSurveys) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <div className="px-2 sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">แบบประเมิน R U O K</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          ประเมินสุขภาพจิตของทีมด้วย 3 คำถาม พร้อมผลลัพธ์แบบ Realtime
        </p>
      </div>

      {/* Create New Survey Card */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-2 border-orange-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          🔥 สร้างแบบประเมินใหม่
        </h2>

        {/* Identity Mode Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            โหมดการตอบ
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setIdentityMode('anonymous')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                identityMode === 'anonymous'
                  ? 'border-orange-500 bg-orange-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">🎭</div>
              <div className="font-bold text-gray-800">ปกปิดตัวตน</div>
              <div className="text-xs text-gray-500 mt-1">ไม่แสดงชื่อผู้ตอบในผลลัพธ์</div>
            </button>
            <button
              onClick={() => setIdentityMode('revealed')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                identityMode === 'revealed'
                  ? 'border-orange-500 bg-orange-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">👤</div>
              <div className="font-bold text-gray-800">เปิดเผยตัวตน</div>
              <div className="text-xs text-gray-500 mt-1">แสดงชื่อผู้ตอบในผลลัพธ์</div>
            </button>
          </div>
        </div>

        {/* Preview Questions */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-3">คำถามในแบบประเมิน (3 ข้อ)</h3>
          <div className="space-y-2">
            {BURNOUT_QUESTIONS.map((q, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="bg-orange-100 text-orange-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                  {i + 1}
                </span>
                <span className="text-gray-700">{q.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <span>ตัวเลือก:</span>
            {EMOJI_OPTIONS.emojis.map((emoji, i) => (
              <span key={i} title={EMOJI_OPTIONS.labels[i]} className="text-xl cursor-default">
                {emoji}
              </span>
            ))}
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={createBurnoutSession}
          disabled={creating}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95"
        >
          {creating ? 'กำลังสร้าง...' : 'เริ่มแบบประเมิน R U O K 🚀'}
        </button>
      </div>

      {/* Past Surveys */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">ประวัติแบบประเมิน</h2>
        {pastSurveys.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500">ยังไม่มีประวัติแบบประเมิน</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pastSurveys.map((survey) => (
              <div
                key={survey.id}
                className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between hover:shadow-lg transition"
              >
                <div>
                  <h3 className="font-bold text-gray-800">{survey.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span>{new Date(survey.created_at).toLocaleDateString('th-TH', {
                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                      {getIdentityModeLabel(survey.description)}
                    </span>
                  </div>
                </div>
                {survey.game_id && (
                  <button
                    onClick={() => window.open(`/host/burnout/${survey.game_id}`, '_blank')}
                    className="px-4 py-2 bg-ci text-white rounded-lg hover:bg-ci-700 transition text-sm font-medium"
                  >
                    ดูผล
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

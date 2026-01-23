'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/types/types'

interface TrainingModule {
  id: string
  title: string
  description?: string
  type: 'slide' | 'quiz' | 'video' | 'discussion' | 'live_session'
  content_id?: string
  order_index: number
  duration_minutes: number
  is_required: boolean
  passing_score?: number
}

interface TrainingProgress {
  module_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  score?: number
  completed_at?: string
  time_spent_minutes: number
}

interface HybridTrainingProps {
  trainingId: string
  userId: string
  isHost?: boolean
}

interface LiveSession {
  id: string
  title: string
  scheduled_at: string
  duration_minutes: number
  meeting_url?: string
  status: 'scheduled' | 'live' | 'ended'
}

export default function HybridTraining({
  trainingId,
  userId,
  isHost = false,
}: HybridTrainingProps) {
  const [modules, setModules] = useState<TrainingModule[]>([])
  const [progress, setProgress] = useState<Map<string, TrainingProgress>>(new Map())
  const [currentModule, setCurrentModule] = useState<TrainingModule | null>(null)
  const [loading, setLoading] = useState(true)
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([])
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'live'>('overview')

  useEffect(() => {
    loadTrainingData()
  }, [trainingId, userId])

  const loadTrainingData = async () => {
    setLoading(true)

    // Load training modules
    const { data: modulesData } = await (supabase as any)
      .from('training_module_items')
      .select('*')
      .eq('training_module_id', trainingId)
      .order('order_index')

    if (modulesData) {
      setModules(modulesData)
    }

    // Load user progress
    const { data: progressData } = await (supabase as any)
      .from('training_progress')
      .select('*')
      .eq('training_module_id', trainingId)
      .eq('user_id', userId)

    if (progressData) {
      const progressMap = new Map<string, TrainingProgress>()
      progressData.forEach((p: any) => {
        progressMap.set(p.module_item_id, p)
      })
      setProgress(progressMap)
    }

    // Load live sessions
    const { data: sessionsData } = await (supabase as any)
      .from('live_training_sessions')
      .select('*')
      .eq('training_id', trainingId)
      .order('scheduled_at')

    if (sessionsData) {
      setLiveSessions(sessionsData)
    }

    setLoading(false)
  }

  const updateProgress = async (moduleId: string, status: TrainingProgress['status'], score?: number) => {
    const currentProgress = progress.get(moduleId)

    const dbData = {
      training_module_id: trainingId,
      module_item_id: moduleId,
      user_id: userId,
      status,
      score: score ?? currentProgress?.score,
      time_spent_minutes: (currentProgress?.time_spent_minutes || 0) + 1,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    }

    if (currentProgress) {
      await (supabase as any)
        .from('training_progress')
        .update(dbData)
        .eq('training_module_id', trainingId)
        .eq('module_item_id', moduleId)
        .eq('user_id', userId)
    } else {
      await (supabase as any)
        .from('training_progress')
        .insert(dbData)
    }

    // Update local state with TrainingProgress format
    const progressData: TrainingProgress = {
      module_id: moduleId,
      status,
      score: score ?? currentProgress?.score,
      time_spent_minutes: (currentProgress?.time_spent_minutes || 0) + 1,
      completed_at: status === 'completed' ? new Date().toISOString() : undefined,
    }

    setProgress(new Map(progress.set(moduleId, progressData)))
  }

  const getModuleIcon = (type: TrainingModule['type']) => {
    switch (type) {
      case 'slide':
        return '📑'
      case 'quiz':
        return '❓'
      case 'video':
        return '🎬'
      case 'discussion':
        return '💬'
      case 'live_session':
        return '🔴'
      default:
        return '📄'
    }
  }

  const getModuleTypeLabel = (type: TrainingModule['type']) => {
    switch (type) {
      case 'slide':
        return 'สไลด์'
      case 'quiz':
        return 'แบบทดสอบ'
      case 'video':
        return 'วิดีโอ'
      case 'discussion':
        return 'อภิปราย'
      case 'live_session':
        return 'สดออนไลน์'
      default:
        return type
    }
  }

  const getProgressColor = (status: TrainingProgress['status'] | undefined) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'in_progress':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-300'
    }
  }

  const calculateOverallProgress = () => {
    if (modules.length === 0) return 0
    const completed = modules.filter(m => progress.get(m.id)?.status === 'completed').length
    return Math.round((completed / modules.length) * 100)
  }

  const getTotalDuration = () => {
    return modules.reduce((sum, m) => sum + m.duration_minutes, 0)
  }

  const getTimeSpent = () => {
    let total = 0
    progress.forEach((p) => {
      total += p.time_spent_minutes
    })
    return total
  }

  const handleScheduleLiveSession = async (session: Partial<LiveSession>) => {
    await (supabase as any).from('live_training_sessions').insert({
      training_id: trainingId,
      ...session,
      status: 'scheduled',
    })
    setShowScheduleModal(false)
    loadTrainingData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">🎓 Hybrid Training</h2>
            <p className="text-white/80">รวม Live + Self-paced Learning</p>
          </div>
          {isHost && (
            <button
              onClick={() => setShowScheduleModal(true)}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
            >
              + จัด Live Session
            </button>
          )}
        </div>

        {/* Progress Overview */}
        <div className="mt-6 bg-white/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span>ความคืบหน้า</span>
            <span className="font-bold">{calculateOverallProgress()}%</span>
          </div>
          <div className="bg-white/30 rounded-full h-3">
            <div
              className="bg-white rounded-full h-3 transition-all"
              style={{ width: `${calculateOverallProgress()}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-3 text-sm text-white/80">
            <span>⏱️ {getTimeSpent()} / {getTotalDuration()} นาที</span>
            <span>📖 {modules.filter(m => progress.get(m.id)?.status === 'completed').length} / {modules.length} บท</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex">
          {(['overview', 'modules', 'live'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 font-medium transition ${
                activeTab === tab
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'overview' && '📊 ภาพรวม'}
              {tab === 'modules' && '📚 บทเรียน'}
              {tab === 'live' && `🔴 Live (${liveSessions.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">{modules.length}</div>
                <div className="text-sm text-purple-600">บทเรียน</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {modules.filter(m => progress.get(m.id)?.status === 'completed').length}
                </div>
                <div className="text-sm text-green-600">เสร็จแล้ว</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{liveSessions.length}</div>
                <div className="text-sm text-blue-600">Live Sessions</div>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-yellow-600">{getTotalDuration()}</div>
                <div className="text-sm text-yellow-600">นาที</div>
              </div>
            </div>

            {/* Next Up */}
            <div>
              <h3 className="font-bold mb-3">⏭️ ถัดไป</h3>
              {(() => {
                const nextModule = modules.find(m =>
                  !progress.get(m.id) || progress.get(m.id)?.status !== 'completed'
                )
                if (nextModule) {
                  return (
                    <button
                      onClick={() => {
                        setCurrentModule(nextModule)
                        updateProgress(nextModule.id, 'in_progress')
                        setActiveTab('modules')
                      }}
                      className="w-full flex items-center gap-4 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition text-left"
                    >
                      <div className="text-3xl">{getModuleIcon(nextModule.type)}</div>
                      <div className="flex-1">
                        <div className="font-medium">{nextModule.title}</div>
                        <div className="text-sm text-gray-500">
                          {getModuleTypeLabel(nextModule.type)} • {nextModule.duration_minutes} นาที
                        </div>
                      </div>
                      <div className="text-purple-600 font-medium">เริ่มเรียน →</div>
                    </button>
                  )
                }
                return (
                  <div className="text-center py-4 text-green-600 font-medium">
                    ✅ เรียนครบทุกบทแล้ว!
                  </div>
                )
              })()}
            </div>

            {/* Upcoming Live */}
            {liveSessions.filter(s => s.status === 'scheduled').length > 0 && (
              <div>
                <h3 className="font-bold mb-3">🔴 Live Sessions ที่กำลังจะมาถึง</h3>
                <div className="space-y-2">
                  {liveSessions
                    .filter(s => s.status === 'scheduled')
                    .slice(0, 2)
                    .map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center gap-4 p-4 bg-red-50 rounded-xl"
                      >
                        <div className="text-2xl">📅</div>
                        <div className="flex-1">
                          <div className="font-medium">{session.title}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(session.scheduled_at).toLocaleString('th-TH')}
                          </div>
                        </div>
                        <div className="text-sm text-red-600 font-medium">
                          {session.duration_minutes} นาที
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modules Tab */}
        {activeTab === 'modules' && (
          <div className="space-y-3">
            {modules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                ยังไม่มีบทเรียน
              </div>
            ) : (
              modules.map((module, index) => {
                const moduleProgress = progress.get(module.id)
                const isCompleted = moduleProgress?.status === 'completed'
                const isInProgress = moduleProgress?.status === 'in_progress'
                const isLocked = index > 0 &&
                  modules[index - 1] &&
                  modules[index - 1].is_required &&
                  progress.get(modules[index - 1].id)?.status !== 'completed'

                return (
                  <div
                    key={module.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition ${
                      isCompleted
                        ? 'border-green-200 bg-green-50'
                        : isInProgress
                        ? 'border-purple-200 bg-purple-50'
                        : isLocked
                        ? 'border-gray-200 bg-gray-50 opacity-60'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {/* Status Indicator */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isInProgress
                          ? 'bg-purple-500 text-white'
                          : isLocked
                          ? 'bg-gray-300 text-gray-500'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {isCompleted ? '✓' : isLocked ? '🔒' : index + 1}
                    </div>

                    {/* Module Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getModuleIcon(module.type)}</span>
                        <span className="font-medium">{module.title}</span>
                        {module.is_required && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                            บังคับ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span>{getModuleTypeLabel(module.type)}</span>
                        <span>⏱️ {module.duration_minutes} นาที</span>
                        {moduleProgress?.score !== undefined && (
                          <span className="text-purple-600 font-medium">
                            คะแนน: {moduleProgress.score}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    {!isLocked && (
                      <button
                        onClick={() => {
                          if (!isCompleted) {
                            updateProgress(module.id, isInProgress ? 'completed' : 'in_progress', isInProgress ? 100 : undefined)
                          }
                        }}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          isCompleted
                            ? 'bg-green-100 text-green-600'
                            : isInProgress
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {isCompleted ? '✓ เสร็จแล้ว' : isInProgress ? 'เสร็จสิ้น' : 'เริ่มเรียน'}
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Live Sessions Tab */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            {liveSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                ยังไม่มี Live Session
                {isHost && (
                  <div className="mt-4">
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                    >
                      + จัด Live Session
                    </button>
                  </div>
                )}
              </div>
            ) : (
              liveSessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-xl border-2 ${
                    session.status === 'live'
                      ? 'border-red-400 bg-red-50'
                      : session.status === 'ended'
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-purple-200 bg-purple-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {session.status === 'live' && (
                          <span className="flex items-center gap-1 text-red-600 font-bold animate-pulse">
                            🔴 LIVE
                          </span>
                        )}
                        <span className="font-bold">{session.title}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        📅 {new Date(session.scheduled_at).toLocaleString('th-TH')}
                        <span className="ml-4">⏱️ {session.duration_minutes} นาที</span>
                      </div>
                    </div>

                    {session.status === 'live' && session.meeting_url && (
                      <a
                        href={session.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700"
                      >
                        🎥 เข้าร่วม
                      </a>
                    )}

                    {session.status === 'scheduled' && (
                      <span className="bg-purple-100 text-purple-600 px-4 py-2 rounded-lg text-sm font-medium">
                        กำลังจะมาถึง
                      </span>
                    )}

                    {session.status === 'ended' && (
                      <span className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-sm">
                        จบแล้ว
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleLiveModal
          onSchedule={handleScheduleLiveSession}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  )
}

// Schedule Live Session Modal
function ScheduleLiveModal({
  onSchedule,
  onClose,
}: {
  onSchedule: (session: Partial<LiveSession>) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [duration, setDuration] = useState(60)
  const [meetingUrl, setMeetingUrl] = useState('')

  const handleSubmit = () => {
    if (!title.trim() || !scheduledAt) return
    onSchedule({
      title: title.trim(),
      scheduled_at: new Date(scheduledAt).toISOString(),
      duration_minutes: duration,
      meeting_url: meetingUrl || undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">🔴 จัด Live Session</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              หัวข้อ *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              placeholder="เช่น Q&A Session"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันเวลา *
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ระยะเวลา (นาที)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              min={15}
              max={180}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ลิงก์ห้องประชุม (Zoom, Meet, etc.)
            </label>
            <input
              type="url"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              placeholder="https://zoom.us/j/..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !scheduledAt}
            className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50"
          >
            จัด Session
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  )
}

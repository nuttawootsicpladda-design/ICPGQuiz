'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/types/types'
import ComplianceTraining from '@/components/ComplianceTraining'
import AICourseCreator from '@/components/AICourseCreator'
import PlayerTracking from '@/components/PlayerTracking'
type TabType = 'overview' | 'compliance' | 'ai-creator' | 'players'

interface Stats {
  totalCourses: number
  totalParticipants: number
  completionRate: number
  pendingAssignments: number
}

export default function EnterpriseDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [stats, setStats] = useState<Stats>({
    totalCourses: 0,
    totalParticipants: 0,
    completionRate: 0,
    pendingAssignments: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      loadStats()
    }
  }, [user, authLoading, router])

  const loadStats = async () => {
    if (!user?.id) return
    setLoading(true)

    try {
      // Get total quiz sets (courses)
      const { count: coursesCount } = await supabase
        .from('quiz_sets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Get total unique participants from games
      const { data: gamesData } = await supabase
        .from('games')
        .select('id, quiz_set_id')
        .in('quiz_set_id', (await supabase.from('quiz_sets').select('id').eq('user_id', user.id)).data?.map(q => q.id) || [])

      let totalParticipants = 0
      let totalCompleted = 0
      let totalAssignments = 0

      if (gamesData && gamesData.length > 0) {
        const gameIds = gamesData.map(g => g.id)

        // Get participants count
        const { count: participantsCount } = await supabase
          .from('participants')
          .select('*', { count: 'exact', head: true })
          .in('game_id', gameIds)

        totalParticipants = participantsCount || 0

        // Get completed count (participants with score > 0)
        const { count: completedCount } = await supabase
          .from('participants')
          .select('*', { count: 'exact', head: true })
          .in('game_id', gameIds)
          .gt('score', 0)

        totalCompleted = completedCount || 0
      }

      // Get compliance assignments stats
      const { data: complianceCourses } = await (supabase as any)
        .from('compliance_courses')
        .select('id')
        .eq('user_id', user.id)

      if (complianceCourses && complianceCourses.length > 0) {
        const courseIds = complianceCourses.map((c: any) => c.id)

        const { count: pendingCount } = await (supabase as any)
          .from('compliance_assignments')
          .select('*', { count: 'exact', head: true })
          .in('compliance_course_id', courseIds)
          .eq('status', 'pending')

        totalAssignments = pendingCount || 0
      }

      setStats({
        totalCourses: coursesCount || 0,
        totalParticipants,
        completionRate: totalParticipants > 0 ? Math.round((totalCompleted / totalParticipants) * 100) : 0,
        pendingAssignments: totalAssignments,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }

    setLoading(false)
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: 'ภาพรวม', icon: '📊' },
    { id: 'compliance', label: 'Compliance', icon: '📋' },
    { id: 'ai-creator', label: 'AI Creator', icon: '🤖' },
    { id: 'players', label: 'ติดตามผู้เล่น', icon: '👥' },
  ]

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">กำลังโหลด...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/host/dashboard" className="text-white/80 hover:text-white text-sm mb-2 inline-block">
                ← กลับไป Dashboard
              </Link>
              <h1 className="text-3xl font-bold">🏢 Enterprise Training</h1>
              <p className="text-white/80 mt-1">จัดการการฝึกอบรมองค์กรแบบครบวงจร</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium whitespace-nowrap rounded-t-lg transition ${
                  activeTab === tab.id
                    ? 'bg-gray-50 text-purple-600'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="text-4xl mb-2">📚</div>
                <div className="text-3xl font-bold text-gray-800">
                  {loading ? '...' : stats.totalCourses}
                </div>
                <div className="text-gray-500">หลักสูตรทั้งหมด</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="text-4xl mb-2">👥</div>
                <div className="text-3xl font-bold text-gray-800">
                  {loading ? '...' : stats.totalParticipants}
                </div>
                <div className="text-gray-500">ผู้เรียนทั้งหมด</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="text-4xl mb-2">✅</div>
                <div className="text-3xl font-bold text-green-600">
                  {loading ? '...' : `${stats.completionRate}%`}
                </div>
                <div className="text-gray-500">อัตราสำเร็จ</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="text-4xl mb-2">⏰</div>
                <div className="text-3xl font-bold text-yellow-600">
                  {loading ? '...' : stats.pendingAssignments}
                </div>
                <div className="text-gray-500">รอดำเนินการ</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">⚡ Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('ai-creator')}
                  className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl hover:scale-105 transition text-left"
                >
                  <div className="text-2xl mb-2">🤖</div>
                  <div className="font-bold">สร้างหลักสูตร AI</div>
                  <div className="text-sm text-white/80">สร้างเนื้อหาอัตโนมัติ</div>
                </button>
                <button
                  onClick={() => setActiveTab('compliance')}
                  className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl hover:scale-105 transition text-left"
                >
                  <div className="text-2xl mb-2">📋</div>
                  <div className="font-bold">Compliance Training</div>
                  <div className="text-sm text-white/80">มอบหมายหลักสูตร</div>
                </button>
                <button
                  onClick={() => setActiveTab('players')}
                  className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl hover:scale-105 transition text-left"
                >
                  <div className="text-2xl mb-2">👥</div>
                  <div className="font-bold">ติดตามผู้เล่น</div>
                  <div className="text-sm text-white/80">ดูสถิติและ Export</div>
                </button>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon="📋"
                title="Compliance Training"
                description="สร้างหลักสูตรบังคับ มอบหมายให้พนักงาน และติดตามความคืบหน้า พร้อมแจ้งเตือนอัตโนมัติ"
                onClick={() => setActiveTab('compliance')}
              />
              <FeatureCard
                icon="🤖"
                title="AI Course Creator"
                description="สร้างหลักสูตรอัตโนมัติด้วย AI เพียงระบุหัวข้อ ได้ทั้งสไลด์และแบบทดสอบ"
                onClick={() => setActiveTab('ai-creator')}
              />
              <FeatureCard
                icon="👥"
                title="Player Tracking"
                description="ติดตามผลการเรียนของพนักงานแต่ละคน ดูสถิติ และ Export รายงาน"
                onClick={() => setActiveTab('players')}
              />
              <FeatureCard
                icon="📊"
                title="NPS & Survey"
                description="วัดความพึงพอใจด้วย NPS และสร้างแบบสำรวจหลังจบการเรียน"
                href="/host/dashboard/analytics"
              />
            </div>

            {/* More Features */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">🚀 Features อื่นๆ</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <span className="text-2xl">❓</span>
                  <div>
                    <h3 className="font-bold">Moderated Q&A</h3>
                    <p className="text-sm text-gray-600">รับคำถามจากผู้เรียน ตรวจสอบก่อนแสดง และตอบคำถามระหว่าง Live</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <span className="text-2xl">🎓</span>
                  <div>
                    <h3 className="font-bold">Hybrid Training</h3>
                    <p className="text-sm text-gray-600">รวม Live Session + Self-paced Learning ในหลักสูตรเดียว</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <span className="text-2xl">📝</span>
                  <div>
                    <h3 className="font-bold">Question Types</h3>
                    <p className="text-sm text-gray-600">True/False, Poll, Open-ended, Brainstorm, Word Cloud</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <span className="text-2xl">📜</span>
                  <div>
                    <h3 className="font-bold">Certificates</h3>
                    <p className="text-sm text-gray-600">ออกใบรับรองอัตโนมัติเมื่อผ่านหลักสูตร</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && user && (
          <ComplianceTraining
            organizationId={user.id}
            userId={user.id}
            isAdmin={true}
          />
        )}

        {/* AI Creator Tab */}
        {activeTab === 'ai-creator' && (
          <AICourseCreator
            onCourseCreated={(course) => {
              console.log('Course created:', course)
              alert(`สร้างหลักสูตร "${course.title}" สำเร็จ!`)
              loadStats()
            }}
          />
        )}

        {/* Players Tab */}
        {activeTab === 'players' && user && (
          <PlayerTracking userId={user.id} />
        )}
      </main>
    </div>
  )
}

// Feature Card Component
function FeatureCard({
  icon,
  title,
  description,
  onClick,
  href,
}: {
  icon: string
  title: string
  description: string
  onClick?: () => void
  href?: string
}) {
  const content = (
    <>
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition block"
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition text-left w-full"
    >
      {content}
    </button>
  )
}

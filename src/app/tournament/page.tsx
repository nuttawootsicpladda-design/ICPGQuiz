'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/types/types'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Tournament {
  id: string
  name: string
  description: string | null
  status: string
  max_rounds: number
  current_round: number
  created_at: string
  host_user_id: string
}

interface QuizSet {
  id: string
  name: string
  description: string | null
}

export default function TournamentPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [quizSets, setQuizSets] = useState<QuizSet[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Create tournament form
  const [newTournament, setNewTournament] = useState({
    name: '',
    description: '',
    maxRounds: 3,
    selectedQuizzes: [] as string[],
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      loadData()
    }
  }, [user, authLoading])

  const loadData = async () => {
    setLoading(true)

    // Load user's tournaments
    const { data: tournamentsData } = await (supabase as any)
      .from('tournaments')
      .select('*')
      .eq('host_user_id', user!.id)
      .order('created_at', { ascending: false })

    setTournaments(tournamentsData || [])

    // Load user's quiz sets for creating tournaments
    const { data: quizData } = await supabase
      .from('quiz_sets')
      .select('id, name, description')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })

    setQuizSets(quizData || [])

    setLoading(false)
  }

  const createTournament = async () => {
    if (!newTournament.name.trim()) {
      alert('กรุณาใส่ชื่อ Tournament')
      return
    }

    if (newTournament.selectedQuizzes.length === 0) {
      alert('กรุณาเลือกอย่างน้อย 1 Quiz')
      return
    }

    // Create tournament
    const { data: tournament, error } = await (supabase as any)
      .from('tournaments')
      .insert({
        name: newTournament.name,
        description: newTournament.description || null,
        host_user_id: user!.id,
        max_rounds: newTournament.selectedQuizzes.length,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating tournament:', error)
      alert('สร้าง Tournament ไม่สำเร็จ')
      return
    }

    // Create rounds
    for (let i = 0; i < newTournament.selectedQuizzes.length; i++) {
      await (supabase as any).from('tournament_rounds').insert({
        tournament_id: tournament.id,
        round_number: i + 1,
        quiz_set_id: newTournament.selectedQuizzes[i],
        status: 'pending',
      })
    }

    setShowCreateModal(false)
    setNewTournament({ name: '', description: '', maxRounds: 3, selectedQuizzes: [] })
    loadData()
  }

  const deleteTournament = async (id: string) => {
    if (!confirm('ต้องการลบ Tournament นี้?')) return

    await (supabase as any).from('tournaments').delete().eq('id', id)
    loadData()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">รอเริ่ม</span>
      case 'active':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">กำลังแข่ง</span>
      case 'completed':
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">จบแล้ว</span>
      default:
        return null
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">🏆 Tournament Mode</h1>
              <p className="opacity-90">จัดการแข่งขันหลายรอบ</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/host/dashboard"
                className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition"
              >
                ← กลับ Dashboard
              </Link>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-white text-purple-600 px-4 py-2 rounded-lg font-bold hover:bg-purple-50 transition"
              >
                + สร้าง Tournament
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {tournaments.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">ยังไม่มี Tournament</h2>
            <p className="text-gray-600 mb-6">สร้าง Tournament แรกของคุณเพื่อจัดการแข่งขัน!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition"
            >
              สร้าง Tournament
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {tournaments.map(tournament => (
              <div
                key={tournament.id}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{tournament.name}</h3>
                      {getStatusBadge(tournament.status)}
                    </div>
                    {tournament.description && (
                      <p className="text-gray-600 mb-3">{tournament.description}</p>
                    )}
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>🎯 {tournament.max_rounds} รอบ</span>
                      <span>📍 รอบที่ {tournament.current_round}/{tournament.max_rounds}</span>
                      <span>📅 {new Date(tournament.created_at).toLocaleDateString('th-TH')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/tournament/${tournament.id}`}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                    >
                      {tournament.status === 'pending' ? 'เริ่มแข่ง' : 'ดูรายละเอียด'}
                    </Link>
                    <button
                      onClick={() => deleteTournament(tournament.id)}
                      className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold mb-6">🏆 สร้าง Tournament ใหม่</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">ชื่อ Tournament *</label>
                <input
                  type="text"
                  value={newTournament.name}
                  onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="เช่น การแข่งขันความรู้รอบตัว 2024"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">คำอธิบาย</label>
                <textarea
                  value={newTournament.description}
                  onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="รายละเอียดการแข่งขัน..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  เลือก Quiz สำหรับแต่ละรอบ * (เลือกตามลำดับรอบ)
                </label>
                {quizSets.length === 0 ? (
                  <p className="text-gray-500 text-sm">ยังไม่มี Quiz กรุณาสร้าง Quiz ก่อน</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-auto border rounded-lg p-3">
                    {quizSets.map((quiz, index) => {
                      const selectedIndex = newTournament.selectedQuizzes.indexOf(quiz.id)
                      const isSelected = selectedIndex !== -1

                      return (
                        <label
                          key={quiz.id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                            isSelected ? 'bg-purple-100 border-2 border-purple-500' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setNewTournament({
                                  ...newTournament,
                                  selectedQuizzes: newTournament.selectedQuizzes.filter(id => id !== quiz.id),
                                })
                              } else {
                                setNewTournament({
                                  ...newTournament,
                                  selectedQuizzes: [...newTournament.selectedQuizzes, quiz.id],
                                })
                              }
                            }}
                            className="w-5 h-5 text-purple-600"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{quiz.name}</div>
                            {quiz.description && (
                              <div className="text-sm text-gray-500">{quiz.description}</div>
                            )}
                          </div>
                          {isSelected && (
                            <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
                              รอบ {selectedIndex + 1}
                            </span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              {newTournament.selectedQuizzes.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-purple-800">
                    ✅ เลือกแล้ว {newTournament.selectedQuizzes.length} รอบ
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={createTournament}
                disabled={!newTournament.name || newTournament.selectedQuizzes.length === 0}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition disabled:opacity-50"
              >
                สร้าง Tournament
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

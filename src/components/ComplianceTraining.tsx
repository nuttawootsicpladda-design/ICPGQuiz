'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/types/types'

interface ComplianceCourse {
  id: string
  title: string
  description?: string
  deadline_days: number
  is_mandatory: boolean
  quiz_set_id?: string
  user_id: string
  created_at: string
}

interface ComplianceAssignment {
  id: string
  compliance_course_id: string
  assigned_email: string
  assigned_name?: string
  assigned_at: string
  due_date: string
  completed_at?: string
  reminder_sent_at?: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  score?: number
  passed?: boolean
  course?: ComplianceCourse
}

interface ComplianceTrainingProps {
  organizationId: string
  userId?: string
  isAdmin?: boolean
}

interface ParticipantUser {
  id: string
  nickname: string
  email?: string
  game_id: string
}

export default function ComplianceTraining({
  organizationId,
  userId,
  isAdmin = false,
}: ComplianceTrainingProps) {
  const [courses, setCourses] = useState<ComplianceCourse[]>([])
  const [assignments, setAssignments] = useState<ComplianceAssignment[]>([])
  const [quizSets, setQuizSets] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<ComplianceCourse | null>(null)
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    deadline_days: 7,
    is_mandatory: true,
    quiz_set_id: '',
  })

  useEffect(() => {
    loadData()
  }, [organizationId, userId])

  const loadData = async () => {
    setLoading(true)

    // Load courses created by this user
    const { data: coursesData } = await (supabase as any)
      .from('compliance_courses')
      .select('*')
      .eq('user_id', organizationId)
      .order('created_at', { ascending: false })

    if (coursesData) {
      setCourses(coursesData)
    }

    // Load quiz sets for linking
    const { data: quizData } = await supabase
      .from('quiz_sets')
      .select('id, name')
      .eq('user_id', organizationId)
      .order('created_at', { ascending: false })

    if (quizData) {
      setQuizSets(quizData)
    }

    // Load assignments
    if (coursesData && coursesData.length > 0) {
      const courseIds = coursesData.map((c: ComplianceCourse) => c.id)

      const { data: assignmentsData } = await (supabase as any)
        .from('compliance_assignments')
        .select(`
          *,
          course:compliance_courses(*)
        `)
        .in('compliance_course_id', courseIds)
        .order('due_date', { ascending: true })

      if (assignmentsData) {
        // Calculate status based on dates
        const now = new Date()
        const processedAssignments = assignmentsData.map((a: any) => {
          let status = a.status
          if (!a.completed_at && status !== 'completed') {
            const dueDate = new Date(a.due_date)
            if (dueDate < now) {
              status = 'overdue'
            }
          }
          return { ...a, status }
        })
        setAssignments(processedAssignments)
      }
    }

    setLoading(false)
  }

  const handleCreateCourse = async () => {
    if (!newCourse.title.trim()) return

    const { error } = await (supabase as any).from('compliance_courses').insert({
      user_id: organizationId,
      quiz_set_id: newCourse.quiz_set_id || null,
      title: newCourse.title.trim(),
      description: newCourse.description.trim() || null,
      deadline_days: newCourse.deadline_days,
      is_mandatory: newCourse.is_mandatory,
    })

    if (!error) {
      setShowCreateModal(false)
      setNewCourse({
        title: '',
        description: '',
        deadline_days: 7,
        is_mandatory: true,
        quiz_set_id: '',
      })
      loadData()
    } else {
      console.error('Error creating course:', error)
      alert('สร้างหลักสูตรไม่สำเร็จ')
    }
  }

  const handleAssignCourse = async (courseId: string, emails: { email: string; name: string }[]) => {
    const course = courses.find(c => c.id === courseId)
    if (!course) return

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + course.deadline_days)

    const assignmentData = emails.map(e => ({
      compliance_course_id: courseId,
      assigned_email: e.email,
      assigned_name: e.name,
      due_date: dueDate.toISOString(),
      status: 'pending',
    }))

    const { error } = await (supabase as any).from('compliance_assignments').insert(assignmentData)

    if (error) {
      console.error('Error assigning course:', error)
      alert('มอบหมายหลักสูตรไม่สำเร็จ')
    } else {
      setShowAssignModal(false)
      loadData()
    }
  }

  const handleSendReminder = async (assignmentId: string) => {
    await (supabase as any)
      .from('compliance_assignments')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', assignmentId)

    alert('ส่งการแจ้งเตือนเรียบร้อยแล้ว!')
    loadData()
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบหลักสูตรนี้?')) return

    const { error } = await (supabase as any)
      .from('compliance_courses')
      .delete()
      .eq('id', courseId)

    if (!error) {
      loadData()
    } else {
      alert('ลบหลักสูตรไม่สำเร็จ')
    }
  }

  const handleMarkComplete = async (assignmentId: string, score: number = 100) => {
    await (supabase as any)
      .from('compliance_assignments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        score,
        passed: score >= 70,
      })
      .eq('id', assignmentId)

    loadData()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'เสร็จสิ้น'
      case 'overdue':
        return 'เลยกำหนด'
      case 'in_progress':
        return 'กำลังทำ'
      default:
        return 'รอดำเนินการ'
    }
  }

  const getDaysRemaining = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Stats for admin dashboard
  const stats = {
    total: assignments.length,
    completed: assignments.filter(a => a.status === 'completed').length,
    overdue: assignments.filter(a => a.status === 'overdue').length,
    pending: assignments.filter(a => a.status === 'pending' || a.status === 'in_progress').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          📋 Compliance Training
        </h2>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            + สร้างหลักสูตร
          </button>
        )}
      </div>

      {/* Admin Stats */}
      {isAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-sm text-gray-500">มอบหมายทั้งหมด</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-green-600">เสร็จสิ้น</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-yellow-600">กำลังดำเนินการ</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-red-600">เลยกำหนด</div>
          </div>
        </div>
      )}

      {/* Courses List (Admin view) */}
      {isAdmin && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">📚 หลักสูตร Compliance</h3>
          {courses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              ยังไม่มีหลักสูตร กดปุ่ม &quot;สร้างหลักสูตร&quot; เพื่อเริ่มต้น
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => {
                const courseAssignments = assignments.filter(a => a.compliance_course_id === course.id)
                const completedCount = courseAssignments.filter(a => a.status === 'completed').length
                return (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">{course.title}</span>
                        {course.is_mandatory && (
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded">
                            บังคับ
                          </span>
                        )}
                        {course.quiz_set_id && (
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">
                            มี Quiz
                          </span>
                        )}
                      </div>
                      {course.description && (
                        <p className="text-sm text-gray-500 mt-1">{course.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>กำหนด {course.deadline_days} วัน</span>
                        <span>มอบหมาย {courseAssignments.length} คน</span>
                        <span className="text-green-600">เสร็จ {completedCount} คน</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedCourse(course)
                          setShowAssignModal(true)
                        }}
                        className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition"
                      >
                        มอบหมาย
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Assignments List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          {isAdmin ? '👥 การมอบหมายทั้งหมด' : '📋 หลักสูตรที่ต้องทำ'}
        </h3>
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {isAdmin ? 'ยังไม่มีการมอบหมายหลักสูตร' : 'ไม่มีหลักสูตรที่ต้องทำ'}
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => {
              const daysLeft = getDaysRemaining(assignment.due_date)
              return (
                <div
                  key={assignment.id}
                  className={`p-4 border-2 rounded-xl ${getStatusColor(assignment.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">
                          {assignment.course?.title || 'หลักสูตร'}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(assignment.status)}`}
                        >
                          {getStatusLabel(assignment.status)}
                        </span>
                        {assignment.course?.is_mandatory && (
                          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                            บังคับ
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <span>👤 {assignment.assigned_name || assignment.assigned_email}</span>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>
                          📅 กำหนด: {new Date(assignment.due_date).toLocaleDateString('th-TH')}
                        </span>
                        {assignment.status !== 'completed' && (
                          <span
                            className={`font-medium ${
                              daysLeft < 0
                                ? 'text-red-600'
                                : daysLeft <= 3
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }`}
                          >
                            {daysLeft < 0
                              ? `เลยกำหนด ${Math.abs(daysLeft)} วัน`
                              : daysLeft === 0
                              ? 'ครบกำหนดวันนี้!'
                              : `เหลือ ${daysLeft} วัน`}
                          </span>
                        )}
                        {assignment.score !== undefined && assignment.score !== null && (
                          <span className="font-medium text-purple-600">
                            คะแนน: {assignment.score}%
                          </span>
                        )}
                      </div>

                      {assignment.completed_at && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ เสร็จสิ้นเมื่อ: {new Date(assignment.completed_at).toLocaleString('th-TH')}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-4">
                      {isAdmin && assignment.status !== 'completed' && (
                        <>
                          <button
                            onClick={() => handleSendReminder(assignment.id)}
                            className="text-sm bg-yellow-500 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-600"
                            title="ส่งการแจ้งเตือน"
                          >
                            🔔
                          </button>
                          <button
                            onClick={() => handleMarkComplete(assignment.id)}
                            className="text-sm bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600"
                            title="ทำเครื่องหมายเสร็จสิ้น"
                          >
                            ✓
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">📚 สร้างหลักสูตร Compliance</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อหลักสูตร *
                </label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                  placeholder="เช่น ความปลอดภัยข้อมูลส่วนบุคคล"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียด
                </label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                  rows={3}
                  placeholder="อธิบายเนื้อหาหลักสูตร..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เชื่อมโยงกับ Quiz (ไม่บังคับ)
                </label>
                <select
                  value={newCourse.quiz_set_id}
                  onChange={(e) => setNewCourse({ ...newCourse, quiz_set_id: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                >
                  <option value="">-- ไม่เลือก --</option>
                  {quizSets.map(quiz => (
                    <option key={quiz.id} value={quiz.id}>{quiz.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  กำหนดเสร็จภายใน (วัน)
                </label>
                <input
                  type="number"
                  value={newCourse.deadline_days}
                  onChange={(e) => setNewCourse({ ...newCourse, deadline_days: parseInt(e.target.value) || 7 })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                  min={1}
                  max={365}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCourse.is_mandatory}
                    onChange={(e) => setNewCourse({ ...newCourse, is_mandatory: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">หลักสูตรบังคับ</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateCourse}
                disabled={!newCourse.title.trim()}
                className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50"
              >
                สร้างหลักสูตร
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Course Modal */}
      {showAssignModal && selectedCourse && (
        <AssignCourseModal
          course={selectedCourse}
          organizationId={organizationId}
          onAssign={(emails) => handleAssignCourse(selectedCourse.id, emails)}
          onClose={() => {
            setShowAssignModal(false)
            setSelectedCourse(null)
          }}
        />
      )}
    </div>
  )
}

// Assign Course Modal Component - Now fetches real participants
function AssignCourseModal({
  course,
  organizationId,
  onAssign,
  onClose,
}: {
  course: ComplianceCourse
  organizationId: string
  onAssign: (emails: { email: string; name: string }[]) => void
  onClose: () => void
}) {
  const [selectedEmails, setSelectedEmails] = useState<{ email: string; name: string }[]>([])
  const [participants, setParticipants] = useState<{ nickname: string; email?: string }[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [manualEmail, setManualEmail] = useState('')
  const [manualName, setManualName] = useState('')

  useEffect(() => {
    loadParticipants()
  }, [])

  const loadParticipants = async () => {
    setLoading(true)

    // Get all games from this user's quiz sets
    const { data: quizSets } = await supabase
      .from('quiz_sets')
      .select('id')
      .eq('user_id', organizationId)

    if (quizSets && quizSets.length > 0) {
      const quizIds = quizSets.map(q => q.id)

      const { data: games } = await supabase
        .from('games')
        .select('id')
        .in('quiz_set_id', quizIds)

      if (games && games.length > 0) {
        const gameIds = games.map(g => g.id)

        // Get unique participants
        const { data: participantsData } = await supabase
          .from('participants')
          .select('nickname')
          .in('game_id', gameIds)

        if (participantsData) {
          // Get unique nicknames
          const uniqueNicknames = Array.from(new Set(participantsData.map(p => p.nickname)))
          setParticipants(uniqueNicknames.map(n => ({ nickname: n })))
        }
      }
    }

    setLoading(false)
  }

  const filteredParticipants = participants.filter(
    (p) => p.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleParticipant = (nickname: string) => {
    const exists = selectedEmails.find(e => e.name === nickname)
    if (exists) {
      setSelectedEmails(prev => prev.filter(e => e.name !== nickname))
    } else {
      // Use nickname as email placeholder if no email
      setSelectedEmails(prev => [...prev, { email: `${nickname}@participant.local`, name: nickname }])
    }
  }

  const addManualEmail = () => {
    if (!manualEmail.trim()) return
    const name = manualName.trim() || manualEmail.split('@')[0]
    setSelectedEmails(prev => [...prev, { email: manualEmail.trim(), name }])
    setManualEmail('')
    setManualName('')
  }

  const selectAll = () => {
    const all = filteredParticipants.map(p => ({
      email: `${p.nickname}@participant.local`,
      name: p.nickname
    }))
    setSelectedEmails(all)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <h3 className="text-xl font-bold mb-2">👥 มอบหมายหลักสูตร</h3>
        <p className="text-gray-600 mb-4">{course.title}</p>

        {/* Manual Add */}
        <div className="mb-4 p-3 bg-gray-50 rounded-xl">
          <p className="text-sm font-medium mb-2">เพิ่มด้วยอีเมล:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="ชื่อ"
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
            />
            <input
              type="email"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              placeholder="อีเมล"
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
            />
            <button
              onClick={addManualEmail}
              disabled={!manualEmail.trim()}
              className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ค้นหาผู้เล่นจากเกมที่ผ่านมา..."
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none mb-2"
        />

        {/* Select All */}
        {!loading && participants.length > 0 && (
          <button
            onClick={selectAll}
            className="text-sm text-purple-600 hover:text-purple-700 mb-2"
          >
            เลือกทั้งหมด ({filteredParticipants.length} คน)
          </button>
        )}

        {/* Participant List */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4 max-h-[250px]">
          {loading ? (
            <div className="text-center py-4 text-gray-500">กำลังโหลด...</div>
          ) : participants.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              ยังไม่มีผู้เล่น ให้เพิ่มด้วยอีเมลด้านบน
            </div>
          ) : (
            filteredParticipants.map((p, index) => (
              <label
                key={`${p.nickname}-${index}`}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                  selectedEmails.find(e => e.name === p.nickname)
                    ? 'bg-purple-100 border-2 border-purple-500'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!selectedEmails.find(e => e.name === p.nickname)}
                  onChange={() => toggleParticipant(p.nickname)}
                  className="rounded"
                />
                <div>
                  <div className="font-medium">{p.nickname}</div>
                </div>
              </label>
            ))
          )}
        </div>

        {/* Selected summary */}
        {selectedEmails.length > 0 && (
          <div className="mb-4 p-2 bg-purple-50 rounded-lg text-sm">
            <span className="font-medium">เลือกแล้ว:</span>{' '}
            {selectedEmails.map(e => e.name).join(', ')}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => onAssign(selectedEmails)}
            disabled={selectedEmails.length === 0}
            className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50"
          >
            มอบหมาย ({selectedEmails.length} คน)
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

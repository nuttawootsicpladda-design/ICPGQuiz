'use client'

import { useState } from 'react'
import { supabase } from '@/types/types'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface CourseModule {
  title: string
  description: string
  type: 'slide' | 'quiz' | 'video' | 'assessment'
  content: SlideContent | QuizContent | VideoContent
  duration_minutes: number
}

interface SlideContent {
  slides: Array<{
    title: string
    content: string
    image_prompt?: string
  }>
}

interface QuizContent {
  questions: Array<{
    question: string
    type: 'multiple_choice' | 'true_false'
    options?: string[]
    correct_answer: number | boolean
    explanation: string
  }>
}

interface VideoContent {
  video_topic: string
  script_outline: string[]
}

interface GeneratedCourse {
  title: string
  description: string
  learning_objectives: string[]
  target_audience: string
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  total_duration_minutes: number
  modules: CourseModule[]
}

interface AICourseCreatorProps {
  onCourseCreated?: (course: GeneratedCourse) => void
}

export default function AICourseCreator({ onCourseCreated }: AICourseCreatorProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<'input' | 'generating' | 'preview' | 'editing' | 'saving'>('input')
  const [topic, setTopic] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [duration, setDuration] = useState(30)
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [includeQuiz, setIncludeQuiz] = useState(true)
  const [includeSlides, setIncludeSlides] = useState(true)
  const [numModules, setNumModules] = useState(5)
  const [generatedCourse, setGeneratedCourse] = useState<GeneratedCourse | null>(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [saveProgress, setSaveProgress] = useState(0)

  const generateCourse = async () => {
    if (!topic.trim()) {
      setError('กรุณาระบุหัวข้อของหลักสูตร')
      return
    }

    setStep('generating')
    setError('')
    setProgress(0)

    try {
      // Start progress animation
      setProgress(10)

      // Call real AI API
      const response = await fetch('/api/generate-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          targetAudience: targetAudience || 'ผู้เรียนทั่วไป',
          difficulty,
          duration,
          numModules,
          includeQuiz,
          includeSlides,
        }),
      })

      setProgress(50)

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate course')
      }

      setProgress(90)

      const course: GeneratedCourse = data.course

      setProgress(100)
      setGeneratedCourse(course)
      setStep('preview')

      // Save to database
      await (supabase as any).from('ai_course_generations').insert({
        topic,
        target_audience: targetAudience,
        difficulty_level: difficulty,
        include_quiz: includeQuiz,
        include_slides: includeSlides,
        generated_content: course,
        status: 'completed',
      })

    } catch (err: any) {
      console.error('AI Course Generation Error:', err)
      setError(err.message || 'เกิดข้อผิดพลาดในการสร้างหลักสูตร กรุณาลองใหม่')
      setStep('input')
    }
  }

  const getModuleTitle = (topic: string, index: number): string => {
    const titles = [
      `พื้นฐาน${topic}`,
      `หลักการสำคัญ`,
      `เทคนิคและวิธีการ`,
      `การประยุกต์ใช้`,
      `กรณีศึกษา`,
      `แนวปฏิบัติที่ดี`,
      `การวัดผลและประเมิน`,
      `การพัฒนาต่อเนื่อง`,
    ]
    return titles[index % titles.length]
  }

  const handleSaveCourse = async () => {
    if (!generatedCourse || !user?.id) {
      setError('กรุณาเข้าสู่ระบบเพื่อบันทึกหลักสูตร')
      return
    }

    setStep('saving')
    setSaveProgress(0)
    setError('')

    try {
      // Extract all questions from quiz and assessment modules
      const allQuestions: Array<{
        body: string
        choices: Array<{ body: string; is_correct: boolean }>
        time_limit: number
        points: number
        explanation?: string
      }> = []

      generatedCourse.modules.forEach((module) => {
        if (module.type === 'quiz' || module.type === 'assessment') {
          const quizContent = module.content as QuizContent
          if (quizContent.questions) {
            quizContent.questions.forEach((q) => {
              // Handle both multiple_choice and true_false questions
              let choices: Array<{ body: string; is_correct: boolean }> = []

              if (q.type === 'multiple_choice' && q.options) {
                choices = q.options.map((opt, idx) => ({
                  body: opt,
                  is_correct: idx === q.correct_answer,
                }))
              } else if (q.type === 'true_false') {
                choices = [
                  { body: 'ถูก', is_correct: q.correct_answer === true },
                  { body: 'ผิด', is_correct: q.correct_answer === false },
                  { body: '-', is_correct: false },
                  { body: '-', is_correct: false },
                ]
              }

              // Ensure we have exactly 4 choices
              while (choices.length < 4) {
                choices.push({ body: '-', is_correct: false })
              }
              choices = choices.slice(0, 4)

              allQuestions.push({
                body: q.question,
                choices,
                time_limit: 20,
                points: 1000,
                explanation: q.explanation,
              })
            })
          }
        }
      })

      if (allQuestions.length === 0) {
        setError('ไม่พบคำถามในหลักสูตรนี้ กรุณาเลือก "สร้างแบบทดสอบ" เมื่อสร้างหลักสูตร')
        setStep('preview')
        return
      }

      setSaveProgress(20)

      // Create quiz_set in database
      const { data: quizSet, error: quizError } = await supabase
        .from('quiz_sets')
        .insert({
          name: generatedCourse.title,
          description: `${generatedCourse.description}\n\nวัตถุประสงค์:\n${generatedCourse.learning_objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}`,
          user_id: user.id,
          auto_advance_time: 0,
          is_public: false,
          theme_id: 'classic',
          team_mode: false,
          max_teams: 2,
          auto_read: false,
          allow_self_paced: true,
          passing_score: 60,
        })
        .select()
        .single()

      if (quizError) {
        throw new Error(`ไม่สามารถสร้างควิซได้: ${quizError.message}`)
      }

      setSaveProgress(40)

      // Add questions one by one
      for (let i = 0; i < allQuestions.length; i++) {
        const question = allQuestions[i]

        await supabase.rpc('add_question', {
          quiz_set_id: quizSet.id,
          body: question.body,
          order: i,
          image_url: null,
          time_limit: question.time_limit,
          points: question.points,
          choices: question.choices.map((c) => ({
            body: c.body,
            is_correct: c.is_correct,
          })),
        } as any)

        setSaveProgress(40 + Math.round((i + 1) / allQuestions.length * 50))
      }

      setSaveProgress(100)

      // Call callback if provided
      onCourseCreated?.(generatedCourse)

      // Show success and redirect
      setTimeout(() => {
        router.push('/host/dashboard')
      }, 1500)

    } catch (err: any) {
      console.error('Save Course Error:', err)
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกหลักสูตร')
      setStep('preview')
    }
  }

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'เริ่มต้น'
      case 'intermediate':
        return 'ปานกลาง'
      case 'advanced':
        return 'ขั้นสูง'
      default:
        return level
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl">
          🤖
        </div>
        <div>
          <h2 className="text-2xl font-bold">AI Course Creator</h2>
          <p className="text-gray-500">สร้างหลักสูตรอัตโนมัติด้วย AI</p>
        </div>
      </div>

      {/* Step: Input */}
      {step === 'input' && (
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl">
              {error}
            </div>
          )}

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📚 หัวข้อหลักสูตร *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
              placeholder="เช่น การบริหารเวลา, Digital Marketing, Python Programming"
            />
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              👥 กลุ่มเป้าหมาย
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              placeholder="เช่น พนักงานใหม่, ผู้จัดการ, ทีมขาย"
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📊 ระดับความยาก
            </label>
            <div className="flex gap-3">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`flex-1 py-3 rounded-xl font-medium transition ${
                    difficulty === level
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getDifficultyLabel(level)}
                </button>
              ))}
            </div>
          </div>

          {/* Duration & Modules */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⏱️ ระยะเวลารวม (นาที)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                min={10}
                max={180}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📖 จำนวนบท
              </label>
              <input
                type="number"
                value={numModules}
                onChange={(e) => setNumModules(parseInt(e.target.value) || 5)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                min={2}
                max={20}
              />
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSlides}
                onChange={(e) => setIncludeSlides(e.target.checked)}
                className="rounded w-5 h-5 text-purple-600"
              />
              <span>📑 สร้างสไลด์</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeQuiz}
                onChange={(e) => setIncludeQuiz(e.target.checked)}
                className="rounded w-5 h-5 text-purple-600"
              />
              <span>❓ สร้างแบบทดสอบ</span>
            </label>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateCourse}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition flex items-center justify-center gap-2"
          >
            <span>🚀</span> สร้างหลักสูตรด้วย AI
          </button>
        </div>
      )}

      {/* Step: Generating */}
      {step === 'generating' && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center text-4xl">
              🤖
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">กำลังสร้างหลักสูตร...</h3>
          <p className="text-gray-500 mb-6">AI กำลังวิเคราะห์และสร้างเนื้อหาให้คุณ</p>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto">
            <div className="bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full h-3 transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">{progress}%</p>
          </div>

          <div className="mt-8 text-sm text-gray-400">
            {progress < 30 && '📝 กำลังวิเคราะห์หัวข้อ...'}
            {progress >= 30 && progress < 80 && '📚 กำลังสร้างเนื้อหาบทเรียน...'}
            {progress >= 80 && progress < 100 && '✨ กำลังตรวจสอบและปรับปรุง...'}
            {progress === 100 && '✅ เสร็จสิ้น!'}
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && generatedCourse && (
        <div>
          {/* Course Header */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
            <h3 className="text-2xl font-bold mb-2">{generatedCourse.title}</h3>
            <p className="text-gray-600 mb-4">{generatedCourse.description}</p>

            <div className="flex flex-wrap gap-3 text-sm">
              <span className="bg-white px-3 py-1 rounded-full">
                ⏱️ {generatedCourse.total_duration_minutes} นาที
              </span>
              <span className="bg-white px-3 py-1 rounded-full">
                📖 {generatedCourse.modules.length} บท
              </span>
              <span className="bg-white px-3 py-1 rounded-full">
                📊 {getDifficultyLabel(generatedCourse.difficulty_level)}
              </span>
              <span className="bg-white px-3 py-1 rounded-full">
                👥 {generatedCourse.target_audience}
              </span>
            </div>
          </div>

          {/* Learning Objectives */}
          <div className="mb-6">
            <h4 className="font-bold mb-3">🎯 วัตถุประสงค์การเรียนรู้</h4>
            <ul className="space-y-2">
              {generatedCourse.learning_objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Modules */}
          <div className="mb-6">
            <h4 className="font-bold mb-3">📚 โครงสร้างหลักสูตร</h4>
            <div className="space-y-3">
              {generatedCourse.modules.map((module, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{module.title}</span>
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                        {module.type === 'slide' && '📑 สไลด์'}
                        {module.type === 'quiz' && '❓ แบบทดสอบ'}
                        {module.type === 'assessment' && '📝 ประเมินผล'}
                        {module.type === 'video' && '🎬 วิดีโอ'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{module.description}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {module.duration_minutes} นาที
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSaveCourse}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700"
            >
              ✅ บันทึกและใช้งานหลักสูตร
            </button>
            <button
              onClick={() => setStep('editing')}
              className="px-6 py-4 border-2 border-purple-600 text-purple-600 rounded-xl font-bold hover:bg-purple-50"
            >
              ✏️ แก้ไข
            </button>
            <button
              onClick={() => {
                setStep('input')
                setGeneratedCourse(null)
              }}
              className="px-6 py-4 border-2 border-gray-300 rounded-xl hover:bg-gray-50"
            >
              🔄 สร้างใหม่
            </button>
          </div>
        </div>
      )}

      {/* Step: Editing */}
      {step === 'editing' && generatedCourse && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">✏️ แก้ไขหลักสูตร</h3>
            <button
              onClick={() => setStep('preview')}
              className="text-purple-600 hover:text-purple-700"
            >
              ← กลับ
            </button>
          </div>

          {/* Editable Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อหลักสูตร
            </label>
            <input
              type="text"
              value={generatedCourse.title}
              onChange={(e) =>
                setGeneratedCourse({ ...generatedCourse, title: e.target.value })
              }
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Editable Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รายละเอียด
            </label>
            <textarea
              value={generatedCourse.description}
              onChange={(e) =>
                setGeneratedCourse({ ...generatedCourse, description: e.target.value })
              }
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
              rows={3}
            />
          </div>

          {/* Editable Modules */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              บทเรียน
            </label>
            <div className="space-y-3">
              {generatedCourse.modules.map((module, i) => (
                <div key={i} className="p-4 border-2 border-gray-200 rounded-xl">
                  <input
                    type="text"
                    value={module.title}
                    onChange={(e) => {
                      const newModules = [...generatedCourse.modules]
                      newModules[i] = { ...newModules[i], title: e.target.value }
                      setGeneratedCourse({ ...generatedCourse, modules: newModules })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:border-purple-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={module.description}
                    onChange={(e) => {
                      const newModules = [...generatedCourse.modules]
                      newModules[i] = { ...newModules[i], description: e.target.value }
                      setGeneratedCourse({ ...generatedCourse, modules: newModules })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={() => setStep('preview')}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700"
          >
            ✓ บันทึกการแก้ไข
          </button>
        </div>
      )}

      {/* Step: Saving */}
      {step === 'saving' && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center text-4xl">
              {saveProgress === 100 ? '✅' : '💾'}
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">
            {saveProgress === 100 ? 'บันทึกสำเร็จ!' : 'กำลังบันทึกหลักสูตร...'}
          </h3>
          <p className="text-gray-500 mb-6">
            {saveProgress === 100
              ? 'กำลังนำคุณไปยังหน้า Dashboard'
              : 'กำลังสร้างควิซและบันทึกคำถามทั้งหมด'}
          </p>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto">
            <div className="bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full h-3 transition-all duration-300"
                style={{ width: `${saveProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">{saveProgress}%</p>
          </div>

          <div className="mt-8 text-sm text-gray-400">
            {saveProgress < 20 && '📋 กำลังเตรียมข้อมูล...'}
            {saveProgress >= 20 && saveProgress < 40 && '📝 กำลังสร้างควิซ...'}
            {saveProgress >= 40 && saveProgress < 100 && '❓ กำลังบันทึกคำถาม...'}
            {saveProgress === 100 && '🎉 เสร็จสิ้น! หลักสูตรพร้อมใช้งานแล้ว'}
          </div>
        </div>
      )}
    </div>
  )
}

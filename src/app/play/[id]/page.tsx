'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/types/types'
import { useRouter } from 'next/navigation'
import AvatarPicker, { AvatarDisplay } from '@/components/AvatarPicker'
import { CountdownCircleTimer } from 'react-countdown-circle-timer'
import Confetti from 'react-confetti'
import useWindowSize from 'react-use/lib/useWindowSize'
import Certificate from '@/components/Certificate'

interface Question {
  id: string
  body: string
  image_url: string | null
  time_limit: number
  points: number
  order: number
  question_type: string
  choices: Choice[]
}

interface Choice {
  id: string
  body: string
  is_correct: boolean
}

interface QuizSet {
  id: string
  name: string
  description: string | null
  passing_score: number
  questions: Question[]
}

interface Session {
  id: string
  nickname: string
  avatar_id: string
  score: number
  correct_answers: number
  current_question: number
}

enum Screen {
  register = 'register',
  quiz = 'quiz',
  result = 'result',
}

const COLORS = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500']
const COLOR_NAMES = ['red', 'blue', 'yellow', 'green']

export default function SelfPacedQuiz({
  params: { id: quizSetId },
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { width, height } = useWindowSize()

  const [screen, setScreen] = useState<Screen>(Screen.register)
  const [quizSet, setQuizSet] = useState<QuizSet | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Registration
  const [nickname, setNickname] = useState('')
  const [avatarId, setAvatarId] = useState('cat')

  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)
  const [showChoices, setShowChoices] = useState(false)
  const [timerKey, setTimerKey] = useState(0)

  // Results
  const [showCertificate, setShowCertificate] = useState(false)
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  // Load quiz set
  useEffect(() => {
    const loadQuiz = async () => {
      const { data, error } = await supabase
        .from('quiz_sets')
        .select(`*, questions(*, choices(*))`)
        .eq('id', quizSetId)
        .order('order', { ascending: true, referencedTable: 'questions' })
        .single()

      if (error || !data) {
        setError('ไม่พบ Quiz นี้')
        setLoading(false)
        return
      }

      setQuizSet(data as any)
      setLoading(false)
    }

    loadQuiz()
  }, [quizSetId])

  // Start quiz session
  const startQuiz = async () => {
    if (!nickname.trim()) {
      setError('กรุณาใส่ชื่อของคุณ')
      return
    }

    setError('')

    // Create session in database (table created via migration)
    const { data, error } = await (supabase as any)
      .from('self_paced_sessions')
      .insert({
        quiz_set_id: quizSetId,
        nickname: nickname.trim(),
        avatar_id: avatarId,
        score: 0,
        correct_answers: 0,
        current_question: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating session:', error)
      // Continue without saving to DB
    }

    setSession({
      id: data?.id || `local-${Date.now()}`,
      nickname: nickname.trim(),
      avatar_id: avatarId,
      score: 0,
      correct_answers: 0,
      current_question: 0,
    })

    setScreen(Screen.quiz)
    setQuestionStartTime(Date.now())

    // Show choices after delay
    setTimeout(() => setShowChoices(true), 3000)
  }

  // Handle answer selection
  const handleAnswer = async (choiceId: string) => {
    if (isAnswered || !quizSet) return

    setSelectedChoice(choiceId)
    setIsAnswered(true)

    const question = quizSet.questions[currentQuestion]
    const choice = question.choices.find(c => c.id === choiceId)
    const isCorrect = choice?.is_correct || false
    const timeTaken = Date.now() - questionStartTime

    // Calculate score (faster = more points)
    let questionScore = 0
    if (isCorrect) {
      const timeLimit = question.time_limit * 1000
      const timeBonus = Math.max(0, 1 - (timeTaken / timeLimit))
      questionScore = Math.floor(question.points * (0.5 + 0.5 * timeBonus))
    }

    const newScore = score + questionScore
    const newCorrect = correctAnswers + (isCorrect ? 1 : 0)

    setScore(newScore)
    setCorrectAnswers(newCorrect)

    // Save answer to database
    if (session?.id && !session.id.startsWith('local-')) {
      await (supabase as any).from('self_paced_answers').insert({
        session_id: session.id,
        question_id: question.id,
        choice_id: choiceId,
        is_correct: isCorrect,
        score: questionScore,
        time_taken: timeTaken,
      })
    }
  }

  // Move to next question
  const nextQuestion = async () => {
    if (!quizSet) return

    if (currentQuestion + 1 >= quizSet.questions.length) {
      // Quiz completed
      await completeQuiz()
    } else {
      setCurrentQuestion(prev => prev + 1)
      setSelectedChoice(null)
      setIsAnswered(false)
      setShowChoices(false)
      setQuestionStartTime(Date.now())
      setTimerKey(prev => prev + 1)

      // Show choices after delay
      setTimeout(() => setShowChoices(true), 3000)
    }
  }

  // Complete the quiz
  const completeQuiz = async () => {
    if (!quizSet || !session) return

    const totalQuestions = quizSet.questions.length
    const percentage = Math.round((correctAnswers / totalQuestions) * 100)
    const passed = percentage >= (quizSet.passing_score || 60)
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000)

    // Update session in database
    if (session.id && !session.id.startsWith('local-')) {
      await (supabase as any)
        .from('self_paced_sessions')
        .update({
          score,
          correct_answers: correctAnswers,
          completed_at: new Date().toISOString(),
          time_taken: timeTaken,
        })
        .eq('id', session.id)

      // Create certificate if passed
      if (passed) {
        await (supabase as any).from('certificates').insert({
          participant_id: session.id,
          game_id: session.id, // Use session ID as game ID for self-paced
          quiz_set_id: quizSetId,
          nickname: session.nickname,
          score,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          percentage,
          passed,
        })
      }
    }

    // Load leaderboard
    const { data: leaderboardData } = await (supabase as any)
      .from('self_paced_sessions')
      .select('nickname, avatar_id, score, correct_answers, time_taken')
      .eq('quiz_set_id', quizSetId)
      .not('completed_at', 'is', null)
      .order('score', { ascending: false })
      .order('time_taken', { ascending: true })
      .limit(10)

    setLeaderboard(leaderboardData || [])
    setScreen(Screen.result)
  }

  // Time up handler
  const handleTimeUp = () => {
    if (!isAnswered) {
      setIsAnswered(true)
      // Auto move to next after showing correct answer
      setTimeout(nextQuestion, 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">Loading...</div>
      </div>
    )
  }

  if (error && !quizSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{error}</h1>
          <button
            onClick={() => router.push('/')}
            className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    )
  }

  // Registration Screen
  if (screen === Screen.register && quizSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{quizSet.name}</h1>
            {quizSet.description && (
              <p className="text-gray-600">{quizSet.description}</p>
            )}
            <div className="flex justify-center gap-4 mt-4 text-sm text-gray-500">
              <span>📝 {quizSet.questions.length} คำถาม</span>
              <span>🎯 ผ่าน {quizSet.passing_score || 60}%</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">ชื่อของคุณ</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="ใส่ชื่อเล่น..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">เลือก Avatar</label>
              <AvatarPicker selectedAvatarId={avatarId} onSelect={setAvatarId} />
            </div>

            <button
              onClick={startQuiz}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-4 rounded-xl font-bold text-xl hover:opacity-90 transition transform hover:scale-105"
            >
              🚀 เริ่มทำ Quiz
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            เล่นเองได้ทุกเวลา • ไม่ต้องรอ Host
          </div>
        </div>
      </div>
    )
  }

  // Quiz Screen
  if (screen === Screen.quiz && quizSet && quizSet.questions[currentQuestion]) {
    const question = quizSet.questions[currentQuestion]
    const correctChoice = question.choices.find(c => c.is_correct)

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-500 flex flex-col">
        {/* Header */}
        <div className="bg-black/30 p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="text-white">
              <span className="font-bold">คำถาม {currentQuestion + 1}</span>
              <span className="opacity-75"> / {quizSet.questions.length}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-white text-right">
                <div className="text-sm opacity-75">คะแนน</div>
                <div className="text-2xl font-bold">{score}</div>
              </div>
              <AvatarDisplay avatarId={session?.avatar_id || 'cat'} size="sm" />
            </div>
          </div>
        </div>

        {/* Timer & Question */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="mb-6">
            <CountdownCircleTimer
              key={timerKey}
              isPlaying={!isAnswered}
              duration={question.time_limit}
              colors={['#22c55e', '#eab308', '#ef4444']}
              colorsTime={[question.time_limit, question.time_limit / 2, 0]}
              onComplete={handleTimeUp}
              size={100}
              strokeWidth={8}
            >
              {({ remainingTime }) => (
                <div className="text-white text-3xl font-bold">{remainingTime}</div>
              )}
            </CountdownCircleTimer>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-3xl w-full">
            {/* Question */}
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
              {question.body}
            </h2>

            {question.image_url && (
              <div className="mb-6 flex justify-center">
                <img
                  src={question.image_url}
                  alt="Question"
                  className="max-h-48 rounded-lg"
                />
              </div>
            )}

            {/* Choices */}
            {showChoices && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {question.choices.map((choice, index) => {
                  let buttonClass = `${COLORS[index]} text-white`

                  if (isAnswered) {
                    if (choice.is_correct) {
                      buttonClass = 'bg-green-500 text-white ring-4 ring-green-300'
                    } else if (selectedChoice === choice.id) {
                      buttonClass = 'bg-red-500 text-white'
                    } else {
                      buttonClass = 'bg-gray-400 text-white opacity-50'
                    }
                  }

                  return (
                    <button
                      key={choice.id}
                      onClick={() => handleAnswer(choice.id)}
                      disabled={isAnswered}
                      className={`${buttonClass} p-4 rounded-xl font-bold text-lg transition transform hover:scale-105 disabled:hover:scale-100`}
                    >
                      {choice.body}
                      {isAnswered && choice.is_correct && ' ✓'}
                    </button>
                  )
                })}
              </div>
            )}

            {!showChoices && (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">⏳</div>
                <div>กำลังโหลดตัวเลือก...</div>
              </div>
            )}

            {/* Result & Next Button */}
            {isAnswered && (
              <div className="mt-6 text-center">
                {selectedChoice && question.choices.find(c => c.id === selectedChoice)?.is_correct ? (
                  <div className="text-green-600 text-xl font-bold mb-4">✅ ถูกต้อง!</div>
                ) : (
                  <div className="text-red-600 text-xl font-bold mb-4">
                    ❌ ผิด - คำตอบคือ: {correctChoice?.body}
                  </div>
                )}

                <button
                  onClick={nextQuestion}
                  className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-purple-700 transition"
                >
                  {currentQuestion + 1 >= quizSet.questions.length ? 'ดูผลลัพธ์' : 'คำถามถัดไป →'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-black/30">
          <div
            className="h-full bg-white transition-all"
            style={{ width: `${((currentQuestion + 1) / quizSet.questions.length) * 100}%` }}
          />
        </div>
      </div>
    )
  }

  // Results Screen
  if (screen === Screen.result && quizSet && session) {
    const totalQuestions = quizSet.questions.length
    const percentage = Math.round((correctAnswers / totalQuestions) * 100)
    const passed = percentage >= (quizSet.passing_score || 60)

    if (showCertificate) {
      return (
        <Certificate
          nickname={session.nickname}
          quizName={quizSet.name}
          score={score}
          correctAnswers={correctAnswers}
          totalQuestions={totalQuestions}
          percentage={percentage}
          onClose={() => setShowCertificate(false)}
        />
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-500 p-4">
        {passed && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}

        <div className="max-w-2xl mx-auto pt-8">
          {/* Result Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center mb-6">
            <div className="text-6xl mb-4">{passed ? '🎉' : '💪'}</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {passed ? 'ยินดีด้วย!' : 'พยายามต่อไป!'}
            </h1>
            <p className="text-gray-600 mb-6">{session.nickname}</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-purple-100 rounded-xl p-4">
                <div className="text-3xl font-bold text-purple-600">{score}</div>
                <div className="text-sm text-gray-600">คะแนน</div>
              </div>
              <div className="bg-green-100 rounded-xl p-4">
                <div className="text-3xl font-bold text-green-600">{correctAnswers}/{totalQuestions}</div>
                <div className="text-sm text-gray-600">ตอบถูก</div>
              </div>
              <div className={`rounded-xl p-4 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
                <div className={`text-3xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                  {percentage}%
                </div>
                <div className="text-sm text-gray-600">{passed ? 'ผ่าน!' : 'ไม่ผ่าน'}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {passed && (
                <button
                  onClick={() => setShowCertificate(true)}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition"
                >
                  🏆 รับใบรับรอง
                </button>
              )}
              <button
                onClick={() => {
                  setScreen(Screen.register)
                  setCurrentQuestion(0)
                  setScore(0)
                  setCorrectAnswers(0)
                  setSession(null)
                }}
                className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition"
              >
                🔄 เล่นอีกครั้ง
              </button>
              <button
                onClick={() => router.push('/')}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
              >
                🏠 กลับหน้าหลัก
              </button>
            </div>
          </div>

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">🏆 อันดับผู้เล่น</h2>
              <div className="space-y-2">
                {leaderboard.map((player, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      player.nickname === session.nickname ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl font-bold w-8">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </div>
                    <AvatarDisplay avatarId={player.avatar_id} size="sm" />
                    <div className="flex-1 font-medium">{player.nickname}</div>
                    <div className="text-right">
                      <div className="font-bold text-purple-600">{player.score}</div>
                      <div className="text-xs text-gray-500">{player.correct_answers} ถูก</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}

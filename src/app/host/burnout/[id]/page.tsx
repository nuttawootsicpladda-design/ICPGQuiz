'use client'

import { Participant, supabase } from '@/types/types'
import { useEffect, useState } from 'react'
import BurnoutLobby from './lobby'
import BurnoutActive from './active'
import BurnoutResults from './results'

// Use standard game phases (DB constraint: 'lobby', 'quiz', 'result')
// 'lobby' = waiting room, 'quiz' = survey active, 'result' = show results
enum Phase {
  lobby = 'lobby',
  active = 'quiz',
  result = 'result',
}

interface SurveyQuestion {
  id: string
  survey_id: string
  question_text: string
  question_type: string
  options: any
  order_index: number
}

interface SurveyData {
  id: string
  title: string
  description: string
  survey_type: string
  game_id: string
  survey_questions: SurveyQuestion[]
}

export default function HostBurnoutPage({
  params: { id: gameId },
}: {
  params: { id: string }
}) {
  const [currentPhase, setCurrentPhase] = useState<Phase>(Phase.lobby)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null)
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      // Get game
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select()
        .eq('id', gameId)
        .single()

      if (gameError || !game) {
        console.error('Error loading game:', gameError)
        setIsLoading(false)
        return
      }

      setCurrentPhase(game.phase as Phase)
      setCurrentQuestionIndex(game.current_question_sequence)

      // Get survey + questions
      const { data: survey } = await (supabase as any)
        .from('surveys')
        .select('*, survey_questions(*)')
        .eq('game_id', gameId)
        .eq('survey_type', 'burnout')
        .single()

      if (survey) {
        setSurveyData(survey)
        const sorted = [...survey.survey_questions].sort(
          (a: SurveyQuestion, b: SurveyQuestion) => a.order_index - b.order_index
        )
        setQuestions(sorted)
      }

      // Get existing participants
      const { data: parts } = await supabase
        .from('participants')
        .select()
        .eq('game_id', gameId)
        .order('created_at')

      if (parts) setParticipants(parts)
      setIsLoading(false)
    }

    loadData()

    // Realtime subscriptions
    const channel = supabase
      .channel(`burnout_host_${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'participants',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          setParticipants((prev) => [...prev, payload.new as Participant])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          const game = payload.new as any
          setCurrentPhase(game.phase as Phase)
          setCurrentQuestionIndex(game.current_question_sequence)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId])

  if (isLoading) {
    return (
      <main className="bg-ci min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl font-bold animate-pulse">กำลังโหลด...</div>
      </main>
    )
  }

  const identityMode = (() => {
    try {
      return JSON.parse(surveyData?.description || '{}').identity_mode || 'anonymous'
    } catch {
      return 'anonymous'
    }
  })()

  return (
    <main className="bg-ci min-h-screen">
      {currentPhase === Phase.lobby && (
        <BurnoutLobby participants={participants} gameId={gameId} />
      )}
      {currentPhase === Phase.active && questions.length > 0 && (
        <BurnoutActive
          gameId={gameId}
          surveyId={surveyData?.id || ''}
          questions={questions}
          currentQuestionIndex={currentQuestionIndex}
          participants={participants}
          identityMode={identityMode}
        />
      )}
      {currentPhase === Phase.result && (
        <BurnoutResults
          gameId={gameId}
          surveyId={surveyData?.id || ''}
          questions={questions}
          participants={participants}
          identityMode={identityMode}
        />
      )}
    </main>
  )
}

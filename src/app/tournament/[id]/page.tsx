'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/types/types'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Confetti from 'react-confetti'
import useWindowSize from 'react-use/lib/useWindowSize'

interface Tournament {
  id: string
  name: string
  description: string | null
  status: string
  max_rounds: number
  current_round: number
  created_at: string
}

interface TournamentRound {
  id: string
  round_number: number
  quiz_set_id: string
  game_id: string | null
  status: string
  quiz_set?: {
    name: string
  }
}

interface TournamentParticipant {
  id: string
  nickname: string
  avatar_id: string
  total_score: number
  rounds_played: number
  is_eliminated: boolean
}

export default function TournamentDetailPage({
  params: { id: tournamentId },
}: {
  params: { id: string }
}) {
  const { user } = useAuth()
  const router = useRouter()
  const { width, height } = useWindowSize()

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [rounds, setRounds] = useState<TournamentRound[]>([])
  const [participants, setParticipants] = useState<TournamentParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    loadTournament()
  }, [tournamentId])

  const loadTournament = async () => {
    setLoading(true)

    // Load tournament
    const { data: tournamentData } = await (supabase as any)
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()

    if (!tournamentData) {
      router.push('/tournament')
      return
    }

    setTournament(tournamentData)

    // Load rounds with quiz names
    const { data: roundsData } = await (supabase as any)
      .from('tournament_rounds')
      .select(`
        *,
        quiz_set:quiz_sets(name)
      `)
      .eq('tournament_id', tournamentId)
      .order('round_number')

    setRounds(roundsData || [])

    // Load participants
    const { data: participantsData } = await (supabase as any)
      .from('tournament_participants')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('total_score', { ascending: false })

    setParticipants(participantsData || [])

    setLoading(false)
  }

  const startRound = async (round: TournamentRound) => {
    // Create a new game for this round
    const { data: game, error } = await supabase
      .from('games')
      .insert({
        quiz_set_id: round.quiz_set_id,
        host_user_id: user?.id,
        phase: 'lobby',
      })
      .select()
      .single()

    if (error || !game) {
      alert('ไม่สามารถสร้างเกมได้')
      return
    }

    // Update round with game_id
    await (supabase as any)
      .from('tournament_rounds')
      .update({
        game_id: game.id,
        status: 'active',
      })
      .eq('id', round.id)

    // Update tournament status and current round
    await (supabase as any)
      .from('tournaments')
      .update({
        status: 'active',
        current_round: round.round_number,
      })
      .eq('id', tournamentId)

    // Open game in new window
    window.open(`/host/game/${game.id}`, '_blank')
    loadTournament()
  }

  const completeRound = async (round: TournamentRound) => {
    if (!round.game_id) return

    // Get game results
    const { data: results } = await supabase
      .from('game_results')
      .select('*')
      .eq('game_id', round.game_id)

    if (results) {
      // Update tournament participants scores
      for (const result of results) {
        // Check if participant exists
        const existingParticipant = participants.find(
          p => p.nickname === result.nickname
        )

        if (existingParticipant) {
          await (supabase as any)
            .from('tournament_participants')
            .update({
              total_score: existingParticipant.total_score + (result.total_score || 0),
              rounds_played: existingParticipant.rounds_played + 1,
            })
            .eq('id', existingParticipant.id)
        } else {
          // Create new tournament participant
          await (supabase as any).from('tournament_participants').insert({
            tournament_id: tournamentId,
            nickname: result.nickname,
            total_score: result.total_score || 0,
            rounds_played: 1,
          })
        }
      }
    }

    // Update round status
    await (supabase as any)
      .from('tournament_rounds')
      .update({ status: 'completed' })
      .eq('id', round.id)

    // Check if all rounds completed
    const nextRound = rounds.find(r => r.round_number === round.round_number + 1)
    if (!nextRound) {
      // Tournament completed
      await (supabase as any)
        .from('tournaments')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
        })
        .eq('id', tournamentId)

      setShowConfetti(true)
    }

    loadTournament()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!tournament) return null

  const isCompleted = tournament.status === 'completed'
  const winner = participants[0]

  return (
    <div className="min-h-screen bg-gray-100">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/tournament" className="text-white/80 hover:text-white mb-4 inline-block">
            ← กลับหน้า Tournament
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{tournament.name}</h1>
              {tournament.description && (
                <p className="opacity-90 mb-2">{tournament.description}</p>
              )}
              <div className="flex gap-4">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  tournament.status === 'completed' ? 'bg-green-500' :
                  tournament.status === 'active' ? 'bg-yellow-500' : 'bg-white/20'
                }`}>
                  {tournament.status === 'completed' ? '🏆 จบแล้ว' :
                   tournament.status === 'active' ? '🎮 กำลังแข่ง' : '⏳ รอเริ่ม'}
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  รอบ {tournament.current_round}/{tournament.max_rounds}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Rounds */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold mb-4">📋 รอบการแข่งขัน</h2>
            <div className="space-y-3">
              {rounds.map(round => (
                <div
                  key={round.id}
                  className={`border-2 rounded-lg p-4 ${
                    round.status === 'completed' ? 'border-green-300 bg-green-50' :
                    round.status === 'active' ? 'border-yellow-300 bg-yellow-50' :
                    'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold">รอบที่ {round.round_number}</div>
                      <div className="text-sm text-gray-600">{round.quiz_set?.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {round.status === 'completed' ? (
                        <span className="text-green-600">✓ เสร็จแล้ว</span>
                      ) : round.status === 'active' ? (
                        <>
                          <Link
                            href={`/host/game/${round.game_id}`}
                            target="_blank"
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                          >
                            เปิดเกม
                          </Link>
                          <button
                            onClick={() => completeRound(round)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                          >
                            จบรอบ
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startRound(round)}
                          disabled={round.round_number > 1 && rounds[round.round_number - 2]?.status !== 'completed'}
                          className="bg-purple-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          เริ่มรอบ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold mb-4">🏆 อันดับรวม</h2>
            {participants.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                ยังไม่มีผู้เล่น - เริ่มรอบแรกเพื่อเพิ่มผู้เล่น
              </div>
            ) : (
              <div className="space-y-2">
                {participants.map((p, index) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      index === 0 && isCompleted ? 'bg-yellow-100 border-2 border-yellow-400' :
                      index < 3 ? 'bg-purple-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl font-bold w-10">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">{p.nickname}</div>
                      <div className="text-sm text-gray-500">เล่น {p.rounds_played} รอบ</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-purple-600">{p.total_score}</div>
                      <div className="text-xs text-gray-500">คะแนนรวม</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Winner Announcement */}
            {isCompleted && winner && (
              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl text-white text-center">
                <div className="text-4xl mb-2">🎉</div>
                <div className="text-xl font-bold">ผู้ชนะ: {winner.nickname}</div>
                <div className="text-lg">{winner.total_score} คะแนน</div>
              </div>
            )}
          </div>
        </div>

        {/* Join Code for Participants */}
        {tournament.status === 'active' && rounds.find(r => r.status === 'active')?.game_id && (
          <div className="mt-6 bg-white rounded-xl p-6 shadow-md text-center">
            <h3 className="text-lg font-bold mb-2">🎮 เข้าร่วมรอบปัจจุบัน</h3>
            <p className="text-gray-600 mb-4">ส่งลิงก์นี้ให้ผู้เล่น:</p>
            <div className="bg-gray-100 rounded-lg p-4 font-mono text-lg">
              {typeof window !== 'undefined' && window.location.origin}/game/{rounds.find(r => r.status === 'active')?.game_id}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

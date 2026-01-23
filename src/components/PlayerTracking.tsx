'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/types/types'

interface PlayerTrackingProps {
  userId: string
}

interface PlayerProfile {
  id: string
  email?: string
  nickname: string
  avatar_id?: string
  total_games_played: number
  total_score: number
  total_correct_answers: number
  total_questions_answered: number
  average_accuracy: number
  best_streak: number
  last_played_at?: string
}

interface GameHistory {
  id: string
  quiz_name: string
  score: number
  correct_answers: number
  total_questions: number
  accuracy: number
  rank: number
  total_players: number
  played_at: string
}

export default function PlayerTracking({ userId }: PlayerTrackingProps) {
  const [players, setPlayers] = useState<PlayerProfile[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(null)
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'score' | 'games' | 'accuracy'>('score')

  // Load all players
  useEffect(() => {
    loadPlayers()
  }, [userId])

  const loadPlayers = async () => {
    setLoading(true)

    // First get quiz sets owned by this user
    const { data: quizSets } = await supabase
      .from('quiz_sets')
      .select('id')
      .eq('user_id', userId)

    if (!quizSets || quizSets.length === 0) {
      setLoading(false)
      return
    }

    const quizSetIds = quizSets.map(q => q.id)

    // Get all games for these quiz sets
    const { data: games } = await supabase
      .from('games')
      .select('id')
      .in('quiz_set_id', quizSetIds)

    if (!games || games.length === 0) {
      setLoading(false)
      return
    }

    const gameIds = games.map(g => g.id)

    // Get all game results for these games
    const { data: results } = await (supabase as any)
      .from('game_results')
      .select('*')
      .in('game_id', gameIds)

    if (!results) {
      setLoading(false)
      return
    }

    // Aggregate by nickname
    const playerMap: { [key: string]: PlayerProfile } = {}

    results.forEach((result: any) => {
      const nickname = result.nickname || 'Unknown'
      if (!playerMap[nickname]) {
        playerMap[nickname] = {
          id: result.participant_id || nickname,
          nickname,
          avatar_id: result.avatar_id,
          total_games_played: 0,
          total_score: 0,
          total_correct_answers: 0,
          total_questions_answered: 0,
          average_accuracy: 0,
          best_streak: 0,
          last_played_at: result.created_at,
        }
      }

      const player = playerMap[nickname]
      player.total_games_played++
      player.total_score += result.total_score || 0
      player.total_correct_answers += result.correct_answers || 0
      player.total_questions_answered += result.total_questions || 0

      if (result.created_at > (player.last_played_at || '')) {
        player.last_played_at = result.created_at
      }
    })

    // Calculate average accuracy
    Object.values(playerMap).forEach(player => {
      if (player.total_questions_answered > 0) {
        player.average_accuracy = Math.round(
          (player.total_correct_answers / player.total_questions_answered) * 100
        )
      }
    })

    setPlayers(Object.values(playerMap))
    setLoading(false)
  }

  const loadPlayerHistory = async (player: PlayerProfile) => {
    setSelectedPlayer(player)

    // First get quiz sets owned by this user
    const { data: quizSets } = await supabase
      .from('quiz_sets')
      .select('id')
      .eq('user_id', userId)

    if (!quizSets) return

    const quizSetIds = quizSets.map(q => q.id)

    // Get game history for this player
    const { data: games } = await supabase
      .from('games')
      .select('id')
      .in('quiz_set_id', quizSetIds)

    if (!games) return

    const gameIds = games.map(g => g.id)

    const { data: results } = await (supabase as any)
      .from('game_results')
      .select(`
        *,
        game:games(quiz_set:quiz_sets(name))
      `)
      .eq('nickname', player.nickname)
      .in('game_id', gameIds)
      .order('created_at', { ascending: false })

    if (results) {
      setGameHistory(
        results.map((r: any) => ({
          id: r.id,
          quiz_name: r.game?.quiz_set?.name || 'Unknown Quiz',
          score: r.total_score || 0,
          correct_answers: r.correct_answers || 0,
          total_questions: r.total_questions || 0,
          accuracy: r.total_questions > 0
            ? Math.round((r.correct_answers / r.total_questions) * 100)
            : 0,
          rank: r.rank || 0,
          total_players: r.total_players || 0,
          played_at: r.created_at,
        }))
      )
    }
  }

  // Filter and sort players
  const filteredPlayers = players
    .filter(p =>
      p.nickname.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.total_score - a.total_score
        case 'games':
          return b.total_games_played - a.total_games_played
        case 'accuracy':
          return b.average_accuracy - a.average_accuracy
        default:
          return 0
      }
    })

  const exportToCSV = () => {
    const headers = ['Nickname', 'Games Played', 'Total Score', 'Correct Answers', 'Total Questions', 'Accuracy %', 'Last Played']
    const rows = filteredPlayers.map(p => [
      p.nickname,
      p.total_games_played,
      p.total_score,
      p.total_correct_answers,
      p.total_questions_answered,
      p.average_accuracy,
      p.last_played_at ? new Date(p.last_played_at).toLocaleDateString('th-TH') : '',
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `player-tracking-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 animate-pulse">กำลังโหลด...</div>
      </div>
    )
  }

  // Player detail view
  if (selectedPlayer) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-md">
        <button
          onClick={() => setSelectedPlayer(null)}
          className="text-purple-600 hover:underline mb-4 flex items-center gap-1"
        >
          ← กลับ
        </button>

        {/* Player Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl">
            {selectedPlayer.avatar_id || '👤'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{selectedPlayer.nickname}</h2>
            <p className="text-gray-500">
              เล่นล่าสุด: {selectedPlayer.last_played_at
                ? new Date(selectedPlayer.last_played_at).toLocaleDateString('th-TH')
                : 'ไม่ทราบ'}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{selectedPlayer.total_games_played}</div>
            <div className="text-sm text-purple-800">เกมที่เล่น</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{selectedPlayer.total_score.toLocaleString()}</div>
            <div className="text-sm text-blue-800">คะแนนรวม</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{selectedPlayer.average_accuracy}%</div>
            <div className="text-sm text-green-800">ความแม่นยำ</div>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">
              {selectedPlayer.total_correct_answers}/{selectedPlayer.total_questions_answered}
            </div>
            <div className="text-sm text-orange-800">ตอบถูก</div>
          </div>
        </div>

        {/* Game History */}
        <h3 className="text-lg font-bold mb-4">ประวัติการเล่น</h3>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {gameHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">ไม่มีประวัติการเล่น</div>
          ) : (
            gameHistory.map((game) => (
              <div key={game.id} className="border rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-gray-800">{game.quiz_name}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(game.played_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-purple-600">{game.score}</div>
                    <div className="text-sm text-gray-500">คะแนน</div>
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>✅ {game.correct_answers}/{game.total_questions}</span>
                  <span>📊 {game.accuracy}%</span>
                  {game.rank > 0 && (
                    <span>🏆 อันดับ {game.rank}/{game.total_players}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // Players list view
  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          👥 ติดตามผู้เล่น
          <span className="text-sm font-normal text-gray-500">({players.length} คน)</span>
        </h2>
        <button
          onClick={exportToCSV}
          className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 ค้นหาชื่อผู้เล่น..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="score">เรียงตามคะแนน</option>
          <option value="games">เรียงตามจำนวนเกม</option>
          <option value="accuracy">เรียงตามความแม่นยำ</option>
        </select>
      </div>

      {/* Players Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-gray-600">
              <th className="py-3 px-2">#</th>
              <th className="py-3 px-2">ชื่อ</th>
              <th className="py-3 px-2 text-center">เกม</th>
              <th className="py-3 px-2 text-center">คะแนนรวม</th>
              <th className="py-3 px-2 text-center">ความแม่นยำ</th>
              <th className="py-3 px-2 text-center">เล่นล่าสุด</th>
              <th className="py-3 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  ไม่พบผู้เล่น
                </td>
              </tr>
            ) : (
              filteredPlayers.map((player, index) => (
                <tr key={player.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-2 text-gray-500">{index + 1}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm">
                        {player.avatar_id || '👤'}
                      </div>
                      <span className="font-medium">{player.nickname}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">{player.total_games_played}</td>
                  <td className="py-3 px-2 text-center font-bold text-purple-600">
                    {player.total_score.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`px-2 py-1 rounded text-sm ${
                      player.average_accuracy >= 80 ? 'bg-green-100 text-green-800' :
                      player.average_accuracy >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {player.average_accuracy}%
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center text-sm text-gray-500">
                    {player.last_played_at
                      ? new Date(player.last_played_at).toLocaleDateString('th-TH')
                      : '-'}
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => loadPlayerHistory(player)}
                      className="text-purple-600 hover:underline text-sm"
                    >
                      ดูรายละเอียด
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

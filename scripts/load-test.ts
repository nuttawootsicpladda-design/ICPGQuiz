/**
 * Load Test Script - Simulate 50 players joining and answering quiz
 *
 * Usage:
 *   1. First, create a game from the dashboard and copy the Game ID
 *   2. Run: npx ts-node scripts/load-test.ts <GAME_ID> [NUM_PLAYERS]
 *
 * Example:
 *   npx ts-node scripts/load-test.ts abc123-game-id 50
 */

import { createClient } from '@supabase/supabase-js'

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

// Get command line arguments
const GAME_ID = process.argv[2]
const NUM_PLAYERS = parseInt(process.argv[3]) || 50

if (!GAME_ID) {
  console.error('❌ Usage: npx ts-node scripts/load-test.ts <GAME_ID> [NUM_PLAYERS]')
  console.error('   Example: npx ts-node scripts/load-test.ts abc123 50')
  process.exit(1)
}

console.log(`
╔════════════════════════════════════════════╗
║       🎮 Quiz Load Test Script 🎮          ║
╠════════════════════════════════════════════╣
║  Game ID: ${GAME_ID.substring(0, 20).padEnd(20)}        ║
║  Players: ${String(NUM_PLAYERS).padEnd(20)}        ║
╚════════════════════════════════════════════╝
`)

interface Player {
  id: number
  participantId: string | null
  nickname: string
  supabase: any
  answeredQuestions: Set<string>
}

interface Question {
  id: string
  choices: { id: string; is_correct: boolean }[]
}

const players: Player[] = []
const avatars = ['cat', 'dog', 'rabbit', 'fox', 'bear', 'panda', 'koala', 'lion']

// Create a player with their own Supabase client
async function createPlayer(playerNum: number): Promise<Player> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  return {
    id: playerNum,
    participantId: null,
    nickname: `Tester_${playerNum}`,
    supabase,
    answeredQuestions: new Set()
  }
}

// Register a player to the game
async function registerPlayer(player: Player): Promise<boolean> {
  try {
    // Sign in anonymously
    const { data: authData, error: authError } = await player.supabase.auth.signInAnonymously()
    if (authError) {
      console.error(`❌ Player ${player.id}: Auth failed - ${authError.message}`)
      return false
    }

    const userId = authData.user?.id
    if (!userId) {
      console.error(`❌ Player ${player.id}: No user ID`)
      return false
    }

    // Register as participant
    const { data: participant, error } = await player.supabase
      .from('participants')
      .insert({
        nickname: player.nickname,
        game_id: GAME_ID,
        user_id: userId,
        avatar_id: avatars[player.id % avatars.length]
      })
      .select()
      .single()

    if (error) {
      console.error(`❌ Player ${player.id}: Register failed - ${error.message}`)
      return false
    }

    player.participantId = participant.id
    console.log(`✅ Player ${player.id} registered: ${player.nickname}`)
    return true
  } catch (e) {
    console.error(`❌ Player ${player.id}: Exception - ${e}`)
    return false
  }
}

// Answer a question for a player
async function answerQuestion(player: Player, question: Question): Promise<boolean> {
  if (!player.participantId) return false
  if (player.answeredQuestions.has(question.id)) return false

  try {
    // Pick a random choice (70% chance correct, 30% wrong for realistic simulation)
    const correctChoice = question.choices.find(c => c.is_correct)
    const wrongChoices = question.choices.filter(c => !c.is_correct)

    let selectedChoice: { id: string }
    if (Math.random() < 0.7 && correctChoice) {
      selectedChoice = correctChoice
    } else if (wrongChoices.length > 0) {
      selectedChoice = wrongChoices[Math.floor(Math.random() * wrongChoices.length)]
    } else {
      selectedChoice = question.choices[0]
    }

    // Random delay to simulate real users (0-3 seconds)
    const delay = Math.random() * 3000
    await new Promise(resolve => setTimeout(resolve, delay))

    // Calculate score based on correctness
    const isCorrect = selectedChoice.id === correctChoice?.id
    const timeTaken = Math.floor(Math.random() * 15) + 2 // 2-17 seconds
    const score = isCorrect ? Math.max(500, 1000 - timeTaken * 30) : 0

    const { error } = await player.supabase
      .from('answers')
      .insert({
        participant_id: player.participantId,
        question_id: question.id,
        choice_id: selectedChoice.id,
        score: score,
        time_taken: timeTaken
      })

    if (error) {
      console.error(`❌ Player ${player.id}: Answer failed - ${error.message}`)
      return false
    }

    player.answeredQuestions.add(question.id)
    console.log(`📝 Player ${player.id} answered question`)
    return true
  } catch (e) {
    console.error(`❌ Player ${player.id}: Answer exception - ${e}`)
    return false
  }
}

// Main test function
async function runLoadTest() {
  const startTime = Date.now()

  // Create admin client for fetching game data
  const adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // Verify game exists
  console.log('\n📋 Verifying game...')
  const { data: game, error: gameError } = await adminClient
    .from('games')
    .select('*, quiz_sets(*, questions(*, choices(*)))')
    .eq('id', GAME_ID)
    .single()

  if (gameError || !game) {
    console.error(`❌ Game not found: ${gameError?.message || 'Unknown error'}`)
    process.exit(1)
  }

  const quizSet = (game as any).quiz_sets
  const questions: Question[] = quizSet?.questions || []

  console.log(`✅ Game found: ${quizSet?.name}`)
  console.log(`📝 Questions: ${questions.length}`)

  // Phase 1: Create and register all players
  console.log(`\n🚀 Phase 1: Registering ${NUM_PLAYERS} players...`)

  const registerStart = Date.now()

  // Create players
  for (let i = 1; i <= NUM_PLAYERS; i++) {
    players.push(await createPlayer(i))
  }

  // Register all players in parallel (batches of 5 to avoid rate limit)
  const BATCH_SIZE = 5
  let registeredCount = 0

  for (let i = 0; i < players.length; i += BATCH_SIZE) {
    const batch = players.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(batch.map(p => registerPlayer(p)))
    registeredCount += results.filter(r => r).length

    console.log(`   Progress: ${Math.min(i + BATCH_SIZE, players.length)}/${players.length}`)

    // Longer delay between batches to avoid Auth rate limit (30 req/min for anonymous)
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  const registerTime = Date.now() - registerStart
  console.log(`\n✅ Registration complete: ${registeredCount}/${NUM_PLAYERS} players`)
  console.log(`⏱️  Time: ${(registerTime / 1000).toFixed(2)}s`)

  // Phase 2: Wait for game to start and answer questions
  console.log('\n⏳ Phase 2: Waiting for host to start game...')
  console.log('   (Start the game from the host dashboard)')

  // Subscribe to game updates
  const gameChannel = adminClient
    .channel('load-test-game')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${GAME_ID}`
      },
      async (payload) => {
        const updatedGame = payload.new as any

        if (updatedGame.phase === 'quiz') {
          const currentQuestion = questions[updatedGame.current_question_sequence]

          if (currentQuestion && !updatedGame.is_answer_revealed) {
            console.log(`\n❓ Question ${updatedGame.current_question_sequence + 1}: Answering...`)

            // All players answer in parallel (with random delays built-in)
            const answerPromises = players
              .filter(p => p.participantId)
              .map(p => answerQuestion(p, currentQuestion))

            const results = await Promise.all(answerPromises)
            const answeredCount = results.filter(r => r).length
            console.log(`✅ ${answeredCount} players answered`)
          }
        }

        if (updatedGame.phase === 'result') {
          console.log('\n🏆 Game finished!')

          // Fetch final results
          const { data: results } = await adminClient
            .from('game_results')
            .select()
            .eq('game_id', GAME_ID)
            .order('total_score', { ascending: false })
            .limit(10)

          if (results) {
            console.log('\n📊 Top 10 Leaderboard:')
            results.forEach((r, i) => {
              console.log(`   ${i + 1}. ${r.nickname}: ${r.total_score} pts`)
            })
          }

          const totalTime = Date.now() - startTime
          console.log(`\n⏱️  Total test time: ${(totalTime / 1000).toFixed(2)}s`)

          // Cleanup
          adminClient.removeChannel(gameChannel)
          process.exit(0)
        }
      }
    )
    .subscribe()

  // Keep script running
  console.log('\n🎮 Test is running. Press Ctrl+C to stop.')
}

// Run the test
runLoadTest().catch(console.error)

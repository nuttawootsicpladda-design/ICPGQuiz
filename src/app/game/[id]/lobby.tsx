import { Participant, supabase } from '@/types/types'
import { on } from 'events'
import { FormEvent, useEffect, useState } from 'react'
import AvatarPicker from '@/components/AvatarPicker'
import { getRandomAvatar } from '@/utils/avatars'

export default function Lobby({
  gameId,
  onRegisterCompleted,
}: {
  gameId: string
  onRegisterCompleted: (participant: Participant) => void
}) {
  const [participant, setParticipant] = useState<Participant | null>(null)

  useEffect(() => {
    const fetchParticipant = async () => {
      let userId: string | null = null

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession()

      if (sessionData.session) {
        userId = sessionData.session?.user.id ?? null
      } else {
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error) console.error(error)
        userId = data?.user?.id ?? null
      }

      if (!userId) {
        return
      }

      const { data: participantData, error } = await supabase
        .from('participants')
        .select()
        .eq('game_id', gameId)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        return alert(error.message)
      }

      if (participantData) {
        setParticipant(participantData)
        onRegisterCompleted(participantData)
      }
    }

    fetchParticipant()
  }, [gameId, onRegisterCompleted])

  return (
    <div
      className="flex justify-center items-center min-h-screen bg-cover bg-center bg-no-repeat px-4 py-8"
      style={{ backgroundImage: "url('/BGlobby.jpg')" }}
    >
      <div className="bg-white bg-opacity-95 p-6 sm:p-8 md:p-12 rounded-2xl shadow-2xl backdrop-blur-lg w-full max-w-md">
        {!participant && (
          <Register
            gameId={gameId}
            onRegisterCompleted={(participant) => {
              onRegisterCompleted(participant)
              setParticipant(participant)
            }}
          />
        )}

        {participant && (
          <div className="text-gray-800 w-full">
            <h1 className="text-2xl sm:text-3xl pb-4 font-bold text-orange-600">Welcome {participant.nickname}！</h1>
            <p className="text-base sm:text-lg">
              You have been registered and your nickname should show up on the
              admin screen. Please sit back and wait until the game master
              starts the game.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Register({
  onRegisterCompleted,
  gameId,
}: {
  onRegisterCompleted: (player: Participant) => void
  gameId: string
}) {
  const [nickname, setNickname] = useState('')
  const [avatarId, setAvatarId] = useState('cat') // Fixed default to prevent hydration mismatch
  const [sending, setSending] = useState(false)

  // Set random avatar only on client side after mounting
  useEffect(() => {
    setAvatarId(getRandomAvatar().id)
  }, [])

  const onFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSending(true)

    if (!nickname) {
      setSending(false)
      return
    }

    // Ensure we have a session before inserting
    let userId: string | null = null
    const { data: sessionData } = await supabase.auth.getSession()

    if (sessionData.session) {
      userId = sessionData.session.user.id
    } else {
      // Sign in anonymously if no session
      const { data, error: authError } = await supabase.auth.signInAnonymously()
      if (authError) {
        console.error('Auth error:', authError)
        alert('Failed to authenticate. Please try again.')
        setSending(false)
        return
      }
      userId = data?.user?.id ?? null
    }

    if (!userId) {
      alert('Failed to get user ID. Please refresh and try again.')
      setSending(false)
      return
    }

    // Insert participant with explicit user_id and avatar_id
    const { data: participant, error } = await supabase
      .from('participants')
      .insert({
        nickname,
        game_id: gameId,
        user_id: userId,
        avatar_id: avatarId
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      setSending(false)
      return alert(error.message)
    }

    onRegisterCompleted(participant)
  }

  return (
    <form onSubmit={(e) => onFormSubmit(e)} className="space-y-4 sm:space-y-5">
      {/* Avatar Picker */}
      <div>
        <label className="block text-orange-600 text-sm sm:text-base font-bold mb-2">
          Choose your avatar
        </label>
        <AvatarPicker
          selectedAvatarId={avatarId}
          onSelect={setAvatarId}
        />
      </div>

      {/* Nickname Input */}
      <div>
        <label className="block text-orange-600 text-sm sm:text-base font-bold mb-2">
          Enter your nickname
        </label>
        <input
          className="p-3 sm:p-4 w-full border-2 border-orange-300 rounded-lg text-gray-800 text-base focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          type="text"
          value={nickname}
          onChange={(val) => setNickname(val.currentTarget.value)}
          placeholder="Your nickname"
          maxLength={20}
          required
        />
      </div>

      {/* Join Button */}
      <button
        disabled={sending}
        className="w-full py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 disabled:bg-gray-400 text-white font-bold text-base sm:text-lg rounded-lg transition-all shadow-lg disabled:opacity-50 active:scale-95"
      >
        {sending ? 'Joining...' : 'Join Game 🎮'}
      </button>
    </form>
  )
}

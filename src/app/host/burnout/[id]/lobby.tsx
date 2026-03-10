'use client'

import { Participant, supabase } from '@/types/types'
import { useQRCode } from 'next-qrcode'
import { useEffect, useRef, useState } from 'react'
import { playSound } from '@/utils/sounds'
import { AvatarDisplay } from '@/components/AvatarPicker'

export default function BurnoutLobby({
  participants: allParticipants,
  gameId,
}: {
  participants: Participant[]
  gameId: string
}) {
  const { Canvas } = useQRCode()
  const [hostUserId, setHostUserId] = useState<string>('')
  const [isQRExpanded, setIsQRExpanded] = useState(false)

  const participants = allParticipants.filter((p) => (p as any).user_id !== hostUserId)
  const previousParticipantCount = useRef(participants.length)

  useEffect(() => {
    const getHostUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setHostUserId(user.id)
    }
    getHostUserId()
  }, [])

  useEffect(() => {
    if (participants.length > previousParticipantCount.current) {
      playSound('join')
    }
    previousParticipantCount.current = participants.length
  }, [participants.length])

  const onStartSurvey = async () => {
    playSound('start')
    const { error } = await supabase
      .from('games')
      .update({ phase: 'result' } as any)
      .eq('id', gameId)
    if (error) {
      alert(error.message)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 px-4 py-8">
      <div className="flex flex-col lg:flex-row justify-center gap-6 m-auto bg-white bg-opacity-95 backdrop-blur-lg p-6 sm:p-8 rounded-2xl shadow-2xl border-2 sm:border-4 border-orange-400 w-full max-w-5xl">
        {/* Left Column: Players List */}
        <div className="w-full lg:w-80 xl:w-96">
          <h2 className="text-2xl sm:text-3xl font-bold text-orange-600 mb-2">
            R U OK ?
          </h2>
          <p className="text-gray-500 text-sm mb-4">รอผู้เข้าร่วมสแกน QR Code...</p>

          <div className="text-gray-700 text-center mb-4 sm:mb-6 bg-orange-100 py-5 rounded-lg">
            <p className="text-4xl sm:text-5xl font-bold text-orange-600 mb-1">
              {participants.length}
            </p>
            <p className="text-lg sm:text-xl font-semibold">
              คนเข้าร่วมแล้ว
            </p>
          </div>

          <button
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 py-3 sm:py-4 px-8 sm:px-12 text-white font-bold text-lg sm:text-xl rounded-lg hover:from-orange-600 hover:to-red-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            onClick={onStartSurvey}
            disabled={participants.length === 0}
          >
            {participants.length === 0
              ? 'รอผู้เข้าร่วม...'
              : 'เริ่มแบบประเมิน 🔥'}
          </button>
        </div>

        {/* Middle Column: QR Code */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl border-2 sm:border-4 border-yellow-400">
          <p className="text-center font-bold text-orange-600 text-lg sm:text-xl mb-3 sm:mb-4">
            📱 สแกนเพื่อเข้าร่วม!
          </p>
          <div
            className="flex justify-center cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setIsQRExpanded(true)}
            title="คลิกเพื่อขยาย QR Code"
          >
            <Canvas
              text={`${typeof window !== 'undefined' ? window.location.origin : ''}/game/${gameId}`}
              options={{
                errorCorrectionLevel: 'M',
                margin: 3,
                scale: 4,
                width:
                  typeof window !== 'undefined' && window.innerWidth < 640
                    ? 200
                    : 250,
              }}
            />
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">คลิกเพื่อขยาย</p>
          <p className="text-center text-xs sm:text-sm text-gray-700 mt-2 sm:mt-3 font-semibold">
            Or go to:{' '}
            <span className="text-orange-600">
              {typeof window !== 'undefined' ? window.location.host : ''}
            </span>
          </p>
          <p className="text-center text-xs text-gray-500 mt-1">
            Game PIN:{' '}
            <span className="font-mono font-bold text-orange-600">
              {gameId.slice(0, 6)}...
            </span>
          </p>
        </div>

        {/* QR Code Expanded Modal */}
        {isQRExpanded && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            onClick={() => setIsQRExpanded(false)}
          >
            <div
              className="bg-white p-8 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-center font-bold text-orange-600 text-2xl mb-6">
                📱 สแกนเพื่อเข้าร่วม!
              </p>
              <div className="flex justify-center">
                <Canvas
                  text={`${typeof window !== 'undefined' ? window.location.origin : ''}/game/${gameId}`}
                  options={{
                    errorCorrectionLevel: 'M',
                    margin: 3,
                    scale: 4,
                    width: 400,
                  }}
                />
              </div>
              <p className="text-center text-lg text-gray-700 mt-6 font-semibold">
                Or go to:{' '}
                <span className="text-orange-600">
                  {typeof window !== 'undefined' ? window.location.host : ''}
                </span>
              </p>
              <p className="text-center text-base text-gray-500 mt-2">
                Game PIN:{' '}
                <span className="font-mono font-bold text-orange-600 text-xl">
                  {gameId.slice(0, 6)}...
                </span>
              </p>
              <button
                className="mt-6 w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition"
                onClick={() => setIsQRExpanded(false)}
              >
                ปิด
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

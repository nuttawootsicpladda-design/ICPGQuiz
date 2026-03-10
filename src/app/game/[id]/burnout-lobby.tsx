'use client'

import { Participant } from '@/types/types'

export default function BurnoutLobbyPlayer({
  participant,
  isAnonymous = false,
}: {
  participant: Participant
  isAnonymous?: boolean
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md w-full">
        <div className="text-5xl mb-4">🔥</div>
        {!isAnonymous && (
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            สวัสดี {participant.nickname}!
          </h2>
        )}
        <p className="text-gray-600 mb-6">
          คุณเข้าร่วมแบบประเมิน R U O K แล้ว
        </p>
        <div className="bg-orange-50 rounded-xl p-5">
          <div className="text-3xl mb-2 animate-bounce">⏳</div>
          <p className="text-orange-700 font-medium">
            รอผู้จัดเริ่มแบบประเมิน...
          </p>
        </div>
      </div>
    </div>
  )
}

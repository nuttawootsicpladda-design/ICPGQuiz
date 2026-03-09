'use client'

import { Participant } from '@/types/types'

export default function BurnoutComplete({
  participant,
}: {
  participant: Participant
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md w-full">
        <div className="text-5xl mb-4">🙏</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          ขอบคุณ {participant.nickname}!
        </h2>
        <p className="text-gray-600 mb-4">คำตอบของคุณถูกบันทึกเรียบร้อยแล้ว</p>
        <p className="text-gray-500 text-sm">
          องค์กรให้ความสำคัญกับสุขภาพจิตของคุณ ❤️
        </p>
      </div>
    </div>
  )
}

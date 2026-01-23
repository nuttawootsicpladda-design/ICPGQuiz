'use client'

import { useRef } from 'react'

interface CertificateProps {
  nickname: string
  quizName: string
  score: number
  correctAnswers: number
  totalQuestions: number
  percentage: number
  certificateNumber?: string
  issuedDate?: string
  onClose: () => void
}

export default function Certificate({
  nickname,
  quizName,
  score,
  correctAnswers,
  totalQuestions,
  percentage,
  certificateNumber,
  issuedDate,
  onClose,
}: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null)

  const currentDate = issuedDate || new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const certNumber = certificateNumber || `CERT-${Date.now().toString(36).toUpperCase()}`

  const downloadCertificate = async () => {
    if (!certificateRef.current) return

    try {
      // Use html2canvas if available, otherwise just print
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      })

      const link = document.createElement('a')
      link.download = `certificate-${nickname}-${quizName}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      // Fallback to print
      window.print()
    }
  }

  const shareCertificate = async () => {
    const shareData = {
      title: 'ใบรับรอง ICPG Quiz',
      text: `🏆 ${nickname} ผ่านการทดสอบ "${quizName}" ด้วยคะแนน ${percentage}%!`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(
          `🏆 ${nickname} ผ่านการทดสอบ "${quizName}" ด้วยคะแนน ${percentage}%!\n${window.location.href}`
        )
        alert('คัดลอกลิงก์แล้ว!')
      }
    } catch (e) {
      console.error('Share failed:', e)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="max-w-4xl w-full">
        {/* Certificate */}
        <div
          ref={certificateRef}
          className="bg-white rounded-lg overflow-hidden shadow-2xl"
          style={{ aspectRatio: '1.414/1' }}
        >
          {/* Border Frame */}
          <div className="h-full p-4 sm:p-8 bg-gradient-to-br from-amber-50 to-orange-50">
            <div className="h-full border-8 border-double border-amber-600 rounded-lg p-4 sm:p-8 relative">
              {/* Corner Decorations */}
              <div className="absolute top-2 left-2 text-amber-600 text-2xl sm:text-4xl">✦</div>
              <div className="absolute top-2 right-2 text-amber-600 text-2xl sm:text-4xl">✦</div>
              <div className="absolute bottom-2 left-2 text-amber-600 text-2xl sm:text-4xl">✦</div>
              <div className="absolute bottom-2 right-2 text-amber-600 text-2xl sm:text-4xl">✦</div>

              <div className="h-full flex flex-col items-center justify-center text-center">
                {/* Header */}
                <div className="text-amber-600 text-lg sm:text-2xl font-serif tracking-widest mb-2">
                  CERTIFICATE OF COMPLETION
                </div>
                <div className="text-gray-600 text-sm sm:text-lg mb-4 sm:mb-6">ใบรับรองการผ่านการทดสอบ</div>

                {/* Trophy Icon */}
                <div className="text-5xl sm:text-7xl mb-4 sm:mb-6">🏆</div>

                {/* Recipient */}
                <div className="text-gray-600 text-sm sm:text-base mb-1">ขอมอบให้แก่</div>
                <div className="text-2xl sm:text-4xl font-bold text-gray-800 mb-4 sm:mb-6 font-serif">
                  {nickname}
                </div>

                {/* Quiz Name */}
                <div className="text-gray-600 text-sm sm:text-base mb-1">สำหรับการผ่านการทดสอบ</div>
                <div className="text-xl sm:text-2xl font-bold text-ci-700 mb-4 sm:mb-6">
                  &quot;{quizName}&quot;
                </div>

                {/* Stats */}
                <div className="flex gap-4 sm:gap-8 mb-4 sm:mb-6">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">{percentage}%</div>
                    <div className="text-xs sm:text-sm text-gray-500">คะแนน</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">{correctAnswers}/{totalQuestions}</div>
                    <div className="text-xs sm:text-sm text-gray-500">ตอบถูก</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-ci">{score}</div>
                    <div className="text-xs sm:text-sm text-gray-500">คะแนนรวม</div>
                  </div>
                </div>

                {/* Seal */}
                <div className="relative mb-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <div className="text-white text-2xl sm:text-3xl">✓</div>
                  </div>
                </div>

                {/* Date & Certificate Number */}
                <div className="text-gray-500 text-xs sm:text-sm">
                  <div>วันที่ออกใบรับรอง: {currentDate}</div>
                  <div className="font-mono text-xs mt-1">{certNumber}</div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-amber-300 w-full">
                  <div className="text-ci font-bold text-sm sm:text-lg">ICPG Quiz</div>
                  <div className="text-gray-500 text-xs">Powered by Supabase</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <button
            onClick={downloadCertificate}
            className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition flex items-center justify-center gap-2"
          >
            📥 ดาวน์โหลด
          </button>
          <button
            onClick={shareCertificate}
            className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition flex items-center justify-center gap-2"
          >
            📤 แชร์
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-600 transition"
          >
            ✕ ปิด
          </button>
        </div>
      </div>
    </div>
  )
}

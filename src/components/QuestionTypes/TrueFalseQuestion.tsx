'use client'

import { useState } from 'react'

interface TrueFalseQuestionProps {
  question: string
  correctAnswer: boolean
  onAnswer: (isCorrect: boolean, answer: boolean) => void
  disabled?: boolean
  showResult?: boolean
  selectedAnswer?: boolean | null
  timeLimit?: number
}

export default function TrueFalseQuestion({
  question,
  correctAnswer,
  onAnswer,
  disabled = false,
  showResult = false,
  selectedAnswer = null,
  timeLimit,
}: TrueFalseQuestionProps) {
  const [selected, setSelected] = useState<boolean | null>(selectedAnswer)

  const handleSelect = (answer: boolean) => {
    if (disabled) return
    setSelected(answer)
    onAnswer(answer === correctAnswer, answer)
  }

  const getButtonStyle = (value: boolean) => {
    const baseStyle = 'flex-1 py-8 sm:py-12 rounded-2xl font-bold text-2xl sm:text-4xl transition-all transform'

    if (showResult) {
      if (value === correctAnswer) {
        return `${baseStyle} bg-green-500 text-white scale-105 ring-4 ring-green-300`
      }
      if (selected === value && value !== correctAnswer) {
        return `${baseStyle} bg-red-500 text-white opacity-75`
      }
      return `${baseStyle} bg-gray-300 text-gray-600 opacity-50`
    }

    if (selected === value) {
      return `${baseStyle} ${value ? 'bg-green-500' : 'bg-red-500'} text-white scale-105 ring-4 ring-white/50`
    }

    return `${baseStyle} ${value ? 'bg-green-400 hover:bg-green-500' : 'bg-red-400 hover:bg-red-500'} text-white hover:scale-105`
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Question */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 mb-6 shadow-lg">
        <p className="text-xl sm:text-2xl font-bold text-gray-800 text-center">
          {question}
        </p>
      </div>

      {/* True/False Buttons */}
      <div className="flex gap-4 sm:gap-6">
        <button
          onClick={() => handleSelect(true)}
          disabled={disabled}
          className={getButtonStyle(true)}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-4xl sm:text-6xl">O</span>
            <span className="text-lg sm:text-xl">ถูก</span>
          </div>
        </button>

        <button
          onClick={() => handleSelect(false)}
          disabled={disabled}
          className={getButtonStyle(false)}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-4xl sm:text-6xl">X</span>
            <span className="text-lg sm:text-xl">ผิด</span>
          </div>
        </button>
      </div>

      {/* Result Message */}
      {showResult && selected !== null && (
        <div className={`mt-6 p-4 rounded-xl text-center ${
          selected === correctAnswer
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          <p className="text-xl font-bold">
            {selected === correctAnswer ? '🎉 ถูกต้อง!' : '❌ ผิด!'}
          </p>
          <p className="mt-1">
            คำตอบที่ถูกต้องคือ: <strong>{correctAnswer ? 'ถูก (O)' : 'ผิด (X)'}</strong>
          </p>
        </div>
      )}
    </div>
  )
}

import { TIME_TIL_CHOICE_REVEAL } from '@/constants'
import { Answer, Participant, Question, QuizSet, supabase } from '@/types/types'
import { useEffect, useRef, useState } from 'react'
import { CountdownCircleTimer } from 'react-countdown-circle-timer'
import { getThemeById, DEFAULT_THEME, getAnswerButtonClass } from '@/utils/themes'

export default function Quiz({
  question: question,
  questionCount: questionCount,
  gameId,
  participants,
  quizSet,
}: {
  question: Question
  questionCount: number
  gameId: string
  participants: Participant[]
  quizSet: QuizSet
}) {
  const theme = getThemeById((quizSet as any).theme_id) || DEFAULT_THEME
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)

  const [hasShownChoices, setHasShownChoices] = useState(false)

  const [answers, setAnswers] = useState<Answer[]>([])

  const [countdown, setCountdown] = useState<number | null>(null)

  const answerStateRef = useRef<Answer[]>()
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  answerStateRef.current = answers

  const getNextQuestion = async () => {
    var updateData
    if (questionCount == question.order + 1) {
      updateData = { phase: 'result' }
    } else {
      updateData = {
        current_question_sequence: question.order + 1,
        is_answer_revealed: false,
      }
    }

    const { data, error } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', gameId)
    if (error) {
      return alert(error.message)
    }
  }

  const onTimeUp = async () => {
    setIsAnswerRevealed(true)
    await supabase
      .from('games')
      .update({
        is_answer_revealed: true,
      })
      .eq('id', gameId)

    // Start auto-advance countdown
    const autoAdvanceTime = (quizSet as any).auto_advance_time || 0
    if (autoAdvanceTime > 0) {
      setCountdown(autoAdvanceTime)
    }
  }

  // Countdown and auto-advance effect
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            // Time's up! Auto-advance to next question
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current)
            }
            getNextQuestion()
            return null
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
        }
      }
    }
  }, [countdown])

  useEffect(() => {
    setIsAnswerRevealed(false)
    setHasShownChoices(false)
    setAnswers([])
    setCountdown(null)

    // Clear any existing countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }

    setTimeout(() => {
      setHasShownChoices(true)
    }, TIME_TIL_CHOICE_REVEAL)

    const channel = supabase
      .channel('answers')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',
          filter: `question_id=eq.${question.id}`,
        },
        (payload) => {
          setAnswers((currentAnswers) => {
            return [...currentAnswers, payload.new as Answer]
          })

          if (
            (answerStateRef.current?.length ?? 0) + 1 ===
            participants.length
          ) {
            onTimeUp()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [question.id])

  return (
    <div className={`h-screen flex flex-col items-stretch ${theme.gameBg} relative`}>
      <div className="absolute right-2 sm:right-4 top-2 sm:top-4 flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 z-10">
        {isAnswerRevealed && countdown !== null && countdown > 0 && (
          <div className="bg-purple-600 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-lg font-bold text-sm sm:text-base md:text-lg flex items-center gap-2">
            <span>⏱️</span>
            <span>{countdown}s</span>
          </div>
        )}
        {isAnswerRevealed && (
          <button
            className="px-3 sm:px-4 py-1 sm:py-2 bg-white text-black font-semibold text-sm sm:text-base rounded-lg hover:bg-gray-200 transition shadow-lg active:scale-95"
            onClick={() => {
              // Clear countdown and go to next
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current)
              }
              setCountdown(null)
              getNextQuestion()
            }}
          >
            {countdown !== null && countdown > 0 ? 'Skip ⏭️' : 'Next ➡️'}
          </button>
        )}
      </div>

      <div className="text-center px-4 py-4">
        <h2 className="pb-3 sm:pb-4 text-lg sm:text-2xl md:text-3xl lg:text-4xl bg-white font-bold mx-4 sm:mx-12 md:mx-24 my-6 sm:my-8 md:my-12 p-3 sm:p-4 rounded inline-block max-w-full">
          {question.body}
        </h2>
      </div>

      <div className="flex-grow text-white px-4 sm:px-8">
        {hasShownChoices && !isAnswerRevealed && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-3xl sm:text-4xl md:text-5xl">
              <CountdownCircleTimer
                onComplete={() => {
                  onTimeUp()
                }}
                isPlaying
                duration={20}
                colors={['#004777', '#F7B801', '#A30000', '#A30000']}
                colorsTime={[7, 5, 2, 0]}
              >
                {({ remainingTime }) => remainingTime}
              </CountdownCircleTimer>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl md:text-6xl pb-2 sm:pb-4 font-bold">{answers.length}</div>
              <div className="text-xl sm:text-2xl md:text-3xl">Answers</div>
            </div>
          </div>
        )}
        {isAnswerRevealed && (
          <div className="flex justify-center gap-1 sm:gap-2">
            {question.choices.map((choice, index) => (
              <div
                key={choice.id}
                className="mx-0.5 sm:mx-1 md:mx-2 h-32 sm:h-40 md:h-48 w-16 sm:w-20 md:w-24 flex flex-col items-stretch justify-end"
              >
                <div className="flex-grow relative">
                  <div
                    style={{
                      height: `${
                        (answers.filter(
                          (answer) => answer.choice_id === choice.id
                        ).length *
                          100) /
                        (answers.length || 1)
                      }%`,
                    }}
                    className={`absolute bottom-0 left-0 right-0 mb-1 rounded-t ${getAnswerButtonClass(index, (quizSet as any).theme_id).split(' ')[0]}`}
                  ></div>
                </div>
                <div
                  className={`mt-1 text-white text-sm sm:text-base md:text-lg text-center py-1 sm:py-2 rounded-b ${getAnswerButtonClass(index, (quizSet as any).theme_id).split(' ')[0]}`}
                >
                  {
                    answers.filter((answer) => answer.choice_id === choice.id)
                      .length
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {hasShownChoices && (
        <div className="flex justify-between flex-wrap p-2 sm:p-4">
          {question.choices.map((choice, index) => (
            <div key={choice.id} className="w-1/2 p-1">
              <div
                className={`px-2 sm:px-4 py-3 sm:py-6 w-full text-sm sm:text-lg md:text-xl lg:text-2xl rounded font-bold text-white flex justify-between
                ${getAnswerButtonClass(index, (quizSet as any).theme_id)}
                ${isAnswerRevealed && !choice.is_correct ? 'opacity-60' : ''}
               `}
              >
                <div className="truncate pr-2">{choice.body}</div>
                {isAnswerRevealed && (
                  <div className="flex-shrink-0">
                    {choice.is_correct && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={5}
                        stroke="currentColor"
                        className="w-4 h-4 sm:w-6 sm:h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 12.75 6 6 9-13.5"
                        />
                      </svg>
                    )}
                    {!choice.is_correct && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={5}
                        stroke="currentColor"
                        className="w-4 h-4 sm:w-6 sm:h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18 18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex text-white py-2 sm:py-3 px-4 items-center bg-black">
        <div className="text-lg sm:text-xl md:text-2xl font-bold">
          {question.order + 1}/{questionCount}
        </div>
      </div>
    </div>
  )
}

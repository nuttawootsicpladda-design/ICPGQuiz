// Export all question types
export { default as TrueFalseQuestion } from './TrueFalseQuestion'
export { default as PollQuestion } from './PollQuestion'
export { default as OpenEndedQuestion } from './OpenEndedQuestion'
export { default as BrainstormQuestion } from './BrainstormQuestion'

// Question type constants
export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  POLL: 'poll',
  OPEN_ENDED: 'open_ended',
  WORD_CLOUD: 'word_cloud',
  BRAINSTORM: 'brainstorm',
} as const

export type QuestionType = typeof QUESTION_TYPES[keyof typeof QUESTION_TYPES]

// Question type labels (Thai)
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  [QUESTION_TYPES.MULTIPLE_CHOICE]: 'ปรนัย (หลายตัวเลือก)',
  [QUESTION_TYPES.TRUE_FALSE]: 'ถูก/ผิด',
  [QUESTION_TYPES.POLL]: 'โพล (ไม่มีคำตอบถูกผิด)',
  [QUESTION_TYPES.OPEN_ENDED]: 'อัตนัย (ตอบเอง)',
  [QUESTION_TYPES.WORD_CLOUD]: 'Word Cloud',
  [QUESTION_TYPES.BRAINSTORM]: 'ระดมสมอง',
}

// Question type icons
export const QUESTION_TYPE_ICONS: Record<QuestionType, string> = {
  [QUESTION_TYPES.MULTIPLE_CHOICE]: '🔘',
  [QUESTION_TYPES.TRUE_FALSE]: '⭕',
  [QUESTION_TYPES.POLL]: '📊',
  [QUESTION_TYPES.OPEN_ENDED]: '✍️',
  [QUESTION_TYPES.WORD_CLOUD]: '☁️',
  [QUESTION_TYPES.BRAINSTORM]: '💡',
}

// Helper to determine if question type has correct answer
export const hasCorrectAnswer = (type: QuestionType): boolean => {
  const scoredTypes: QuestionType[] = [QUESTION_TYPES.MULTIPLE_CHOICE, QUESTION_TYPES.TRUE_FALSE]
  return scoredTypes.includes(type)
}

// Helper to determine if question type needs manual scoring
export const needsManualScoring = (type: QuestionType): boolean => {
  const manualTypes: QuestionType[] = [QUESTION_TYPES.OPEN_ENDED]
  return manualTypes.includes(type)
}

// Helper to determine if question type is interactive
export const isInteractive = (type: QuestionType): boolean => {
  const interactiveTypes: QuestionType[] = [
    QUESTION_TYPES.POLL,
    QUESTION_TYPES.WORD_CLOUD,
    QUESTION_TYPES.BRAINSTORM,
  ]
  return interactiveTypes.includes(type)
}

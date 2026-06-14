import { useEffect } from 'react'
import useExamStore from '../store/examStore'

export default function useKeyboardNav() {
  const {
    currentQuestionIndex, currentQuestions, isQuizActive,
    setCurrentQuestionIndex, saveAnswer, toggleFlag, submitQuiz, userAnswers,
  } = useExamStore()

  useEffect(() => {
    if (!isQuizActive) return

    function handleKeyDown(e) {
      // Don't handle if typing in textarea
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
        if (e.key === 'Escape') {
          e.target.blur()
        }
        return
      }

      const question = currentQuestions[currentQuestionIndex]
      if (!question) return

      switch (e.key) {
        // MCQ number shortcuts
        case '1': case '2': case '3': case '4': {
          if (question.type === 'multiple-choice' && question.options) {
            const idx = parseInt(e.key) - 1
            if (idx < question.options.length) {
              const val = question.options[idx]
              saveAnswer({
                question: question.question,
                category: question.category || question.lesson || 'General',
                correctAnswer: question.answer,
                userAnswer: val,
                hintsUsed: userAnswers[currentQuestionIndex]?.hintsUsed || 0,
              })
              e.preventDefault()
            }
          }
          break
        }
        // Previous / Next
        case 'ArrowLeft':
        case 'p':
        case 'P': {
          if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1)
          }
          e.preventDefault()
          break
        }
        case 'ArrowRight':
        case 'n':
        case 'N': {
          if (currentQuestionIndex < currentQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1)
          }
          e.preventDefault()
          break
        }
        // Flag
        case 'f':
        case 'F': {
          e.preventDefault()
          toggleFlag()
          break
        }
        // Submit
        case 's':
        case 'S': {
          if (currentQuestionIndex === currentQuestions.length - 1) {
            e.preventDefault()
            submitQuiz()
          }
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isQuizActive, currentQuestionIndex, currentQuestions, saveAnswer, toggleFlag, submitQuiz, setCurrentQuestionIndex, userAnswers])
}

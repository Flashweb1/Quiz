import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Home } from 'lucide-react'
import useExamStore from '../store/examStore'
import Timer from '../components/Timer'
import TrustScore from '../components/TrustScore'
import FlagButton from '../components/FlagButton'
import QuestionCard from '../components/QuestionCard'
import QuestionNav from '../components/QuestionNav'
import ProctoringOverlay from '../components/ProctoringOverlay'
import { setupAntiCheat } from '../lib/antiCheat'
import useKeyboardNav from '../hooks/useKeyboardNav'

export default function Exam({ onSubmit }) {
  const { currentQuestions, currentQuestionIndex, isQuizActive, setCurrentQuestionIndex, submitQuiz, trustScore, userAnswers, saveState, quizStatus } = useExamStore()

  useKeyboardNav()
  const antiCheatRef = useRef(null)

  useEffect(() => {
    if (!isQuizActive) return
    const interval = setInterval(() => saveState(), 5000)
    return () => clearInterval(interval)
  }, [isQuizActive])

  useEffect(() => {
    return () => { if (useExamStore.getState().isQuizActive) saveState() }
  }, [])

  useEffect(() => {
    if (!isQuizActive) return
    const ac = setupAntiCheat(
      (type, details) => { useExamStore.setState(s => ({ cheatWarnings: s.cheatWarnings + 1 })); trustScore.addViolation(type, details) },
      { maxTabSwitches: 3, autoSubmitAfterMax: true, onAutoSubmit: () => submitQuiz() }
    )
    ac.start()
    ac.requestFullscreen()
    antiCheatRef.current = ac
    return () => ac.stop()
  }, [isQuizActive])

  useEffect(() => { if (quizStatus === 'submitted') onSubmit?.() }, [quizStatus])

  if (quizStatus === 'submitted') return null

  const total = currentQuestions.length
  const answeredCount = userAnswers.filter(a => a?.userAnswer?.trim()).length

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-full sm:max-w-7xl mx-auto px-2 sm:px-4 py-2">
          <div className="flex items-center justify-between gap-1 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
              <span className="text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent whitespace-nowrap">Quizzer</span>
              <span className="hidden sm:inline text-slate-700 text-sm">|</span>
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium whitespace-nowrap">{answeredCount}/{total}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <ProctoringOverlay />
              <TrustScore />
              <Timer />
            </div>
          </div>
          <div className="mt-1.5 h-1 rounded-full bg-slate-800/50 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
              style={{ width: `${(answeredCount / total) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex max-w-full sm:max-w-7xl mx-auto w-full px-2 sm:px-4 py-3 sm:py-6 gap-4 sm:gap-6">
        {/* Desktop sidebar */}
        <div className="hidden lg:block w-56 xl:w-64 flex-shrink-0">
          <div className="sticky top-20 bg-slate-900/60 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-4">
            <QuestionNav />
          </div>
        </div>

        {/* Question area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
                  Question {currentQuestionIndex + 1} of {total}
                </span>
                <FlagButton />
              </div>

              <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/50 ring-1 ring-slate-800/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
                <QuestionCard />
              </div>

              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <button onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 text-xs sm:text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700/60 cursor-pointer">
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Previous</span>
                </button>
                <button onClick={() => currentQuestionIndex === total - 1 ? submitQuiz() : setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer">
                  {currentQuestionIndex === total - 1 ? 'Submit Quiz' : 'Next'}
                  {currentQuestionIndex < total - 1 && <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>

              {/* Mobile nav */}
              <div className="lg:hidden mt-4">
                <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-3 sm:p-4">
                  <QuestionNav compact />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

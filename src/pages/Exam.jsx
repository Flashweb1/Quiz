import { useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Send } from 'lucide-react'
import useExamStore from '../store/examStore'
import Timer from '../components/Timer'
import TrustScore from '../components/TrustScore'
import FlagButton from '../components/FlagButton'
import QuestionCard from '../components/QuestionCard'
import QuestionNav from '../components/QuestionNav'
import ProctoringOverlay from '../components/ProctoringOverlay'
import { setupAntiCheat } from '../lib/antiCheat'
import useKeyboardNav from '../hooks/useKeyboardNav'

export default function Exam() {
  const navigate = useNavigate()
  const {
    currentQuestions, currentQuestionIndex, isQuizActive, examConfig,
    setCurrentQuestionIndex, submitQuiz, trustScore, userAnswers, saveState, quizStatus,
  } = useExamStore()

  const isNoScore = examConfig?.scoring?.type === 'none'
  const hasTimer = (examConfig?.duration || 0) > 0
  const hasProctoring = examConfig?.proctoring?.tabSwitchDetection || false
  const navigation = examConfig?.navigation || 'free'
  const isLockedNav = navigation === 'locked'
  const isSequential = navigation === 'sequential'
  const showQuestionNav = !isSequential
  const submitLabel = isNoScore ? 'Submit Survey' : 'Submit Quiz'

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
    if (!isQuizActive || !hasProctoring) return
    const proctoringCfg = examConfig.proctoring
    const ac = setupAntiCheat(
      (type, details) => {
        useExamStore.setState(s => ({ cheatWarnings: s.cheatWarnings + 1 }))
        trustScore.addViolation(type, details)
      },
      {
        maxTabSwitches: proctoringCfg.maxTabSwitches || 3,
        autoSubmitAfterMax: proctoringCfg.autoSubmitAfterMax || false,
        onAutoSubmit: () => submitQuiz(),
      }
    )
    ac.start()
    if (proctoringCfg.fullscreenEnforcement) ac.requestFullscreen()
    antiCheatRef.current = ac
    return () => ac.stop()
  }, [isQuizActive, hasProctoring])

  useEffect(() => { if (quizStatus === 'submitted') navigate('/results', { replace: true }) }, [quizStatus])

  if (quizStatus === 'submitted') return null

  const total = currentQuestions.length
  const answeredCount = userAnswers.filter(a => a?.userAnswer?.trim()).length
  const canGoBack = !isLockedNav && currentQuestionIndex > 0
  const isLastQuestion = currentQuestionIndex === total - 1

  const handleNext = () => {
    if (isLastQuestion) {
      submitQuiz()
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent whitespace-nowrap">Quizzer</span>
              <span className="hidden sm:inline text-slate-700 text-xs">|</span>
              <span className="hidden sm:inline text-xs text-slate-500 font-medium whitespace-nowrap">{answeredCount}/{total} answered</span>
            </div>
            <div className="flex items-center gap-1.5">
              {hasProctoring && <ProctoringOverlay />}
              {hasProctoring && <TrustScore />}
              {hasTimer && <Timer />}
            </div>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-slate-800/50 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
              style={{ width: `${(answeredCount / total) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 gap-5">
        {showQuestionNav && (
          <div className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-20 bg-slate-900/60 backdrop-blur-sm border border-slate-800/50 rounded-xl p-3">
              <QuestionNav />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Question {currentQuestionIndex + 1} of {total}
                </span>
                {!isNoScore && <FlagButton />}
              </div>

              <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4 sm:p-6 mb-3">
                <QuestionCard />
              </div>

              <div className="flex items-center justify-between gap-3">
                <button onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                  disabled={!canGoBack}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700/60 cursor-pointer">
                  <ArrowLeft className="w-4 h-4" /> Previous
                </button>
                <button onClick={handleNext}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer">
                  {isLastQuestion ? submitLabel : 'Next'}
                  {!isLastQuestion && <ArrowRight className="w-4 h-4" />}
                  {isLastQuestion && <Send className="w-4 h-4" />}
                </button>
              </div>

              {showQuestionNav && (
                <div className="lg:hidden mt-4">
                  <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-3">
                    <QuestionNav compact />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

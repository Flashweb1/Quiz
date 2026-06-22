import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Flag, Clock, Home, FileText, Award, BarChart3 } from 'lucide-react'
import useExamStore from '../store/examStore'
import { computeSimilaritySync } from '../lib/similarity'
import { db, collection, addDoc } from '../lib/firebase'

export default function Results() {
  const navigate = useNavigate()
  const { clearSavedState, resetQuiz } = useExamStore()
  const { currentQuestions, userAnswers, flaggedQuestions, totalTime, timeRemaining, userName, userEmail, examConfig } = useExamStore()
  const [reviewOpen, setReviewOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const hasSaved = useRef(false)

  const isSurvey = examConfig?.scoring?.type === 'none'
  const showAggregated = examConfig?.resultsDisplay === 'aggregated'
  const showReview = !showAggregated && !isSurvey

  const timeTaken = totalTime - timeRemaining
  const minutes = Math.floor(timeTaken / 60)
  const seconds = timeTaken % 60

  const results = useMemo(() => currentQuestions.map((q, i) => {
    const ua = userAnswers[i]
    const answer = ua?.userAnswer || ''
    const sim = q.type === 'multiple-choice' ? (answer === q.answer ? 100 : 0) : computeSimilaritySync(answer, q.answer)
    return { ...q, index: i, userAnswer: answer, sim, correct: sim >= 70, hintsUsed: ua?.hintsUsed || 0, isFlagged: flaggedQuestions[i] }
  }), [currentQuestions, userAnswers])

  const correctCount = results.filter(r => r.correct).length
  const pct = Math.round((correctCount / results.length) * 100)
  const answeredCount = results.filter(r => r.userAnswer).length

  useEffect(() => {
    const save = async () => {
      if (hasSaved.current) return
      hasSaved.current = true
      setSaving(true)
      try {
        await addDoc(collection(db, "quizResults"), {
          fullname: userName || userEmail || 'Anonymous',
          email: userEmail,
          format: examConfig?.format || examConfig?.id || 'formal-exam',
          answers: results.map(r => ({
            question: r.question,
            category: r.category || r.lesson || 'General',
            correctAnswer: r.answer,
            userAnswer: r.userAnswer,
            hintsUsed: r.hintsUsed,
            similarity: r.sim,
            isCorrect: r.correct,
          })),
          totalQuestions: results.length,
          correctCount,
          score: correctCount,
          answeredCount,
          timeTakenSeconds: timeTaken,
          status: isSurvey ? 'Survey' : 'Pending',
          submittedAt: new Date().toISOString(),
        })
      } catch (e) { console.warn('Save failed:', e) }
      setSaving(false)
    }
    save()
  }, [])

  const scoreColor = isSurvey ? 'text-indigo-400' : pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'
  const scoreRing = isSurvey ? 'from-indigo-500/20 to-indigo-600/10' : pct >= 80 ? 'from-emerald-500/20 to-emerald-600/10' : pct >= 50 ? 'from-amber-500/20 to-amber-600/10' : 'from-red-500/20 to-red-600/10'
  const label = isSurvey ? 'Responses recorded' : pct >= 80 ? 'Excellent work!' : pct >= 50 ? 'Good effort!' : 'Keep practicing!'

  const stats = isSurvey ? [
    { label: 'Answered', value: answeredCount, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: BarChart3 },
    { label: 'Questions', value: results.length, color: 'text-slate-400', bg: 'bg-slate-800/60', border: 'border-slate-700/50', icon: FileText },
    { label: 'Time', value: `${minutes}:${String(seconds).padStart(2, '0')}`, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: Clock },
  ] : [
    { label: 'Correct', value: correctCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle },
    { label: 'Incorrect', value: results.length - correctCount, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle },
    { label: 'Flagged', value: flaggedQuestions.filter(Boolean).length, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Flag },
    { label: 'Time', value: `${minutes}:${String(seconds).padStart(2, '0')}`, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: Clock },
  ]

  return (
    <div className="min-h-screen flex flex-col p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 max-w-2xl w-full">
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br ${scoreRing} border-2 border-slate-700/50 mb-3 shadow-xl`}>
              {isSurvey ? (
                <BarChart3 className={`w-10 h-10 sm:w-12 sm:h-12 ${scoreColor}`} />
              ) : (
                <span className={`text-3xl sm:text-4xl font-extrabold ${scoreColor}`}>{pct}%</span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
              {isSurvey ? 'Survey Complete!' : 'Quiz Complete!'}
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">{label}</p>
            {saving && <p className="text-xs text-slate-600 mt-1">Saving results...</p>}
          </div>

          <div className={`grid ${isSurvey ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'} gap-2 sm:gap-3 mb-6`}>
            {stats.map(s => (
              <div key={s.label} className={`${s.bg} ${s.border} rounded-xl p-3 sm:p-4 text-center border`}>
                <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 ${s.color}`} />
                <div className={`text-lg sm:text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-6">
            {showReview && (
              <button onClick={() => setReviewOpen(!reviewOpen)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-200 text-sm font-medium hover:bg-slate-700/60 transition-all cursor-pointer">
                <FileText className="w-4 h-4" /> {reviewOpen ? 'Hide' : 'Review'} Answers
              </button>
            )}
            <button onClick={() => { clearSavedState(); resetQuiz(); navigate('/') }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all cursor-pointer">
              <Home className="w-4 h-4" /> Back to Home
            </button>
          </div>

          {showReview && reviewOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 mb-8">
              <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-indigo-400" /> Answer Review
              </h3>
              {results.map(r => (
                <div key={r.index} className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <span className="text-xs text-slate-500 font-medium">Q{r.index+1} &middot; {r.category || r.lesson || 'General'}</span>
                      {r.isFlagged && <span className="ml-1.5 text-amber-400 text-xs">flagged</span>}
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${r.correct ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                      {r.correct ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {r.correct ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-100 font-medium mb-2">{r.question}</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-red-400"><span className="text-slate-500">Your answer:</span> {r.userAnswer || <span className="italic text-slate-600">Not answered</span>}</p>
                    <p className="text-emerald-400"><span className="text-slate-500">Correct:</span> {r.answer}</p>
                    {r.hintsUsed > 0 && <p className="text-amber-400/70 text-xs">Hints used: {r.hintsUsed}</p>}
                    {r.sim < 100 && <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${r.sim >= 70 ? 'bg-emerald-500/15 text-emerald-400' : r.sim >= 40 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>Similarity: {r.sim}%</span>}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

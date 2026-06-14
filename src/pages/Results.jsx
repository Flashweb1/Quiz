import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Flag, Clock, Home, FileText, Award } from 'lucide-react'
import useExamStore from '../store/examStore'
import { computeSimilaritySync } from '../lib/similarity'
import { db, collection, addDoc } from '../lib/firebase'

export default function Results({ onHome }) {
  const { currentQuestions, userAnswers, flaggedQuestions, totalTime, timeRemaining, userName, userEmail } = useExamStore()
  const [reviewOpen, setReviewOpen] = useState(false)
  const [saving, setSaving] = useState(false)

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

  useEffect(() => {
    const save = async () => {
      setSaving(true)
      try {
        await addDoc(collection(db, "quizResults"), {
          fullname: userName || userEmail || 'Anonymous', email: userEmail,
          answers: results.map(r => ({ question: r.question, category: r.category || r.lesson || 'General', correctAnswer: r.answer, userAnswer: r.userAnswer, hintsUsed: r.hintsUsed, similarity: r.sim, isCorrect: r.correct })),
          totalQuestions: results.length, correctCount, score: correctCount, timeTakenSeconds: timeTaken,           status: "Pending", submittedAt: new Date().toISOString(),
        })
      } catch (e) { console.warn('Save failed:', e) }
      setSaving(false)
    }
    save()
  }, [])

  const color = pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'
  const bg = pct >= 80 ? 'from-emerald-500/20 to-emerald-600/10' : pct >= 50 ? 'from-amber-500/20 to-amber-600/10' : 'from-red-500/20 to-red-600/10'
  const label = pct >= 80 ? 'Excellent work!' : pct >= 50 ? 'Good effort!' : 'Keep practicing!'

  const stats = [
    { label: 'Correct', value: correctCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle },
    { label: 'Incorrect', value: results.length - correctCount, color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
    { label: 'Flagged', value: flaggedQuestions.filter(Boolean).length, color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Flag },
    { label: 'Time', value: `${minutes}:${String(seconds).padStart(2, '0')}`, color: 'text-indigo-400', bg: 'bg-indigo-500/10', icon: Clock },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 max-w-2xl w-full">
        <div className="text-center mb-6 sm:mb-8">
          <div className={`inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br ${bg} border-2 border-slate-700/50 mb-3 sm:mb-4`}>
            <span className={`text-3xl sm:text-4xl font-extrabold ${color}`}>{pct}%</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Quiz Complete!</h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">{label}</p>
          {saving && <p className="text-xs text-slate-600 mt-1">Saving results...</p>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
          {stats.map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-3 sm:p-4 text-center border border-slate-700/30`}>
              <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 ${s.color}`} />
              <div className={`text-lg sm:text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-6 sm:mb-8">
          <button onClick={() => setReviewOpen(!reviewOpen)}
            className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-200 text-xs sm:text-sm font-medium hover:bg-slate-700/60 transition-all cursor-pointer">
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {reviewOpen ? 'Hide' : 'Review'} Answers
          </button>
          <button onClick={onHome}
            className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer">
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Back to Home
          </button>
        </div>

        {reviewOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 sm:space-y-3 mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-slate-200 flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" /> Answer Review
            </h3>
            {results.map(r => (
              <div key={r.index} className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-3 sm:p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-500 font-medium">Q{r.index+1} &middot; {r.category || r.lesson || 'General'}</span>
                    {r.isFlagged && <span className="ml-1.5 text-amber-400 text-[11px]">🚩</span>}
                  </div>
                  <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${r.correct ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                    {r.correct ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {r.correct ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-slate-100 font-medium mb-2">{r.question}</p>
                <div className="space-y-1 text-xs sm:text-sm">
                  <p className="text-red-400"><span className="text-slate-500">Your answer:</span> {r.userAnswer || <span className="italic text-slate-600">Not answered</span>}</p>
                  <p className="text-emerald-400"><span className="text-slate-500">Correct:</span> {r.answer}</p>
                  {r.hintsUsed > 0 && <p className="text-amber-400/70 text-[11px]">Hints used: {r.hintsUsed}</p>}
                  {r.sim < 100 && <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium mt-1 ${r.sim >= 70 ? 'bg-emerald-500/15 text-emerald-400' : r.sim >= 40 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>Similarity: {r.sim}%</span>}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

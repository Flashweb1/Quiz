import { useState, useMemo } from 'react'
import { ChevronLeft, Check, X, Save, Sparkles, Bot } from 'lucide-react'
import { db, doc, setDoc, collection, addDoc } from '../lib/firebase'
import { computeSimilaritySync } from '../lib/similarity'
import { aiGradeAnswer } from '../lib/ai'

export default function SubmissionDetail({ submission, onBack }) {
  const [answers, setAnswers] = useState(submission.answers || [])
  const [saving, setSaving] = useState(false)
  const [aiGrading, setAiGrading] = useState(false)
  const [toast, setToast] = useState(null)

  const grade = useMemo(() => {
    const graded = answers.filter(a => a && a.isCorrect === true)
    return { correct: graded.length, total: answers.filter(a => a).length }
  }, [answers])

  const handleGrade = (index, value) => {
    setAnswers(prev => {
      const next = [...prev]
      if (next[index]) next[index] = { ...next[index], isCorrect: value }
      return next
    })
  }

  const autoGrade = () => {
    setAnswers(prev => prev.map(a => {
      if (!a) return a
      const sim = a.questionType === 'multiple-choice'
        ? (a.userAnswer === a.correctAnswer ? 100 : 0)
        : computeSimilaritySync(a.userAnswer || '', a.correctAnswer || '')
      return { ...a, isCorrect: sim >= 70, similarity: sim }
    }))
  }

  const aiGrade = async () => {
    setAiGrading(true)
    setToast({ type: 'info', message: 'AI grading short answers...' })
    const updated = []
    for (const a of answers) {
      if (!a) { updated.push(a); continue }
      if (a.questionType === 'multiple-choice') {
        const sim = a.userAnswer === a.correctAnswer ? 100 : 0
        updated.push({ ...a, isCorrect: sim >= 70, similarity: sim })
      } else {
        try {
          const result = await aiGradeAnswer(a.question, a.correctAnswer, a.userAnswer)
          updated.push({ ...a, isCorrect: result.score >= 70, similarity: result.score, aiFeedback: result.feedback })
        } catch {
          const sim = computeSimilaritySync(a.userAnswer || '', a.correctAnswer || '')
          updated.push({ ...a, isCorrect: sim >= 70, similarity: sim })
        }
      }
    }
    setAnswers(updated)
    setAiGrading(false)
    setToast({ type: 'success', message: 'AI grading complete' })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const score = answers.filter(a => a && a.isCorrect === true).length
      await setDoc(doc(db, "quizResults", submission.id), { ...submission, answers, score, status: "Graded" }, { merge: true })
      await addDoc(collection(db, 'auditLogs'), {
        action: 'grade_saved',
        details: { submissionId: submission.id, score, total: answers.filter(a => a).length },
        userEmail: 'admin',
        timestamp: new Date().toISOString(),
      }).catch(() => {})
      setToast({ type: 'success', message: 'Grade saved!' })
      setTimeout(() => setToast(null), 3000)
    } catch (e) { setToast({ type: 'error', message: 'Failed to save grade' }); setTimeout(() => setToast(null), 3000) }
    setSaving(false)
  }

  const fmt = (sec) => sec ? `${Math.floor(sec / 60)}m ${sec % 60}s` : '-'

  return (
    <div>
      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-xl border text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {toast.message}
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-all cursor-pointer"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100">{submission.fullname || 'Unknown'}</h2>
            <p className="text-sm text-slate-500">{grade.correct}/{grade.total} correct &middot; {fmt(submission.timeTakenSeconds)}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={autoGrade} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-all cursor-pointer"><Sparkles className="w-4 h-4" /> Auto</button>
          <button onClick={aiGrade} disabled={aiGrading} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium hover:bg-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"><Bot className="w-4 h-4" /> {aiGrading ? 'AI Grading...' : 'AI Grade'}</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>

      <div className="space-y-3">
        {answers.map((ans, i) => {
          if (!ans) return null
          const sim = ans.similarity ?? computeSimilaritySync(ans.userAnswer || '', ans.correctAnswer || '')
          return (
            <div key={i} className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-500">Q{i+1}</span>
                    <span className="text-xs text-slate-600">&middot;</span>
                    <span className="text-xs text-slate-500">{ans.category || 'General'}</span>
                  </div>
                  <p className="text-sm sm:text-base text-slate-100 font-medium mb-3">{ans.question}</p>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="flex items-start gap-2"><X className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" /><div><span className="text-slate-500 text-xs">Student:</span><p className="text-red-400">{ans.userAnswer || <span className="italic text-slate-600">Blank</span>}</p></div></div>
                    <div className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" /><div><span className="text-slate-500 text-xs">Correct:</span><p className="text-emerald-400">{ans.correctAnswer}</p></div></div>
                  </div>
                  {sim < 100 && <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium mt-2 ${sim >= 70 ? 'bg-emerald-500/15 text-emerald-400' : sim >= 40 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>Similarity: {sim}%</span>}
                </div>
                <div className="flex sm:flex-col gap-1.5 w-full sm:w-auto">
                  <button onClick={() => handleGrade(i, true)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${ans.isCorrect === true ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'}`}>
                    <Check className="w-3 h-3" /> Correct
                  </button>
                  <button onClick={() => handleGrade(i, false)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${ans.isCorrect === false ? 'bg-red-500/15 border-red-500/30 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'}`}>
                    <X className="w-3 h-3" /> Incorrect
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

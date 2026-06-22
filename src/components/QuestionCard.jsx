import { useState, useEffect, useMemo } from 'react'
import useExamStore from '../store/examStore'
import { Lightbulb, Hash, BookOpen, CheckCircle, XCircle } from 'lucide-react'
import { computeSimilaritySync } from '../lib/similarity'

export default function QuestionCard() {
  const { currentQuestions, currentQuestionIndex, userAnswers, showReference, allowHints, examConfig, saveAnswer, flaggedQuestions } = useExamStore()
  const question = currentQuestions[currentQuestionIndex]
  const [inputVal, setInputVal] = useState('')
  const [hintsUsed, setHintsUsed] = useState(0)
  const [hintDisplay, setHintDisplay] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const isSurvey = examConfig?.scoring?.type === 'none'
  const isPractice = examConfig?.mode === 'practice'
  const showInstantFeedback = isPractice && feedback !== null

  useEffect(() => {
    if (!question) return
    const prev = userAnswers[currentQuestionIndex]
    setInputVal(prev?.userAnswer || '')
    setHintsUsed(prev?.hintsUsed || 0)
    setHintDisplay(null)
    setFeedback(null)
  }, [currentQuestionIndex, question])

  const save = (value, hints = hintsUsed) => {
    if (!question) return
    saveAnswer({
      question: question.question,
      category: question.category || question.lesson || 'General',
      correctAnswer: question.answer,
      userAnswer: value || '',
      hintsUsed: hints,
    })
  }

  const checkAnswer = (value) => {
    if (!question || isSurvey) return
    const sim = question.type === 'multiple-choice'
      ? (value === question.answer ? 100 : 0)
      : computeSimilaritySync(value || '', question.answer || '')
    const correct = sim >= 70
    setFeedback({ correct, sim, correctAnswer: question.answer })
  }

  if (!question) return null

  const handleMCQ = (opt) => {
    setInputVal(opt)
    save(opt)
    checkAnswer(opt)
  }

  const handleTextChange = (e) => {
    const val = e.target.value
    setInputVal(val)
    save(val)
    checkAnswer(val)
  }

  const showFirstLetterHint = () => {
    if (hintsUsed >= 2) return
    const words = question.answer.split(' ')
    const letters = words.map(w => w.charAt(0).toUpperCase()).join(' ')
    setHintDisplay({ label: 'First letters', value: letters })
    const newHints = hintsUsed + 1
    setHintsUsed(newHints)
    save(inputVal, newHints)
  }

  const showWordCountHint = () => {
    if (hintsUsed >= 2) return
    const count = question.answer.split(' ').length
    setHintDisplay({ label: 'Word count', value: `${count} words` })
    const newHints = hintsUsed + 1
    setHintsUsed(newHints)
    save(inputVal, newHints)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
          <BookOpen className="w-3 h-3" />
          {question.category || question.lesson || 'General'}
        </span>
        {!isSurvey && showReference && question.reference && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20">
            <BookOpen className="w-3 h-3" />
            {question.reference}
          </span>
        )}
        {!isSurvey && flaggedQuestions[currentQuestionIndex] && (
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">Flagged</span>
        )}
      </div>

      <p className="text-base sm:text-lg font-semibold leading-relaxed text-slate-50">{question.question}</p>

      {question.type === 'multiple-choice' && question.options ? (
        <div className="space-y-2">
          {question.options.map((opt, i) => {
            const selected = inputVal === opt
            return (
              <button key={i} onClick={() => handleMCQ(opt)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer active:scale-[0.99]
                  ${selected
                    ? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/5'
                    : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                  }`}>
                <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all
                  ${selected ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className={`text-sm ${selected ? 'text-indigo-200' : 'text-slate-200'}`}>{opt}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="relative">
          <textarea value={inputVal} onChange={handleTextChange}
            placeholder={isSurvey ? 'Type your response here...' : 'Type your answer here...'}
            className="w-full min-h-[100px] p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-100 text-sm leading-relaxed
              placeholder:text-slate-600 resize-y focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all" />
          {inputVal && (
            <div className="absolute bottom-2 right-2 text-[10px] text-slate-600 bg-slate-800/80 px-2 py-0.5 rounded">
              {inputVal.split(/\s+/).filter(Boolean).length} words
            </div>
          )}
        </div>
      )}

      {/* Instant feedback for practice mode */}
      {showInstantFeedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${
          feedback.correct
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {feedback.correct ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">
            {feedback.correct ? 'Correct!' : `Incorrect — ${feedback.correctAnswer}`}
          </span>
          {!feedback.correct && feedback.sim > 0 && feedback.sim < 70 && (
            <span className="text-xs opacity-70">({feedback.sim}% similarity)</span>
          )}
        </div>
      )}

      {/* Hints (hidden for survey mode) */}
      {!isSurvey && allowHints && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={showFirstLetterHint} disabled={hintsUsed >= 2}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 cursor-pointer
                ${hintsUsed >= 2 ? 'border-slate-700/30 text-slate-600 bg-slate-800/30 cursor-not-allowed'
                  : 'border-slate-700/50 text-slate-400 bg-slate-800/50 hover:border-amber-500/30 hover:text-amber-400'}`}>
              <Lightbulb className="w-3 h-3" /> First Letters
            </button>
            <button onClick={showWordCountHint} disabled={hintsUsed >= 2}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 cursor-pointer
                ${hintsUsed >= 2 ? 'border-slate-700/30 text-slate-600 bg-slate-800/30 cursor-not-allowed'
                  : 'border-slate-700/50 text-slate-400 bg-slate-800/50 hover:border-amber-500/30 hover:text-amber-400'}`}>
              <Hash className="w-3 h-3" /> Word Count
            </button>
            {hintsUsed > 0 && <span className="text-[11px] text-slate-600">({hintsUsed}/2 used)</span>}
          </div>
          {hintDisplay && (
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-300 text-sm leading-relaxed">
              <span className="font-bold">{hintDisplay.label}: </span>
              <span>{hintDisplay.value}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

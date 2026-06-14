import { useState, useEffect } from 'react'
import useExamStore from '../store/examStore'
import { Lightbulb, Hash, BookOpen } from 'lucide-react'

export default function QuestionCard() {
  const { currentQuestions, currentQuestionIndex, userAnswers, showReference, allowHints, saveAnswer, flaggedQuestions } = useExamStore()
  const question = currentQuestions[currentQuestionIndex]
  const [inputVal, setInputVal] = useState('')
  const [hintsUsed, setHintsUsed] = useState(0)
  const [hintDisplay, setHintDisplay] = useState(null)

  useEffect(() => {
    if (!question) return
    const prev = userAnswers[currentQuestionIndex]
    setInputVal(prev?.userAnswer || '')
    setHintsUsed(prev?.hintsUsed || 0)
    setHintDisplay(null)
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

  if (!question) return null

  const handleMCQ = (opt) => { setInputVal(opt); save(opt) }

  const handleTextChange = (e) => {
    const val = e.target.value
    setInputVal(val)
    save(val)
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
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs sm:text-sm font-medium border border-indigo-500/20">
          <BookOpen className="w-3 h-3" />
          {question.category || question.lesson || 'General'}
        </span>
        {showReference && question.reference && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs sm:text-sm border border-amber-500/20">
            <BookOpen className="w-3 h-3" />
            {question.reference}
          </span>
        )}
        {flaggedQuestions[currentQuestionIndex] && (
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">Flagged</span>
        )}
      </div>

      <p className="text-lg sm:text-xl font-semibold leading-relaxed text-slate-50">{question.question}</p>

      {question.type === 'multiple-choice' && question.options ? (
        <div className="space-y-2">
          {question.options.map((opt, i) => {
            const selected = inputVal === opt
            return (
              <button key={i} onClick={() => handleMCQ(opt)}
                className={`w-full flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer active:scale-[0.99] active:opacity-90
                  ${selected
                    ? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/5'
                    : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800 active:bg-slate-700'
                  }`}>
                <span className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold transition-all
                  ${selected ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className={`text-sm sm:text-base ${selected ? 'text-indigo-200' : 'text-slate-200'}`}>{opt}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="relative">
          <textarea value={inputVal} onChange={handleTextChange}
            placeholder="Type your answer here..."
            className="w-full min-h-[100px] sm:min-h-[120px] p-3 sm:p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-100 text-sm sm:text-base leading-relaxed
              placeholder:text-slate-600 resize-y focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all duration-200" />
          {inputVal && (
            <div className="absolute bottom-2 right-2 text-[11px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded-md">
              {inputVal.split(/\s+/).filter(Boolean).length} words
            </div>
          )}
        </div>
      )}

      {allowHints && (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={showFirstLetterHint} disabled={hintsUsed >= 2}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer
                ${hintsUsed >= 2 ? 'border-slate-700/30 text-slate-600 bg-slate-800/30 cursor-not-allowed'
                  : 'border-slate-700/50 text-slate-400 bg-slate-800/50 hover:border-amber-500/30 hover:text-amber-400'}`}>
              <Lightbulb className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> First Letters
            </button>
            <button onClick={showWordCountHint} disabled={hintsUsed >= 2}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer
                ${hintsUsed >= 2 ? 'border-slate-700/30 text-slate-600 bg-slate-800/30 cursor-not-allowed'
                  : 'border-slate-700/50 text-slate-400 bg-slate-800/50 hover:border-amber-500/30 hover:text-amber-400'}`}>
              <Hash className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Word Count
            </button>
            {hintsUsed > 0 && <span className="text-xs text-slate-600">({hintsUsed}/2 used)</span>}
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

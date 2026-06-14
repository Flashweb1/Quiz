import useExamStore from '../store/examStore'
import { Flag } from 'lucide-react'

export default function QuestionNav({ compact }) {
  const { currentQuestions, currentQuestionIndex, userAnswers, flaggedQuestions, setCurrentQuestionIndex } = useExamStore()
  if (!currentQuestions.length) return null

  return (
    <div className="w-full">
      <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 sm:mb-3">
        Questions ({currentQuestions.length})
      </div>
      <div className={`flex flex-wrap gap-1 ${compact ? 'justify-center' : ''}`}>
        {currentQuestions.map((q, i) => {
          const isCurrent = i === currentQuestionIndex
          const isAnswered = userAnswers[i]?.userAnswer?.trim()?.length > 0
          const isFlagged = flaggedQuestions[i]

          let cls = 'border-slate-700 bg-slate-800 text-slate-500'
          if (isCurrent) cls = 'ring-2 ring-indigo-500/50 border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
          if (isAnswered && !isFlagged) cls = 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
          if (isFlagged) cls = isAnswered
            ? 'border-amber-500/30 bg-amber-500/20 text-amber-400'
            : 'border-amber-500/20 bg-amber-500/10 text-amber-400'

          return (
            <button key={i} onClick={() => setCurrentQuestionIndex(i)}
              className={`relative w-7 h-7 sm:w-9 sm:h-9 rounded-lg border text-[10px] sm:text-xs font-bold transition-all duration-150 cursor-pointer active:scale-90 ${cls} hover:brightness-110`}
              title={`Q${i+1}`}>
              {i + 1}
              {isFlagged && <Flag className="absolute -top-1 -right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 fill-amber-400 text-amber-400" />}
            </button>
          )
        })}
      </div>
      {!compact && (
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 text-[10px] sm:text-xs text-slate-600">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500/40" /> Answered</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-700" /> Unanswered</span>
          <span className="flex items-center gap-1"><Flag className="w-2.5 h-2.5 text-amber-400" /> Flagged</span>
        </div>
      )}
    </div>
  )
}

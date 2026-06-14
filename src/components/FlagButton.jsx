import { Flag, FlagOff } from 'lucide-react'
import useExamStore from '../store/examStore'

export default function FlagButton() {
  const { currentQuestionIndex, flaggedQuestions, toggleFlag } = useExamStore()
  const isFlagged = flaggedQuestions[currentQuestionIndex]

  return (
    <button
      onClick={toggleFlag}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer
        ${isFlagged
          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-lg shadow-amber-500/10'
          : 'bg-slate-800/50 text-slate-500 border-slate-700/50 hover:border-amber-500/30 hover:text-amber-400/70'
        }`}
      title={isFlagged ? 'Remove flag' : 'Flag for review'}
    >
      {isFlagged ? <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400" /> : <FlagOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
      <span className="hidden sm:inline">{isFlagged ? 'Flagged' : 'Flag'}</span>
    </button>
  )
}

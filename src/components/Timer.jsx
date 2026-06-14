import { useEffect, useRef } from 'react'
import { Clock, AlertTriangle, Timer as TimerIcon } from 'lucide-react'
import useExamStore from '../store/examStore'

export default function Timer() {
  const { timeRemaining, totalTime, isQuizActive, updateTimer, submitQuiz } = useExamStore()
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!isQuizActive) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      const store = useExamStore.getState()
      if (store.timeRemaining <= 1) {
        clearInterval(intervalRef.current)
        submitQuiz()
      } else {
        updateTimer()
      }
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isQuizActive])

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const pctRemaining = totalTime > 0 ? ((timeRemaining / totalTime) * 100) : 0

  let phase = 'normal'
  if (pctRemaining <= 10) phase = 'critical'
  else if (pctRemaining <= 25) phase = 'warning'

  const phaseStyles = {
    normal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse',
    critical: 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse',
  }

  const barStyles = {
    normal: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
  }

  const Icon = phase === 'normal' ? Clock : phase === 'warning' ? AlertTriangle : TimerIcon

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-4 sm:py-2 rounded-xl border transition-all duration-300 ${phaseStyles[phase]}`}>
      <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
      <span className="font-mono text-sm sm:text-lg font-bold tabular-nums tracking-wider">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
      {phase === 'critical' && (
        <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest">Time!</span>
      )}
      <div className="hidden sm:block w-16 h-1.5 rounded-full bg-slate-700/50 overflow-hidden ml-1">
        <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${barStyles[phase]}`}
          style={{ width: `${pctRemaining}%` }} />
      </div>
    </div>
  )
}

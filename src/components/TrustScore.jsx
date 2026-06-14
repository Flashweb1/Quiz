import { useEffect, useState } from 'react'
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react'
import useExamStore from '../store/examStore'

export default function TrustScore() {
  const { trustScore } = useExamStore()
  const [score, setScore] = useState(100)
  const [status, setStatus] = useState('good')

  useEffect(() => {
    const interval = setInterval(() => {
      setScore(trustScore.getScore())
      setStatus(trustScore.getStatus())
    }, 1000)
    return () => clearInterval(interval)
  }, [trustScore])

  const config = {
    good: { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Secure' },
    warning: { icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Caution' },
    danger: { icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'At Risk' },
  }

  const cfg = config[status] || config.good
  const Icon = cfg.icon
  const barColor = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className={`flex items-center gap-1 sm:gap-1.5 px-1.5 py-1 sm:px-3 sm:py-2 rounded-xl border transition-all duration-500 ${cfg.bg} ${cfg.border}`}>
      <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${cfg.color}`} />
      <div className="flex flex-col">
        <span className={`hidden sm:block text-[10px] font-bold tracking-wider uppercase leading-tight ${cfg.color}`}>{cfg.label}</span>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <div className="w-8 sm:w-14 h-1 rounded-full bg-slate-700/50 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${score}%` }} />
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-400">{score}</span>
        </div>
      </div>
    </div>
  )
}

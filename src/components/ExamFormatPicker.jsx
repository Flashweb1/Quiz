import { FileText, BookOpen, Timer, BarChart3, Flame, Shuffle, Target, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { getAllFormats } from '../lib/formatPresets'

const ICON_MAP = {
  FileText, BookOpen, Timer, BarChart3, Flame, Shuffle, Target, Users,
}

export default function ExamFormatPicker({ selected, onSelect }) {
  const formats = getAllFormats()

  return (
    <div>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-slate-100">Choose Exam Format</h3>
        <p className="text-sm text-slate-500 mt-1">Select a format that matches your assessment type. Settings can be customized after.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {formats.map((fmt, i) => {
          const Icon = ICON_MAP[fmt.icon] || FileText
          const sel = selected === fmt.id
          return (
            <motion.button
              key={fmt.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
              onClick={() => onSelect(fmt.id)}
              className={`relative w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                sel
                  ? 'border-indigo-500/50 bg-indigo-500/10 ring-1 ring-indigo-500/20'
                  : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                  sel ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/50 text-slate-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-slate-100">{fmt.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${fmt.badgeClass}`}>
                      {fmt.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{fmt.description}</p>
                </div>
                <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  sel ? 'border-indigo-500 bg-indigo-500' : 'border-slate-600'
                }`}>
                  {sel && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

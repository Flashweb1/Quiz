import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, AlertTriangle, Search, MessageSquare, XCircle, ChevronLeft } from 'lucide-react'

const mockSessions = [
  { id: 1, name: 'John Doe', trustScore: 92, status: 'good', faceDetected: true, alerts: [] },
  { id: 2, name: 'Sarah Smith', trustScore: 64, status: 'warning', faceDetected: true, alerts: ['Looked away for 15s'] },
  { id: 3, name: 'Mike Johnson', trustScore: 55, status: 'danger', faceDetected: true, alerts: ['Multiple faces detected', 'Tab switch detected'] },
  { id: 4, name: 'Emily Davis', trustScore: 88, status: 'good', faceDetected: true, alerts: [] },
  { id: 5, name: 'Alex Brown', trustScore: 45, status: 'danger', faceDetected: false, alerts: ['Face not visible'] },
]

const alertLog = [
  { time: '14:32:23', name: 'Sarah Smith', message: 'Looked away for 15s' },
  { time: '14:31:45', name: 'Mike Johnson', message: 'Multiple faces detected' },
  { time: '14:30:12', name: 'Alex Brown', message: 'Screen switched to notes' },
  { time: '14:28:50', name: 'Mike Johnson', message: 'Tab switch detected' },
  { time: '14:25:00', name: 'Alex Brown', message: 'Face not visible' },
]

export default function LiveProctoringPage({ onBack }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const filtered = mockSessions.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
  const alertCount = mockSessions.filter(s => s.status !== 'good').length

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"><ChevronLeft className="w-5 h-5" /></button>
            <h1 className="text-lg font-bold text-slate-100">Live Proctoring</h1>
            <span className="text-sm text-slate-500">{mockSessions.length} Active</span>
            {alertCount > 0 && (
              <span className="flex items-center gap-1 text-sm text-red-400 bg-red-500/10 px-2 py-1 rounded-lg"><AlertTriangle className="w-3.5 h-3.5" /> {alertCount}</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Search candidates..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500/50" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(session => (
                <div key={session.id} onClick={() => setSelected(session)}
                  className={`bg-slate-900/60 border rounded-xl p-4 transition-all cursor-pointer ${selected?.id === session.id ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : 'border-slate-800/50 hover:border-slate-700'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold ${session.faceDetected ? 'bg-slate-800' : 'bg-red-500/10 text-red-400'}`}>
                        {session.faceDetected ? '👤' : '🚫'}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-200">{session.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Shield className={`w-3 h-3 ${session.status === 'good' ? 'text-emerald-400' : session.status === 'warning' ? 'text-amber-400' : 'text-red-400'}`} />
                          <span className={`text-xs font-mono font-bold ${session.status === 'good' ? 'text-emerald-400' : session.status === 'warning' ? 'text-amber-400' : 'text-red-400'}`}>{session.trustScore}%</span>
                        </div>
                      </div>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${session.status === 'good' ? 'bg-emerald-500' : session.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'} animate-pulse`} />
                  </div>
                  {session.alerts.length > 0 && session.alerts.map((a, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs text-red-400 bg-red-500/5 px-2 py-1 rounded-md mb-1"><AlertTriangle className="w-3 h-3" /> {a}</div>
                  ))}
                  <div className="flex gap-2 mt-2 pt-2 border-t border-slate-800/30">
                    <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-slate-400 hover:bg-slate-700/50 transition-all cursor-pointer"><MessageSquare className="w-3 h-3" /> Chat</button>
                    <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"><XCircle className="w-3 h-3" /> Terminate</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-80 space-y-4">
            {selected && (
              <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
                <h3 className="font-semibold text-sm text-slate-200 mb-3">{selected.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between"><span className="text-slate-500">Trust Score</span><span className={`font-mono font-bold ${selected.trustScore >= 80 ? 'text-emerald-400' : selected.trustScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{selected.trustScore}%</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-500">Face</span><span className={selected.faceDetected ? 'text-emerald-400' : 'text-red-400'}>{selected.faceDetected ? 'Yes' : 'No'}</span></div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-all cursor-pointer">Warn</button>
                  <button className="flex-1 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all cursor-pointer">Terminate</button>
                </div>
              </div>
            )}
            <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" /> Alert Log</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {alertLog.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                    <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-200">{log.name}</p>
                      <p className="text-[11px] text-red-400/80">{log.message}</p>
                      <p className="text-[10px] text-slate-600">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

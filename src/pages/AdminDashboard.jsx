import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Users, FileText, Search, Download, RefreshCw, CheckCircle, AlertTriangle, BookOpen, LogOut, ChevronLeft, Settings as SettingsIcon } from 'lucide-react'
import useExamStore from '../store/examStore'
import { db, auth, collection, getDocs, query, orderBy, setDoc, getDoc, settingsDocRef, signOut, onAuthStateChanged } from '../lib/firebase'
import SubmissionDetail from '../components/SubmissionDetail'
import QuestionBank from '../components/QuestionBank'
import ExamWizard from '../components/ExamWizard'

export default function AdminDashboard({ onHome }) {
  const { submissions, setSubmissions } = useExamStore()
  const [tab, setTab] = useState('dashboard')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quizActive, setQuizActive] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [showWizard, setShowWizard] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => { if (user) { setIsAdmin(true); loadData() } else { setIsAdmin(false); setLoading(false) } })
    return () => unsub()
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const q = query(collection(db, "quizResults"), orderBy("submittedAt", "desc"))
      const snap = await getDocs(q)
      const data = []; snap.forEach(d => data.push({ id: d.id, ...d.data() }))
      setSubmissions(data)
      const ds = await getDoc(settingsDocRef)
      setQuizActive(ds.exists() && ds.data().isQuizActive)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    try { await signInWithEmailAndPassword(auth, email, pass) }
    catch (err) { setLoginErr(err.message) }
  }

  const toggleQuiz = async () => {
    const next = !quizActive; await setDoc(settingsDocRef, { isQuizActive: next }); setQuizActive(next)
  }

  const filtered = submissions.filter(s => {
    if (!search) return true; const q = search.toLowerCase()
    return (s.fullname || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q)
  }).filter(s => statusFilter === 'all' || (s.status || 'Pending') === statusFilter)

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => (s.status || 'Pending') === 'Pending').length,
    graded: submissions.filter(s => s.status === 'Graded').length,
    avg: submissions.length > 0 ? Math.round(submissions.reduce((a, s) => a + (s.score || 0), 0) / submissions.length) : 0,
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm bg-slate-900/60 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center mx-auto mb-3"><Users className="w-6 h-6 text-indigo-400" /></div>
            <h2 className="text-xl font-bold text-slate-100">Admin Login</h2>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input type="email" placeholder="Admin email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50" />
            <input type="password" placeholder="Password" value={pass} onChange={e => setPass(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50" />
            {loginErr && <p className="text-red-400 text-sm">{loginErr}</p>}
            <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all cursor-pointer">Sign In</button>
          </form>
          <button onClick={onHome} className="w-full text-center text-sm text-slate-500 hover:text-slate-300 mt-4 cursor-pointer">&larr; Back</button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onHome} className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"><ChevronLeft className="w-5 h-5" /></button>
            <h1 className="text-lg font-bold text-slate-100">Admin</h1>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${quizActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
              {quizActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <button onClick={() => signOut(auth)} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"><LogOut className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-1 mb-6 bg-slate-800/50 rounded-xl p-1 border border-slate-700/50 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'submissions', label: 'Submissions', icon: FileText },
            { id: 'questions', label: 'Questions', icon: BookOpen },
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${tab === t.id ? 'bg-slate-700 text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
              <t.icon className="w-4 h-4" /> <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {tab === 'dashboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {[
                { label: 'Total', value: stats.total, icon: FileText, c: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                { label: 'Pending', value: stats.pending, icon: AlertTriangle, c: 'text-amber-400', bg: 'bg-amber-500/10' },
                { label: 'Graded', value: stats.graded, icon: CheckCircle, c: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: 'Avg Score', value: stats.avg, icon: BarChart3, c: 'text-blue-400', bg: 'bg-blue-500/10' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} border border-slate-700/30 rounded-xl p-3 sm:p-4`}>
                  <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.c} mb-1.5`} />
                  <div className={`text-xl sm:text-2xl font-bold ${s.c}`}>{s.value}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-4 sm:p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Recent Submissions</h3>
              {filtered.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-slate-800/30 last:border-0">
                  <p className="font-medium text-sm text-slate-200">{s.fullname || 'Unknown'}</p>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${s.status === 'Graded' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>{s.status || 'Pending'}</span>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-slate-500 text-sm py-4 text-center">No submissions yet</p>}
            </div>
            <button onClick={() => setShowWizard(true)} className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold transition-all cursor-pointer">
              + Create New Exam
            </button>
            {showWizard && <div className="mt-4"><ExamWizard onClose={() => setShowWizard(false)} /></div>}
          </motion.div>
        )}

        {tab === 'submissions' && !selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500/50" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-100 text-sm focus:outline-none focus:border-indigo-500/50">
                <option value="all">All</option>
                <option value="Pending">Pending</option>
                <option value="Graded">Graded</option>
              </select>
              <button onClick={loadData} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"><RefreshCw className="w-4 h-4" /></button>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-slate-800/50">
                    <th className="text-left py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Name</th>
                    <th className="text-left py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="text-left py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Score</th>
                    <th className="text-left py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Date</th>
                    <th className="text-right py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Action</th>
                  </tr></thead>
                  <tbody>
                    {filtered.map(s => (
                      <tr key={s.id} className="border-b border-slate-800/20 hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-sm text-slate-200">{s.fullname || 'Unknown'}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${s.status === 'Graded' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>{s.status || 'Pending'}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-300">{s.score !== undefined ? `${s.score}/${s.totalQuestions}` : '-'}</td>
                        <td className="py-3 px-4 text-sm text-slate-500">{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : '-'}</td>
                        <td className="py-3 px-4 text-right"><button onClick={() => setSelected(s)} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">View</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="md:hidden space-y-2 p-3">
                {filtered.map(s => (
                  <div key={s.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-slate-200 truncate">{s.fullname || 'Unknown'}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${s.status === 'Graded' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>{s.status || 'Pending'}</span>
                        <span className="text-xs text-slate-500">{s.score !== undefined ? `${s.score}/${s.totalQuestions}` : '-'}</span>
                        <span className="text-xs text-slate-600">{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                    <button onClick={() => setSelected(s)} className="flex-shrink-0 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer">View</button>
                  </div>
                ))}
              </div>
              {filtered.length === 0 && <p className="text-slate-500 text-sm py-8 text-center">No submissions</p>}
            </div>
          </motion.div>
        )}
        {tab === 'submissions' && selected && <SubmissionDetail submission={selected} onBack={() => setSelected(null)} />}

        {tab === 'questions' && <QuestionBank />}

        {tab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5 sm:p-6 max-w-lg">
            <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-4">Exam Settings</h3>
            <label className="flex items-center justify-between cursor-pointer">
              <div><p className="font-medium text-sm text-slate-200">Quiz Active</p><p className="text-xs text-slate-500">Students can start the quiz</p></div>
              <button onClick={toggleQuiz}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${quizActive ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${quizActive ? 'translate-x-5' : ''}`} />
              </button>
            </label>
          </motion.div>
        )}
      </div>
    </div>
  )
}

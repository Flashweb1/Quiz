import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, FileText, Search, RefreshCw, CheckCircle, AlertTriangle, ChevronLeft, LogOut, BookOpen, Download } from 'lucide-react'
import useExamStore from '../store/examStore'
import { db, auth, collection, getDocs, query, orderBy, where, signOut, onAuthStateChanged, signInWithEmailAndPassword, doc, getDoc } from '../lib/firebase'
import BulkImport from '../components/BulkImport'
import { CardSkeleton, ListSkeleton, EmptyState } from '../components/Skeletons'

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const { submissions, setSubmissions } = useExamStore()
  const [tab, setTab] = useState('dashboard')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [isTeacher, setIsTeacher] = useState(false)
  const [teacherEmail, setTeacherEmail] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 20
  const [stats, setStats] = useState({ total: 0, pending: 0, graded: 0, avg: 0 })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (user) {
        const roleDoc = await getDoc(doc(db, 'users', user.uid)).catch(() => null)
        const role = roleDoc?.data()?.role || 'teacher'
        if (role === 'teacher' || role === 'admin') {
          setIsTeacher(true)
          loadData(user.email)
        } else {
          setIsTeacher(false)
          setLoading(false)
        }
      } else {
        setIsTeacher(false)
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  const loadData = useCallback(async (emailFilter) => {
    setLoading(true)
    try {
      const constraints = [orderBy('submittedAt', 'desc')]
      if (emailFilter) constraints.push(where('teacherEmail', '==', emailFilter))
      const q = query(collection(db, "quizResults"), ...constraints)
      const snap = await getDocs(q)
      const data = []; snap.forEach(d => data.push({ id: d.id, ...d.data() }))
      setSubmissions(data)
      computeStats(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  const computeStats = (data) => {
    setStats({
      total: data.length,
      pending: data.filter(s => (s.status || 'Pending') === 'Pending').length,
      graded: data.filter(s => s.status === 'Graded').length,
      avg: data.length > 0 ? Math.round(data.reduce((a, s) => a + (s.score || 0), 0) / data.length) : 0,
    })
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    try { await signInWithEmailAndPassword(auth, email, pass) }
    catch (err) { setLoginErr(err.message) }
  }

  const exportCSV = () => {
    const headers = 'Name,Status,Score,Questions,Time (s),Date\n'
    const rows = filtered.map(s => {
      const name = (s.fullname || 'Unknown').replace(/"/g, '""')
      const status = s.status || 'Pending'
      const score = s.score !== undefined ? `${s.score}/${s.totalQuestions}` : '-'
      const date = s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : '-'
      return `"${name}","${status}","${score}","${s.totalQuestions || 0}","${s.timeTakenSeconds || 0}","${date}"`
    }).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'teacher_submissions.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  useEffect(() => { setPage(1) }, [search])

  const filtered = submissions.filter(s => {
    if (!search) return true; const q = search.toLowerCase()
    return (s.fullname || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q)
  })

  const paginated = filtered.slice(0, page * perPage)
  const hasMore = paginated.length < filtered.length

  if (!isTeacher) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-7 h-7 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Teacher Login</h2>
            <p className="text-sm text-slate-500 mt-1">Sign in with your teacher account</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input type="email" placeholder="Teacher email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500/50" />
            <input type="password" placeholder="Password" value={pass} onChange={e => setPass(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500/50" />
            {loginErr && <p className="text-red-400 text-xs">{loginErr}</p>}
            <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all cursor-pointer">Sign In</button>
          </form>
          <button onClick={() => navigate('/')} className="w-full text-center text-sm text-slate-500 hover:text-slate-300 mt-4 cursor-pointer">&larr; Back to Home</button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"><ChevronLeft className="w-5 h-5" /></button>
            <h1 className="text-lg font-bold text-slate-100">Teacher Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/admin')} className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">Admin Panel</button>
            <button onClick={() => signOut(auth)} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-1 mb-6 bg-slate-800/50 rounded-xl p-1 border border-slate-700/50 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Users },
            { id: 'submissions', label: 'Submissions', icon: FileText },
            { id: 'import', label: 'Import', icon: Users },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${tab === t.id ? 'bg-slate-700 text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
              <t.icon className="w-4 h-4" /> <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {tab === 'dashboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {loading ? <CardSkeleton /> : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {[
                  { label: 'Total', value: stats.total, icon: FileText, c: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                  { label: 'Pending', value: stats.pending, icon: AlertTriangle, c: 'text-amber-400', bg: 'bg-amber-500/10' },
                  { label: 'Graded', value: stats.graded, icon: CheckCircle, c: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  { label: 'Avg Score', value: stats.avg, icon: Users, c: 'text-blue-400', bg: 'bg-blue-500/10' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} border border-slate-700/30 rounded-xl p-3 sm:p-4`}>
                    <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.c} mb-1.5`} />
                    <div className={`text-xl sm:text-2xl font-bold ${s.c}`}>{s.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-4 sm:p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Recent Submissions</h3>
              {loading ? <ListSkeleton count={3} /> : submissions.length === 0 ? (
                <EmptyState icon={FileText} title="No submissions yet" description="Student results will appear here" />
              ) : submissions.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-slate-800/30 last:border-0">
                  <p className="font-medium text-sm text-slate-200">{s.fullname || 'Unknown'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'Graded' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>{s.status || 'Pending'}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === 'submissions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500/50" />
              </div>
              <button onClick={exportCSV} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer" title="Export CSV"><Download className="w-4 h-4" /></button>
              <button onClick={() => loadData()} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"><RefreshCw className="w-4 h-4" /></button>
            </div>
            {loading ? <ListSkeleton count={5} /> : submissions.length === 0 ? (
              <EmptyState icon={FileText} title="No submissions" description="Student results will appear here once exams are completed" />
            ) : (
              <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-slate-800/50">
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Name</th>
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Score</th>
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                    </tr></thead>
                    <tbody>
                      {paginated.map(s => (
                        <tr key={s.id} className="border-b border-slate-800/20 hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-sm text-slate-200">{s.fullname || 'Unknown'}</td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'Graded' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>{s.status || 'Pending'}</span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-300">{s.score !== undefined ? `${s.score}/${s.totalQuestions}` : '-'}</td>
                          <td className="py-3 px-4 text-sm text-slate-500">{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {hasMore && (
                  <button onClick={() => setPage(p => p + 1)}
                    className="w-full py-3 text-sm text-indigo-400 hover:text-indigo-300 font-medium bg-slate-900/40 hover:bg-slate-900/60 transition-all cursor-pointer border-t border-slate-800/30">
                    Show more ({filtered.length - paginated.length} remaining)
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'import' && <BulkImport />}
      </div>
    </div>
  )
}

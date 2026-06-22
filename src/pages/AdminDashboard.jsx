import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, Users, FileText, Search, RefreshCw, CheckCircle, AlertTriangle, BookOpen, LogOut, ChevronLeft, Download, Settings as SettingsIcon, TrendingUp, PieChart } from 'lucide-react'
import useExamStore from '../store/examStore'
import { db, auth, collection, getDocs, query, orderBy, setDoc, getDoc, settingsDocRef, signOut, onAuthStateChanged, signInWithEmailAndPassword, doc, writeBatch } from '../lib/firebase'
import SubmissionDetail from '../components/SubmissionDetail'
import QuestionBank from '../components/QuestionBank'
import ExamWizard from '../components/ExamWizard'
import BulkImport from '../components/BulkImport'
import { getFormat } from '../lib/formatPresets'
import { CardSkeleton, ListSkeleton, EmptyState, TableSkeleton } from '../components/Skeletons'

const AUDIT_COLLECTION = 'auditLogs'

async function addAuditLog(action, details) {
  try {
    const ref = doc(collection(db, AUDIT_COLLECTION))
    await setDoc(ref, {
      action,
      details,
      userEmail: auth.currentUser?.email || 'unknown',
      timestamp: new Date().toISOString(),
    })
  } catch (e) { console.warn('Audit log failed:', e) }
}

export default function AdminDashboard() {
  const navigate = useNavigate()
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
  const [page, setPage] = useState(1)
  const perPage = 20

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (user) {
        const roleDoc = await getDoc(doc(db, 'users', user.uid)).catch(() => null)
        const role = roleDoc?.data()?.role || 'admin'
        setIsAdmin(true)
        loadData()
        addAuditLog('login', { role })
      } else {
        setIsAdmin(false)
        setLoading(false)
      }
    })
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
    try {
      await signInWithEmailAndPassword(auth, email, pass)
      addAuditLog('admin_login', { email })
    } catch (err) { setLoginErr(err.message) }
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
    link.download = 'quizzer_submissions.csv'
    link.click()
    URL.revokeObjectURL(link.href)
    addAuditLog('export_csv', { count: filtered.length })
  }

  useEffect(() => { setPage(1) }, [search, statusFilter])

  const toggleQuiz = async () => {
    const next = !quizActive
    await setDoc(settingsDocRef, { isQuizActive: next })
    setQuizActive(next)
    addAuditLog('toggle_quiz', { from: quizActive, to: next })
  }

  const filtered = submissions.filter(s => {
    if (!search) return true; const q = search.toLowerCase()
    return (s.fullname || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q)
  }).filter(s => statusFilter === 'all' || (s.status || 'Pending') === statusFilter)

  const paginated = filtered.slice(0, page * perPage)
  const hasMore = paginated.length < filtered.length

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => (s.status || 'Pending') === 'Pending').length,
    graded: submissions.filter(s => s.status === 'Graded').length,
    avg: submissions.length > 0 ? Math.round(submissions.reduce((a, s) => a + (s.score || 0), 0) / submissions.length) : 0,
  }

  // Analytics data
  const gradeDistribution = (() => {
    const ranges = { '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 }
    submissions.forEach(s => {
      if (s.score === undefined || !s.totalQuestions) return
      const pct = (s.score / s.totalQuestions) * 100
      if (pct <= 25) ranges['0-25']++
      else if (pct <= 50) ranges['26-50']++
      else if (pct <= 75) ranges['51-75']++
      else ranges['76-100']++
    })
    return ranges
  })()

  const maxGradeCount = Math.max(...Object.values(gradeDistribution), 1)

  const perQuestionDifficulty = (() => {
    const qMap = {}
    submissions.forEach(s => {
      (s.answers || []).forEach(a => {
        if (!a || !a.question) return
        if (!qMap[a.question]) qMap[a.question] = { total: 0, correct: 0 }
        qMap[a.question].total++
        if (a.isCorrect) qMap[a.question].correct++
      })
    })
    return Object.entries(qMap)
      .map(([q, d]) => ({ question: q.length > 40 ? q.slice(0, 40) + '...' : q, pct: Math.round((d.correct / d.total) * 100) }))
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 10)
  })()

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Admin Login</h2>
            <p className="text-sm text-slate-500 mt-1">Sign in with your admin account</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input type="email" placeholder="Admin email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500/50" />
            <input type="password" placeholder="Password" value={pass} onChange={e => setPass(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500/50" />
            {loginErr && <p className="text-red-400 text-xs">{loginErr}</p>}
            <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all cursor-pointer">Sign In</button>
          </form>
          <button onClick={() => navigate('/')} className="w-full text-center text-sm text-slate-500 hover:text-slate-300 mt-4 cursor-pointer">&larr; Back</button>
          <p className="mt-6 text-xs text-center text-slate-700">Built with React, Tailwind CSS, and Firebase by flashweb technology</p>
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
            <h1 className="text-lg font-bold text-slate-100">Admin</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${quizActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
              {quizActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/teacher')} className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">Teacher View</button>
            <button onClick={() => signOut(auth)} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-1 mb-6 bg-slate-800/50 rounded-xl p-1 border border-slate-700/50 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'submissions', label: 'Submissions', icon: FileText },
            { id: 'questions', label: 'Questions', icon: BookOpen },
            { id: 'import', label: 'Import', icon: Users },
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
            {loading ? <CardSkeleton /> : (
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
                    <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-4 sm:p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Recent Submissions</h3>
              {loading ? <ListSkeleton count={3} /> : filtered.length === 0 ? (
                <EmptyState icon={FileText} title="No submissions yet" />
              ) : filtered.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-slate-800/30 last:border-0">
                  <p className="font-medium text-sm text-slate-200">{s.fullname || 'Unknown'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'Graded' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>{s.status || 'Pending'}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowWizard(true)} className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold transition-all cursor-pointer">
              + Create New Exam
            </button>
            {showWizard && <div className="mt-4"><ExamWizard onClose={() => setShowWizard(false)} /></div>}
          </motion.div>
        )}

        {tab === 'analytics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-400" /> Grade Distribution
              </h3>
              <div className="flex items-end gap-3 h-32">
                {Object.entries(gradeDistribution).map(([range, count]) => (
                  <div key={range} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-slate-500">{count}</span>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all"
                      style={{ height: `${(count / maxGradeCount) * 100}%`, minHeight: count > 0 ? '8px' : '0' }}
                    />
                    <span className="text-[10px] text-slate-600 whitespace-nowrap">{range}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" /> Per-Question Difficulty
              </h3>
              {perQuestionDifficulty.length === 0 ? (
                <EmptyState icon={BarChart3} title="No data yet" description="Complete submissions to see difficulty breakdown" />
              ) : (
                <div className="space-y-2">
                  {perQuestionDifficulty.map((q, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-4">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs text-slate-300 truncate">{q.question}</span>
                          <span className={`text-xs font-medium ${q.pct >= 70 ? 'text-emerald-400' : q.pct >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{q.pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800/50 overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${
                            q.pct >= 70 ? 'bg-emerald-500' : q.pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`} style={{ width: `${q.pct}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {tab === 'submissions' && !selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500/50" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-100 text-sm focus:outline-none focus:border-indigo-500/50">
                <option value="all">All</option>
                <option value="Pending">Pending</option>
                <option value="Graded">Graded</option>
              </select>
              <button onClick={exportCSV} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer" title="Export CSV"><Download className="w-4 h-4" /></button>
              <button onClick={loadData} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"><RefreshCw className="w-4 h-4" /></button>
            </div>
            {loading ? <TableSkeleton /> : filtered.length === 0 ? (
              <EmptyState icon={FileText} title="No submissions" />
            ) : (
              <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-slate-800/50">
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Name</th>
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Format</th>
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Score</th>
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                      <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Action</th>
                    </tr></thead>
                    <tbody>
                      {paginated.map(s => (
                        <tr key={s.id} className="border-b border-slate-800/20 hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-sm text-slate-200">{s.fullname || 'Unknown'}</td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'Graded' ? 'bg-emerald-500/15 text-emerald-400' : s.status === 'Survey' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-amber-500/15 text-amber-400'}`}>{s.status || 'Pending'}</span>
                          </td>
                          <td className="py-3 px-4">
                            {(() => { const fmt = getFormat(s.format); return fmt ? <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${fmt.badgeClass}`}>{fmt.label}</span> : <span className="text-xs text-slate-600">—</span> })()}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-300">{s.score !== undefined ? `${s.score}/${s.totalQuestions}` : '-'}</td>
                          <td className="py-3 px-4 text-sm text-slate-500">{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : '-'}</td>
                          <td className="py-3 px-4 text-right"><button onClick={() => setSelected(s)} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">View</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden space-y-2 p-3">
                  {paginated.map(s => {
                    const fmt = s.format ? getFormat(s.format) : null
                    return (
                    <div key={s.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-slate-200 truncate">{s.fullname || 'Unknown'}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'Graded' ? 'bg-emerald-500/15 text-emerald-400' : s.status === 'Survey' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-amber-500/15 text-amber-400'}`}>{s.status || 'Pending'}</span>
                          {fmt && <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${fmt.badgeClass}`}>{fmt.label}</span>}
                          <span className="text-xs text-slate-500">{s.score !== undefined ? `${s.score}/${s.totalQuestions}` : '-'}</span>
                          <span className="text-xs text-slate-600">{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : ''}</span>
                        </div>
                      </div>
                      <button onClick={() => setSelected(s)} className="flex-shrink-0 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer">View</button>
                    </div>
                    )
                  })}
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
        {tab === 'submissions' && selected && <SubmissionDetail submission={selected} onBack={() => setSelected(null)} />}

        {tab === 'questions' && <QuestionBank />}

        {tab === 'import' && <BulkImport />}

        {tab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-5 sm:p-6 max-w-lg">
            <h3 className="text-base font-semibold text-slate-100 mb-4">Exam Settings</h3>
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
      <div className="border-t border-slate-800/50 mt-8 py-4 text-center text-xs text-slate-600">
        Built with React, Tailwind CSS, and Firebase by flashweb technology
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Check, BookOpen, Settings, Calendar, List } from 'lucide-react'
import { db, collection, getDocs, addDoc } from '../lib/firebase'

const steps = [
  { id: 'info', label: 'Info', icon: BookOpen },
  { id: 'questions', label: 'Questions', icon: List },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
]

export default function ExamWizard({ onClose }) {
  const [step, setStep] = useState(0)
  const [allQuestions, setAllQuestions] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', duration: 60, passingScore: 70, maxAttempts: 3,
    shuffleQuestions: true, showResults: false,
    aiProctoring: true, screenRecording: false, faceDetection: true, passwordRequired: false,
    startDate: '', endDate: '', selfPaced: false,
  })

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "questions"))
        const qs = []
        snap.forEach(d => qs.push({ id: d.id, ...d.data() }))
        setAllQuestions(qs)
      } catch { setError('Could not load questions') }
    }
    load()
  }, [])

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleQuestion = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleCreate = async () => {
    if (!form.title) { setError('Title is required'); return }
    if (selectedIds.size === 0) { setError('Select at least one question'); return }
    setSaving(true)
    setError('')
    try {
      await addDoc(collection(db, "exams"), {
        ...form,
        questionIds: [...selectedIds],
        createdAt: new Date().toISOString(),
      })
      onClose()
    } catch (e) {
      setError('Failed to create exam: ' + e.message)
    }
    setSaving(false)
  }

  const render = () => {
    switch (step) {
      case 0: return (
        <div className="space-y-4">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Title *</label>
            <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Midterm Exam"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50" /></div>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Duration (min)</label>
              <input type="number" value={form.duration} onChange={e => update('duration', parseInt(e.target.value) || 0)} min={1}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-100 focus:outline-none focus:border-indigo-500/50" /></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Passing %</label>
              <input type="number" value={form.passingScore} onChange={e => update('passingScore', parseInt(e.target.value) || 0)} min={0} max={100}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-100 focus:outline-none focus:border-indigo-500/50" /></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Attempts</label>
              <input type="number" value={form.maxAttempts} onChange={e => update('maxAttempts', parseInt(e.target.value) || 1)} min={1}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-100 focus:outline-none focus:border-indigo-500/50" /></div>
          </div>
        </div>
      )
      case 1: return (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          <p className="text-xs text-slate-500 mb-3">{selectedIds.size} selected — click questions to toggle</p>
          {allQuestions.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No questions in the database</p>
          ) : allQuestions.map(q => {
            const sel = selectedIds.has(q.id)
            return (
              <div key={q.id} onClick={() => toggleQuestion(q.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${sel ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600'}`}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${sel ? 'border-indigo-500 bg-indigo-500' : 'border-slate-600'}`}>
                  {sel && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-200 truncate">{q.question}</p>
                  <p className="text-xs text-slate-500">{q.category || 'General'} — {q.type === 'multiple-choice' ? 'MCQ' : 'Short Answer'}</p>
                </div>
              </div>
            )
          })}
        </div>
      )
      case 2: return (
        <div className="space-y-4">
          {[
            { k: 'aiProctoring', l: 'AI Proctoring' },
            { k: 'screenRecording', l: 'Screen Recording' },
            { k: 'faceDetection', l: 'Face Detection' },
            { k: 'passwordRequired', l: 'Password Required' },
          ].map(t => (
            <label key={t.k} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-slate-200">{t.l}</span>
              <button onClick={() => update(t.k, !form[t.k])}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${form[t.k] ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${form[t.k] ? 'translate-x-5' : ''}`} />
              </button>
            </label>
          ))}
        </div>
      )
      case 3: return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Start</label><input type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-100 focus:outline-none focus:border-indigo-500/50" /></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">End</label><input type="date" value={form.endDate} onChange={e => update('endDate', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-100 focus:outline-none focus:border-indigo-500/50" /></div>
          </div>
          <label className="flex items-center justify-between cursor-pointer">
            <div><span className="text-sm text-slate-200">Self-paced</span><p className="text-xs text-slate-600">No time limit</p></div>
            <button onClick={() => update('selfPaced', !form.selfPaced)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${form.selfPaced ? 'bg-indigo-500' : 'bg-slate-700'}`}>
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${form.selfPaced ? 'translate-x-5' : ''}`} />
            </button>
          </label>
        </div>
      )
    }
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5 sm:p-6">
      <div className="flex items-center gap-1 sm:gap-2 mb-6 overflow-x-auto">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
            <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-sm font-medium whitespace-nowrap transition-all
              ${i === step ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' :
                i < step ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                'bg-slate-800 text-slate-500 border border-slate-700/50'}`}>
              {i < step ? <Check className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-slate-800/50 min-w-[8px]" />}
          </div>
        ))}
      </div>

      {render()}

      {error && step > 0 && <p className="text-red-400 text-sm mt-3">{error}</p>}

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/30">
        <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">Cancel</button>
        <div className="flex gap-2">
          {step > 0 && <button onClick={() => setStep(s => s-1)}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-700 text-slate-200 text-sm font-medium hover:bg-slate-600 transition-all cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>}
          {step < steps.length - 1 ? (
            <button onClick={() => { setError(''); setStep(s => s+1) }} disabled={step === 0 && !form.title}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-50">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleCreate} disabled={saving}
              className="flex items-center gap-1 px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-50">
              <Check className="w-4 h-4" /> {saving ? 'Creating...' : 'Create'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

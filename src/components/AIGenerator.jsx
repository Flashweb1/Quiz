import { useState } from 'react'
import { Sparkles, Check, X, RefreshCw, BookOpen, Save, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { db, collection, addDoc } from '../lib/firebase'
import { generateQuestions } from '../lib/ai'

export default function AIGenerator({ onComplete }) {
  const [topic, setTopic] = useState('')
  const [type, setType] = useState('mixed')
  const [count, setCount] = useState(10)
  const [category, setCategory] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingIdx, setEditingIdx] = useState(null)
  const [editData, setEditData] = useState(null)

  const handleGenerate = async () => {
    if (!topic.trim()) { setError('Enter a topic'); return }
    setError('')
    setGenerating(true)
    setGenerated([])
    try {
      const questions = await generateQuestions({
        topic: topic.trim(),
        count,
        type,
        category: category.trim() || topic.trim(),
      })
      setGenerated(questions)
    } catch (e) {
      setError(e.message)
    }
    setGenerating(false)
  }

  const startEdit = (idx) => {
    setEditingIdx(idx)
    setEditData({ ...generated[idx] })
  }

  const saveEdit = () => {
    if (editingIdx === null) return
    const next = [...generated]
    next[editingIdx] = { ...editData }
    setGenerated(next)
    setEditingIdx(null)
    setEditData(null)
  }

  const removeQuestion = (idx) => {
    setGenerated(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSaveAll = async () => {
    if (generated.length === 0) return
    setSaving(true)
    setError('')
    try {
      for (const q of generated) {
        await addDoc(collection(db, "questions"), q)
      }
      onComplete?.(generated.length)
    } catch (e) {
      setError('Failed to save: ' + e.message)
    }
    setSaving(false)
  }

  const phases = ['Generating questions...', 'Analyzing topic...', 'Creating answers...', 'Formatting output...']
  const [phaseIdx, setPhaseIdx] = useState(0)
  useState(() => {
    if (generating) {
      const interval = setInterval(() => setPhaseIdx(i => (i + 1) % phases.length), 2000)
      return () => clearInterval(interval)
    }
    setPhaseIdx(0)
  })

  return (
    <div>
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-6">
        <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" /> AI Question Generator
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input type="text" placeholder="Topic (e.g., Photosynthesis, World War II, Python loops)" value={topic}
            onChange={e => setTopic(e.target.value)}
            className="sm:col-span-2 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500/50" />
          <select value={type} onChange={e => setType(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50 text-slate-200 text-sm focus:outline-none focus:border-indigo-500/50">
            <option value="mixed">Mixed (MCQ + Short Answer)</option>
            <option value="multiple-choice">Multiple Choice only</option>
            <option value="short-answer">Short Answer only</option>
          </select>
          <div className="flex gap-3">
            <select value={count} onChange={e => setCount(parseInt(e.target.value))}
              className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50 text-slate-200 text-sm focus:outline-none focus:border-indigo-500/50">
              <option value={5}>5 questions</option>
              <option value={10}>10 questions</option>
              <option value={15}>15 questions</option>
              <option value={20}>20 questions</option>
            </select>
            <input type="text" placeholder="Category (optional)" value={category}
              onChange={e => setCategory(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500/50" />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <button onClick={handleGenerate} disabled={generating || !topic.trim()}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
          {generating ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> {phases[phaseIdx]}</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Generate Questions</>
          )}
        </button>
      </div>

      {/* Generated questions preview */}
      {generated.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" /> Preview ({generated.length} questions)
            </h4>
            <div className="flex gap-2">
              <button onClick={handleGenerate} disabled={generating}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/50 text-slate-400 text-xs hover:text-slate-200 transition-all cursor-pointer disabled:opacity-50">
                <RefreshCw className="w-3 h-3" /> Regenerate
              </button>
              <button onClick={handleSaveAll} disabled={saving || generated.length === 0}
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50">
                <Save className="w-3 h-3" /> {saving ? 'Saving...' : `Save All (${generated.length})`}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {generated.map((q, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                {editingIdx === i ? (
                  <div className="space-y-2">
                    <input value={editData.question} onChange={e => setEditData(d => ({ ...d, question: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/50 text-slate-100 text-sm focus:outline-none focus:border-indigo-500/50" />
                    {editData.type === 'multiple-choice' && (
                      <input value={editData.options.join(', ')} onChange={e => setEditData(d => ({ ...d, options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/50 text-slate-100 text-sm focus:outline-none focus:border-indigo-500/50" placeholder="Options (comma-separated)" />
                    )}
                    <div className="flex gap-2">
                      <input value={editData.answer} onChange={e => setEditData(d => ({ ...d, answer: e.target.value }))}
                        className="flex-1 px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/50 text-emerald-400 text-sm focus:outline-none focus:border-indigo-500/50" placeholder="Correct answer" />
                      <button onClick={saveEdit} className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer">Done</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-600 font-mono">Q{i + 1}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-medium">{q.category || 'General'}</span>
                        <span className="text-[10px] text-slate-500">{q.type === 'multiple-choice' ? 'MCQ' : 'Short Answer'}</span>
                      </div>
                      <p className="text-sm text-slate-100 font-medium">{q.question}</p>
                      {q.type === 'multiple-choice' && q.options?.length > 0 && (
                        <p className="text-xs text-slate-500 mt-1">Options: {q.options.join(', ')}</p>
                      )}
                      <p className="text-xs text-emerald-400 mt-1">Answer: {q.answer}</p>
                      {q.reference && <p className="text-[11px] text-amber-400/70 mt-0.5">Ref: {q.reference}</p>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(i)} className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => removeQuestion(i)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="flex justify-end mt-4">
            <button onClick={handleSaveAll} disabled={saving || generated.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : `Save All to Database (${generated.length})`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

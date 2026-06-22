import { useEffect, useState } from 'react'
import { Plus, Trash2, RefreshCw, BookOpen, Sparkles, List } from 'lucide-react'
import { motion } from 'framer-motion'
import { db, collection, getDocs, addDoc, deleteDoc, doc, writeBatch } from '../lib/firebase'
import { demoQuestions } from '../lib/demoQuestions'
import AIGenerator from './AIGenerator'

export default function QuestionBank() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('list')
  const [form, setForm] = useState({ type: 'multiple-choice', category: '', question: '', options: '', answer: '', reference: '' })

  useEffect(() => { loadQuestions() }, [])

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, "questions"))
      const qs = []
      snap.forEach(d => qs.push({ id: d.id, ...d.data() }))
      setQuestions(qs)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!form.category || !form.question || !form.answer) return
    const opts = form.type === 'multiple-choice' ? form.options.split(',').map(s => s.trim()).filter(Boolean) : []
    if (form.type === 'multiple-choice' && opts.length === 0) return
    try {
      await addDoc(collection(db, "questions"), {
        type: form.type, category: form.category, question: form.question,
        options: opts, answer: form.answer, reference: form.reference,
      })
      setForm({ type: 'multiple-choice', category: '', question: '', options: '', answer: '', reference: '' })
      loadQuestions()
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this question?')) return
    try {
      await deleteDoc(doc(db, "questions", id))
      loadQuestions()
    } catch (e) { console.error(e) }
  }

  const seedDemo = async () => {
    if (!confirm('Seed demo questions?')) return
    try {
      const batch = writeBatch(db)
      demoQuestions.forEach((q) => {
        const newDocRef = doc(collection(db, "questions"))
        batch.set(newDocRef, q)
      })
      await batch.commit()
      loadQuestions()
    } catch (e) { console.error(e) }
  }

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-100">Question Bank ({questions.length})</h3>
        <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
          <button onClick={() => setMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${mode === 'list' ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}>
            <List className="w-3.5 h-3.5" /> List
          </button>
          <button onClick={() => setMode('generate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${mode === 'generate' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}>
            <Sparkles className="w-3.5 h-3.5" /> AI Generate
          </button>
        </div>
      </div>

      {mode === 'generate' ? (
        <AIGenerator onComplete={(n) => { loadQuestions(); setMode('list') }} />
      ) : (
        <>
          {/* Add form */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-6">
            <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" /> Add New Question
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/50 text-slate-200 text-sm focus:outline-none focus:border-indigo-500/50">
                <option value="multiple-choice">Multiple Choice</option>
                <option value="short-answer">Short Answer</option>
              </select>
              <input type="text" placeholder="Category (e.g. Science)" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500/50" />
              <input type="text" placeholder="Question text" value={form.question}
                onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                className="sm:col-span-2 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500/50" />
              {form.type === 'multiple-choice' && (
                <input type="text" placeholder="Comma-separated options (Earth, Mars, Jupiter, Saturn)" value={form.options}
                  onChange={e => setForm(f => ({ ...f, options: e.target.value }))}
                  className="sm:col-span-2 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500/50" />
              )}
              <input type="text" placeholder="Correct answer" value={form.answer}
                onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500/50" />
              <input type="text" placeholder="Reference (optional)" value={form.reference}
                onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500/50" />
            </div>
            <button onClick={handleAdd}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all cursor-pointer">
              Add Question
            </button>
          </div>

          {/* Question list */}
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p>No questions in the database</p>
              <p className="text-sm">Add questions manually, seed demo data, or use AI to generate them</p>
              <div className="flex gap-2 justify-center mt-4">
                <button onClick={seedDemo} className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 text-sm hover:bg-slate-600 transition-all cursor-pointer">Seed Demo</button>
                <button onClick={() => setMode('generate')} className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30 transition-all cursor-pointer flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> AI Generate
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-end gap-2 mb-2">
                <button onClick={seedDemo} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 text-xs hover:text-slate-200 transition-all cursor-pointer">
                  <RefreshCw className="w-3 h-3" /> Seed Demo
                </button>
                <button onClick={loadQuestions} className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 transition-all cursor-pointer">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              {questions.map((q) => (
                <div key={q.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-medium">{q.category || 'General'}</span>
                      <span className="text-xs text-slate-500">{q.type === 'multiple-choice' ? 'MCQ' : 'Short Answer'}</span>
                    </div>
                    <p className="text-slate-200 font-medium text-sm">{q.question}</p>
                    <p className="text-emerald-400 text-xs mt-1">Answer: {q.answer}</p>
                    {q.reference && <p className="text-amber-400/70 text-xs mt-0.5">Ref: {q.reference}</p>}
                  </div>
                  <button onClick={() => handleDelete(q.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

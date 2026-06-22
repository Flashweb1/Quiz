import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react'
import { db, collection, writeBatch, doc } from '../lib/firebase'

export default function BulkImport() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef()

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) { setPreview([]); return }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const nameIdx = headers.indexOf('name') === -1 ? 0 : headers.indexOf('name')
      const emailIdx = headers.indexOf('email') === -1 ? 1 : headers.indexOf('email')
      const rows = lines.slice(1).map(l => {
        const cols = l.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
        return { name: cols[nameIdx] || '', email: cols[emailIdx] || '' }
      }).filter(r => r.name || r.email)
      setPreview(rows.slice(0, 20))
    }
    reader.readAsText(f)
  }

  const importStudents = async () => {
    if (preview.length === 0) return
    setImporting(true)
    let success = 0, failed = 0
    try {
      const batch = writeBatch(db)
      for (const row of preview) {
        if (!row.name && !row.email) { failed++; continue }
        const ref = doc(collection(db, 'students'))
        batch.set(ref, {
          name: row.name,
          email: row.email,
          role: 'student',
          importedAt: new Date().toISOString(),
        })
        success++
      }
      await batch.commit()
      setResult({ success, failed })
    } catch (e) {
      setResult({ success, failed: preview.length, error: e.message })
    }
    setImporting(false)
    setFile(null)
    setPreview([])
    if (fileRef.current) fileRef.current.value = ''
  }

  const downloadTemplate = () => {
    const csv = 'Name,Email\nJohn Doe,john@example.com\nJane Smith,jane@example.com'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'student_import_template.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-5 sm:p-6">
        <h3 className="text-base font-semibold text-slate-100 mb-2 flex items-center gap-2">
          <Upload className="w-4 h-4 text-indigo-400" /> Bulk Import Students
        </h3>
        <p className="text-sm text-slate-500 mb-4">Upload a CSV file with Name and Email columns.</p>

        {!result && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={downloadTemplate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 text-sm hover:bg-slate-700/60 transition-all cursor-pointer">
                <Download className="w-4 h-4" /> Download Template
              </button>
            </div>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 hover:border-indigo-500/30 transition-all cursor-pointer">
              <Upload className="w-6 h-6 text-slate-500 mb-2" />
              <span className="text-sm text-slate-400">{file ? file.name : 'Click to upload CSV'}</span>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
            </label>
            {preview.length > 0 && (
              <div>
                <p className="text-sm text-slate-400 mb-2">{preview.length} student{preview.length !== 1 ? 's' : ''} detected</p>
                <div className="max-h-40 overflow-y-auto space-y-1 mb-3">
                  {preview.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/30 rounded-lg px-3 py-1.5">
                      <FileText className="w-3 h-3 text-slate-500" />
                      {r.name} {r.email ? `<${r.email}>` : ''}
                    </div>
                  ))}
                </div>
                <button onClick={importStudents} disabled={importing}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-50">
                  {importing ? 'Importing...' : `Import ${preview.length} Student${preview.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${result.error ? 'bg-red-500/10 border-red-500/20' : result.success > 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
              {result.error ? <XCircle className="w-5 h-5 text-red-400" /> : result.success > 0 ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-amber-400" />}
              <div>
                <p className="text-sm font-medium text-slate-200">{result.error ? 'Import failed' : `${result.success} student${result.success !== 1 ? 's' : ''} imported`}</p>
                {result.failed > 0 && <p className="text-xs text-slate-500">{result.failed} failed</p>}
              </div>
            </div>
            {result.error && <p className="text-xs text-red-400">{result.error}</p>}
            <button onClick={() => setResult(null)} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">Import another file</button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

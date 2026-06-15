import { useState, useRef } from 'react'
import { uploadFile, loadSample } from '../api'
import toast from 'react-hot-toast'
import { Upload as UploadIcon, Database, ArrowRight, Brain, FileText } from 'lucide-react'

const SAMPLES = [
  {
    key: 'sales', emoji: '📈', label: 'Sales Performance',
    desc: '500 rows · revenue, products, regions',
    detail: 'Includes a built-in Q3 revenue dip — perfect for demonstrating trend analysis',
    color: 'text-brand-600 bg-brand-50 border-brand-200 hover:border-brand-500 ring-brand-100'
  },
  {
    key: 'students', emoji: '🎓', label: 'Student Performance',
    desc: '300 rows · scores, study hours, attendance',
    detail: 'Explore how study habits, sleep, and attendance correlate with exam scores',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:border-indigo-500 ring-indigo-100'
  },
]

export default function Upload({ onSessionReady }) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(null)
  const inputRef = useRef()

  const handleFile = async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['csv', 'xlsx', 'xls', 'json'].includes(ext)) {
      toast.error('Supported: CSV, Excel (.xlsx), JSON'); return
    }
    setLoading('upload')
    try {
      const res = await uploadFile(file)
      toast.success(`✅ ${res.data.shape?.rows?.toLocaleString()} rows loaded`)
      onSessionReady(res.data)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Upload failed — is the backend running?')
    } finally { setLoading(null) }
  }

  const handleSample = async (key) => {
    setLoading(key)
    try {
      const res = await loadSample(key)
      toast.success('✅ Sample dataset loaded')
      onSessionReady(res.data)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load sample — is the backend running?')
    } finally { setLoading(null) }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-8 bg-gray-50 text-gray-900 font-sans">

      {/* Header */}
      <div className="text-center mb-10 max-w-lg mx-auto">
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center shadow-md">
            <Brain size={24} className="text-white" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          Choose Your Dataset
        </h1>
        <p className="text-gray-500 text-base leading-relaxed">
          Upload your own data or try a sample — the AI agent will analyze it autonomously.
        </p>
      </div>

      <div className="w-full max-w-2xl">
        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-2xl p-10 sm:p-12 text-center cursor-pointer transition-all duration-200 mb-8
            ${dragging ? 'border-brand-500 bg-brand-50' : 'border-gray-300 bg-white hover:border-brand-400 hover:bg-gray-50'}
            ${loading === 'upload' ? 'pointer-events-none opacity-80' : ''}
          `}
        >
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.json" className="hidden" onChange={e => handleFile(e.target.files[0])} />

          {loading === 'upload' ? (
            <div className="flex flex-col items-center gap-4">
              <div className="spinner w-8 h-8 border-3 border-gray-200 border-t-brand-600 rounded-full animate-spin"></div>
              <span className="text-gray-600 font-medium">Processing your dataset...</span>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-5 shadow-sm">
                <UploadIcon size={28} className="text-brand-600" />
              </div>
              <div className="text-lg font-bold text-gray-900 mb-2">
                Drop your dataset here
              </div>
              <div className="text-sm text-gray-500 mb-6">
                CSV, Excel (.xlsx), JSON &middot; max 50MB
              </div>
              <span className="btn btn-glass inline-flex">
                <Database size={16} /> Browse Files
              </span>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">OR TRY A SAMPLE</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Sample cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          {SAMPLES.map(s => (
            <button key={s.key} onClick={() => handleSample(s.key)} disabled={!!loading}
              className={`
                text-left p-6 rounded-xl border transition-all duration-200 bg-white
                ${loading === s.key ? 'border-brand-500 shadow-md ring-1 ring-brand-500' : 'border-gray-200 shadow-sm'}
                ${!loading ? s.color.split(' ').map(c => `hover:${c}`).join(' ') : ''}
                ${loading && loading !== s.key ? 'opacity-50' : 'opacity-100'}
              `}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-3xl">{s.emoji}</span>
                {loading === s.key
                  ? <div className="spinner w-5 h-5 border-2 border-gray-200 border-t-brand-600 rounded-full animate-spin"></div>
                  : <ArrowRight size={18} className="text-gray-400" />
                }
              </div>
              <div className="text-base font-bold text-gray-900 mb-1">
                {s.label}
              </div>
              <div className="text-xs font-mono text-gray-500 mb-3 bg-gray-50 inline-block px-2 py-0.5 rounded border border-gray-100">
                {s.desc}
              </div>
              <div className="text-sm text-gray-600 leading-relaxed">
                {s.detail}
              </div>
            </button>
          ))}
        </div>

        {/* Features strip */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-12">
          {['🤖 Agentic AI', '📊 Auto Charts', '💬 Follow-up Chat', '📁 Export Report'].map(f => (
            <span key={f} className="text-xs font-medium text-gray-500 uppercase tracking-wider bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">{f}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

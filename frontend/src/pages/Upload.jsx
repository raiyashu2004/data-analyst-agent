import { useState, useRef } from 'react'
import { uploadFile, loadSample } from '../api'
import toast from 'react-hot-toast'
import { Upload as UploadIcon, Database, Zap, ArrowRight, Brain } from 'lucide-react'

const SAMPLES = [
  {
    key: 'sales', emoji: '📈', label: 'Sales Performance',
    desc: '500 rows · revenue, products, regions',
    detail: 'Includes a built-in Q3 revenue dip — perfect for demonstrating trend analysis',
    color: 'var(--neon)'
  },
  {
    key: 'students', emoji: '🎓', label: 'Student Performance',
    desc: '300 rows · scores, study hours, attendance',
    detail: 'Explore how study habits, sleep, and attendance correlate with exam scores',
    color: 'var(--neon-2)'
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48, maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--neon), var(--neon-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(13,242,192,0.3)'
          }}>
            <Brain size={22} color="#000" />
          </div>
        </div>
        <h1 style={{
          fontFamily: 'var(--f-display)', fontSize: 36, fontWeight: 700,
          letterSpacing: '-0.03em', marginBottom: 12
        }}>
          Choose Your Dataset
        </h1>
        <p style={{ fontSize: 15, color: 'var(--t2)', lineHeight: 1.6 }}>
          Upload your own data or try a sample — the AI agent will analyze it autonomously.
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 680 }}>
        {/* Drop zone */}
        <div
          className="anim-up-1"
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--neon)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 16, padding: '44px 32px', textAlign: 'center', cursor: 'pointer',
            background: dragging ? 'rgba(13,242,192,0.04)' : 'rgba(255,255,255,0.02)',
            transition: 'all .2s', marginBottom: 24,
            boxShadow: dragging ? '0 0 40px rgba(13,242,192,0.1)' : 'none'
          }}
        >
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.json"
            style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

          {loading === 'upload' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
              <span style={{ color: 'var(--t2)', fontSize: 14 }}>Processing your dataset...</span>
            </div>
          ) : (
            <>
              <div style={{
                width: 60, height: 60, borderRadius: 14, margin: '0 auto 18px',
                background: 'rgba(13,242,192,0.08)', border: '1px solid var(--b2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 30px rgba(13,242,192,0.08)'
              }}>
                <UploadIcon size={24} color="var(--neon)" />
              </div>
              <div style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 17, marginBottom: 6 }}>
                Drop your dataset here
              </div>
              <div style={{ color: 'var(--t2)', fontSize: 13, marginBottom: 18 }}>
                CSV, Excel (.xlsx), JSON · max 50MB
              </div>
              <span className="btn btn-glass" style={{ display: 'inline-flex', fontSize: 13 }}>
                <Database size={14} /> Browse Files
              </span>
            </>
          )}
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--b1))' }} />
          <span style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--f-mono)' }}>OR TRY A SAMPLE</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--b1), transparent)' }} />
        </div>

        {/* Sample cards */}
        <div className="anim-up-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {SAMPLES.map(s => (
            <button key={s.key} onClick={() => handleSample(s.key)} disabled={!!loading}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${loading === s.key ? s.color : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 14, padding: '20px', textAlign: 'left', cursor: 'pointer',
                transition: 'all .2s', opacity: loading && loading !== s.key ? 0.5 : 1,
                boxShadow: loading === s.key ? `0 0 30px ${s.color}20` : 'none'
              }}
              onMouseOver={e => { if (!loading) { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.background = `${s.color}06` } }}
              onMouseOut={e => { if (!loading) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 28 }}>{s.emoji}</span>
                {loading === s.key
                  ? <div className="spinner" />
                  : <ArrowRight size={16} color={s.color} style={{ opacity: 0.5 }} />
                }
              </div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 15, fontWeight: 600, marginBottom: 4, color: 'var(--t1)' }}>
                {s.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--f-mono)', marginBottom: 8 }}>
                {s.desc}
              </div>
              <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>
                {s.detail}
              </div>
            </button>
          ))}
        </div>

        {/* Features strip */}
        <div className="anim-up-3" style={{
          display: 'flex', gap: 20, justifyContent: 'center', marginTop: 32,
          flexWrap: 'wrap'
        }}>
          {['🤖 Agentic AI', '📊 Auto Charts', '💬 Follow-up Chat', '📁 Export Report'].map(f => (
            <span key={f} style={{ fontSize: 12, color: 'var(--t3)', fontFamily: 'var(--f-mono)' }}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { startAnalysis } from '../api'
import toast from 'react-hot-toast'
import { Send, RotateCcw, ChevronDown, ChevronUp, Cpu, History, X, Clock } from 'lucide-react'
import Report from '../components/Report'
import AgentLog from '../components/AgentLog'
import DataProfile from '../components/DataProfile'
import { useHistory } from '../hooks/useHistory'

const PROVIDERS = [
  { value: 'gemini', label: '♊ Gemini', color: '#34a853' },
  { value: 'claude', label: '⚡ Claude', color: '#f5a623' },
  { value: 'openai', label: '🤖 GPT-4', color: '#4d9fff' },
]

const SAMPLE_QUESTIONS = {
  sales: [
    "What's causing the Q3 revenue decline and which products are most affected?",
    "Which sales region is underperforming and why?",
    "What's the correlation between discounts and units sold?",
  ],
  students: [
    "What factors most strongly predict student performance?",
    "Which students are at risk of failing and why?",
    "How does study hours correlate with exam scores?",
  ],
  default: [
    "Give me a comprehensive analysis of this dataset",
    "What are the most important trends and anomalies?",
    "What insights can you find from this data?",
  ]
}

export default function Analyze({ session, onReset }) {
  const [question, setQuestion] = useState(session._suggestedQ || '')
  const [provider, setProvider] = useState('gemini')
  const [running, setRunning] = useState(false)
  const [steps, setSteps] = useState([])
  const [charts, setCharts] = useState([])
  const [report, setReport] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const esRef = useRef(null)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const { history, save, clear } = useHistory()

  // Detect sample type for suggested questions
  const sampleType = session.filename?.includes('sales') ? 'sales'
    : session.filename?.includes('student') ? 'students' : 'default'
  const suggestedQs = SAMPLE_QUESTIONS[sampleType]

  useEffect(() => () => { esRef.current?.close(); clearInterval(timerRef.current) }, [])

  const run = () => {
    if (!question.trim() || running) return
    esRef.current?.close()
    setRunning(true)
    setSteps([])
    setCharts([])
    setReport(null)
    setElapsedTime(0)

    // Start timer
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)

    const es = startAnalysis(session.session_id, question, provider)
    esRef.current = es

    es.onmessage = (e) => {
      const event = JSON.parse(e.data)
      if (event.type === 'end') { es.close(); setRunning(false); clearInterval(timerRef.current); return }
      if (event.type === 'error') { toast.error(event.message); es.close(); setRunning(false); clearInterval(timerRef.current); return }
      if (event.type === 'chart') { setCharts(prev => [...prev, event.data]); return }
      if (event.type === 'report') {
        setReport(event.report)
        if (event.charts) setCharts(event.charts)
        // Save to history
        save({
          filename: session.filename,
          question,
          provider,
          reportTitle: event.report.title,
          findingsCount: event.report.key_findings?.length || 0,
          chartsCount: (event.charts || []).length,
        })
        setRunning(false)
        clearInterval(timerRef.current)
        es.close()
        return
      }
      if (event.type === 'done') { setRunning(false); clearInterval(timerRef.current); return }
      setSteps(prev => [...prev, event])
    }
    es.onerror = () => { toast.error('Connection lost. Is the backend running?'); setRunning(false); clearInterval(timerRef.current) }
  }

  const stop = () => { esRef.current?.close(); setRunning(false); clearInterval(timerRef.current); toast('Analysis stopped') }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
        borderBottom: '1px solid var(--b1)',
        background: 'rgba(2,4,8,0.9)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, var(--neon), var(--neon-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Cpu size={13} color="#000" />
          </div>
          <span style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 15 }}>DataTwin Agent</span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* History button */}
          <button onClick={() => setShowHistory(p => !p)} className="btn btn-ghost"
            style={{ padding: '6px 12px', fontSize: 12, position: 'relative' }}>
            <History size={13} />
            History
            {history.length > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: 'var(--neon)', color: '#000',
                width: 16, height: 16, borderRadius: '50%',
                fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700
              }}>
                {history.length}
              </span>
            )}
          </button>

          {/* Dataset info */}
          <button onClick={() => setShowProfile(p => !p)} className="btn btn-ghost"
            style={{ padding: '6px 12px', fontSize: 12 }}>
            📁 {session.filename}
            <span style={{ color: 'var(--t3)', fontFamily: 'var(--f-mono)', fontSize: 10 }}>
              {session.shape?.rows}×{session.shape?.cols}
            </span>
            {showProfile ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          <button onClick={onReset} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>
            <RotateCcw size={12} /> New
          </button>
        </div>
      </header>

      {/* History panel */}
      {showHistory && history.length > 0 && (
        <div style={{
          position: 'fixed', top: 52, right: 0, width: 320, height: 'calc(100vh - 52px)',
          background: 'rgba(6,13,22,0.98)', borderLeft: '1px solid var(--b1)',
          backdropFilter: 'blur(20px)', zIndex: 200, overflowY: 'auto', padding: 20
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--f-display)', fontWeight: 600 }}>Analysis History</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={clear} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }}>Clear</button>
              <button onClick={() => setShowHistory(false)} className="btn btn-ghost" style={{ padding: '4px 8px' }}>
                <X size={13} />
              </button>
            </div>
          </div>
          {history.map(h => (
            <div key={h.id} style={{
              padding: '12px 14px', marginBottom: 10,
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--b1)',
              borderRadius: 10
            }}>
              <div style={{ fontSize: 12, color: 'var(--t1)', fontWeight: 500, marginBottom: 4 }}>{h.reportTitle}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6 }}>{h.question.slice(0, 60)}...</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className="tag tag-neon" style={{ fontSize: 9 }}>📁 {h.filename}</span>
                <span className="tag tag-blue" style={{ fontSize: 9 }}>📊 {h.chartsCount} charts</span>
                <span className="tag tag-amber" style={{ fontSize: 9 }}>✅ {h.findingsCount} findings</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 6, fontFamily: 'var(--f-mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={9} /> {new Date(h.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data profile (collapsible) */}
      {showProfile && <DataProfile session={session} />}

      {/* Main layout */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '360px 1fr', minHeight: 0 }}>

        {/* Left panel */}
        <div style={{ borderRight: '1px solid var(--b1)', display: 'flex', flexDirection: 'column' }}>

          {/* Question + controls */}
          <div style={{ padding: 20, borderBottom: '1px solid var(--b1)' }}>
            <div className="mono-label" style={{ marginBottom: 10 }}>YOUR QUESTION</div>
            <textarea
              className="input"
              placeholder="What do you want to know about this data?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) run() }}
              rows={4}
              disabled={running}
              style={{ resize: 'none', lineHeight: 1.6, marginBottom: 12 }}
            />

            {/* Suggested questions */}
            <div style={{ marginBottom: 12 }}>
              <div className="mono-label" style={{ marginBottom: 6, fontSize: 9 }}>QUICK START</div>
              {suggestedQs.map(q => (
                <button key={q} onClick={() => setQuestion(q)} disabled={running}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '7px 10px', marginBottom: 5, borderRadius: 7,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--b1)',
                    color: 'var(--t2)', cursor: 'pointer', fontSize: 12,
                    fontFamily: 'var(--f-body)', transition: 'all .15s',
                    lineHeight: 1.4
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--b2)'; e.currentTarget.style.color = 'var(--t1)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.color = 'var(--t2)' }}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Provider pills */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {PROVIDERS.map(p => (
                <button key={p.value} onClick={() => setProvider(p.value)}
                  style={{
                    flex: 1, padding: '7px 8px', borderRadius: 7, border: '1px solid',
                    borderColor: provider === p.value ? p.color : 'var(--b1)',
                    background: provider === p.value ? `${p.color}12` : 'transparent',
                    color: provider === p.value ? p.color : 'var(--t3)',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'var(--f-body)', transition: 'all .15s'
                  }}>
                  {p.label}
                </button>
              ))}
            </div>

            {running ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  background: 'rgba(13,242,192,0.05)', border: '1px solid var(--b2)',
                  borderRadius: 8, fontSize: 13, color: 'var(--neon)' }}>
                  <div className="spinner" />
                  <span>Analyzing... {elapsedTime}s</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--neon)', animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
                <button onClick={stop} className="btn btn-red" style={{ justifyContent: 'center', padding: '10px' }}>
                  Stop Analysis
                </button>
              </div>
            ) : (
              <button onClick={run} className="btn btn-neon"
                disabled={!question.trim()}
                style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
                <Send size={14} /> Run Analysis
              </button>
            )}
            <div style={{ fontSize: 10, color: 'var(--t4)', textAlign: 'center', marginTop: 6, fontFamily: 'var(--f-mono)' }}>
              ⌘ + Enter to run
            </div>
          </div>

          {/* Agent log */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <AgentLog steps={steps} running={running} />
          </div>
        </div>

        {/* Right panel — report */}
        <div style={{ overflowY: 'auto', padding: 32 }}>
          {!report && !running && steps.length === 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '70%', gap: 16, opacity: 0.5, textAlign: 'center'
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(13,242,192,0.06)', border: '1px solid var(--b2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'float 3s ease-in-out infinite'
              }}>
                <Cpu size={32} color="var(--neon)" />
              </div>
              <div>
                <p style={{ fontSize: 16, fontFamily: 'var(--f-display)', fontWeight: 600, marginBottom: 6 }}>
                  Ready to Analyze
                </p>
                <p style={{ fontSize: 13, color: 'var(--t2)' }}>
                  Ask a question and the AI agent<br />will do the rest autonomously
                </p>
              </div>
            </div>
          )}

          {running && !report && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '60%', gap: 24
            }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  border: '2px solid var(--b1)',
                  borderTop: '2px solid var(--neon)',
                  animation: 'spin .8s linear infinite'
                }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Cpu size={28} color="var(--neon)" />
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--f-display)', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                  Agent Working
                </p>
                <p style={{ fontSize: 13, color: 'var(--t2)', fontFamily: 'var(--f-mono)' }}>
                  {steps.length} steps completed · {elapsedTime}s elapsed
                </p>
              </div>
              {/* Live chart preview */}
              {charts.length > 0 && (
                <div style={{ width: '100%', maxWidth: 500 }}>
                  <div className="mono-label" style={{ marginBottom: 10 }}>CHART GENERATED</div>
                  <img src={`data:image/png;base64,${charts[charts.length - 1]}`}
                    alt="chart" style={{ width: '100%', borderRadius: 10, border: '1px solid var(--b1)' }} />
                </div>
              )}
            </div>
          )}

          {report && (
            <Report
              report={report}
              charts={charts}
              question={question}
              sessionId={session.session_id}
              provider={provider}
            />
          )}
        </div>
      </div>
    </div>
  )
}

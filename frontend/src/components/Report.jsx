import { useState } from 'react'
import { CheckCircle2, Lightbulb, Download, Send, MessageSquare, TrendingUp, AlertCircle } from 'lucide-react'
import { startAnalysis } from '../api'

function FindingCard({ text, index }) {
  return (
    <div style={{
      display: 'flex', gap: 14, padding: '14px 18px',
      background: 'rgba(13,242,192,0.03)',
      border: '1px solid rgba(13,242,192,0.1)',
      borderRadius: 10, marginBottom: 10,
      animation: `fadeUp .35s ease ${index * 0.07}s both`
    }}>
      <CheckCircle2 size={16} color="var(--neon)" style={{ flexShrink: 0, marginTop: 3 }} />
      <p style={{ fontSize: 14, color: 'var(--t1)', lineHeight: 1.7 }}>{text}</p>
    </div>
  )
}

function RecommendationCard({ text, index }) {
  return (
    <div style={{
      display: 'flex', gap: 14, padding: '14px 18px',
      background: 'rgba(255,184,48,0.03)',
      border: '1px solid rgba(255,184,48,0.12)',
      borderRadius: 10, marginBottom: 10,
      animation: `fadeUp .35s ease ${index * 0.07}s both`
    }}>
      <Lightbulb size={16} color="var(--amber)" style={{ flexShrink: 0, marginTop: 3 }} />
      <p style={{ fontSize: 14, color: 'var(--t1)', lineHeight: 1.7 }}>{text}</p>
    </div>
  )
}

function ScoreBar({ label, value, max = 100, color = 'var(--neon)' }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--t2)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 12, color }}>{value}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function FollowUpChat({ sessionId, provider, onNewInsight }) {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  const QUICK_QUESTIONS = [
    'Which metric had the biggest impact?',
    'What would happen in a best-case scenario?',
    'Summarize in 3 bullet points',
    'What data is missing for deeper analysis?',
  ]

  const ask = (question) => {
    if (!question.trim() || loading) return
    setLoading(true)
    let answer = ''

    const es = startAnalysis(sessionId, question, provider)
    es.onmessage = (e) => {
      const event = JSON.parse(e.data)
      if (event.type === 'report') {
        answer = event.report.summary
      }
      if (event.type === 'thought' && !answer) {
        answer = event.message
      }
      if (event.type === 'done' || event.type === 'end') {
        es.close()
        const finalAnswer = answer || 'Analysis complete — see the agent trace for details.'
        setHistory(prev => [...prev, { q: question, a: finalAnswer }])
        onNewInsight && onNewInsight(finalAnswer)
        setLoading(false)
        setQ('')
      }
      if (event.type === 'error') {
        setHistory(prev => [...prev, { q: question, a: `Error: ${event.message}` }])
        es.close()
        setLoading(false)
        setQ('')
      }
    }
    es.onerror = () => { es.close(); setLoading(false) }
  }

  return (
    <div className="glass" style={{ padding: 24, marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'rgba(240,89,255,0.1)', border: '1px solid rgba(240,89,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <MessageSquare size={15} color="var(--neon-3)" />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--f-display)' }}>Follow-up Chat</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--f-mono)' }}>Ask deeper questions about this analysis</div>
        </div>
      </div>

      {/* Quick questions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {QUICK_QUESTIONS.map(qq => (
          <button key={qq} onClick={() => ask(qq)} disabled={loading}
            className="btn btn-ghost"
            style={{ fontSize: 11, padding: '5px 12px', borderRadius: 999 }}>
            {qq}
          </button>
        ))}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {history.map((item, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 13, color: 'var(--neon-3)',
                fontFamily: 'var(--f-mono)', marginBottom: 6
              }}>
                ❯ {item.q}
              </div>
              <div style={{
                fontSize: 13, color: 'var(--t2)', lineHeight: 1.7,
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 8, borderLeft: '2px solid var(--b2)'
              }}>
                {item.a}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          className="input"
          placeholder="Ask a follow-up question..."
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask(q)}
          disabled={loading}
        />
        <button className="btn btn-neon" onClick={() => ask(q)}
          disabled={loading || !q.trim()}
          style={{ padding: '10px 16px', flexShrink: 0 }}>
          {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Send size={14} />}
        </button>
      </div>
    </div>
  )
}

export default function Report({ report, charts, question, sessionId, provider }) {
  const exportMarkdown = () => {
    const md = `# ${report.title}

> **Question:** ${question}

## Executive Summary
${report.summary}

## Key Findings
${report.key_findings.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## Recommendations
${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## Conclusion
${report.conclusion}

---
*Generated by Autonomous Data Analyst Agent — Spring Boot + FastAPI + Gemini AI*`

    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'analysis-report.md'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="anim-up">
      {/* Report header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span className="tag tag-neon" style={{ fontSize: 10 }}>✅ ANALYSIS COMPLETE</span>
            <span className="tag tag-blue" style={{ fontSize: 10 }}>{charts.length} CHARTS</span>
            <span className="tag tag-purple" style={{ fontSize: 10 }}>{report.key_findings?.length} FINDINGS</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--f-display)', fontSize: 26, fontWeight: 700,
            lineHeight: 1.2, letterSpacing: '-0.02em'
          }}>
            {report.title}
          </h1>
        </div>
        <button onClick={exportMarkdown} className="btn btn-glass" style={{ fontSize: 12, padding: '8px 16px', flexShrink: 0 }}>
          <Download size={13} /> Export
        </button>
      </div>

      {/* Summary */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(13,242,192,0.06), rgba(77,124,255,0.04))',
        border: '1px solid rgba(13,242,192,0.15)',
        borderRadius: 12, padding: '20px 24px', marginBottom: 28,
        borderLeft: '3px solid var(--neon)'
      }}>
        <div className="mono-label" style={{ marginBottom: 10, color: 'var(--neon)' }}>EXECUTIVE SUMMARY</div>
        <p style={{ fontSize: 15, color: 'var(--t1)', lineHeight: 1.75 }}>{report.summary}</p>
      </div>

      {/* Charts */}
      {charts.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div className="mono-label" style={{ marginBottom: 16 }}>VISUALIZATIONS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {charts.map((c, i) => (
              <div key={i} style={{
                borderRadius: 12, overflow: 'hidden',
                border: '1px solid var(--b1)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)'
              }}>
                <img
                  src={`data:image/png;base64,${c}`}
                  alt={`Chart ${i + 1}`}
                  style={{ width: '100%', display: 'block' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two column layout for findings + recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div>
          <div className="mono-label" style={{ marginBottom: 16 }}>
            <TrendingUp size={10} style={{ marginRight: 4 }} />
            KEY FINDINGS
          </div>
          {report.key_findings?.map((f, i) => <FindingCard key={i} text={f} index={i} />)}
        </div>
        <div>
          <div className="mono-label" style={{ marginBottom: 16 }}>
            <Lightbulb size={10} style={{ marginRight: 4 }} />
            RECOMMENDATIONS
          </div>
          {report.recommendations?.map((r, i) => <RecommendationCard key={i} text={r} index={i} />)}
        </div>
      </div>

      {/* Conclusion */}
      <div className="glass" style={{ padding: '20px 24px', marginBottom: 8 }}>
        <div className="mono-label" style={{ marginBottom: 10 }}>CONCLUSION</div>
        <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.75 }}>{report.conclusion}</p>
      </div>

      {/* Follow-up chat */}
      <FollowUpChat sessionId={sessionId} provider={provider} />
    </div>
  )
}

import { useState } from 'react'
import { CheckCircle2, Lightbulb, Download, Send, MessageSquare, TrendingUp, Copy, Check } from 'lucide-react'
import { startAnalysis } from '../api'

function FindingCard({ text, index }) {
  if (!text || typeof text !== 'string') return null
  return (
    <div className={`flex gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-lg mb-3 opacity-0 animate-[fadeUp_0.35s_ease_both]`} style={{ animationDelay: `${index * 0.07}s` }}>
      <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
      <p className="text-sm text-emerald-900 leading-relaxed">{text}</p>
    </div>
  )
}

function RecommendationCard({ text, index }) {
  if (!text || typeof text !== 'string') return null
  return (
    <div className={`flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg mb-3 opacity-0 animate-[fadeUp_0.35s_ease_both]`} style={{ animationDelay: `${index * 0.07}s` }}>
      <Lightbulb size={18} className="text-blue-500 shrink-0 mt-0.5" />
      <p className="text-sm text-blue-900 leading-relaxed">{text}</p>
    </div>
  )
}

function FollowUpChat({ sessionId, provider }) {
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
      try {
        const event = JSON.parse(e.data)
        if (event.type === 'report') {
          answer = event.report?.summary || ''
        }
        if (event.type === 'thought' && !answer) {
          answer = event.message || ''
        }
        if (event.type === 'done' || event.type === 'end') {
          es.close()
          const finalAnswer = answer || 'Analysis complete.'
          setHistory(prev => [...prev, { q: question, a: finalAnswer }])
          setLoading(false)
          setQ('')
        }
        if (event.type === 'error') {
          setHistory(prev => [...prev, { q: question, a: `Error: ${event.message}` }])
          es.close()
          setLoading(false)
          setQ('')
        }
      } catch (err) {
        console.warn('Follow-up parse error:', err)
      }
    }
    es.onerror = () => { es.close(); setLoading(false) }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mt-8 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center">
          <MessageSquare size={18} className="text-gray-600" />
        </div>
        <div>
          <div className="text-base font-bold text-gray-900">Follow-up Questions</div>
          <div className="text-[11px] text-gray-500 font-medium mt-0.5">Ask for clarification or deeper analysis</div>
        </div>
      </div>

      {/* Quick questions */}
      <div className="flex flex-wrap gap-2 mb-6">
        {QUICK_QUESTIONS.map(qq => (
          <button key={qq} onClick={() => ask(qq)} disabled={loading}
            className="text-[11px] font-medium px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-50">
            {qq}
          </button>
        ))}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mb-6 space-y-4">
          {history.map((item, i) => (
            <div key={i}>
              <div className="text-[11px] font-medium text-gray-500 mb-1.5 ml-2">
                Q: {item.q}
              </div>
              <div className="text-sm text-gray-700 leading-relaxed p-4 bg-gray-50 rounded-md border-l-4 border-l-gray-400">
                {item.a}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          className="input text-sm"
          placeholder="Ask a question about the data..."
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask(q)}
          disabled={loading}
        />
        <button className="btn btn-neon px-5 shrink-0" onClick={() => ask(q)} disabled={loading || !q.trim()}>
          {loading ? <div className="spinner w-4 h-4 border-2" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}

export default function Report({ report, charts, question, sessionId, provider }) {
  const [copied, setCopied] = useState(false)

  // Defensive: normalize all report fields
  const title = report?.title || 'Analysis Report'
  const summary = report?.summary || 'No summary available.'
  const conclusion = report?.conclusion || 'No conclusion available.'
  const safeFindings = Array.isArray(report?.key_findings)
    ? report.key_findings.filter(f => f && typeof f === 'string')
    : (typeof report?.key_findings === 'string' ? [report.key_findings] : [])
  const safeRecommendations = Array.isArray(report?.recommendations)
    ? report.recommendations.filter(r => r && typeof r === 'string')
    : (typeof report?.recommendations === 'string' ? [report.recommendations] : [])
  const safeCharts = Array.isArray(charts) ? charts : []

  const exportMarkdown = () => {
    const md = `# ${title}\n\n> **Question:** ${question}\n\n## Executive Summary\n${summary}\n\n## Key Findings\n${safeFindings.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\n## Recommendations\n${safeRecommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n## Conclusion\n${conclusion}\n\n---\n*Generated by DataPlatform*`
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'analysis-report.md'; a.click()
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = () => {
    const text = `${title}\n\nSummary: ${summary}\n\nKey Findings:\n${safeFindings.map((f, i) => `${i+1}. ${f}`).join('\n')}\n\nRecommendations:\n${safeRecommendations.map((r, i) => `${i+1}. ${r}`).join('\n')}\n\nConclusion: ${conclusion}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="opacity-0 animate-[fadeUp_0.4s_ease_both]">
      {/* Report header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-[9px] font-bold tracking-widest uppercase bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-sm">Analysis Complete</span>
            <span className="text-[9px] font-bold tracking-widest uppercase bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-sm">{safeCharts.length} Charts</span>
            <span className="text-[9px] font-bold tracking-widest uppercase bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-sm">{safeFindings.length} Findings</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">
            {title}
          </h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={copyToClipboard} className="btn btn-ghost px-3 py-2 text-xs border border-gray-200">
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={exportMarkdown} className="btn btn-glass px-4 py-2 text-xs border border-gray-200 hover:border-gray-300">
            <Download size={14} /> Export .md
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 md:p-8 mb-8 border-l-4 border-l-gray-400 shadow-sm relative overflow-hidden">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Executive Summary</div>
        <p className="text-sm text-gray-800 leading-relaxed relative z-10">{summary}</p>
      </div>

      {/* Charts */}
      {safeCharts.length > 0 && (
        <div className="mb-10">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Visualizations</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {safeCharts.map((c, i) => (
              <div key={i} className="rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white p-2">
                <img
                  src={`data:image/png;base64,${c}`}
                  alt={`Chart ${i + 1}`}
                  className="w-full h-auto object-contain rounded-md"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two column layout for findings + recommendations */}
      <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-8">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
            <TrendingUp size={12} /> Key Findings ({safeFindings.length})
          </div>
          {safeFindings.length > 0
            ? safeFindings.map((f, i) => <FindingCard key={i} text={f} index={i} />)
            : <p className="text-xs text-gray-500 italic">No findings reported.</p>
          }
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
            <Lightbulb size={12} /> Recommendations ({safeRecommendations.length})
          </div>
          {safeRecommendations.length > 0
            ? safeRecommendations.map((r, i) => <RecommendationCard key={i} text={r} index={i} />)
            : <p className="text-xs text-gray-500 italic">No recommendations reported.</p>
          }
        </div>
      </div>

      {/* Conclusion */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 mb-4 shadow-sm">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Conclusion</div>
        <p className="text-sm text-gray-700 leading-relaxed">{conclusion}</p>
      </div>

      {/* Follow-up chat */}
      <FollowUpChat sessionId={sessionId} provider={provider} />
    </div>
  )
}

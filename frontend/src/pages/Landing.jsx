import { useState, useEffect } from 'react'
import { ArrowRight, Brain, Zap, BarChart3, MessageSquare, Sparkles, ChevronRight, Github } from 'lucide-react'

const FEATURES = [
  { icon: Brain, label: 'Agentic AI', desc: 'ReAct loop with tool use — plans, codes, corrects itself', color: 'var(--neon)' },
  { icon: BarChart3, label: 'Auto Analysis', desc: 'Pandas + Matplotlib charts generated autonomously', color: 'var(--neon-2)' },
  { icon: MessageSquare, label: 'Follow-up Chat', desc: 'Ask follow-up questions after the report', color: 'var(--neon-3)' },
  { icon: Zap, label: 'Live Streaming', desc: 'Watch every reasoning step in real time via SSE', color: 'var(--amber)' },
]

const TECH = ['Spring Boot', 'FastAPI', 'React', 'Gemini AI', 'Pandas', 'SSE', 'Java 17', 'Python 3']

const TYPED_WORDS = [
  'Sales Trends',
  'Student Performance',
  'Revenue Patterns',
  'Risk Factors',
  'Market Insights',
]

function TypedWord() {
  const [idx, setIdx] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const word = TYPED_WORDS[idx]
    let timeout
    if (!deleting && displayed.length < word.length) {
      timeout = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80)
    } else if (!deleting && displayed.length === word.length) {
      timeout = setTimeout(() => setDeleting(true), 2000)
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40)
    } else if (deleting && displayed.length === 0) {
      setDeleting(false)
      setIdx((idx + 1) % TYPED_WORDS.length)
    }
    return () => clearTimeout(timeout)
  }, [displayed, deleting, idx])

  return (
    <span style={{ color: 'var(--neon)', display: 'inline-block', minWidth: 280 }}>
      {displayed}<span style={{ animation: 'blink 1s infinite', color: 'var(--neon)' }}>|</span>
    </span>
  )
}

function FloatingOrb({ style }) {
  return (
    <div style={{
      position: 'absolute', borderRadius: '50%',
      filter: 'blur(80px)', opacity: 0.15,
      animation: 'float 6s ease-in-out infinite',
      pointerEvents: 'none', ...style
    }} />
  )
}

export default function Landing({ onStart }) {
  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden' }}>
      <FloatingOrb style={{ width: 400, height: 400, background: 'var(--neon)', top: -100, left: -100, animationDelay: '0s' }} />
      <FloatingOrb style={{ width: 300, height: 300, background: 'var(--neon-2)', top: 200, right: -80, animationDelay: '2s' }} />
      <FloatingOrb style={{ width: 250, height: 250, background: 'var(--neon-3)', bottom: 100, left: '30%', animationDelay: '4s' }} />

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px', borderBottom: '1px solid var(--b1)',
        backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(2,4,8,0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--neon), var(--neon-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Brain size={16} color="#000" />
          </div>
          <span style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 18 }}>
            DataTwin <span style={{ color: 'var(--neon)', fontSize: 12, fontFamily: 'var(--f-mono)', fontWeight: 400 }}>AGENT</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <a href="https://github.com" target="_blank" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }}>
            <Github size={14} /> GitHub
          </a>
          <button onClick={onStart} className="btn btn-neon" style={{ padding: '8px 20px', fontSize: 13 }}>
            Launch App <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '100px 24px 80px', maxWidth: 900, margin: '0 auto' }}>
        <h1 className="anim-up" style={{
          fontFamily: 'var(--f-display)', fontSize: 'clamp(40px, 7vw, 80px)',
          fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 24
        }}>
          Autonomous AI Agent<br />
          that Analyzes <TypedWord />
        </h1>

        <p className="anim-up-1" style={{
          fontSize: 18, color: 'var(--t2)', lineHeight: 1.7,
          maxWidth: 600, margin: '0 auto 40px'
        }}>
          Upload any dataset, ask a question, and watch an AI agent autonomously
          plan, write code, run analyses, generate charts, and deliver a full report.
        </p>

        <div className="anim-up-2" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onStart} className="btn btn-neon" style={{ padding: '14px 32px', fontSize: 15 }}>
            <Zap size={16} /> Try the Agent
          </button>
          <a href="#features" className="btn btn-glass" style={{ padding: '14px 32px', fontSize: 15 }}>
            See Features <ChevronRight size={14} />
          </a>
        </div>

        {/* Tech stack pills */}
        <div className="anim-up-3" style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 48 }}>
          {TECH.map(t => (
            <span key={t} style={{
              padding: '4px 12px', borderRadius: 999,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: 12, color: 'var(--t2)', fontFamily: 'var(--f-mono)'
            }}>{t}</span>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section style={{ padding: '0 24px 80px', maxWidth: 800, margin: '0 auto' }}>
        <div className="glass anim-in" style={{ padding: '28px 32px' }}>
          <div className="mono-label" style={{ marginBottom: 20, color: 'var(--t2)' }}>System Architecture</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' }}>
            {[
              { label: 'React', sub: 'Frontend', color: 'var(--neon-2)' },
              { arrow: true },
              { label: 'Spring Boot', sub: 'Gateway :8080', color: 'var(--amber)' },
              { arrow: true },
              { label: 'FastAPI', sub: 'ML Service :8001', color: 'var(--neon-3)' },
              { arrow: true },
              { label: 'Gemini AI', sub: 'Tool Use', color: 'var(--neon)' },
            ].map((item, i) => item.arrow ? (
              <div key={i} style={{ color: 'var(--t3)', padding: '0 12px', fontSize: 20, flexShrink: 0 }}>→</div>
            ) : (
              <div key={i} style={{
                padding: '12px 20px', borderRadius: 10, flexShrink: 0,
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${item.color}30`, textAlign: 'center'
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: item.color, fontFamily: 'var(--f-display)' }}>{item.label}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--f-mono)', marginTop: 3 }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '0 24px 100px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="mono-label" style={{ marginBottom: 12 }}>What it does</div>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700 }}>
            Beyond a Dashboard
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <div key={f.label} className={`glass anim-up-${i + 1}`} style={{ padding: '28px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, marginBottom: 16,
                  background: `${f.color}15`, border: `1px solid ${f.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={20} color={f.color} />
                </div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{f.label}</div>
                <div style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            )
          })}
        </div>
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <button onClick={onStart} className="btn btn-neon" style={{ padding: '16px 48px', fontSize: 16 }}>
            <Brain size={18} /> Launch Agent
          </button>
        </div>
      </section>
    </div>
  )
}

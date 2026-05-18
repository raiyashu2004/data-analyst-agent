import { useEffect, useRef } from 'react'
import { Search, BarChart3, Code2, AlertTriangle, GitBranch, FileText, Brain, CheckCircle2, XCircle } from 'lucide-react'

const TOOL_META = {
  inspect_dataset:  { icon: Search,       color: 'var(--neon-2)',  label: 'Inspect' },
  get_column_stats: { icon: BarChart3,    color: 'var(--neon)',    label: 'Stats' },
  run_analysis:     { icon: Code2,        color: 'var(--amber)',   label: 'Code' },
  detect_anomalies: { icon: AlertTriangle,color: 'var(--red)',     label: 'Anomaly' },
  correlate_columns:{ icon: GitBranch,    color: 'var(--neon-3)', label: 'Correlate' },
  generate_report:  { icon: FileText,     color: 'var(--neon)',    label: 'Report' },
}

function StepItem({ step, index }) {
  const meta = step.tool ? TOOL_META[step.tool] : null
  const Icon = meta?.icon || Brain

  const colors = {
    start:       'var(--neon)',
    thinking:    'var(--t3)',
    thought:     'var(--t2)',
    tool_start:  meta?.color || 'var(--amber)',
    tool_result: step.data?.error ? 'var(--red)' : 'var(--neon)',
    error:       'var(--red)',
    done:        'var(--neon)',
  }
  const color = colors[step.type] || 'var(--t2)'

  return (
    <div style={{
      display: 'flex', gap: 10, padding: '10px 0',
      borderBottom: '1px solid rgba(255,255,255,0.03)',
      animation: 'fadeUp .3s ease both',
      animationDelay: `${Math.min(index * 0.03, 0.5)}s`
    }}>
      {/* Step number */}
      <div style={{
        fontFamily: 'var(--f-mono)', fontSize: 9,
        color: 'var(--t4)', width: 20, paddingTop: 4, flexShrink: 0,
        textAlign: 'right'
      }}>
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* Icon */}
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        background: `${color}12`, border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2
      }}>
        {step.type === 'tool_result' && !step.data?.error
          ? <CheckCircle2 size={11} color={color} />
          : step.type === 'error' || step.data?.error
          ? <XCircle size={11} color="var(--red)" />
          : <Icon size={11} color={color} />
        }
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, color, lineHeight: 1.5,
          wordBreak: 'break-word',
          fontFamily: step.type === 'thinking' ? 'var(--f-mono)' : 'var(--f-body)'
        }}>
          {step.message}
        </div>
        {/* Tool result output snippet */}
        {step.type === 'tool_result' && step.data?.output && !step.data.error && (
          <div style={{
            marginTop: 6, padding: '6px 10px',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 6, fontSize: 11,
            color: 'var(--t3)', fontFamily: 'var(--f-mono)',
            maxHeight: 60, overflow: 'hidden',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word'
          }}>
            {String(step.data.output).slice(0, 200)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AgentLog({ steps, running }) {
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [steps.length])

  if (!steps.length && !running) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: 12, opacity: 0.4
      }}>
        <Brain size={28} color="var(--neon)" style={{ animation: 'float 3s ease-in-out infinite' }} />
        <p style={{ fontSize: 12, color: 'var(--t2)', fontFamily: 'var(--f-mono)', textAlign: 'center' }}>
          Agent trace will<br />appear here...
        </p>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="mono-label" style={{ padding: '12px 16px', borderBottom: '1px solid var(--b1)', color: 'var(--t2)' }}>
        ◉ AGENT TRACE · {steps.length} steps
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
        {steps.map((s, i) => <StepItem key={i} step={s} index={i} />)}

        {running && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', color: 'var(--t2)' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 0.15, 0.3].map((d, i) => (
                <div key={i} style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: 'var(--neon)',
                  animation: `pulse 1.2s ease-in-out ${d}s infinite`
                }} />
              ))}
            </div>
            <span style={{ fontSize: 11, fontFamily: 'var(--f-mono)', color: 'var(--t3)' }}>
              thinking...
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

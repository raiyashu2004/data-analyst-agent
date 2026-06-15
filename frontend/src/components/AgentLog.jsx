import { useEffect, useRef } from 'react'
import { CheckCircle2, Circle, Clock, Loader2, Search, BarChart3, Code2, AlertTriangle, GitBranch, FileText, Database } from 'lucide-react'

const TOOL_META = {
  inspect_dataset:   { icon: Search,         label: 'Inspecting Dataset' },
  get_column_stats:  { icon: BarChart3,      label: 'Column Statistics' },
  run_analysis:      { icon: Code2,          label: 'Running Analysis' },
  detect_anomalies:  { icon: AlertTriangle,  label: 'Detecting Anomalies' },
  correlate_columns: { icon: GitBranch,      label: 'Computing Correlations' },
  generate_report:   { icon: FileText,       label: 'Generating Report' },
}

function StepItem({ step, index, isLast, running }) {
  const isComplete = step.type === 'tool_result' || step.type === 'done' || (!isLast)
  const isCurrent = isLast && running
  const isError = step.type === 'error' || step.data?.error
  const meta = step.tool ? TOOL_META[step.tool] : null
  const label = meta?.label || (step.type === 'thinking' ? 'Reasoning' : step.type === 'start' ? 'Initialization' : step.type === 'thought' ? 'Thinking' : 'Processing')

  return (
    <div className={`relative flex gap-4 pb-5 opacity-0 animate-[fadeUp_0.4s_ease_both]`} style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}>
      {/* Vertical connector line */}
      {!isLast && (
        <div className="absolute left-[11px] top-[28px] bottom-0 w-px bg-gray-200" />
      )}

      {/* Icon/Node */}
      <div className="relative z-10 flex flex-col items-center mt-0.5 shrink-0">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors border
          ${isError ? 'bg-red-50 text-red-500 border-red-200' :
            isComplete ? 'bg-brand-50 text-brand-600 border-brand-200' :
            isCurrent ? 'bg-blue-50 text-blue-500 border-blue-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
          {isError ? <AlertTriangle size={12} /> :
           isComplete ? <CheckCircle2 size={12} /> :
           isCurrent ? <Loader2 size={12} className="animate-spin" /> :
           <Circle size={10} />}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className={`text-xs font-semibold mb-0.5 ${isError ? 'text-red-600' : 'text-gray-900'}`}>
          {label}
        </div>
        <div className="text-[11px] text-gray-500 leading-relaxed break-words pr-2">
          {step.message || ''}
        </div>

        {/* Tool result output snippet */}
        {step.type === 'tool_result' && step.data?.output && !step.data.error && (
          <div className="mt-1.5 p-2 bg-gray-50 border border-gray-200 rounded-md text-[10px] text-gray-600 font-mono max-h-16 overflow-hidden whitespace-pre-wrap break-words">
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

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 flex items-center gap-3 shrink-0 bg-white z-20">
        <div className="w-8 h-8 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600">
          <Database size={16} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Analysis Progress</h3>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5 tracking-wide uppercase">
            {running ? `${steps.length} steps · processing` : steps.length > 0 ? `${steps.length} steps · complete` : 'awaiting task'}
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto p-6 relative">
        {!steps.length && !running && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center opacity-50">
            <Clock size={24} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 font-medium">Waiting for task...</p>
              <p className="text-[10px] text-gray-400 mt-1">Run an analysis to see progress</p>
            </div>
          </div>
        )}

        {steps.map((s, i) => (
          <StepItem key={i} step={s} index={i} isLast={i === steps.length - 1} running={running} />
        ))}

        {running && (
          <div className="relative flex gap-4 opacity-0 animate-[fadeUp_0.4s_ease_both]">
            <div className="relative z-10 flex flex-col items-center mt-0.5 shrink-0">
              <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <Loader2 size={12} className="animate-spin text-blue-500" />
              </div>
            </div>
            <div className="flex-1 pt-1">
              <div className="text-[11px] font-mono text-gray-400">Processing next step...</div>
            </div>
          </div>
        )}

        {/* All tasks complete banner */}
        {!running && steps.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md text-center opacity-0 animate-[fadeUp_0.5s_ease_both]" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-green-700">
              <CheckCircle2 size={16} />
              Analysis Complete
            </div>
            <p className="text-[11px] text-green-600 mt-1">Report generated successfully</p>
          </div>
        )}

        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Bottom panel */}
      <div className="p-5 border-t border-gray-200 bg-gray-50 shrink-0">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2">
          <Clock size={14} className="text-gray-500" /> Next Scheduled Run
        </div>
        <div className="text-sm font-bold text-gray-900 mb-1">Tomorrow, 09:00 AM</div>
        <div className="text-[11px] text-gray-500 mb-3">Auto analysis & report generation</div>
        <button className="w-full btn btn-ghost bg-white border border-gray-200 py-2 text-xs hover:bg-gray-100 transition-colors">
          Manage Schedule
        </button>
      </div>
    </div>
  )
}

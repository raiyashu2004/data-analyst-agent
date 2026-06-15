import { ArrowRight, Brain, Zap, BarChart3, MessageSquare, ChevronRight, Github } from 'lucide-react'

const FEATURES = [
  { icon: Brain, label: 'Agentic AI', desc: 'ReAct loop with tool use — plans, codes, corrects itself', color: 'text-brand-600 bg-brand-50 border-brand-200' },
  { icon: BarChart3, label: 'Auto Analysis', desc: 'Pandas + Matplotlib charts generated autonomously', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { icon: MessageSquare, label: 'Follow-up Chat', desc: 'Ask follow-up questions after the report', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { icon: Zap, label: 'Live Streaming', desc: 'Watch every reasoning step in real time via SSE', color: 'text-amber-600 bg-amber-50 border-amber-200' },
]

const TECH = ['Spring Boot', 'FastAPI', 'React', 'Gemini AI', 'Pandas', 'SSE', 'Java 17', 'Python 3']

export default function Landing({ onStart }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-brand-100 selection:text-brand-900">
      
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 text-white shadow-sm">
            <Brain size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight">
            DataPlatform <span className="text-brand-600 text-xs font-mono font-medium ml-1 bg-brand-50 px-1.5 py-0.5 rounded">AGENT</span>
          </span>
        </div>
        <div className="flex gap-3">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="btn btn-ghost text-sm px-3 py-1.5 hidden sm:flex">
            <Github size={16} /> GitHub
          </a>
          <button onClick={onStart} className="btn btn-neon text-sm px-4 py-1.5">
            Launch App <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-32 pb-24 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-sm font-medium">
          <SparklesIcon className="w-4 h-4" />
          <span>v2.0 Released. Smarter and faster.</span>
        </div>
        
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1] mb-6">
          Autonomous Data Analysis <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">
            at your fingertips
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload any dataset, ask a question, and watch an AI agent autonomously plan, write code, run analyses, generate charts, and deliver a full report.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button onClick={onStart} className="btn btn-neon text-base px-8 py-3 shadow-md hover:shadow-lg">
            <Zap size={18} /> Try the Agent
          </button>
          <a href="#features" className="btn btn-glass text-base px-8 py-3">
            See Features <ChevronRight size={18} />
          </a>
        </div>

        {/* Tech stack pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-16 max-w-3xl mx-auto">
          {TECH.map(t => (
            <span key={t} className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-600 shadow-sm">
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl p-8 sm:p-10 border border-gray-200 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-8 text-center sm:text-left">
            System Architecture
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-0 overflow-x-auto pb-4 sm:pb-0">
            {[
              { label: 'React', sub: 'Frontend', color: 'border-blue-200 bg-blue-50 text-blue-700' },
              { arrow: true },
              { label: 'Spring Boot', sub: 'Gateway :8080', color: 'border-green-200 bg-green-50 text-green-700' },
              { arrow: true },
              { label: 'FastAPI', sub: 'ML Service :8001', color: 'border-teal-200 bg-teal-50 text-teal-700' },
              { arrow: true },
              { label: 'Gemini AI', sub: 'Tool Use', color: 'border-brand-200 bg-brand-50 text-brand-700' },
            ].map((item, i) => item.arrow ? (
              <div key={i} className="text-gray-300 px-4 text-xl sm:rotate-0 rotate-90 shrink-0">→</div>
            ) : (
              <div key={i} className={`px-5 py-4 rounded-xl border shrink-0 text-center w-40 ${item.color}`}>
                <div className="text-sm font-bold">{item.label}</div>
                <div className="text-xs font-mono mt-1 opacity-80">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 pb-32 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Beyond a Dashboard
          </h2>
          <p className="text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
            DataTwin doesn't just display data; it thinks through problems and acts like a genuine analyst.
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.label} className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-6 ${f.color}`}>
                  <Icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.label}</h3>
                <p className="text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
        
        <div className="text-center mt-20">
          <button onClick={onStart} className="btn btn-neon text-base px-10 py-4 shadow-md">
            <Brain size={20} /> Launch Agent
          </button>
        </div>
      </section>
    </div>
  )
}

function SparklesIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  )
}

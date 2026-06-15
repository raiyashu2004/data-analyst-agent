import { useState } from 'react'
import { Database, FileDigit, Hash, Search, AlignLeft, Type, Calendar, ToggleLeft, Activity, List, ChevronRight, ChevronDown } from 'lucide-react'

// Maps pandas dtypes to an icon and a human readable name
const getTypeInfo = (dtype) => {
  const typeStr = (dtype || '').toLowerCase()
  if (typeStr.includes('int') || typeStr.includes('float')) {
    return { icon: Hash, name: 'Numeric', color: 'text-brand-600', bg: 'bg-brand-50 border-brand-200' }
  } else if (typeStr.includes('bool')) {
    return { icon: ToggleLeft, name: 'Boolean', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' }
  } else if (typeStr.includes('date') || typeStr.includes('time')) {
    return { icon: Calendar, name: 'DateTime', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' }
  } else if (typeStr.includes('cat')) {
    return { icon: List, name: 'Categorical', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' }
  } else {
    return { icon: Type, name: 'Text', color: 'text-gray-600', bg: 'bg-gray-100 border-gray-300' }
  }
}

function ColumnCard({ col }) {
  const { icon: Icon, name, color, bg } = getTypeInfo(col.dtype)
  const isId = col.name.toLowerCase().includes('id')

  const sampleValues = Array.isArray(col.sample)
    ? col.sample.filter(v => v !== null && v !== undefined && v !== 'nan' && v !== 'None').slice(0, 3)
    : []

  const hasNulls = Array.isArray(col.sample) && col.sample.some(v => v === 'nan' || v === 'None')

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md border ${bg}`}>
            <Icon size={14} className={color} />
          </div>
          <span className="font-bold text-gray-900 text-sm truncate max-w-[140px]">{col.name}</span>
        </div>
        {isId && (
          <span className="text-[9px] font-bold tracking-widest uppercase bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">ID</span>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] mb-3">
        <span className="text-gray-500 font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">{col.dtype}</span>
        {hasNulls && (
          <span className="text-red-600 font-medium bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-sm">Has Nulls</span>
        )}
      </div>

      <div className="bg-gray-50 rounded-md p-2.5 border border-gray-200 min-h-[64px]">
        <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Sample Data</div>
        <div className="flex flex-wrap gap-1.5">
          {sampleValues.length > 0 ? (
            sampleValues.map((val, i) => (
              <span key={i} className="text-[10px] font-mono bg-white text-gray-700 px-1.5 py-0.5 rounded border border-gray-200 truncate max-w-full">
                {String(val)}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-gray-400 italic">No samples</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DataProfile({ session, alwaysExpanded = false }) {
  const [expanded, setExpanded] = useState(alwaysExpanded)

  const numericCols = session.columns?.filter(c => c.dtype !== 'object' && c.dtype !== 'categorical').length || 0
  const catCols = (session.columns?.length || 0) - numericCols
  const nullCols = session.columns?.filter(c => c.sample?.includes('nan') || c.sample?.includes('None')).length || 0

  return (
    <div className="border-b border-gray-200 bg-white shrink-0">
      {/* Summary bar */}
      <div
        className={`px-8 py-3 flex items-center justify-between transition-colors ${!alwaysExpanded ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={() => !alwaysExpanded && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Search size={14} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-700">Data Profile</span>
          </div>

          <div className="h-4 w-px bg-gray-200" />

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-gray-500"><strong className="text-gray-900">{session.columns?.length || 0}</strong> Total Columns</span>
            <span className="text-gray-500"><strong className="text-brand-600">{numericCols}</strong> Numeric</span>
            <span className="text-gray-500"><strong className="text-orange-600">{catCols}</strong> Categorical/Text</span>
            {nullCols > 0 && (
              <span className="text-gray-500"><strong className="text-red-600">{nullCols}</strong> Cols with Nulls</span>
            )}
          </div>
        </div>

        {!alwaysExpanded && (
          <div className="text-gray-400 p-1 hover:text-gray-600 transition-colors">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-8 pb-8 pt-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {session.columns?.map((col, i) => (
              <ColumnCard key={i} col={col} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

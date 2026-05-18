import { useState } from 'react'
import { ChevronDown, ChevronUp, Hash, Type, AlertCircle } from 'lucide-react'

function StatPill({ label, value, color = 'var(--neon)' }) {
  return (
    <div style={{
      padding: '6px 12px', borderRadius: 8,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      textAlign: 'center'
    }}>
      <div style={{ fontFamily: 'var(--f-mono)', fontSize: 15, fontWeight: 600, color }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2, fontFamily: 'var(--f-mono)' }}>{label}</div>
    </div>
  )
}

function ColumnCard({ col }) {
  const isNumeric = col.dtype !== 'categorical' && col.dtype !== 'object'
  const color = isNumeric ? 'var(--neon-2)' : 'var(--neon-3)'

  return (
    <div style={{
      padding: '14px 16px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isNumeric
            ? <Hash size={12} color="var(--neon-2)" />
            : <Type size={12} color="var(--neon-3)" />
          }
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>
            {col.name}
          </span>
        </div>
        <span className="tag" style={{
          fontSize: 9, padding: '2px 7px',
          background: `${color}10`, color, border: `1px solid ${color}25`
        }}>
          {col.dtype}
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--f-mono)' }}>
        Sample: {col.sample?.slice(0, 3).join(', ')}
      </div>
    </div>
  )
}

export default function DataProfile({ session }) {
  const [expanded, setExpanded] = useState(false)

  const numericCols = session.columns?.filter(c => c.dtype !== 'object' && c.dtype !== 'categorical').length || 0
  const catCols = (session.columns?.length || 0) - numericCols
  const nullCols = session.columns?.filter(c => c.sample?.includes('nan') || c.sample?.includes('None')).length || 0

  return (
    <div style={{ borderBottom: '1px solid var(--b1)', background: 'rgba(0,0,0,0.3)' }}>
      {/* Summary bar */}
      <div
        onClick={() => setExpanded(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: 20,
          padding: '12px 24px', cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div className="mono-label" style={{ color: 'var(--t2)', flexShrink: 0 }}>
          📁 {session.filename}
        </div>
        <div style={{ display: 'flex', gap: 12, flex: 1 }}>
          <StatPill label="ROWS" value={session.shape?.rows?.toLocaleString()} color="var(--neon)" />
          <StatPill label="COLS" value={session.shape?.cols} color="var(--neon-2)" />
          <StatPill label="NUMERIC" value={numericCols} color="var(--amber)" />
          <StatPill label="CATEGORICAL" value={catCols} color="var(--neon-3)" />
          {nullCols > 0 && <StatPill label="NULL COLS" value={nullCols} color="var(--red)" />}
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)' }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded columns grid */}
      {expanded && (
        <div style={{ padding: '0 24px 20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 10
          }}>
            {session.columns?.map(col => (
              <ColumnCard key={col.name} col={col} />
            ))}
          </div>
          {/* Sample data table */}
          <div style={{ marginTop: 20, overflowX: 'auto' }}>
            <div className="mono-label" style={{ marginBottom: 10 }}>Sample Data (5 rows)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {session.columns?.slice(0, 7).map(col => (
                    <th key={col.name} style={{
                      padding: '6px 12px', textAlign: 'left',
                      borderBottom: '1px solid var(--b1)',
                      color: 'var(--t3)', fontFamily: 'var(--f-mono)', fontWeight: 600
                    }}>
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {session.head?.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {session.columns?.slice(0, 7).map(col => (
                      <td key={col.name} style={{
                        padding: '5px 12px',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        color: 'var(--t2)', maxWidth: 140,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {String(row[col.name] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {session.columns?.length > 7 && (
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6, fontFamily: 'var(--f-mono)' }}>
                + {session.columns.length - 7} more columns not shown
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

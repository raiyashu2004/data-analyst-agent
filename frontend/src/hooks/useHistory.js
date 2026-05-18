import { useState, useEffect } from 'react'

const STORAGE_KEY = 'datatwin_history'
const MAX_HISTORY = 10

export function useHistory() {
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  })

  const save = (item) => {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      filename: item.filename,
      question: item.question,
      provider: item.provider,
      reportTitle: item.reportTitle,
      findingsCount: item.findingsCount,
      chartsCount: item.chartsCount,
    }
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, MAX_HISTORY)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }

  const clear = () => {
    setHistory([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return { history, save, clear }
}

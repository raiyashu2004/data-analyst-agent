import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import Landing from './pages/Landing'
import Upload from './pages/Upload'
import Analyze from './pages/Analyze'
import './index.css'

export default function App() {
  const [page, setPage] = useState('landing') // 'landing' | 'upload' | 'analyze'
  const [session, setSession] = useState(null)

  const handleSessionReady = (s) => {
    setSession(s)
    setPage('analyze')
  }

  const handleReset = () => {
    setSession(null)
    setPage('upload')
  }

  return (
    <>
      <Toaster
        position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
              fontWeight: '500',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
        }}
      />
      {page === 'landing' && <Landing onStart={() => setPage('upload')} />}
      {page === 'upload' && <Upload onSessionReady={handleSessionReady} />}
      {page === 'analyze' && session && <Analyze session={session} onReset={handleReset} />}
    </>
  )
}

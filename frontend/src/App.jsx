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
            background: 'rgba(10,22,40,0.95)',
            color: 'var(--t1)',
            border: '1px solid var(--b2)',
            fontFamily: 'Instrument Sans, sans-serif',
            fontSize: 14,
            backdropFilter: 'blur(20px)',
          }
        }}
      />
      {page === 'landing' && <Landing onStart={() => setPage('upload')} />}
      {page === 'upload' && <Upload onSessionReady={handleSessionReady} />}
      {page === 'analyze' && session && <Analyze session={session} onReset={handleReset} />}
    </>
  )
}

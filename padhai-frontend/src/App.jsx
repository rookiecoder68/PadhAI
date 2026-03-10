import React, { useState, useEffect } from 'react'
import StudyChat from './components/StudyChat'
import SummaryView from './components/SummaryView'
import PomodoroTimer from './components/PomodoroTimer'
import FocusMode from './components/FocusMode'
import QuizAndFlashcards from './components/QuizAndFlashcards'
import RewardsAndStreaks from './components/RewardsAndStreaks'
import NotesLibrary from './components/NotesLibrary'
import UserProfile from './components/UserProfile'
import ProgressAnalytics from './components/ProgressAnalytics'
import NotificationCenter from './components/NotificationCenter'

export default function App() {
  const [summary, setSummary] = useState('')
  const [notes, setNotes] = useState('')
  const [activeTab, setActiveTab] = useState('learn')
  const [chatKey, setChatKey] = useState(0)
  const [libKey, setLibKey] = useState(0)
  const [initialChat, setInitialChat] = useState([])

  const handleNotesSummary = (s) => setSummary(s)
  const handleNotesChange = (text) => setNotes(text)

  const handleLoadSession = ({ notes: n, summary: s, chat: c }) => {
    setNotes(n || '')
    setSummary(s || '')
    setInitialChat(c || [])
    setChatKey(k => k + 1)
    setActiveTab('learn')
  }

  const handleNewChat = () => {
    setSummary('')
    setNotes('')
    setInitialChat([])
    setChatKey(k => k + 1)
  }

  // Auto session tracking
  useEffect(() => {
    const sessionId = Date.now()
    const SESSION_KEY = 'padhai_study_sessions'
    const upsertSession = () => {
      const durationMinutes = Math.max(1, Math.round((Date.now() - sessionId) / 60000))
      const sessions = JSON.parse(localStorage.getItem(SESSION_KEY) || '[]')
      const idx = sessions.findIndex(s => s.id === sessionId)
      const entry = { id: sessionId, date: new Date(sessionId).toISOString(), durationMinutes }
      if (idx >= 0) sessions[idx] = entry
      else sessions.push(entry)
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessions.slice(-200)))
    }
    window.addEventListener('beforeunload', upsertSession)
    const interval = setInterval(upsertSession, 5 * 60 * 1000)
    return () => {
      upsertSession()
      window.removeEventListener('beforeunload', upsertSession)
      clearInterval(interval)
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'sans-serif' }}>
      <NotificationCenter />

      {/* Header */}
      <div style={{ backgroundColor: '#fff', borderBottom: '2px solid #007bff', padding: '16px 20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', color: '#007bff', fontSize: 24 }}>📚 PadhAI</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#888' }}>Learn smarter with AI-powered study tools</p>
        </div>
        <button onClick={handleNewChat}
          style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          🆕 New Chat
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #ddd', padding: '10px 20px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {[
          { id: 'learn', label: '📖 Learn' },
          { id: 'focus', label: '🎯 Focus' },
          { id: 'quiz', label: '📝 Quiz' },
          { id: 'saved', label: '💾 Saved Notes' },
          { id: 'profile', label: '👤 Profile' },
          { id: 'analytics', label: '📊 Analytics' },
          { id: 'rewards', label: '🏆 Rewards' },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: '8px 14px', backgroundColor: activeTab === tab.id ? '#007bff' : '#f0f0f0', color: activeTab === tab.id ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: activeTab === tab.id ? 'bold' : 'normal', whiteSpace: 'nowrap', fontSize: 13 }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* FocusMode always mounted so it survives tab switches */}
        <FocusMode visible={activeTab === 'focus'} />
        <PomodoroTimer visible={activeTab === 'focus'} />

        {activeTab === 'learn' && (
          <div>
            <StudyChat
              key={chatKey}
              initialMessages={initialChat}
              onSummary={handleNotesSummary}
              onNotesChange={handleNotesChange}
              onAutoSaved={() => setLibKey(k => k + 1)}
            />
            <SummaryView summary={summary} />
          </div>
        )}
        {activeTab === 'focus' && null}
        {activeTab === 'quiz' && (
          <div>
            <QuizAndFlashcards notes={notes} />
          </div>
        )}
        {activeTab === 'saved' && (
          <NotesLibrary key={libKey} notes={notes} summary={summary} onLoadSession={handleLoadSession} />
        )}
        {activeTab === 'profile' && <UserProfile />}
        {activeTab === 'analytics' && <ProgressAnalytics />}
        {activeTab === 'rewards' && <RewardsAndStreaks />}
      </div>
    </div>
  )
}


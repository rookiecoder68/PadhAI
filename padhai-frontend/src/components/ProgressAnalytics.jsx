import React, { useState, useEffect, useRef } from 'react'

const SESSION_KEY = 'padhai_study_sessions'
const QUIZ_KEY = 'padhai_quiz_history'

function todayStr() { return new Date().toDateString() }
function isToday(isoDate) { return new Date(isoDate).toDateString() === todayStr() }
function isThisWeek(isoDate) {
  const d = new Date(isoDate)
  const now = new Date()
  return (now - d) < 7 * 24 * 60 * 60 * 1000
}

function calcStreak(sessions) {
  if (!sessions.length) return 0
  const days = [...new Set(sessions.map(s => new Date(s.date).toDateString()))].sort((a, b) => new Date(b) - new Date(a))
  let streak = 0
  let cur = new Date()
  cur.setHours(0, 0, 0, 0)
  for (const day of days) {
    const d = new Date(day)
    const diff = Math.round((cur - d) / 86400000)
    if (diff === 0 || diff === 1) { streak++; cur = d }
    else break
  }
  return streak
}

export default function ProgressAnalytics() {
  const [sessions, setSessions] = useState([])
  const [quizHistory, setQuizHistory] = useState([])
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const startRef = useRef(Date.now())

  // Live current-session timer
  useEffect(() => {
    const tick = setInterval(() => setSessionSeconds(Math.floor((Date.now() - startRef.current) / 1000)), 10000)
    return () => clearInterval(tick)
  }, [])

  // Load + auto-refresh every 30s
  useEffect(() => {
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [])

  function load() {
    try { setSessions(JSON.parse(localStorage.getItem(SESSION_KEY) || '[]')) } catch { setSessions([]) }
    try { setQuizHistory(JSON.parse(localStorage.getItem(QUIZ_KEY) || '[]')) } catch { setQuizHistory([]) }
  }

  function clearAll() {
    if (confirm('Clear all study sessions?')) {
      localStorage.removeItem(SESSION_KEY)
      setSessions([])
    }
  }

  // --- Compute stats ---
  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((s, x) => s + (x.durationMinutes || 0), 0) + Math.floor(sessionSeconds / 60)
  const avgSession = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0
  const todayMinutes = sessions.filter(s => isToday(s.date)).reduce((s, x) => s + (x.durationMinutes || 0), 0) + Math.floor(sessionSeconds / 60)
  const weekMinutes = sessions.filter(s => isThisWeek(s.date)).reduce((s, x) => s + (x.durationMinutes || 0), 0) + Math.floor(sessionSeconds / 60)
  const streak = calcStreak(sessions)

  // Quiz stats
  const totalQuizzes = quizHistory.length
  const avgScore = totalQuizzes > 0 ? Math.round(quizHistory.reduce((s, q) => s + (q.pct || 0), 0) / totalQuizzes) : 0
  const bestScore = totalQuizzes > 0 ? Math.max(...quizHistory.map(q => q.pct || 0)) : 0
  const todayQuizzes = quizHistory.filter(q => isToday(q.date)).length
  const weekQuizzes = quizHistory.filter(q => isThisWeek(q.date)).length
  const recentTrend = quizHistory.slice(0, 5).map(q => q.pct || 0)

  const liveMin = Math.floor(sessionSeconds / 60)
  const liveSec = sessionSeconds % 60

  const card = (val, label, color, bg) => (
    <div style={{ backgroundColor: bg, padding: 12, borderRadius: 6, textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 'bold', color }}>{val}</div>
      <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{label}</div>
    </div>
  )

  return (
    <div style={{ border: '1px solid #ddd', padding: 15, borderRadius: 8, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0 }}>📊 Progress & Analytics</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: '#28a745', fontWeight: 'bold', backgroundColor: '#f0fff4', padding: '4px 10px', borderRadius: 20, border: '1px solid #c3e6cb' }}>
            🟢 Live: {String(liveMin).padStart(2,'0')}:{String(liveSec).padStart(2,'0')}
          </div>
          <button onClick={load} style={{ padding: '4px 10px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>↻ Refresh</button>
        </div>
      </div>

      {/* Study time stats */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 'bold', color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>⏱ Study Time</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
          {card(`${liveMin}m`, 'This Session', '#28a745', '#f0fff4')}
          {card(`${todayMinutes}m`, 'Today', '#1976d2', '#e3f2fd')}
          {card(`${weekMinutes}m`, 'This Week', '#7b1fa2', '#f3e5f5')}
          {card(`${totalMinutes}m`, 'All Time', '#e65100', '#fff3e0')}
          {card(`${avgSession}m`, 'Avg Session', '#00796b', '#e0f2f1')}
          {card(`🔥 ${streak}`, 'Day Streak', '#c62828', '#fff8f0')}
        </div>
      </div>

      {/* Quiz performance */}
      <div style={{ marginTop: 18, marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 'bold', color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>📝 Quiz Performance</div>
        {totalQuizzes === 0 ? (
          <p style={{ color: '#888', fontSize: 13, margin: 0 }}>No quizzes taken yet. Head to the Quiz tab!</p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginBottom: 12 }}>
              {card(totalQuizzes, 'Quizzes Taken', '#1976d2', '#e3f2fd')}
              {card(`${avgScore}%`, 'Avg Score', avgScore >= 70 ? '#28a745' : avgScore >= 50 ? '#f57c00' : '#dc3545', '#fafafa')}
              {card(`${bestScore}%`, 'Best Score', '#28a745', '#f0fff4')}
              {card(todayQuizzes, "Today's Quizzes", '#7b1fa2', '#f3e5f5')}
              {card(weekQuizzes, 'This Week', '#e65100', '#fff3e0')}
            </div>
            {/* Score trend bar */}
            {recentTrend.length > 1 && (
              <div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Recent scores (latest first):</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 50 }}>
                  {recentTrend.map((pct, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>{pct}%</div>
                      <div style={{ width: '100%', height: Math.max(4, (pct / 100) * 36), backgroundColor: pct >= 70 ? '#28a745' : pct >= 50 ? '#ffc107' : '#dc3545', borderRadius: '3px 3px 0 0' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Recent quiz list */}
            <div style={{ marginTop: 12, maxHeight: 220, overflowY: 'auto' }}>
              {quizHistory.slice(0, 8).map(q => {
                const pct = q.pct || Math.round((q.score / q.total) * 100)
                return (
                  <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 4, marginBottom: 5 }}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ fontWeight: 'bold', color: pct >= 70 ? '#28a745' : pct >= 50 ? '#f57c00' : '#dc3545' }}>{q.score}/{q.total}</span>
                      <span style={{ fontSize: 11, color: '#888', marginLeft: 8 }}>{pct}%</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#999' }}>{new Date(q.date).toLocaleDateString()} {new Date(q.date).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Insights */}
      <div style={{ backgroundColor: '#f0f8ff', padding: 12, borderRadius: 6, margin: '14px 0', fontSize: 13 }}>
        <div style={{ fontWeight: 'bold', marginBottom: 6 }}>💡 Insights</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: '#333', lineHeight: 1.8 }}>
          {streak > 0 && <li>🔥 You're on a <strong>{streak}-day</strong> streak!</li>}
          {todayMinutes > 0 && <li>Studied <strong>{todayMinutes} minutes</strong> today</li>}
          {avgScore > 0 && <li>Quiz average: <strong>{avgScore}%</strong> {avgScore >= 70 ? '— great performance! 🏆' : avgScore >= 50 ? '— keep it up!' : '— review your notes and retry 📖'}</li>}
          {recentTrend.length >= 2 && recentTrend[0] > recentTrend[1] && <li>📈 Your quiz score improved in the last attempt!</li>}
          {recentTrend.length >= 2 && recentTrend[0] < recentTrend[1] && <li>📉 Recent quiz dipped — try reviewing the material again.</li>}
          {totalMinutes === 0 && <li>Start studying to see your progress here!</li>}
        </ul>
      </div>

      <button onClick={clearAll} disabled={sessions.length === 0}
        style={{ padding: '8px 16px', backgroundColor: sessions.length > 0 ? '#dc3545' : '#ccc', color: 'white', border: 'none', borderRadius: 4, cursor: sessions.length > 0 ? 'pointer' : 'not-allowed', fontSize: 13 }}>
        🗑 Clear Session History
      </button>
    </div>
  )
}

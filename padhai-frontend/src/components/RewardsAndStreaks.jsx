import React, { useState, useEffect } from 'react'

const STORAGE_KEY = 'padhai_rewards'

function todayStr() { return new Date().toDateString() }
function isToday(isoDate) { return new Date(isoDate).toDateString() === todayStr() }

function checkQuests(points) {
  // Auto-detect quest completion from localStorage
  const quizHistory = (() => { try { return JSON.parse(localStorage.getItem('padhai_quiz_history') || '[]') } catch { return [] } })()
  const sessions = (() => { try { return JSON.parse(localStorage.getItem('padhai_study_sessions') || '[]') } catch { return [] } })()
  const pomodoros = (() => { try { return JSON.parse(localStorage.getItem('padhai_pomodoro_sessions') || '[]') } catch { return [] } })()
  const fcViews = (() => { try { return JSON.parse(localStorage.getItem('padhai_flashcard_views') || '{"date":"","count":0}') } catch { return { date: '', count: 0 } } })()

  const todayMinutes = sessions.filter(s => isToday(s.date)).reduce((s, x) => s + (x.durationMinutes || 0), 0)
  const quizToday = quizHistory.some(q => isToday(q.date))
  const pomodoroToday = pomodoros.some(p => isToday(p.date))
  const flashcardsToday = fcViews.date === todayStr() ? fcViews.count : 0

  return [
    { id: 1, task: 'Study for 10+ minutes today', points: 10, completed: todayMinutes >= 10, auto: true },
    { id: 2, task: 'Complete a quiz today', points: 20, completed: quizToday, auto: true },
    { id: 3, task: 'Review 5+ flashcards today', points: 15, completed: flashcardsToday >= 5, auto: true },
    { id: 4, task: 'Complete a Pomodoro session', points: 25, completed: pomodoroToday, auto: true },
  ]
}

function calcStreak(sessions) {
  if (!sessions.length) return 0
  const days = [...new Set(sessions.map(s => new Date(s.date).toDateString()))].sort((a, b) => new Date(b) - new Date(a))
  let streak = 0
  let cur = new Date(); cur.setHours(0,0,0,0)
  for (const day of days) {
    const d = new Date(day)
    const diff = Math.round((cur - d) / 86400000)
    if (diff === 0 || diff === 1) { streak++; cur = d } else break
  }
  return streak
}

export default function RewardsAndStreaks() {
  const [quests, setQuests] = useState([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 30000)
    return () => clearInterval(t)
  }, [])

  function refresh() {
    const saved = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} } })()
    const sessions = (() => { try { return JSON.parse(localStorage.getItem('padhai_study_sessions') || '[]') } catch { return [] } })()
    const quizHistory = (() => { try { return JSON.parse(localStorage.getItem('padhai_quiz_history') || '[]') } catch { return [] } })()

    const updatedQuests = checkQuests()
    setQuests(updatedQuests)

    // Calculate points: base from completed quests + bonus from quiz scores
    const questPoints = updatedQuests.filter(q => q.completed).reduce((s, q) => s + q.points, 0)
    const quizBonus = quizHistory.reduce((s, q) => s + Math.floor((q.pct || 0) / 10), 0) // 1pt per 10% score
    const newTotal = questPoints + quizBonus
    setTotalPoints(newTotal)
    setStreak(calcStreak(sessions))

    // Persist
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ totalPoints: newTotal, streak, lastUpdated: new Date().toISOString() }))
  }

  const level = Math.floor(totalPoints / 50) + 1
  const progressPercent = ((totalPoints % 50) / 50) * 100
  const completedCount = quests.filter(q => q.completed).length

  const badges = []
  if (streak >= 3) badges.push({ emoji: '🔥', label: `${streak} Day Streak` })
  if (totalPoints >= 50) badges.push({ emoji: '⭐', label: 'Star Learner' })
  if (totalPoints >= 100) badges.push({ emoji: '🏆', label: 'Champion' })
  const quizHistory2 = (() => { try { return JSON.parse(localStorage.getItem('padhai_quiz_history') || '[]') } catch { return [] } })()
  if (quizHistory2.some(q => (q.pct || 0) >= 90)) badges.push({ emoji: '🎯', label: 'Perfect Score' })
  if (quizHistory2.length >= 5) badges.push({ emoji: '📚', label: 'Quiz Master' })

  return (
    <div style={{ border: '1px solid #ddd', padding: 15, borderRadius: 8, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0 }}>🏆 Rewards & Streaks</h3>
        <button onClick={refresh} style={{ padding: '4px 10px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>↻ Refresh</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 16 }}>
        <div style={{ backgroundColor: '#f0f8ff', padding: 12, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 'bold', color: '#007bff' }}>⭐ Lvl {level}</div>
          <div style={{ fontSize: 11, color: '#666' }}>Current Level</div>
        </div>
        <div style={{ backgroundColor: '#f0fff0', padding: 12, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 'bold', color: '#28a745' }}>{totalPoints}</div>
          <div style={{ fontSize: 11, color: '#666' }}>Total Points</div>
        </div>
        <div style={{ backgroundColor: '#fff8f0', padding: 12, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 'bold', color: '#ff6b6b' }}>🔥 {streak}</div>
          <div style={{ fontSize: 11, color: '#666' }}>Day Streak</div>
        </div>
        <div style={{ backgroundColor: '#f9f0ff', padding: 12, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 'bold', color: '#7b1fa2' }}>{completedCount}/{quests.length}</div>
          <div style={{ fontSize: 11, color: '#666' }}>Today's Quests</div>
        </div>
      </div>

      {/* Level progress */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, marginBottom: 5, color: '#555' }}>
          Level {level} → {level + 1} &nbsp;·&nbsp; <strong>{Math.round(progressPercent)}%</strong> ({totalPoints % 50}/50 pts)
        </div>
        <div style={{ height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#007bff', transition: 'width 0.4s', borderRadius: 5 }} />
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 'bold', color: '#555', marginBottom: 8 }}>🎖 Badges Earned</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {badges.map((b, i) => (
              <div key={i} style={{ padding: '6px 12px', backgroundColor: '#fff9c4', border: '1px solid #fbc02d', borderRadius: 20, fontSize: 13, fontWeight: 'bold', color: '#f57f17' }}>
                {b.emoji} {b.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Quests — auto-tracked */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 'bold', color: '#555', marginBottom: 8 }}>
          📋 Today's Quests <span style={{ fontWeight: 'normal', color: '#999', fontSize: 11 }}>(auto-tracked)</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {quests.map(q => (
            <div key={q.id} style={{ padding: '10px 14px', backgroundColor: q.completed ? '#d4edda' : '#f8f9fa', border: `2px solid ${q.completed ? '#28a745' : '#dee2e6'}`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{q.completed ? '✅' : '○'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: 13, color: q.completed ? '#155724' : '#333' }}>{q.task}</div>
                <div style={{ fontSize: 11, color: '#666' }}>+{q.points} pts</div>
              </div>
              {q.completed && <div style={{ fontSize: 12, color: '#28a745', fontWeight: 'bold' }}>Done!</div>}
            </div>
          ))}
        </div>
      </div>

      {completedCount === quests.length && quests.length > 0 && (
        <div style={{ marginTop: 14, padding: 10, backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6, color: '#856404', fontSize: 14, fontWeight: 'bold', textAlign: 'center' }}>
          🎉 All quests done today! Amazing work!
        </div>
      )}
      <div style={{ marginTop: 10, fontSize: 11, color: '#aaa', textAlign: 'right' }}>Auto-refreshes every 30s</div>
    </div>
  )
}


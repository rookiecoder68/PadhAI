import React, { useState, useEffect, useRef } from 'react'

function playBeep(freq = 800, duration = 0.6) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch (e) { /* ignore */ }
}

function sendOSNotification(title, body) {
  if (!('Notification' in window)) return
  const send = () => new Notification(title, { body, icon: '/favicon.ico', requireInteraction: true })
  if (Notification.permission === 'granted') {
    send()
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => { if (p === 'granted') send() })
  }
}

export default function PomodoroTimer({ visible = true }) {
  const [workMin, setWorkMin] = useState(25)
  const [breakMin, setBreakMin] = useState(5)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isWorkSession, setIsWorkSession] = useState(true)
  const [totalSessions, setTotalSessions] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('work_done')
  const isWorkRef = useRef(isWorkSession)
  const workMinRef = useRef(workMin)
  const breakMinRef = useRef(breakMin)
  const totalSessionsRef = useRef(totalSessions)

  useEffect(() => { isWorkRef.current = isWorkSession }, [isWorkSession])
  useEffect(() => { workMinRef.current = workMin }, [workMin])
  useEffect(() => { breakMinRef.current = breakMin }, [breakMin])
  useEffect(() => { totalSessionsRef.current = totalSessions }, [totalSessions])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const totalSeconds = (isWorkSession ? workMin : breakMin) * 60
  const remaining = totalSeconds - seconds
  const displayMin = Math.floor(remaining / 60)
  const displaySec = remaining % 60
  const progress = seconds / totalSeconds
  const circumference = 2 * Math.PI * 54
  const dashOffset = circumference * (1 - progress)

  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => {
      setSeconds(prev => {
        const total = (isWorkRef.current ? workMinRef.current : breakMinRef.current) * 60
        if (prev + 1 >= total) {
          setIsRunning(false)
          if (isWorkRef.current) {
            const newCount = totalSessionsRef.current + 1
            setTotalSessions(newCount)
            const pKey = 'padhai_pomodoro_sessions'
            const existing = JSON.parse(localStorage.getItem(pKey) || '[]')
            existing.push({ date: new Date().toISOString(), durationMinutes: workMinRef.current })
            localStorage.setItem(pKey, JSON.stringify(existing.slice(-200)))
            setModalType('work_done')
            sendOSNotification(
              '🎉 Work Session Complete!',
              `Great job! ${workMinRef.current} minutes of focus done. Session #${newCount} complete. Take a break or keep going?`
            )
          } else {
            setModalType('break_done')
            sendOSNotification(
              '⏰ Break Over!',
              `Break time is up! Ready to get back to it? Start your next focus session.`
            )
          }
          playBeep(880, 0.3)
          setTimeout(() => playBeep(880, 0.3), 400)
          setTimeout(() => playBeep(1100, 0.6), 800)
          setShowModal(true)
          return 0
        }
        return prev + 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning])

  function handleSkipBreak() { setShowModal(false); setIsWorkSession(true); setSeconds(0); setIsRunning(true) }
  function handleTakeBreak() { setShowModal(false); setIsWorkSession(false); setSeconds(0); setIsRunning(true) }
  function handleStartWork() { setShowModal(false); setIsWorkSession(true); setSeconds(0); setIsRunning(true) }
  function reset() { setSeconds(0); setIsRunning(false); setShowModal(false) }

  return (
    <>
      {/* Fullscreen completion modal — always in DOM so it shows regardless of active tab */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(6px)' }}>
          <div style={{ backgroundColor: 'white', borderRadius: 24, padding: '44px 52px', maxWidth: 440, width: '92%', textAlign: 'center', boxShadow: '0 32px 96px rgba(0,0,0,0.45)' }}>
            {modalType === 'work_done' ? (
              <>
                <div style={{ fontSize: 70, marginBottom: 14 }}>🎉</div>
                <h2 style={{ margin: '0 0 10px', color: '#1a1a2e', fontSize: 24 }}>Work Session Complete!</h2>
                <p style={{ color: '#555', marginBottom: 10, fontSize: 15, lineHeight: 1.6 }}>
                  You crushed <strong>{workMin} minutes</strong> of focused work!<br />
                  Session <strong>#{totalSessions}</strong> done. What's next?
                </p>
                <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 24 }}>
                  <button onClick={handleTakeBreak}
                    style={{ padding: '14px 0', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 'bold', fontSize: 15, flex: 1 }}>
                    ☕ Take a Break<br />
                    <span style={{ fontSize: 12, fontWeight: 'normal', opacity: 0.9 }}>{breakMin} min</span>
                  </button>
                  <button onClick={handleSkipBreak}
                    style={{ padding: '14px 0', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 'bold', fontSize: 15, flex: 1 }}>
                    ⚡ Keep Going<br />
                    <span style={{ fontSize: 12, fontWeight: 'normal', opacity: 0.9 }}>Skip break</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 70, marginBottom: 14 }}>⏰</div>
                <h2 style={{ margin: '0 0 10px', color: '#1a1a2e', fontSize: 24 }}>Break Time is Over!</h2>
                <p style={{ color: '#555', marginBottom: 28, fontSize: 15, lineHeight: 1.6 }}>
                  Hope you're recharged and ready!<br />
                  Time to get back and crush it. 💪
                </p>
                <button onClick={handleStartWork}
                  style={{ padding: '14px 48px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>
                  ▶ Let's Go!
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating badge when timer is running but user is on another tab */}
      {isRunning && !visible && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, backgroundColor: isWorkSession ? '#007bff' : '#28a745', color: 'white', borderRadius: 50, padding: '12px 18px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 9998, display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }}
          title="Click to go to Focus tab">
          <span>{isWorkSession ? '🎯' : '☕'}</span>
          <span style={{ fontFamily: 'monospace', fontSize: 17 }}>
            {String(displayMin).padStart(2, '0')}:{String(displaySec).padStart(2, '0')}
          </span>
          <span style={{ fontSize: 11, opacity: 0.85, fontWeight: 'normal' }}>{isWorkSession ? 'FOCUS' : 'BREAK'}</span>
        </div>
      )}

      {/* Main timer UI — hidden (not unmounted) when on other tabs */}
      <div style={{ display: visible ? 'block' : 'none' }}>
        <div style={{ border: '1px solid #ddd', padding: 20, borderRadius: 12, marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>⏱️ Pomodoro Timer</h3>

          {/* Settings */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 13 }}>Work (mins): </label>
              <input type="number" min="1" max="60" value={workMin}
                onChange={e => setWorkMin(parseInt(e.target.value) || 25)}
                disabled={isRunning}
                style={{ width: 52, padding: '4px 6px', borderRadius: 4, border: '1px solid #ddd' }} />
            </div>
            <div>
              <label style={{ fontSize: 13 }}>Break (mins): </label>
              <input type="number" min="1" max="30" value={breakMin}
                onChange={e => setBreakMin(parseInt(e.target.value) || 5)}
                disabled={isRunning}
                style={{ width: 52, padding: '4px 6px', borderRadius: 4, border: '1px solid #ddd' }} />
            </div>
          </div>

          {/* Circular timer */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ position: 'relative', width: 140, height: 140 }}>
              <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r="62" fill="none" stroke="#f0f0f0" strokeWidth="9" />
                <circle cx="70" cy="70" r="62" fill="none"
                  stroke={isWorkSession ? '#007bff' : '#28a745'}
                  strokeWidth="9"
                  strokeDasharray={2 * Math.PI * 62}
                  strokeDashoffset={2 * Math.PI * 62 * (1 - progress)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }} />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 'bold', fontFamily: 'monospace', lineHeight: 1 }}>
                  {String(displayMin).padStart(2, '0')}:{String(displaySec).padStart(2, '0')}
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 3, fontWeight: 'bold', letterSpacing: 1 }}>
                  {isWorkSession ? '🎯 FOCUS' : '☕ BREAK'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: 13, color: '#666', marginBottom: 16 }}>
            Sessions completed: <strong>{totalSessions}</strong>
            {isRunning && <span style={{ marginLeft: 10, color: isWorkSession ? '#007bff' : '#28a745', fontWeight: 'bold' }}>● Running</span>}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => setIsRunning(r => !r)}
              style={{ padding: '10px 28px', backgroundColor: isRunning ? '#dc3545' : '#28a745', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 15 }}>
              {isRunning ? '⏸️ Pause' : '▶️ Start'}
            </button>
            <button onClick={reset}
              style={{ padding: '10px 22px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
              🔄 Reset
            </button>
          </div>

          {!isRunning && seconds === 0 && (
            <p style={{ textAlign: 'center', fontSize: 12, color: '#bbb', marginTop: 12, marginBottom: 0 }}>
              Timer keeps running even if you switch tabs — you'll get a notification when done.
            </p>
          )}
        </div>
      </div>
    </>
  )
}



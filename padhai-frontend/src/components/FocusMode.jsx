import React, { useState, useEffect, useRef } from 'react'

// Saves original Notification constructor so we can restore it
const OriginalNotification = window.Notification

// Blocks all browser notifications by replacing window.Notification with a no-op
function blockNotifications() {
  if (!window._focusNotifBlocked) {
    function SilentNotification(title, opts) {
      console.log('[FocusMode] Notification suppressed:', title)
    }
    SilentNotification.permission = OriginalNotification?.permission || 'granted'
    SilentNotification.requestPermission = () => Promise.resolve('granted')
    window.Notification = SilentNotification
    window._focusNotifBlocked = true
  }
}

function restoreNotifications() {
  if (window._focusNotifBlocked) {
    window.Notification = OriginalNotification
    window._focusNotifBlocked = false
  }
}

function sendOSNotif(title, body) {
  try {
    new OriginalNotification(title, { body, icon: '/favicon.ico', requireInteraction: true })
  } catch (e) { /* ignore */ }
}

export default function FocusMode({ visible = true }) {
  const [isFocusActive, setIsFocusActive] = useState(false)
  const [focusMinutes, setFocusMinutes] = useState(30)
  const [seconds, setSeconds] = useState(0)
  const [blockedApps, setBlockedApps] = useState(['Social Media', 'YouTube', 'Netflix', 'Instagram'])
  const [tabWarning, setTabWarning] = useState(false)
  const [showDoneModal, setShowDoneModal] = useState(false)
  const isFocusRef = useRef(isFocusActive)
  const focusMinRef = useRef(focusMinutes)

  useEffect(() => { isFocusRef.current = isFocusActive }, [isFocusActive])
  useEffect(() => { focusMinRef.current = focusMinutes }, [focusMinutes])

  const totalSeconds = focusMinutes * 60
  const remaining = totalSeconds - seconds
  const displayMin = Math.floor(remaining / 60)
  const displaySec = remaining % 60
  const progress = seconds / totalSeconds

  // Block/restore notifications when focus toggles
  useEffect(() => {
    if (isFocusActive) {
      blockNotifications()
    } else {
      restoreNotifications()
    }
    return () => restoreNotifications()
  }, [isFocusActive])

  // Tab-switch warning during focus
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden && isFocusRef.current) {
        setTabWarning(true)
        setTimeout(() => setTabWarning(false), 4000)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // Countdown timer
  useEffect(() => {
    if (!isFocusActive) return
    const interval = setInterval(() => {
      setSeconds(prev => {
        const total = focusMinRef.current * 60
        if (prev + 1 >= total) {
          setIsFocusActive(false)
          setShowDoneModal(true)
          sendOSNotif('🎉 Focus Session Complete!', `You focused for ${focusMinRef.current} minutes. Amazing work!`)
          return 0
        }
        return prev + 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isFocusActive])

  function startFocus() {
    setSeconds(0)
    setIsFocusActive(true)
    setShowDoneModal(false)
    // Request notification permission for end-of-session alert
    if ('Notification' in window && OriginalNotification?.permission === 'default') {
      OriginalNotification?.requestPermission?.()
    }
  }

  function stopFocus() {
    setIsFocusActive(false)
    setSeconds(0)
  }

  function toggleApp(app) {
    setBlockedApps(prev => prev.includes(app) ? prev.filter(a => a !== app) : [...prev, app])
  }

  function addApp() {
    const newApp = prompt('Enter app/website to block during focus:')
    if (newApp?.trim() && !blockedApps.includes(newApp.trim())) {
      setBlockedApps(prev => [...prev, newApp.trim()])
    }
  }

  const circumference = 2 * Math.PI * 56

  return (
    <>
      {/* Tab-switch warning toast */}
      {tabWarning && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#dc3545', color: 'white', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 'bold', zIndex: 99998, boxShadow: '0 4px 20px rgba(220,53,69,0.5)', whiteSpace: 'nowrap' }}>
          🚫 Stay focused! You left your study tab.
        </div>
      )}

      {/* Session complete modal */}
      {showDoneModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(6px)' }}>
          <div style={{ backgroundColor: 'white', borderRadius: 24, padding: '44px 52px', maxWidth: 420, width: '92%', textAlign: 'center', boxShadow: '0 32px 96px rgba(0,0,0,0.45)' }}>
            <div style={{ fontSize: 70, marginBottom: 14 }}>🏆</div>
            <h2 style={{ margin: '0 0 10px', color: '#1a1a2e', fontSize: 24 }}>Focus Session Done!</h2>
            <p style={{ color: '#555', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
              You stayed focused for <strong>{focusMinutes} minutes</strong>.<br />
              Distractions were blocked. Notifications are back on.
            </p>
            <button onClick={() => setShowDoneModal(false)}
              style={{ padding: '13px 48px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>
              🎯 Awesome!
            </button>
          </div>
        </div>
      )}

      {/* Floating badge when active on another tab */}
      {isFocusActive && !visible && (
        <div style={{ position: 'fixed', bottom: 72, right: 24, backgroundColor: '#dc3545', color: 'white', borderRadius: 50, padding: '11px 16px', boxShadow: '0 4px 20px rgba(220,53,69,0.4)', zIndex: 9997, display: 'flex', alignItems: 'center', gap: 9, fontSize: 14, fontWeight: 'bold', userSelect: 'none' }}>
          <span>🎯</span>
          <span style={{ fontFamily: 'monospace', fontSize: 16 }}>
            {String(displayMin).padStart(2, '0')}:{String(displaySec).padStart(2, '0')}
          </span>
          <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 'normal' }}>FOCUS</span>
        </div>
      )}

      {/* Main UI — hidden but not unmounted when on other tabs */}
      <div style={{ display: visible ? 'block' : 'none' }}>
        <div style={{ border: `2px solid ${isFocusActive ? '#dc3545' : '#ddd'}`, padding: 20, borderRadius: 14, marginBottom: 20, backgroundColor: isFocusActive ? '#fff8f8' : '#fff', transition: 'all 0.3s' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>🎯 Focus Mode</h3>
            {isFocusActive && (
              <span style={{ backgroundColor: '#dc3545', color: 'white', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 'bold', animation: 'pulse 2s infinite' }}>
                🔴 ACTIVE · Notifications Blocked
              </span>
            )}
          </div>

          {/* Duration setting */}
          {!isFocusActive && (
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ fontSize: 14, color: '#555' }}>Duration:</label>
              {[15, 25, 30, 45, 60].map(m => (
                <button key={m} onClick={() => setFocusMinutes(m)}
                  style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${focusMinutes === m ? '#007bff' : '#ddd'}`, backgroundColor: focusMinutes === m ? '#007bff' : 'white', color: focusMinutes === m ? 'white' : '#555', cursor: 'pointer', fontSize: 13, fontWeight: focusMinutes === m ? 'bold' : 'normal' }}>
                  {m}m
                </button>
              ))}
              <input type="number" min="1" max="120" value={focusMinutes}
                onChange={e => setFocusMinutes(parseInt(e.target.value) || 30)}
                style={{ width: 54, padding: '5px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13, textAlign: 'center' }} />
            </div>
          )}

          {/* Circular progress when active */}
          {isFocusActive && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              <div style={{ position: 'relative', width: 148, height: 148 }}>
                <svg width="148" height="148" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="74" cy="74" r="56" fill="none" stroke="#ffe0e0" strokeWidth="10" />
                  <circle cx="74" cy="74" r="56" fill="none"
                    stroke="#dc3545"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s linear' }} />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 'bold', fontFamily: 'monospace', color: '#dc3545', lineHeight: 1 }}>
                    {String(displayMin).padStart(2, '0')}:{String(displaySec).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 4, fontWeight: 'bold', letterSpacing: 1 }}>REMAINING</div>
                </div>
              </div>
            </div>
          )}

          {/* Blocked apps */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 8 }}>
              🚫 Blocked Distractions:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 8 }}>
              {blockedApps.map(app => (
                <div key={app}
                  style={{ padding: '5px 12px', backgroundColor: isFocusActive ? '#ffe0e0' : '#f0f0f0', color: isFocusActive ? '#c0392b' : '#444', borderRadius: 20, fontSize: 12, fontWeight: 'bold', cursor: isFocusActive ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 5, border: isFocusActive ? '1px solid #f5c6cb' : '1px solid #e0e0e0' }}
                  onClick={() => !isFocusActive && toggleApp(app)}
                  title={isFocusActive ? 'Blocked' : 'Click to remove'}>
                  {isFocusActive ? '🚫' : '✕'} {app}
                </div>
              ))}
              {!isFocusActive && (
                <button onClick={addApp}
                  style={{ padding: '5px 12px', backgroundColor: 'white', color: '#28a745', borderRadius: 20, border: '1px dashed #28a745', cursor: 'pointer', fontSize: 12, fontWeight: 'bold' }}>
                  + Add
                </button>
              )}
            </div>
            {isFocusActive && (
              <div style={{ fontSize: 12, color: '#888', backgroundColor: '#fff8f8', border: '1px solid #ffe0e0', borderRadius: 6, padding: '7px 12px' }}>
                🔇 Browser notifications are suppressed during focus. Switch tabs and you'll be reminded to stay on track.
              </div>
            )}
          </div>

          {/* Controls */}
          {isFocusActive ? (
            <button onClick={stopFocus}
              style={{ width: '100%', padding: '12px 0', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 15 }}>
              ⏹️ Exit Focus Mode
            </button>
          ) : (
            <button onClick={startFocus}
              style={{ width: '100%', padding: '12px 0', background: 'linear-gradient(135deg, #007bff, #0056b3)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 15 }}>
              🎯 Start Focus Mode — Block All Distractions
            </button>
          )}
        </div>
      </div>
    </>
  )
}


import React, { useState } from 'react'

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([])

  function addNotification(message, type = 'info') {
    const id = Date.now()
    const notification = { id, message, type }
    setNotifications((prev) => [...prev, notification])

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 4000)

    return id
  }

  function removeNotification(id) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <>
      {/* Notification Toast Container */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 10000,
          maxWidth: 400,
        }}
      >
        {notifications.map((notif) => (
          <div
            key={notif.id}
            style={{
              padding: '12px 16px',
              marginBottom: 12,
              borderRadius: 8,
              backgroundColor:
                notif.type === 'success'
                  ? '#d4edda'
                  : notif.type === 'error'
                  ? '#f8d7da'
                  : notif.type === 'warning'
                  ? '#fff3cd'
                  : '#d1ecf1',
              border:
                notif.type === 'success'
                  ? '1px solid #c3e6cb'
                  : notif.type === 'error'
                  ? '1px solid #f5c6cb'
                  : notif.type === 'warning'
                  ? '1px solid #ffeeba'
                  : '1px solid #bee5eb',
              color:
                notif.type === 'success'
                  ? '#155724'
                  : notif.type === 'error'
                  ? '#721c24'
                  : notif.type === 'warning'
                  ? '#856404'
                  : '#0c5460',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              animation: 'slideIn 0.3s ease-in',
            }}
          >
            <span>{notif.message}</span>
            <button
              onClick={() => removeNotification(notif.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
                padding: 0,
                marginLeft: 12,
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Styles */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      {/* Export addNotification for use in other components */}
      {React.cloneElement(<></>, {
        ref: (el) => {
          if (el && window) {
            window.notificationCenter = { addNotification }
          }
        },
      })}
    </>
  )
}

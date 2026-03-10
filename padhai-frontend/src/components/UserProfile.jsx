import React, { useState, useEffect } from 'react'

const USER_KEY = 'padhai_user_profile'

export default function UserProfile() {
  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [language, setLanguage] = useState('en')
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    loadProfile()
  }, [])

  function loadProfile() {
    const saved = localStorage.getItem(USER_KEY)
    if (saved) {
      const profile = JSON.parse(saved)
      setUser(profile)
      setName(profile.name)
      setGoal(profile.goal)
      setLanguage(profile.language)
      setTheme(profile.theme)
    } else {
      createDefaultProfile()
    }
  }

  function createDefaultProfile() {
    const defaultUser = {
      name: 'Learner',
      goal: 'Master new skills',
      joinDate: new Date().toISOString(),
      language: 'en',
      theme: 'light',
      notifications: true,
      notificationReminder: '9:00 AM',
    }
    setUser(defaultUser)
    saveProfile(defaultUser)
  }

  function saveProfile(changes) {
    const updated = { ...user, ...changes }
    setUser(updated)
    localStorage.setItem(USER_KEY, JSON.stringify(updated))
  }

  function updateProfile() {
    saveProfile({
      name: name.trim() || 'Learner',
      goal: goal.trim() || 'Master new skills',
      language,
      theme,
    })
    setIsEditing(false)
  }

  if (!user) return <div>Loading...</div>

  return (
    <div style={{ border: '1px solid #ddd', padding: 15, borderRadius: 8, marginBottom: 20 }}>
      <h3>👤 My Profile</h3>

      {!isEditing ? (
        <div>
          {/* Display Mode */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 20 }}>
            <div style={{ backgroundColor: '#f0f8ff', padding: 12, borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Name</div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{user.name}</div>
            </div>
            <div style={{ backgroundColor: '#f0fff0', padding: 12, borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Learning Goal</div>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>{user.goal}</div>
            </div>
            <div style={{ backgroundColor: '#fff8f0', padding: 12, borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Member Since</div>
              <div style={{ fontSize: 14, color: '#333' }}>
                {new Date(user.joinDate).toLocaleDateString()}
              </div>
            </div>
            <div style={{ backgroundColor: '#f8f0ff', padding: 12, borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Language</div>
              <div style={{ fontSize: 14, color: '#333' }}>
                {user.language === 'en' ? '🇬🇧 English' : user.language === 'hi' ? '🇮🇳 Hindi' : user.language}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div style={{ marginBottom: 15, padding: 12, backgroundColor: '#f9f9f9', borderRadius: 6 }}>
            <h4 style={{ marginTop: 0 }}>⚙️ Preferences</h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span>🔔 Notifications</span>
              <div
                onClick={() => saveProfile({ notifications: !user.notifications })}
                style={{
                  width: 50,
                  height: 26,
                  backgroundColor: user.notifications ? '#28a745' : '#ccc',
                  borderRadius: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: user.notifications ? 26 : 2,
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    backgroundColor: 'white',
                    borderRadius: '50%',
                  }}
                />
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {user.notificationReminder && `Daily reminder at ${user.notificationReminder}`}
            </div>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✏️ Edit Profile
          </button>
        </div>
      ) : (
        <div>
          {/* Edit Mode */}
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 4,
                border: '1px solid #ddd',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>Learning Goal</label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 4,
                border: '1px solid #ddd',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 4,
                border: '1px solid #ddd',
              }}
            >
              <option value="en">🇬🇧 English</option>
              <option value="hi">🇮🇳 Hindi</option>
              <option value="es">🇪🇸 Spanish</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={updateProfile}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Save Changes
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setName(user.name)
                setGoal(user.goal)
                setLanguage(user.language)
              }}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

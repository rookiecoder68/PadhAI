import React, { useState, useEffect } from 'react'

const LIBRARY_KEY = 'padhai_notes_library'

export default function NotesLibrary({ notes = '', summary = '', onLoadSession, onLoadNotes }) {
  const [library, setLibrary] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadLibrary()
  }, [])

  function loadLibrary() {
    const saved = localStorage.getItem(LIBRARY_KEY)
    if (saved) {
      setLibrary(JSON.parse(saved))
    }
  }

  function saveNote(noteObj) {
    const updatedLibrary = [...library, { ...noteObj, id: Date.now() }]
    setLibrary(updatedLibrary)
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(updatedLibrary))
    setShowForm(false)
    setTitle('')
    setSubject('')
  }

  function deleteNote(id) {
    const updatedLibrary = library.filter((n) => n.id !== id)
    setLibrary(updatedLibrary)
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(updatedLibrary))
  }

  function loadNoteToEditor(note) {
    if (onLoadSession) {
      onLoadSession({ notes: note.content || '', summary: note.summary || '', chat: note.chat || [] })
    } else {
      onLoadNotes?.(note.content)
    }
  }

  const filtered = library.filter(
    (n) =>
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ border: '1px solid #ddd', padding: 15, borderRadius: 8, marginBottom: 20 }}>
      <h3>📚 Notes Library</h3>

      {/* Search */}
      <div style={{ marginBottom: 15 }}>
        <input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 4,
            border: '1px solid #ddd',
            fontSize: 14,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Notes List */}
      {filtered.length === 0 ? (
        <p style={{ color: '#666', fontSize: 14 }}>
          {library.length === 0 ? 'No saved notes yet. Create one below!' : 'No notes match your search.'}
        </p>
      ) : (
        <div style={{ marginBottom: 15 }}>
          {filtered.map((note) => (
            <div
              key={note.id}
              style={{
                padding: 12,
                backgroundColor: '#f9f9f9',
                border: '1px solid #e0e0e0',
                borderRadius: 4,
                marginBottom: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: 14, color: '#333' }}>{note.title}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>📚 {note.subject}</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    {new Date(note.createdAt).toLocaleDateString()}
                    {note.summary ? ' · 📋 Has summary' : ''}
                    {note.chat && note.chat.length > 0 ? ' · 💬 Has chat' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => loadNoteToEditor(note)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: 3,
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    Load
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: 3,
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Note Form */}
      {showForm ? (
        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 4, backgroundColor: '#f0f8ff' }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold', fontSize: 12 }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Biology Chapter 3"
              style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #ddd', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold', fontSize: 12 }}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Biology"
              style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #ddd', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() =>
                title.trim() &&
                subject.trim() &&
                saveNote({
                  title,
                  subject,
                  content: notes,
                  summary: summary,
                  createdAt: new Date().toISOString(),
                })
              }
              disabled={!title.trim() || !subject.trim()}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: title.trim() && subject.trim() ? '#28a745' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: title.trim() && subject.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                setTitle('')
                setSubject('')
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
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
      ) : (
        <button
          onClick={() => setShowForm(true)}
          style={{
            width: '100%',
            padding: '10px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          + Save Current Notes
        </button>
      )}
    </div>
  )
}

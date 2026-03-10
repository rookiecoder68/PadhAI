import React, { useState } from 'react'
import { renderMarkdown } from './renderMarkdown'

export default function ShortNotes({ notes = '' }) {
  const [keypoints, setKeypoints] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lang, setLang] = useState('en')

  async function generate() {
    if (!notes.trim()) return
    setLoading(true); setError(null)
    try {
      const res = await fetch('http://localhost:4000/api/notes/keypoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, lang })
      })
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch {
        throw new Error(res.status === 404
          ? 'Backend needs restart to load new routes (restart: node server.js)'
          : `Server error (${res.status}): ${text.slice(0, 120)}`)
      }
      if (!res.ok) throw new Error(data.details || data.error || 'Failed')
      setKeypoints(data.keypoints || '')
    } catch (e) {
      setError('Key points generation failed: ' + e.message)
    }
    setLoading(false)
  }

  function downloadNotes() {
    const el = document.createElement('a')
    el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(keypoints))
    el.setAttribute('download', 'padhai-keypoints.md')
    el.style.display = 'none'
    document.body.appendChild(el); el.click(); document.body.removeChild(el)
  }

  return (
    <div style={{ border: '1px solid #ddd', padding: 15, borderRadius: 8, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h3 style={{ margin: 0 }}>📌 Key Points & Takeaways</h3>
        <select value={lang} onChange={e => setLang(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', fontSize: 13 }}>
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
        </select>
      </div>

      {error && <div style={{ backgroundColor: '#fff0f0', border: '1px solid #f5c6cb', borderRadius: 4, padding: 8, marginBottom: 10, fontSize: 13, color: '#721c24' }}>❌ {error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#555' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          <div>⚡ Distilling the key insights for you…</div>
        </div>
      ) : keypoints ? (
        <div style={{ backgroundColor: '#f9f9f9', padding: 12, borderRadius: 6, marginBottom: 12, maxHeight: 420, overflowY: 'auto', lineHeight: 1.7 }}>
          {renderMarkdown(keypoints)}
        </div>
      ) : (
        <p style={{ color: '#666', fontSize: 14, marginBottom: 12 }}>
          💡 Click "Generate Key Points" to extract important concepts, definitions, and takeaways using AI.
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={generate} disabled={!notes.trim() || loading}
          style={{ flex: 1, minWidth: 160, padding: '10px 16px', backgroundColor: notes.trim() && !loading ? '#007bff' : '#ccc', color: 'white', border: 'none', borderRadius: 4, cursor: notes.trim() && !loading ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
          ✨ {loading ? 'Generating…' : 'Generate Key Points'}
        </button>
        <button onClick={downloadNotes} disabled={!keypoints}
          style={{ flex: 1, minWidth: 160, padding: '10px 16px', backgroundColor: keypoints ? '#6c757d' : '#ccc', color: 'white', border: 'none', borderRadius: 4, cursor: keypoints ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
          ⬇️ Download (.md)
        </button>
        {keypoints && (
          <button onClick={() => setKeypoints('')}
            style={{ padding: '10px 14px', backgroundColor: 'transparent', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', color: '#888', fontSize: 13 }}>
            ✕ Clear
          </button>
        )}
      </div>
      {!notes.trim() && (
        <p style={{ fontSize: 12, color: '#aaa', marginTop: 8, marginBottom: 0 }}>
          Upload and summarize notes first to enable key point generation.
        </p>
      )}
    </div>
  )
}


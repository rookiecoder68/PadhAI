import React, { useState } from 'react'
import { renderMarkdown } from './renderMarkdown'

export default function DetailedExplanation({ summary = '', notes = '' }) {
  const [showModal, setShowModal] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [lang, setLang] = useState('en')

  async function generate(targetLang = lang) {
    setIsGenerating(true); setError(null)
    try {
      const content = summary || notes
      if (!content.trim()) { setError('No content to explain'); setIsGenerating(false); return }
      const res = await fetch('http://localhost:4000/api/notes/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: content, lang: targetLang })
      })
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch {
        throw new Error(res.status === 404
          ? 'Backend needs restart to load new routes (restart: node server.js)'
          : `Server error (${res.status}): ${text.slice(0, 120)}`)
      }
      if (!res.ok) throw new Error(data.details || data.error || 'Failed')
      setExplanation(data.explanation)
    } catch (e) {
      setError('Explanation failed: ' + e.message)
    }
    setIsGenerating(false)
  }

  function openModal() {
    setShowModal(true)
    if (!explanation) generate(lang)
  }

  function handleLangChange(e) {
    setLang(e.target.value)
    setExplanation('')   // clear so it regenerates in new language
  }

  return (
    <>
      <button onClick={openModal}
        style={{ padding: '10px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
        📖 Detailed Explanation
      </button>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 8, width: '92%', maxWidth: 720, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h3 style={{ margin: 0, color: '#007bff' }}>📖 Detailed Explanation</h3>
                <select value={lang} onChange={handleLangChange}
                  style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', fontSize: 13 }}>
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                </select>
                {explanation && (
                  <button onClick={() => generate(lang)} disabled={isGenerating}
                    style={{ padding: '4px 10px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                    🔄 Regenerate
                  </button>
                )}
              </div>
              <button onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#666', lineHeight: 1 }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {error && <div style={{ backgroundColor: '#fff0f0', border: '1px solid #f5c6cb', borderRadius: 4, padding: 10, marginBottom: 12, color: '#721c24', fontSize: 13 }}>❌ {error}</div>}

              {isGenerating ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
                  <div style={{ color: '#555', fontSize: 15 }}>✨ Your AI tutor is building a detailed explanation…</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>This may take 15–20 seconds</div>
                </div>
              ) : explanation ? (
                <div style={{ lineHeight: 1.8, color: '#333', fontSize: 14 }}>
                  {renderMarkdown(explanation)}
                </div>
              ) : !error ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#888' }}>Loading…</div>
              ) : null}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #eee', display: 'flex', gap: 8, flexShrink: 0 }}>
              {explanation && (
                <button onClick={() => {
                    const el = document.createElement('a')
                    el.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(explanation)
                    el.download = 'explanation.md'
                    el.click()
                  }}
                  style={{ flex: 1, padding: '9px 14px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
                  ⬇️ Download
                </button>
              )}
              <button onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: '9px 14px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


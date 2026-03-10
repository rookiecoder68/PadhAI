import React, { useState, useRef, useEffect } from 'react'
import { renderMarkdown } from './renderMarkdown'

const LIBRARY_KEY = 'padhai_notes_library'

// Extract a short, meaningful title from the summary text
function extractTitle(summary, fallback = 'Study Notes') {
  if (!summary) return fallback
  // Try first markdown heading
  const headingMatch = summary.match(/^#{1,3}\s+(.+)/m)
  if (headingMatch) {
    const title = headingMatch[1].replace(/\*\*/g, '').trim()
    return title.length > 60 ? title.slice(0, 57) + '…' : title
  }
  // Try first bold phrase **like this**
  const boldMatch = summary.match(/\*\*(.+?)\*\*/)
  if (boldMatch) {
    const title = boldMatch[1].trim()
    if (title.length > 5 && title.length <= 60) return title
  }
  // First 7 meaningful words
  const words = summary.replace(/[#*`_>]/g, '').trim().split(/\s+/).slice(0, 7).join(' ')
  return words.length > 3 ? words + (summary.split(/\s+/).length > 7 ? '…' : '') : fallback
}

export default function StudyChat({ onSummary, onNotesChange, onAutoSaved, initialMessages = [] }) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [detail, setDetail] = useState('brief')
  const [analyzing, setAnalyzing] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [context, setContext] = useState('')
  const [lang, setLang] = useState('en')
  const [autoSavedMsg, setAutoSavedMsg] = useState(false)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading, analyzing])

  // If initialMessages change (session loaded), reset
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages)
      // Try to restore context from first AI message
      const firstAI = initialMessages.find(m => m.role === 'ai')
      if (firstAI) setContext(firstAI.content)
    }
  }, [initialMessages])

  function addMsg(role, content) {
    const msg = { role, content, ts: Date.now() }
    setMessages(prev => [...prev, msg])
    return msg
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type.startsWith('image/')) {
      setPdfFile(null)
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const dataUrl = ev.target.result
        setImagePreview(dataUrl)
        try {
          const base64 = dataUrl.split(',').pop()
          const resp = await fetch('http://localhost:4000/api/notes/ocr', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64 })
          })
          if (resp.ok) {
            const j = await resp.json()
            if (j.text) { setInput(j.text); onNotesChange?.(j.text) }
          }
        } catch (err) { console.warn('auto OCR failed', err) }
      }
      reader.readAsDataURL(file)
    } else if (file.type === 'application/pdf') {
      setImagePreview(null)
      setPdfLoading(true)
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target.result
        const base64 = dataUrl.split(',').pop()
        setPdfFile({ name: file.name, size: file.size, base64 })
        setPdfLoading(false)
      }
      reader.readAsDataURL(file)
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      setPdfFile(null); setImagePreview(null)
      const reader = new FileReader()
      reader.onload = (ev) => { setInput(ev.target.result); onNotesChange?.(ev.target.result) }
      reader.readAsText(file)
    }
    e.target.value = ''
  }

  async function handleCameraCapture(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfFile(null)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result
      setImagePreview(dataUrl)
      try {
        const base64 = dataUrl.split(',').pop()
        const resp = await fetch('http://localhost:4000/api/notes/ocr', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 })
        })
        if (resp.ok) { const j = await resp.json(); if (j.text) setInput(j.text) }
      } catch (err) { console.warn('camera OCR failed', err) }
    }
    reader.readAsDataURL(file)
  }

  async function handleAnalyze() {
    if (!input.trim() && !imagePreview && !pdfFile) return
    setAnalyzing(true)

    // Show user message
    let userLabel = ''
    if (pdfFile) userLabel = `📄 Analyze this PDF: **${pdfFile.name}** (${detail} mode)`
    else if (imagePreview && !input.trim()) userLabel = `📸 Analyze this image (${detail} mode)`
    else userLabel = input.slice(0, 120) + (input.length > 120 ? '…' : '')
    setMessages(prev => [...prev, { role: 'user', content: userLabel, ts: Date.now() }])

    try {
      let summary = ''
      if (pdfFile) {
        const resp = await fetch('http://localhost:4000/api/notes/pdf', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfBase64: pdfFile.base64, detail })
        })
        const j = await resp.json()
        if (!resp.ok) throw new Error(j.details || j.error || 'PDF failed')
        summary = j.summary || ''
      } else if (imagePreview && !input.trim()) {
        const base64 = imagePreview.split(',').pop()
        const resp = await fetch('http://localhost:4000/api/notes/summarize', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, detail })
        })
        const j = await resp.json()
        if (!resp.ok) throw new Error(j.details || j.error || 'Image failed')
        summary = j.summary || ''
      } else {
        const resp = await fetch('http://localhost:4000/api/notes/summarize', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: input, detail })
        })
        const j = await resp.json()
        if (!resp.ok) throw new Error(j.details || j.error || 'Text failed')
        summary = j.summary || ''
      }

      const ctx = input.trim() || summary
      setContext(ctx)
      onSummary?.(summary)
      onNotesChange?.(ctx)

      // Only show a brief confirmation in chat — the full summary is in the Summary tab below
      const title = extractTitle(summary)
      const confirmMsg = {
        role: 'ai',
        content: `✅ **${title}** — summary ready! Check the **📋 Summary** tab just below.\n\nFeel free to ask me any questions about this content.`,
        ts: Date.now(),
        isConfirmation: true
      }
      setMessages(prev => {
        const updated = [...prev, confirmMsg]
        doAutoSave(ctx, summary, title, updated, pdfFile?.name)
        return updated
      })
      if (input.trim() && !pdfFile && !imagePreview) setInput('')
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: '❌ Error: ' + e.message, ts: Date.now() }])
    }
    setAnalyzing(false)
  }

  function doAutoSave(notes, summary, topicTitle, msgs, filename) {
    const title = filename
      ? filename.replace(/\.[^.]+$/, '')
      : topicTitle || 'Auto-saved'
    const lib = JSON.parse(localStorage.getItem(LIBRARY_KEY) || '[]')
    lib.push({
      id: Date.now(),
      title,
      subject: 'Auto-saved',
      content: notes,
      summary,
      chat: msgs.map(m => ({ role: m.role, content: m.content })),
      createdAt: new Date().toISOString(),
      autoSaved: true
    })
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(lib.slice(-100)))
    setAutoSavedMsg(true)
    setTimeout(() => setAutoSavedMsg(false), 3000)
    onAutoSaved?.()
  }

  async function handleSend() {
    const question = input.trim()
    if (!question || chatLoading) return
    setInput('')
    const userMsg = { role: 'user', content: question, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setChatLoading(true)
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('http://localhost:4000/api/notes/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, history: history.slice(-14), question, lang })
      })
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch {
        throw new Error(res.status === 404 ? 'Backend needs restart' : `Server error ${res.status}`)
      }
      if (!res.ok) throw new Error(data.details || data.error || 'Chat failed')
      setMessages(prev => [...prev, { role: 'ai', content: data.answer || '', ts: Date.now() }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: '❌ ' + e.message, ts: Date.now() }])
    }
    setChatLoading(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (context && input.trim()) handleSend()
    }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const hasUpload = imagePreview || pdfFile
  const hasContent = input.trim() || hasUpload
  const analyzed = context !== ''

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 10, marginBottom: 20, overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #007bff, #0056b3)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🤖</span>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>AI Study Chat</span>
          {autoSavedMsg && (
            <span style={{ backgroundColor: '#28a745', color: 'white', borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: 'bold' }}>✅ Auto-saved!</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={lang} onChange={e => setLang(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 6, border: 'none', fontSize: 12, backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer' }}>
            <option value="en" style={{ color: '#333', backgroundColor: 'white' }}>🌐 English</option>
            <option value="hi" style={{ color: '#333', backgroundColor: 'white' }}>🇮🇳 हिंदी</option>
          </select>
        </div>
      </div>

      {/* Upload toolbar */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #eee', backgroundColor: '#f8f9fa', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => fileInputRef.current?.click()}
          style={{ padding: '7px 12px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: 6, fontWeight: 'bold', fontSize: 13 }}>
          📁 Upload File
        </button>
        <button onClick={() => cameraInputRef.current?.click()}
          style={{ padding: '7px 12px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: 6, fontWeight: 'bold', fontSize: 13 }}>
          📷 Camera
        </button>
        <span style={{ fontSize: 11, color: '#aaa' }}>PDF · image · .txt</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: '#666' }}>Mode:</label>
          <select value={detail} onChange={e => setDetail(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: 12 }}>
            <option value="brief">Brief</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>
        <button onClick={handleAnalyze} disabled={!hasContent || analyzing || pdfLoading}
          style={{ padding: '7px 14px', backgroundColor: hasContent && !analyzing ? '#007bff' : '#ccc', color: 'white', border: 'none', borderRadius: 6, cursor: hasContent && !analyzing ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: 13 }}>
          {analyzing ? '⏳ Thinking…' : '🚀 Analyze'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*,.txt,.pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleCameraCapture} style={{ display: 'none' }} />
      </div>

      {/* PDF / image preview strip */}
      {pdfLoading && <div style={{ padding: '8px 16px', backgroundColor: '#fff3cd', fontSize: 13, color: '#856404' }}>⏳ Reading PDF...</div>}
      {pdfFile && !pdfLoading && (
        <div style={{ padding: '8px 16px', backgroundColor: '#f0f8ff', borderBottom: '1px solid #cce4ff', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>📄</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: 13 }}>{pdfFile.name}</div>
            <div style={{ fontSize: 11, color: '#888' }}>{formatSize(pdfFile.size)} · Click 🚀 Analyze to process</div>
          </div>
          <button onClick={() => setPdfFile(null)} style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>✕ Remove</button>
        </div>
      )}
      {imagePreview && (
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #eee', backgroundColor: '#fffef0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={imagePreview} alt="preview" style={{ maxHeight: 56, borderRadius: 4, border: '1px solid #ddd' }} />
          <div style={{ flex: 1, fontSize: 12, color: '#666' }}>📸 Image ready · Click 🚀 Analyze to process</div>
          <button onClick={() => setImagePreview(null)} style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>✕ Remove</button>
        </div>
      )}

      {/* Chat messages */}
      <div style={{ minHeight: 220, maxHeight: 440, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#bbb', fontSize: 13, marginTop: 50 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🎓</div>
            <div style={{ fontWeight: 'bold', color: '#888', marginBottom: 4 }}>Welcome to AI Study Chat!</div>
            <div>Upload a PDF/image or paste notes, then click <strong>🚀 Analyze</strong>.</div>
            <div style={{ marginTop: 6 }}>Afterwards, ask me anything about the content!</div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: msg.role === 'user' ? 'linear-gradient(135deg,#007bff,#0056b3)' : msg.isConfirmation ? 'linear-gradient(135deg,#28a745,#1e7e34)' : 'linear-gradient(135deg,#6c757d,#495057)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, color: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
              {msg.role === 'user' ? '👤' : msg.isConfirmation ? '✅' : '🤖'}
            </div>
            {msg.isConfirmation ? (
              <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: '4px 18px 18px 18px', backgroundColor: '#f0fff4', border: '1px solid #b7ebc8', fontSize: 13, lineHeight: 1.6, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', color: '#1a5c2a' }}>
                {renderMarkdown(msg.content)}
              </div>
            ) : (
              <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px', backgroundColor: msg.role === 'user' ? '#007bff' : '#f1f3f5', color: msg.role === 'user' ? 'white' : '#222', fontSize: 14, lineHeight: 1.65, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
                {msg.role === 'ai' ? renderMarkdown(msg.content) : msg.content}
              </div>
            )}
          </div>
        ))}
        {(analyzing || chatLoading) && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#28a745,#1e7e34)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'white' }}>🤖</div>
            <div style={{ padding: '10px 14px', borderRadius: '4px 18px 18px 18px', backgroundColor: '#f1f3f5', fontSize: 14, color: '#888' }}>
              <span style={{ display: 'inline-block', animation: 'none' }}>⚡ {analyzing ? 'Your AI tutor is analyzing your content…' : 'Thinking…'}</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div style={{ borderTop: '1px solid #eee', padding: '10px 16px', backgroundColor: '#fafafa', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={e => { setInput(e.target.value); if (!context) onNotesChange?.(e.target.value) }}
          onKeyDown={handleKeyDown}
          placeholder={analyzed ? 'Ask a follow-up question… (Enter to send, Shift+Enter for new line)' : 'Paste notes or text here to analyze… or upload a file above'}
          rows={2}
          style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontFamily: 'inherit', fontSize: 14, resize: 'none', lineHeight: 1.5, outline: 'none' }}
        />
        {analyzed ? (
          <button onClick={handleSend} disabled={!input.trim() || chatLoading}
            style={{ padding: '9px 18px', backgroundColor: input.trim() && !chatLoading ? '#007bff' : '#ccc', color: 'white', border: 'none', borderRadius: 8, cursor: input.trim() && !chatLoading ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: 14, whiteSpace: 'nowrap', alignSelf: 'center' }}>
            Send ➤
          </button>
        ) : (
          <button onClick={handleAnalyze} disabled={!hasContent || analyzing || pdfLoading}
            style={{ padding: '9px 18px', backgroundColor: hasContent && !analyzing ? '#007bff' : '#ccc', color: 'white', border: 'none', borderRadius: 8, cursor: hasContent && !analyzing ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: 14, whiteSpace: 'nowrap', alignSelf: 'center' }}>
            {analyzing ? '⏳' : '🚀 Analyze'}
          </button>
        )}
      </div>
    </div>
  )
}

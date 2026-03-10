import React, { useState, useRef, useEffect } from 'react'
import DetailedExplanation from './DetailedExplanation'
import { renderMarkdown } from './renderMarkdown'

// Strip markdown syntax so TTS reads clean prose
function cleanForSpeech(text) {
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^[\*\-●•]\s*/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/---+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Pick the best available voice for a given BCP-47 language code
function pickVoice(lang) {
  const voices = window.speechSynthesis?.getVoices() || []
  // exact match first, then prefix match
  return (
    voices.find(v => v.lang === lang) ||
    voices.find(v => v.lang.startsWith(lang.split('-')[0])) ||
    null
  )
}

export default function SummaryView({ summary }) {
  const [mode, setMode] = useState('text')
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [videoUrl, setVideoUrl] = useState(null)
  const [videoLoading, setVideoLoading] = useState(false)
  const [lang, setLang] = useState('en-US')
  const canvasRef = useRef(null)
  const utteranceRef = useRef(null)

  // stop speech when summary changes or component unmounts
  useEffect(() => {
    return () => { window.speechSynthesis?.cancel() }
  }, [summary])

  // Voices load asynchronously; trigger a re-render once they're ready
  const [voicesLoaded, setVoicesLoaded] = useState(false)
  useEffect(() => {
    const onVoicesChanged = () => setVoicesLoaded(true)
    window.speechSynthesis?.addEventListener('voiceschanged', onVoicesChanged)
    // Some browsers already have voices sync
    if (window.speechSynthesis?.getVoices().length) setVoicesLoaded(true)
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', onVoicesChanged)
  }, [])

  function speak(targetLang = lang) {
    if (!summary) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(cleanForSpeech(summary))
    utter.lang = targetLang
    utter.rate = 0.9
    // Explicitly pick a matching voice for better Hindi/other language support
    const voice = pickVoice(targetLang)
    if (voice) utter.voice = voice
    utter.onstart = () => { setSpeaking(true); setPaused(false) }
    utter.onend = () => { setSpeaking(false); setPaused(false) }
    utter.onerror = () => { setSpeaking(false); setPaused(false) }
    utteranceRef.current = utter
    window.speechSynthesis.speak(utter)
  }

  function handleLangChange(newLang) {
    setLang(newLang)
    // If currently in audio mode and speaking, restart in the new language
    if (mode === 'audio') {
      window.speechSynthesis.cancel()
      setSpeaking(false); setPaused(false)
      // slight delay so state settles
      setTimeout(() => speak(newLang), 100)
    }
  }

  function pauseResume() {
    if (paused) {
      window.speechSynthesis.resume()
      setPaused(false)
    } else {
      window.speechSynthesis.pause()
      setPaused(true)
    }
  }

  function stopSpeech() {
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setPaused(false)
  }

  // Draw summary text on canvas for the video panel
  function drawCanvas(imgSrc) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (imgSrc) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      img.src = imgSrc
    } else {
      // fallback: plain text slide
      ctx.fillStyle = '#007bff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#0056b3'
      ctx.fillRect(0, 0, canvas.width, 44)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 20px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('📚 PadhAI Summary', canvas.width / 2, 12)
      ctx.textAlign = 'left'
      ctx.font = '16px sans-serif'
      const padding = 28
      const maxWidth = canvas.width - padding * 2
      const lineHeight = 28
      const words = summary.split(' ')
      const displayLines = []
      let current = ''
      for (const word of words) {
        const test = current ? current + ' ' + word : word
        if (ctx.measureText(test).width > maxWidth) { displayLines.push(current); current = word }
        else current = test
        if (displayLines.length >= 9) break
      }
      if (current && displayLines.length < 9) displayLines.push(current)
      displayLines.forEach((line, i) => {
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#d0e8ff'
        ctx.fillText(line, padding, 54 + i * lineHeight)
      })
    }
  }

  async function makeVideo() {
    if (!summary) return
    setVideoLoading(true)
    setVideoUrl(null)
    setVideoReady(false)

    // 1. Ask Gemini to generate an AI infographic slide
    let aiImageSrc = null
    try {
      console.log('[Video] Requesting AI slide image...')
      const res = await fetch('http://localhost:4000/api/notes/generate-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary })
      })
      if (res.ok) {
        const data = await res.json()
        aiImageSrc = `data:${data.mimeType};base64,${data.base64}`
        console.log('[Video] AI slide image received')
      } else {
        console.warn('[Video] Slide generation failed, using fallback canvas')
      }
    } catch (e) {
      console.warn('[Video] Slide generation error, using fallback:', e.message)
    }

    // slight delay to let canvas mount
    await new Promise(r => setTimeout(r, 150))
    drawCanvas(aiImageSrc)

    // wait for image to paint before recording
    await new Promise(r => setTimeout(r, 300))

    const canvas = canvasRef.current
    const stream = canvas.captureStream(10)
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
    const chunks = []
    recorder.ondataavailable = e => chunks.push(e.data)
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      setVideoUrl(url)
      setVideoReady(true)
      setVideoLoading(false)
    }

    // record while TTS plays
    recorder.start()
    speak(lang)

    // estimate duration: ~130 words/min average speech rate
    const wordCount = summary.split(/\s+/).length
    const durationMs = Math.max(5000, Math.ceil((wordCount / 130) * 60 * 1000))
    setTimeout(() => { if (recorder.state === 'recording') recorder.stop() }, durationMs + 1000)
  }

  // auto-start speech when switching to audio mode
  useEffect(() => {
    if (mode === 'audio' && summary && !speaking) {
      speak(lang)
    }
    if (mode !== 'audio' && mode !== 'video') {
      stopSpeech()
    }
  }, [mode])

  const btnStyle = (active) => ({
    padding: '6px 12px', borderRadius: 4, border: '1px solid #ccc', cursor: 'pointer',
    backgroundColor: active ? '#007bff' : '#f0f0f0',
    color: active ? 'white' : '#333', fontWeight: active ? 'bold' : 'normal'
  })

  return (
    <div style={{ border: '1px solid #ddd', padding: 15, borderRadius: 8, marginBottom: 20 }}>
      <h3 style={{ marginTop: 0 }}>📋 Summary</h3>

      {/* Mode tabs */}
      <div style={{ marginBottom: 12, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setMode('text')} style={btnStyle(mode === 'text')}>📝 Text</button>
        <button onClick={() => setMode('audio')} disabled={!summary} style={btnStyle(mode === 'audio')}>🎙️ Audio</button>
        <button onClick={() => setMode('video')} disabled={!summary} style={btnStyle(mode === 'video')}>🎥 Video</button>
        <select value={lang} onChange={e => handleLangChange(e.target.value)}
          style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #ccc', fontSize: 13 }}>
          <option value="en-US">English (US)</option>
          <option value="hi-IN">हिंदी</option>
          <option value="en-GB">English (UK)</option>
          <option value="en-IN">English (India)</option>
        </select>
      </div>

      {/* Text mode */}
      {mode === 'text' && (
        <>
          <div style={{ backgroundColor: '#f9f9f9', padding: 12, borderRadius: 4, marginBottom: 12, maxHeight: 400, overflowY: 'auto', lineHeight: 1.7 }}>
            {summary ? renderMarkdown(summary) : <span style={{ color: '#666' }}>No summary yet. Upload notes or a PDF and click "📝 Summarize".</span>}
          </div>
          {summary && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => speak(lang)} disabled={speaking}
                style={{ padding: '8px 14px', backgroundColor: speaking ? '#ccc' : '#28a745', color: 'white', border: 'none', borderRadius: 4, cursor: speaking ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                🎙️ Read Aloud
              </button>
              <DetailedExplanation summary={summary} />
            </div>
          )}
        </>
      )}

      {/* Audio mode */}
      {mode === 'audio' && (
        <div style={{ padding: 16, backgroundColor: '#f0f8ff', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{speaking ? (paused ? '⏸️' : '🔊') : '🔇'}</div>
          <div style={{ fontSize: 14, color: '#555', marginBottom: 16 }}>
            {speaking ? (paused ? 'Paused' : `Speaking in ${lang === 'hi-IN' ? 'Hindi' : 'English'}…`) : 'Stopped'}
          </div>
          {/* Hindi voice availability notice */}
          {lang === 'hi-IN' && (() => {
            const hindiVoice = pickVoice('hi-IN')
            return hindiVoice ? (
              <div style={{ fontSize: 12, color: '#28a745', marginBottom: 10, backgroundColor: '#f0fff4', padding: '4px 10px', borderRadius: 4, display: 'inline-block' }}>
                ✅ Hindi voice found: {hindiVoice.name}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#856404', marginBottom: 10, backgroundColor: '#fff3cd', padding: '6px 10px', borderRadius: 4 }}>
                ⚠️ No Hindi voice found in your browser. Try Chrome/Edge on Windows, or install a Hindi TTS voice in your OS settings. Speech will fall back to the default voice.
              </div>
            )
          })()}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => speak(lang)} disabled={speaking && !paused}
              style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
              ▶ Play
            </button>
            <button onClick={pauseResume} disabled={!speaking}
              style={{ padding: '8px 16px', backgroundColor: '#ffc107', color: '#333', border: 'none', borderRadius: 4, cursor: speaking ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
              {paused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button onClick={stopSpeech} disabled={!speaking}
              style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: 4, cursor: speaking ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
              ⏹ Stop
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#888', marginTop: 12 }}>
            Uses your browser's built-in text-to-speech. Change language above to switch and it will restart automatically.
          </p>
        </div>
      )}

      {/* Video mode */}
      {mode === 'video' && (
        <div style={{ textAlign: 'center' }}>
          <canvas ref={canvasRef} width={640} height={320}
            style={{ width: '100%', maxWidth: 640, borderRadius: 8, border: '1px solid #ddd', display: 'block', margin: '0 auto 12px' }} />
          {!videoReady && !videoLoading && (
            <button onClick={makeVideo}
              style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold', fontSize: 15 }}>
              🎬 Generate Video + Read Aloud
            </button>
          )}
          {videoLoading && <div style={{ color: '#555', marginBottom: 8 }}>⏳ Your AI tutor is crafting a visual summary… then recording with audio</div>}
          {videoReady && videoUrl && (
            <>
              <video controls src={videoUrl} style={{ width: '100%', maxWidth: 640, borderRadius: 8, marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <a href={videoUrl} download="padhai-summary.webm"
                  style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', borderRadius: 4, textDecoration: 'none', fontWeight: 'bold' }}>
                  ⬇️ Download Video
                </a>
                <button onClick={makeVideo}
                  style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                  🔄 Regenerate
                </button>
              </div>
            </>
          )}
          <p style={{ fontSize: 12, color: '#888', marginTop: 10 }}>
            Video shows summary slide; audio plays via browser speech engine — no billing required.
          </p>
        </div>
      )}
    </div>
  )
}

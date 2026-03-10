import React, { useState, useEffect, useRef } from 'react'

const HISTORY_KEY = 'padhai_quiz_history'
const INPROGRESS_KEY = 'padhai_quiz_inprogress'
const MAX_HISTORY = 20

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [] } catch { return [] }
}
function saveHistory(h) { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, MAX_HISTORY))) }
function loadInProgress() {
  try { return JSON.parse(localStorage.getItem(INPROGRESS_KEY)) } catch { return null }
}
function clearInProgress() { localStorage.removeItem(INPROGRESS_KEY) }
function saveInProgress(state) { localStorage.setItem(INPROGRESS_KEY, JSON.stringify({ ...state, savedAt: Date.now() })) }

const optionLabels = ['A', 'B', 'C', 'D']

export default function QuizAndFlashcards({ notes = '' }) {
  const [mode, setMode] = useState('menu') // menu | quiz | flashcards | history
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState(null)

  // quiz state
  const [quiz, setQuiz] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [answers, setAnswers] = useState([])

  // flashcard state
  const [cards, setCards] = useState([])
  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)

  // history + resume
  const [quizHistory, setQuizHistory] = useState(loadHistory)
  const [savedQuiz, setSavedQuiz] = useState(loadInProgress)

  // save in-progress quiz on unmount if mid-quiz
  const quizStateRef = useRef({})
  useEffect(() => {
    quizStateRef.current = { mode, quiz, currentQ, score, answers, showResults }
  })
  useEffect(() => {
    return () => {
      const s = quizStateRef.current
      if (s.mode === 'quiz' && !s.showResults && s.quiz.length > 0) {
        saveInProgress({ quiz: s.quiz, currentQ: s.currentQ, score: s.score, answers: s.answers })
      }
    }
  }, [])

  async function startQuiz(fresh = true) {
    if (!notes.trim()) { alert('Please add or summarize notes first'); return }
    if (fresh) {
      clearInProgress()
      setLoading(true); setError(null)
      setLoadingMsg('🧠 Your AI tutor is crafting your quiz…')
      try {
        const res = await fetch('http://localhost:4000/api/notes/quiz', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.details || data.error || 'Quiz generation failed')
        setQuiz(data.quiz); setCurrentQ(0); setSelected(null)
        setScore(0); setShowResults(false); setAnswers([])
        setMode('quiz')
      } catch (e) { setError('Quiz generation failed: ' + e.message) }
      setLoading(false)
    } else {
      // resume
      const s = savedQuiz
      if (!s) return
      setQuiz(s.quiz); setCurrentQ(s.currentQ); setScore(s.score)
      setAnswers(s.answers); setSelected(null); setShowResults(false)
      setSavedQuiz(null); clearInProgress()
      setMode('quiz')
    }
  }

  async function startFlashcards() {
    if (!notes.trim()) { alert('Please add or summarize notes first'); return }
    setLoading(true); setError(null)
    setLoadingMsg('🃏 Brewing your flashcards with AI magic…')
    try {
      const res = await fetch('http://localhost:4000/api/notes/flashcards', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || 'Flashcard generation failed')
      setCards(data.cards); setCurrentCard(0); setFlipped(false)
      setMode('flashcards')
    } catch (e) { setError('Flashcard generation failed: ' + e.message) }
    setLoading(false)
  }

  function handleAnswer(idx) {
    if (selected !== null) return
    const q = quiz[currentQ]
    const isCorrect = idx === q.correct
    setSelected(idx)
    if (isCorrect) setScore(s => s + 1)
    setAnswers(a => [...a, { selected: idx, correct: q.correct, explanation: q.explanation }])
  }

  function nextQuestion() {
    if (currentQ + 1 < quiz.length) {
      setCurrentQ(q => q + 1); setSelected(null)
    } else {
      // Quiz complete — save to history
      const newScore = score + (selected === quiz[currentQ].correct ? 0 : 0) // score already updated via handleAnswer
      const finalScore = answers.filter(a => a.selected === a.correct).length + (selected === quiz[currentQ].correct ? 1 : 0)
      // use `score` state which was updated via setScore in handleAnswer
      const record = {
        id: Date.now(),
        date: new Date().toISOString(),
        score, total: quiz.length,
        pct: Math.round((score / quiz.length) * 100),
        quiz: quiz.map((q, i) => ({ ...q, userAnswer: answers[i]?.selected ?? selected })),
        answers: [...answers]
      }
      const updated = [record, ...quizHistory].slice(0, MAX_HISTORY)
      setQuizHistory(updated); saveHistory(updated)
      clearInProgress()
      setShowResults(true)
    }
  }

  function reset() { setMode('menu'); setError(null) }

  // ── Menu ──────────────────────────────────────────────────────────────────
  if (mode === 'menu') {
    return (
      <div style={{ border: '1px solid #ddd', padding: 15, borderRadius: 8, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>📚 AI Learning Tools</h3>
          {quizHistory.length > 0 && (
            <button onClick={() => setMode('history')} style={{ padding: '5px 12px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
              📊 History ({quizHistory.length})
            </button>
          )}
        </div>

        {error && <div style={{ backgroundColor: '#fff0f0', border: '1px solid #f5c6cb', borderRadius: 4, padding: 10, marginBottom: 12, fontSize: 13, color: '#721c24' }}>❌ {error}</div>}

        {/* Resume banner */}
        {savedQuiz && !loading && (
          <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6, padding: 12, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 13 }}>⏸️ Quiz in Progress</div>
              <div style={{ fontSize: 12, color: '#555' }}>Q{savedQuiz.currentQ + 1}/{savedQuiz.quiz.length} · Score: {savedQuiz.score}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => startQuiz(false)} style={{ padding: '6px 12px', backgroundColor: '#ffc107', color: '#333', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>▶ Resume</button>
              <button onClick={() => { clearInProgress(); setSavedQuiz(null) }} style={{ padding: '6px 8px', backgroundColor: 'transparent', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: '#666' }}>✕</button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>⏳</div>
            <div style={{ color: '#555' }}>{loadingMsg}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>This may take 10–20 seconds…</div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div onClick={() => startQuiz(true)} style={{ flex: 1, minWidth: 160, padding: 20, backgroundColor: notes.trim() ? '#007bff' : '#ccc', color: 'white', borderRadius: 8, cursor: notes.trim() ? 'pointer' : 'not-allowed', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>📝</div>
              <div style={{ fontWeight: 'bold', fontSize: 15 }}>AI Quiz</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>10 MCQs with explanations</div>
            </div>
            <div onClick={startFlashcards} style={{ flex: 1, minWidth: 160, padding: 20, backgroundColor: notes.trim() ? '#28a745' : '#ccc', color: 'white', borderRadius: 8, cursor: notes.trim() ? 'pointer' : 'not-allowed', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>🎴</div>
              <div style={{ fontWeight: 'bold', fontSize: 15 }}>AI Flashcards</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>10–20 cards covering all concepts</div>
            </div>
          </div>
        )}
        {!notes.trim() && !loading && (
          <p style={{ fontSize: 12, color: '#888', marginTop: 10, marginBottom: 0 }}>
            💡 Go to the Learn tab, upload notes or a PDF, summarize it, then come back here.
          </p>
        )}
      </div>
    )
  }

  // ── Quiz History ───────────────────────────────────────────────────────────
  if (mode === 'history') {
    return (
      <div style={{ border: '1px solid #ddd', padding: 15, borderRadius: 8, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>📊 Quiz History</h3>
          <button onClick={reset} style={{ padding: '5px 12px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>← Back</button>
        </div>
        {quizHistory.length === 0 ? (
          <p style={{ color: '#888' }}>No quiz history yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 480, overflowY: 'auto' }}>
            {quizHistory.map((record, ri) => {
              const pct = Math.round((record.score / record.total) * 100)
              const grade = pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📖'
              return (
                <details key={record.id} style={{ border: '1px solid #e0e0e0', borderRadius: 6, padding: 0, overflow: 'hidden' }}>
                  <summary style={{ padding: '10px 12px', backgroundColor: '#f8f9fa', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', listStyle: 'none', gap: 10 }}>
                    <div>
                      <span style={{ fontWeight: 'bold', fontSize: 14 }}>{grade} {record.score}/{record.total}</span>
                      <span style={{ fontSize: 13, color: pct >= 60 ? '#28a745' : '#dc3545', marginLeft: 8 }}>{pct}%</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#888' }}>{new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </summary>
                  <div style={{ padding: 12 }}>
                    {(record.quiz || []).map((q, qi) => {
                      const ans = record.answers?.[qi]
                      const isCorrect = ans?.selected === q.correct
                      return (
                        <div key={qi} style={{ marginBottom: 10, padding: 10, backgroundColor: isCorrect ? '#f0fff4' : '#fff5f5', borderRadius: 5, border: `1px solid ${isCorrect ? '#c3e6cb' : '#f5c6cb'}` }}>
                          <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 5 }}>Q{qi + 1}. {q.question}</div>
                          {q.options.map((opt, oi) => (
                            <div key={oi} style={{ fontSize: 12, padding: '2px 6px', borderRadius: 3, marginBottom: 2, backgroundColor: oi === q.correct ? '#d4edda' : (oi === ans?.selected && !isCorrect ? '#f8d7da' : 'transparent'), color: oi === q.correct ? '#155724' : (oi === ans?.selected && !isCorrect ? '#721c24' : '#555') }}>
                              {optionLabels[oi]}. {opt} {oi === q.correct ? '✓' : (oi === ans?.selected && !isCorrect ? '✗' : '')}
                            </div>
                          ))}
                          {q.explanation && <div style={{ fontSize: 11, color: '#555', marginTop: 5, fontStyle: 'italic' }}>💡 {q.explanation}</div>}
                        </div>
                      )
                    })}
                    <button onClick={() => { const updated = quizHistory.filter(r => r.id !== record.id); setQuizHistory(updated); saveHistory(updated) }} style={{ fontSize: 11, padding: '3px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer' }}>🗑️ Delete</button>
                  </div>
                </details>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── Quiz Results ──────────────────────────────────────────────────────────
  if (mode === 'quiz' && showResults) {
    const pct = Math.round((score / quiz.length) * 100)
    const grade = pct >= 80 ? '🏆 Excellent!' : pct >= 60 ? '👍 Good job!' : '📖 Keep studying!'
    return (
      <div style={{ border: '1px solid #ddd', padding: 15, borderRadius: 8, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>📝 Quiz Results</h3>
        <div style={{ textAlign: 'center', padding: '14px 0', borderBottom: '1px solid #eee', marginBottom: 14 }}>
          <div style={{ fontSize: 48, fontWeight: 'bold', color: pct >= 60 ? '#28a745' : '#dc3545' }}>{score}/{quiz.length}</div>
          <div style={{ fontSize: 20, marginTop: 4 }}>{grade}</div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{pct}% correct · Saved to history</div>
        </div>
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {quiz.map((q, i) => {
            const ans = answers[i]
            const isCorrect = ans?.selected === q.correct
            return (
              <div key={i} style={{ marginBottom: 12, padding: 10, backgroundColor: isCorrect ? '#f0fff4' : '#fff5f5', borderRadius: 6, border: `1px solid ${isCorrect ? '#c3e6cb' : '#f5c6cb'}` }}>
                <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 5 }}>Q{i + 1}. {q.question}</div>
                {q.options.map((opt, oi) => (
                  <div key={oi} style={{ fontSize: 13, padding: '3px 8px', borderRadius: 4, marginBottom: 3, backgroundColor: oi === q.correct ? '#d4edda' : (oi === ans?.selected && !isCorrect ? '#f8d7da' : 'transparent'), color: oi === q.correct ? '#155724' : (oi === ans?.selected && !isCorrect ? '#721c24' : '#333') }}>
                    {optionLabels[oi]}. {opt} {oi === q.correct ? '✓' : (oi === ans?.selected && !isCorrect ? '✗' : '')}
                  </div>
                ))}
                {q.explanation && <div style={{ fontSize: 12, color: '#555', marginTop: 5, fontStyle: 'italic' }}>💡 {q.explanation}</div>}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={() => startQuiz(true)} style={{ flex: 1, padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>🔄 New Quiz</button>
          <button onClick={() => setMode('history')} style={{ flex: 1, padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>📊 History</button>
          <button onClick={reset} style={{ flex: 1, padding: '10px', backgroundColor: '#e9ecef', color: '#333', border: 'none', borderRadius: 4, cursor: 'pointer' }}>← Menu</button>
        </div>
      </div>
    )
  }

  // ── Quiz Question ──────────────────────────────────────────────────────────
  if (mode === 'quiz') {
    const q = quiz[currentQ]
    return (
      <div style={{ border: '1px solid #ddd', padding: 15, borderRadius: 8, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>📝 AI Quiz</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: '#666' }}>Q {currentQ + 1}/{quiz.length} · Score: {score}</span>
            <button onClick={() => { saveInProgress({ quiz, currentQ, score, answers }); reset() }}
              style={{ padding: '4px 10px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: '#856404' }}>
              ⏸ Save & Exit
            </button>
          </div>
        </div>
        <div style={{ height: 6, backgroundColor: '#e9ecef', borderRadius: 3, marginBottom: 14 }}>
          <div style={{ height: '100%', width: `${(currentQ / quiz.length) * 100}%`, backgroundColor: '#007bff', borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 14, lineHeight: 1.5 }}>{q.question}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.options.map((opt, idx) => {
            let bg = '#f8f9fa', border = '2px solid #dee2e6', color = '#333'
            if (selected !== null) {
              if (idx === q.correct) { bg = '#d4edda'; border = '2px solid #28a745'; color = '#155724' }
              else if (idx === selected) { bg = '#f8d7da'; border = '2px solid #dc3545'; color = '#721c24' }
            }
            return (
              <button key={idx} onClick={() => handleAnswer(idx)} disabled={selected !== null}
                style={{ padding: '12px 16px', textAlign: 'left', backgroundColor: bg, border, borderRadius: 6, cursor: selected !== null ? 'default' : 'pointer', fontSize: 14, color, transition: 'all 0.2s' }}>
                <span style={{ fontWeight: 'bold', marginRight: 8 }}>{optionLabels[idx]}.</span>{opt}
                {idx === q.correct && selected !== null && <span style={{ float: 'right' }}>✓</span>}
                {idx === selected && idx !== q.correct && <span style={{ float: 'right' }}>✗</span>}
              </button>
            )
          })}
        </div>
        {selected !== null && (
          <>
            <div style={{ marginTop: 10, padding: 10, backgroundColor: '#f0f8ff', borderRadius: 6, fontSize: 13, color: '#0056b3' }}>💡 {q.explanation}</div>
            <button onClick={nextQuestion} style={{ marginTop: 10, width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold', fontSize: 15 }}>
              {currentQ + 1 < quiz.length ? 'Next Question →' : 'See Results 🏆'}
            </button>
          </>
        )}
      </div>
    )
  }

  // ── Flashcards ────────────────────────────────────────────────────────────
  if (mode === 'flashcards') {
    const card = cards[currentCard]
    return (
      <div style={{ border: '1px solid #ddd', padding: 15, borderRadius: 8, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>🎴 AI Flashcards</h3>
          <span style={{ fontSize: 13, color: '#666' }}>{currentCard + 1} / {cards.length}</span>
        </div>
        <div style={{ height: 6, backgroundColor: '#e9ecef', borderRadius: 3, marginBottom: 14 }}>
          <div style={{ height: '100%', width: `${((currentCard + 1) / cards.length) * 100}%`, backgroundColor: '#28a745', borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
        <div onClick={() => setFlipped(f => !f)} style={{ minHeight: 200, backgroundColor: flipped ? '#e8f5e9' : '#e3f2fd', border: `2px solid ${flipped ? '#28a745' : '#007bff'}`, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 24, textAlign: 'center', transition: 'background-color 0.25s, border-color 0.25s' }}>
          <div style={{ fontSize: 11, fontWeight: 'bold', letterSpacing: 1, color: flipped ? '#28a745' : '#007bff', marginBottom: 12, textTransform: 'uppercase' }}>
            {flipped ? '💡 Answer' : '❓ Question'}
          </div>
          <div style={{ fontSize: flipped ? 15 : 18, fontWeight: flipped ? 'normal' : 'bold', color: '#222', lineHeight: 1.6 }}>
            {flipped ? card.back : card.front}
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#999', margin: '8px 0 12px' }}>Click card to flip</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setCurrentCard(c => c - 1); setFlipped(false) }} disabled={currentCard === 0}
            style={{ flex: 1, padding: '10px', backgroundColor: currentCard === 0 ? '#e9ecef' : '#6c757d', color: currentCard === 0 ? '#aaa' : 'white', border: 'none', borderRadius: 4, cursor: currentCard === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>← Previous</button>
          <button onClick={() => setFlipped(f => !f)} style={{ padding: '10px 14px', backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffc107', borderRadius: 4, cursor: 'pointer' }}>🔄</button>
          <button onClick={() => { 
            // track flashcard views
            const fcKey = 'padhai_flashcard_views'
            const today = new Date().toDateString()
            const fc = JSON.parse(localStorage.getItem(fcKey) || '{"date":"","count":0}')
            const count = fc.date === today ? fc.count + 1 : 1
            localStorage.setItem(fcKey, JSON.stringify({ date: today, count }))
            setCurrentCard(c => c + 1); setFlipped(false) }} disabled={currentCard === cards.length - 1}
            style={{ flex: 1, padding: '10px', backgroundColor: currentCard === cards.length - 1 ? '#e9ecef' : '#6c757d', color: currentCard === cards.length - 1 ? '#aaa' : 'white', border: 'none', borderRadius: 4, cursor: currentCard === cards.length - 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>Next →</button>
        </div>
        <button onClick={reset} style={{ marginTop: 8, width: '100%', padding: '6px', backgroundColor: 'transparent', color: '#888', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>← Back to Menu</button>
      </div>
    )
  }
}


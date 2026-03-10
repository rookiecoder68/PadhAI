const express = require('express');
const router = express.Router();
const { summarizeText, summarizePDF, generateSlideImage, synthesizeSpeech, extractTextFromImage } = require('../azureClient');

router.post('/summarize', async (req, res) => {
  const { text, detail, imageBase64, lang, language } = req.body;
  if (!text && !imageBase64) return res.status(400).json({ error: 'text or imageBase64 required' });
  try {
    // strip data: prefix if present from imageBase64
    const image = imageBase64 ? imageBase64.split(',').pop() : null;
    const selectedLang = lang || language || 'en';
    const summary = await summarizeText(text || '', detail || 'brief', image, selectedLang);
    if (!summary || typeof summary !== 'string' || !summary.trim()) {
      console.warn('summarize returned empty result');
      return res.json({ summary: '', note: 'no summary generated' });
    }
    res.json({ summary });
  } catch (e) {
    console.error('summarize endpoint error', e);
    const msg = e.message || String(e);
    const status = msg.includes('429') || msg.toLowerCase().includes('quota') ? 429 : 500;
    res.status(status).json({ error: 'summarization failed', details: msg });
  }
});

router.post('/tts', async (req, res) => {
  const { text, lang, voice } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  try {
    const base64 = await synthesizeSpeech(text, lang || 'en-US', voice || 'en-US-JennyNeural');
    res.json({ audioBase64: base64 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'tts failed' });
  }
});

// OCR endpoint: expects base64 image data (data URL prefix optional)
router.post('/ocr', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const { imageBase64 } = req.body || {};
  if (!imageBase64) {
    console.warn('OCR called with no imageBase64');
    return res.status(400).json({ error: 'imageBase64 required' });
  }
  try {
    // strip data: prefix if present
    const base64 = imageBase64.split(',').pop();
    const text = await extractTextFromImage(base64);
    if (typeof text !== 'string') {
      console.warn('OCR returned non-string', text);
    }
    res.json({ text });
  } catch (e) {
    console.error('OCR endpoint error', e);
    // respond with structured JSON message so client can parse
    res.status(500).json({ error: 'ocr failed', details: e.message || String(e) });
  }
});

// PDF summarization endpoint: sends PDF directly to Gemini (no local text extraction)
router.post('/pdf', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const { pdfBase64, detail, lang, language } = req.body || {};
  if (!pdfBase64) {
    return res.status(400).json({ error: 'pdfBase64 required' });
  }
  try {
    const base64 = pdfBase64.split(',').pop(); // strip data URL prefix if present
    const selectedLang = lang || language || 'en';
    const summary = await summarizePDF(base64, detail || 'brief', selectedLang);
    res.json({ summary });
  } catch (e) {
    console.error('PDF summarize error', e);
    const msg = e.message || String(e);
    const status = msg.includes('429') || msg.toLowerCase().includes('quota') ? 429 : 500;
    res.status(status).json({ error: 'pdf_summarize_failed', details: msg });
  }
});

// AI slide image generation for video mode
router.post('/generate-slide', async (req, res) => {
  const { summary } = req.body || {};
  if (!summary) return res.status(400).json({ error: 'summary required' });
  try {
    const image = await generateSlideImage(summary);
    res.json(image); // { mimeType, base64 }
  } catch (e) {
    console.error('generate-slide error', e);
    res.status(500).json({ error: 'slide_generation_failed', details: e.message || String(e) });
  }
});

// AI quiz generation
router.post('/quiz', async (req, res) => {
  const { notes } = req.body || {};
  if (!notes) return res.status(400).json({ error: 'notes required' });
  try {
    const { generateQuiz } = require('../azureClient');
    const quiz = await generateQuiz(notes);
    res.json({ quiz });
  } catch (e) {
    console.error('quiz error', e);
    res.status(500).json({ error: 'quiz_failed', details: e.message || String(e) });
  }
});

// AI flashcard generation
router.post('/flashcards', async (req, res) => {
  const { notes } = req.body || {};
  if (!notes) return res.status(400).json({ error: 'notes required' });
  try {
    const { generateFlashcards } = require('../azureClient');
    const cards = await generateFlashcards(notes);
    res.json({ cards });
  } catch (e) {
    console.error('flashcards error', e);
    res.status(500).json({ error: 'flashcards_failed', details: e.message || String(e) });
  }
});

// AI key points generation
router.post('/keypoints', async (req, res) => {
  const { notes, lang } = req.body || {};
  if (!notes) return res.status(400).json({ error: 'notes required' });
  try {
    const { generateKeyPoints } = require('../azureClient');
    const keypoints = await generateKeyPoints(notes, lang || 'en');
    res.json({ keypoints });
  } catch (e) {
    console.error('keypoints error', e);
    res.status(500).json({ error: 'keypoints_failed', details: e.message || String(e) });
  }
});

// AI detailed explanation
router.post('/explain', async (req, res) => {
  const { notes, lang } = req.body || {};
  if (!notes) return res.status(400).json({ error: 'notes required' });
  try {
    const { generateExplanation } = require('../azureClient');
    const explanation = await generateExplanation(notes, lang || 'en');
    res.json({ explanation });
  } catch (e) {
    console.error('explain error', e);
    res.status(500).json({ error: 'explain_failed', details: e.message || String(e) });
  }
});

// AI chat follow-up questions
router.post('/chat', async (req, res) => {
  const { context, history, question, lang } = req.body || {};
  if (!question) return res.status(400).json({ error: 'question required' });
  try {
    const { generateChatResponse } = require('../azureClient');
    const answer = await generateChatResponse(context || '', history || [], question, lang || 'en');
    res.json({ answer });
  } catch (e) {
    console.error('chat error', e);
    res.status(500).json({ error: 'chat_failed', details: e.message || String(e) });
  }
});

module.exports = router;

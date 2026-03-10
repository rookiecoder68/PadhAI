const fetch = require('node-fetch');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_MODEL   = 'gemini-2.5-flash';
const GEMINI_URL     = () => `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GOOGLE_API_KEY}`;

async function callGemini(parts) {
  if (!GOOGLE_API_KEY) throw new Error('GOOGLE_API_KEY not set – check .env and restart the server');
  const res = await fetch(GEMINI_URL(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] })
  });
  const raw = await res.text();
  if (res.status === 429) {
    throw new Error('Gemini quota exceeded (429): API usage limit reached. Please try again later or increase quota.');
  }
  if (res.status >= 500) {
    throw new Error(`Gemini service temporarily unavailable (${res.status}). Please retry in a moment.`);
  }
  if (raw.trimStart().startsWith('<')) {
    throw new Error(`Gemini API returned HTTP ${res.status}: ${raw.slice(0, 200)}`);
  }
  const data = JSON.parse(raw);
  if (data.error) throw new Error(`Gemini error ${data.error.code}: ${data.error.message}`);
  return data.candidates[0].content.parts[0].text;
}

// wrapper that handles text or image summarization
async function summarizeText(text, detailLevel = 'brief', imageBase64 = null, lang = 'en') {
  const detail = detailLevel === 'detailed' ? 'detailed and comprehensive' : 'concise';
  const langInstruction = lang === 'hi'
    ? 'Respond entirely in Hindi (Devanagari script).'
    : 'Respond in English.';

  if (imageBase64) {
    let mimeType = 'image/jpeg';
    let cleanB64 = imageBase64;
    if (imageBase64.startsWith('data:')) {
      const m = imageBase64.match(/data:([^;]+)/);
      if (m) mimeType = m[1];
      cleanB64 = imageBase64.split(',')[1];
    }
    console.log('[Gemini] summarize image, mime:', mimeType);
    const prompt = `You are an expert AI tutor. ${langInstruction} Analyse this image which may contain handwritten or typed notes. Produce a ${detail} summary:\n- Transcribe all visible text accurately.\n- Organise the content into clear bullet points.\n- Highlight key concepts, definitions, and important takeaways.`;
    return await callGemini([
      { text: prompt },
      { inline_data: { mime_type: mimeType, data: cleanB64 } }
    ]);
  }

  if (!text || !text.trim()) throw new Error('Either text or imageBase64 must be provided');
  if (text.length > 60000) { console.warn('Trimming text to 60k chars'); text = text.slice(0, 60000); }
  console.log('[Gemini] summarize text, len:', text.length);
  const prompt = `You are an expert AI tutor. ${langInstruction} Summarise the following notes in a ${detail} way.\n- Use clear bullet points for key concepts and definitions.\n- Highlight the most important takeaways.\n- Do NOT copy sentences verbatim; rephrase and condense.\n\nNotes:\n${text}`;
  return await callGemini([{ text: prompt }]);
}

async function summarizePDF(pdfBase64, detailLevel = 'brief', lang = 'en') {
  const detail = detailLevel === 'detailed' ? 'detailed and comprehensive' : 'concise';
  const langInstruction = lang === 'hi'
    ? 'Respond entirely in Hindi (Devanagari script).'
    : 'Respond in English.';
  console.log('[Gemini] summarize PDF');
  const prompt = `You are an expert AI tutor. ${langInstruction} Analyse this PDF document and produce a ${detail} summary.\n- Use clear bullet points for key concepts and definitions.\n- Highlight the most important takeaways.\n- Describe any equations or diagrams in plain text.\n- Do NOT copy paragraphs verbatim; summarise and condense.`;
  return await callGemini([
    { text: prompt },
    { inline_data: { mime_type: 'application/pdf', data: pdfBase64 } }
  ]);
}

// Generate an AI infographic/slide image for the summary using Gemini image generation
async function generateSlideImage(summary) {
  if (!GOOGLE_API_KEY) throw new Error('GOOGLE_API_KEY not set – check .env');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GOOGLE_API_KEY}`;
  const prompt = `Create a visually appealing, professional educational summary slide/infographic. It should look like a high-quality study card with:
- A bold title at the top: "AI Summary"
- The key points listed as clean bullet points with icons
- A modern, clean design with a blue and white color scheme
- Clear, readable typography
- Visual hierarchy with sections

Content to visualise:
${summary.slice(0, 800)}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['IMAGE'] }
  };

  console.log('[Gemini-Image-Gen] Generating slide image...');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const raw = await res.text();
  if (raw.trimStart().startsWith('<')) throw new Error(`Gemini image API HTTP ${res.status}: ${raw.slice(0, 200)}`);
  const data = JSON.parse(raw);
  if (data.error) throw new Error(`Gemini image error ${data.error.code}: ${data.error.message}`);

  // find the image part in the response
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find(p => p.inlineData || p.inline_data);
  if (!imgPart) throw new Error('No image returned from Gemini image generation');
  const inline = imgPart.inlineData || imgPart.inline_data;
  return { mimeType: inline.mime_type, base64: inline.data };
}

// ---------------------------------------------------------------------------
// TTS – Google Text-to-Speech REST API
// ---------------------------------------------------------------------------

const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION;

async function synthesizeSpeech(text, language = 'en-US', voice = 'en-US-JennyNeural') {
  if (!GOOGLE_API_KEY) throw new Error('Google API key not set for TTS');
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`;
  const body = {
    input: { text },
    voice: { languageCode: language, name: voice },
    audioConfig: { audioEncoding: 'MP3' }
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(`Google TTS error: ${JSON.stringify(data.error)}`);
  }
  return data.audioContent; // already base64
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&"']/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
    }
  });
}


// OCR via Gemini vision – no Azure CV needed
async function extractTextFromImage(imageBase64) {
  let mimeType = 'image/jpeg';
  let cleanB64 = imageBase64;
  if (imageBase64.startsWith('data:')) {
    const m = imageBase64.match(/data:([^;]+)/);
    if (m) mimeType = m[1];
    cleanB64 = imageBase64.split(',')[1];
  }
  console.log('[Gemini] OCR image, mime:', mimeType);
  const prompt = 'You are an OCR engine. Transcribe ALL text visible in this image exactly as written, preserving line breaks and structure. Output only the transcribed text, nothing else.';
  return await callGemini([
    { text: prompt },
    { inline_data: { mime_type: mimeType, data: cleanB64 } }
  ]);
}

// AI quiz generation – returns array of MCQ question objects
async function generateQuiz(notes) {
  const prompt = `You are an expert educator. Based on the following notes, generate a comprehensive multiple-choice quiz with exactly 10 questions.

Rules:
- Cover ALL major topics and concepts from the notes
- Each question must have exactly 4 options (A, B, C, D)
- Only one option is correct
- Make distractors plausible but clearly wrong upon understanding
- Vary question types: definition, application, comparison, true/false style

Return ONLY a valid JSON array, no markdown, no explanation. Format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Brief explanation of why this is correct"
  }
]

Notes:
${notes.slice(0, 12000)}`;

  console.log('[Gemini] generating quiz...');
  const raw = await callGemini([{ text: prompt }]);
  // strip any accidental markdown code fences
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error('Quiz response was not an array');
  return parsed;
}

// AI flashcard generation – returns array of { front, back } objects
async function generateFlashcards(notes) {
  const prompt = `You are an expert educator. Based on the following notes, generate comprehensive flashcards that cover every key concept, term, formula, and fact.

Rules:
- Generate between 10 and 20 flashcards depending on content density
- Front: a concise question, term, or concept (max 15 words)
- Back: a clear, complete answer or explanation (2-4 sentences)
- Cover definitions, key facts, processes, formulas, and comparisons
- Do NOT repeat concepts

Return ONLY a valid JSON array, no markdown, no explanation. Format:
[
  {
    "front": "What is [concept]?",
    "back": "Detailed explanation or definition here."
  }
]

Notes:
${notes.slice(0, 12000)}`;

  console.log('[Gemini] generating flashcards...');
  const raw = await callGemini([{ text: prompt }]);
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error('Flashcards response was not an array');
  return parsed;
}

// AI key points extraction – returns structured markdown bullet points
async function generateKeyPoints(notes, lang = 'en') {
  const langInstr = lang === 'hi' ? 'Respond entirely in Hindi (Devanagari script).' : 'Respond in English.'
  const prompt = `You are an expert educator. ${langInstr} Extract and organise the key points, important concepts, definitions, and takeaways from the following notes.

Format your response as well-structured markdown:
- Use ## headings for major sections if the content has distinct topics
- Use bullet points (- ) for key facts and concepts
- Use **bold** for important terms and definitions
- Use numbered lists for processes or steps
- Be concise but comprehensive — cover everything important
- Do NOT include unnecessary filler text

Notes:
${notes.slice(0, 12000)}`;

  console.log('[Gemini] generating key points, lang:', lang);
  return await callGemini([{ text: prompt }]);
}

// AI detailed explanation – returns structured markdown explanation
async function generateExplanation(notes, lang = 'en') {
  const langInstr = lang === 'hi' ? 'Respond in Hindi (Devanagari script).' : 'Respond in English.'
  const prompt = `You are an expert AI tutor. ${langInstr} Provide a detailed, easy-to-understand explanation of the following study material.

Format your response as well-structured markdown:
- Start with a ## Overview section
- Break down complex concepts step by step
- Use ## headings for each major topic
- Use bullet points for sub-points and examples
- Use **bold** for key terms
- Add a ## Key Takeaways section at the end
- Use analogies and real-world examples where helpful

Notes / Summary:
${notes.slice(0, 12000)}`;

  console.log('[Gemini] generating explanation, lang:', lang);
  return await callGemini([{ text: prompt }]);
}

// AI chat response for follow-up questions
async function generateChatResponse(context, history, question, lang = 'en') {
  const langInstr = lang === 'hi'
    ? 'Respond entirely in Hindi (Devanagari script).'
    : 'Respond in English.'

  const historyText = history.length > 0
    ? 'Previous conversation:\n' + history.slice(-12).map(m =>
        `${m.role === 'user' ? 'Student' : 'AI Tutor'}: ${m.content.slice(0, 400)}`
      ).join('\n') + '\n\n'
    : ''

  const prompt = `You are an expert AI tutor helping a student understand their study material. ${langInstr}

Study Material:
${context.slice(0, 8000)}

${historyText}Student's Question: ${question}

Provide a clear, helpful, and educational answer. Use markdown formatting (bold, bullets, numbered lists) where it aids clarity. Be concise but thorough.`

  console.log('[AI] generating chat response, lang:', lang)
  return await callGemini([{ text: prompt }])
}

module.exports = { summarizeText, summarizePDF, generateSlideImage, generateQuiz, generateFlashcards, generateKeyPoints, generateExplanation, generateChatResponse, synthesizeSpeech, extractTextFromImage };

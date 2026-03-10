# PadhAI Backend API Reference

## Overview
RESTful API built with Node.js + Express. Integrates with Azure OpenAI and Azure Speech services.

**Base URL**: `http://localhost:4000`

---

## Endpoints

### 1. Summarize Notes
**POST** `/api/notes/summarize`

Generates a summary of provided text notes.

**Request:**
```json
{
  "text": "Your messy notes here...",
  "detail": "brief" // or "detailed"
}
```

**Response (Success):**
```json
{
  "summary": "Clean, organized summary of the notes..."
}
```

**Response (Error):**
```json
{
  "error": "summarization failed"
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing text parameter
- `500`: Summarization error (Azure not configured)

**Example cURL:**
```bash
curl -X POST http://localhost:4000/api/notes/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Photosynthesis is a process where plants convert light into chemical energy...",
    "detail": "brief"
  }'
```

---

### 2. Text-to-Speech
**POST** `/api/notes/tts`

Converts text to speech audio in multiple languages.

**Request:**
```json
{
  "text": "Text to convert to audio...",
  "lang": "en-US",  // or "hi-IN"
  "voice": "en-US-JennyNeural"  // Azure voice name (optional)
}
```

**Response (Success):**
```json
{
  "audioBase64": "//NExAAAAAANIAAAAAExBTUUzLjk4LjIVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV..."
}
```

**Response (Error):**
```json
{
  "error": "tts failed"
}
```

**Supported Languages:**
- `en-US`: English (US)
- `en-GB`: English (UK)
- `hi-IN`: Hindi (India)

**Popular Voices:**
- English: `en-US-JennyNeural`, `en-US-AriaNeural`, `en-US-GuyNeural`
- Hindi: `hi-IN-MadhurNeural`, `hi-IN-GajananaNeural`

**Status Codes:**
- `200`: Success
- `400`: Missing text parameter
- `500`: TTS error (Azure not configured)

**Example cURL:**
```bash
curl -X POST http://localhost:4000/api/notes/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test.",
    "lang": "en-US"
  }'
```

---

## Environment Variables

Create `.env` in `padhai-backend/`:

```env
# Port (optional, defaults to 4000)
PORT=4000

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-azure-openai-api-key
OPENAI_DEPLOYMENT_NAME=your-gpt-deployment-name

# Azure Speech Configuration
AZURE_SPEECH_KEY=your-azure-speech-key
AZURE_SPEECH_REGION=eastus  # e.g., eastus, westus, etc.
```

### Getting Azure Credentials

1. **Azure OpenAI** (default provider):
   - Go to Azure Portal → Create an "Azure OpenAI" resource in a region where you have quota (e.g. eastus2).
   - Deploy the single model `gpt-4o` and give the deployment the same name (`gpt-4o`).
   - Copy endpoint and key from "Keys and Endpoint".
   - The code defaults to using `gpt-4o`, so you only need to set
     `OPENAI_DEPLOYMENT_NAME` if you picked a different name for testing.
   - Set `MODEL_PROVIDER=azure` in your `.env` (or leave it blank).

2. **Hugging Face** (alternative free or open‑source provider):
   - Sign up at https://huggingface.co and obtain an API token (free tier).
   - Choose a model suitable for summarization; `gpt2` is tiny and free, or
     any of the open‑source chat models such as `meta-llama/Llama-2-7b-chat-hf`.
   - Add the token and model name to `.env`:
     ```env
     MODEL_PROVIDER=hf
     HF_API_KEY=<your-token>
     HF_MODEL=gpt2
     ```
   - There are no Azure quotas involved; requests go to HF's hosted inference
     endpoint, which has a limited free allowance.  You can also run models
     locally and set `MODEL_PROVIDER=local` (not implemented in this repo).

3. **Google GenAI** (via AI Studio / Vertex AI):
   - Obtain an API key from Google Cloud (AI Studio) and enable the
     Generative Language API (GenAI).  The same key can also be used for
     Google Text-to-Speech (no additional credentials required).
   - Set the following variables in `.env`:
     ```env
     MODEL_PROVIDER=google
     GOOGLE_API_KEY=<your-key>
     GOOGLE_MODEL=text-bison-001  # or another GenAI model
     ```
   - This provider sends a POST to Google's `generateText` endpoint and
     returns the first candidate.  It gives you another no‑quota, pay‑as‑you‑go
     option that works wherever Google has service enabled.
   - When `MODEL_PROVIDER=google`, `synthesizeSpeech` will call the Google
     Text-to-Speech API instead of Azure Speech.  You may specify voices such
     as `en-US-Wavenet-F` or `hi-IN-Neural2` via the `voice` parameter in the
     same way as Azure.

2. **Azure Speech**:
   - Go to Azure Portal → Create "Speech" resource
   - Copy key and region from "Keys and Endpoint"

---

## Error Handling

**Bad Request (400)**:
```json
{
  "error": "text required"
}
```

**Internal Server Error (500)**:
```json
{
  "error": "summarization failed"
}
```

---

## CORS & Headers

- **CORS**: Enabled for localhost
- **Content-Type**: `application/json` (required for POST)
- **Max Body Size**: 5MB

---

## Rate Limiting

Currently **no rate limiting**. For production, implement:
```bash
npm install express-rate-limit
```

---

## Example: Full Workflow

```bash
# 1. Summarize notes
curl -X POST http://localhost:4000/api/notes/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Photosynthesis converts CO2 into oxygen...",
    "detail": "detailed"
  }' > summary.json

# 2. Convert summary to speech
SUMMARY=$(jq -r '.summary' summary.json)
curl -X POST http://localhost:4000/api/notes/tts \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": \"$SUMMARY\",
    \"lang\": \"en-US\"
  }" > audio.json

# 3. Parse and use audio
jq -r '.audioBase64' audio.json | base64 -d > output.mp3
```

---

## Future Endpoints

- `POST /api/notes/ocr` - Extract text from images (using Azure Computer Vision)
- `POST /api/notes/pdf` - Extract text from PDF files (runs pdfjs on server)

---

### 4. PDF Text Extraction
**POST** `/api/notes/pdf`

Parses a Base64‑encoded PDF on the server and returns the concatenated text of
all pages.  This is used by the frontend when client‑side parsing fails or for
large/complex documents.

**Request:**
```json
{
  "pdfBase64": "<base64-data>"
}
```

**Response (Success):**
```json
{
  "text": "Extracted text from the PDF..."
}
```

**Response (Error):**
```json
{
  "error": "pdf_extract_failed",
  "details": "error message"
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing pdfBase64 parameter
- `500`: Extraction error

---

### 3. Image OCR
**POST** `/api/notes/ocr`

Transforms a base‑64 encoded image (PNG, JPG, BMP, etc.) or a rendered PDF page into plain text using Azure Computer Vision's Read API.  The request may also be sent with a raw base64 string (no `data:` prefix).

**Request:**
```json
{
  "imageBase64": "data:image/png;base64,iVBORw0KGgo..."  // any common image type
}
```

**Response (Success):**
```json
{
  "text": "Extracted text from the image..."
}
```

**Response (Error):**
```json
{
  "error": "ocr failed",
  "details": "error message from Azure or parsing"
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing imageBase64 parameter
- `500`: OCR error (Azure not configured, service error, or parsing failed)

**Example cURL:**
```bash
curl -X POST http://localhost:4000/api/notes/ocr \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "<base64-data>"
  }'
```

**Notes:**
- The client library included in the frontend will transparently accept
  JPG/PNG uploads and even PDF files (rendered server‑side/page‑by‑page).
- If the Azure service returns HTML or an unexpected response, the endpoint
  now sends a JSON error with `details` to help debugging.

- `POST /api/notes/generate-quiz` - Generate quiz questions
- `GET /api/notes/history` - Retrieve user's note history
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration

---

## Troubleshooting

### "Azure credentials not configured"
- Ensure `.env` file exists with all required variables
- Restart the server after adding/changing `.env`
- Check spelling of variable names

### "Cannot connect to Azure"
- Verify Azure resource exists and is active
- Check API key and endpoint are correct
- Ensure your IP isn't blocked by Azure's firewall
- Try from a different network

### Slow responses
- Check Azure service quotas (may be throttled)
- Verify network connectivity
- Try smaller input texts first

### Audio quality issues
- Try different voice names
- Reduce text length
- Use `X-Microsoft-OutputFormat: audio-16khz-32kbitrate-mono-mp3` header

---

## Support

For API issues, check:
1. Backend console logs (`npm run dev` output)
2. Azure Portal diagnostics
3. Browser DevTools (F12) Network tab
4. `.env` configuration

Made with ❤️ by PadhAI Team

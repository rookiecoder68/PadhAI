# PadhAI – AI-Powered Study Companion

> **Transform messy notes into summaries, quizzes, flashcards, and audio—powered by Google Gemini 2.5 Flash**

PadhAI is an AI study assistant that helps students learn smarter with intelligent summarization, interactive quizzes, focus tools, and progress tracking.

## 🎯 What's Included

### 📱 PadhAI Android (Primary App)
Full-featured native Android app built with Kotlin.

**Features**:
- ✅ AI-powered summarization (text, images, PDFs, camera capture)
- ✅ Smart chat assistant with context-aware responses
- ✅ Auto-generated quizzes & flashcards
- ✅ Pomodoro timer with focus mode
- ✅ Progress analytics & study streaks
- ✅ Rewards & gamification (XP, daily quests)
- ✅ **Bilingual support**: English & Hindi (summaries, chat, TTS)
- ✅ Text-to-Speech in multiple languages
- ✅ Firebase Authentication & cloud storage

**Technology**: Kotlin, MVVM, Firebase, Google Gemini 2.5 Flash, ML Kit OCR, CameraX

**Setup**: See [`padhai-android/README.md`](padhai-android/README.md) and [`padhai-android/GETTING_STARTED.md`](padhai-android/GETTING_STARTED.md)

---

### 🖥️ PadhAI Web (Legacy/Prototype)
React frontend + Node.js backend (original MVP scaffold).

**Status**: Proof of concept—Android app is the main implementation

**Features**:
- Audio/video explanations (prototype)
- Multiple AI provider support (Azure OpenAI, Hugging Face, Google GenAI)
- Local fallback summarizer

**Folders**:
- `padhai-backend` — Node.js Express API with Gemini integration
- `padhai-backend/examples` — Helper scripts and tests
- `padhai-frontend` — React (Vite) web interface

---

## 🤖 AI Model

**Current**: **Google Gemini 2.5 Flash** (via Google AI API)
- Free tier: 60 requests/minute
- Supports text generation, chat, and multimodal input
- Bilingual: English & Hindi responses

**Note**: Original prototype used Azure OpenAI, but production app standardized on Gemini 2.5 Flash for cost-efficiency and multilingual support.

---

## 🚀 Quick Start

### For Android App (Recommended):
```bash
# 1. Setup Firebase (see Android GETTING_STARTED.md)
# 2. Get Google AI API key from https://ai.google.dev
# 3. Start backend
cd padhai-backend
npm install
# Create .env with GEMINI_API_KEY=your-key-here
npm run dev

# 4. Open Android Studio
# Open padhai-android/ folder
# Add google-services.json from Firebase
# Run app (Shift+F10)
```

**Detailed Guide**: [`padhai-android/GETTING_STARTED.md`](padhai-android/GETTING_STARTED.md)

---

### For Web App (Legacy):
```bash
# Backend
cd padhai-backend
npm install
# Configure .env (see backend README)
npm run dev  # Port 4000

# Frontend
cd padhai-frontend
npm install
npm run dev  # Port 5173
```

---

## 📂 Project Structure

```
padhai/
├── padhai-android/              # 📱 Android App (PRIMARY)
│   ├── app/
│   │   ├── src/main/java/com/padhai/app/
│   │   │   ├── ui/              # Fragments (Learn, Focus, Quiz, etc.)
│   │   │   ├── data/            # Models & persistence
│   │   │   └── utils/           # TTS, Rewards, Timers
│   │   └── build.gradle         # Dependencies
│   ├── README.md                # Full feature docs
│   └── GETTING_STARTED.md       # Step-by-step setup
│
├── padhai-backend/              # Node.js API (SHARED)
│   ├── server.js                # Express server
│   ├── gemini_helper.py         # Python Gemini integration
│   ├── src/azureClient.js       # AI API routes (Gemini)
│   ├── examples/                # Test scripts
│   └── API_REFERENCE.md         # API documentation
│
├── padhai-frontend/             # React Web App (LEGACY)
│   ├── src/
│   │   ├── App.jsx              # Main app
│   │   └── components/          # UI components
│   └── package.json
│
├── FEATURES.md                  # Feature list (original MVP)
├── GETTING_STARTED.md           # Web app setup
└── README.md                    # This file
```

---

## ✅ Implemented Features (Android)

### Core AI Features
- [x] Text summarization (brief/detailed modes)
- [x] Image OCR + summarization (Google ML Kit)
- [x] PDF text extraction + summarization
- [x] Camera capture for handwritten notes
- [x] AI chat assistant (context-aware Q&A)
- [x] Auto-generated quizzes (10 questions)
- [x] Flashcard generation
- [x] **Bilingual support**: English & Hindi

### Productivity Tools
- [x] Pomodoro timer (customizable work/break)
- [x] Focus mode with session tracking
- [x] Study session logging
- [x] Progress analytics (time, streaks, sessions)

### Gamification
- [x] XP and leveling system
- [x] Daily quest system (5 quests)
- [x] Study streak tracking
- [x] Rewards UI

### User Experience
- [x] Firebase Authentication (email/password)
- [x] Cloud storage (Firestore)
- [x] Notes library with subject categorization
- [x] Chat history per note
- [x] Text-to-Speech (English/Hindi)
- [x] Dark mode support
- [x] Material Design 3 UI

---

## ⚠️ Limitations & Known Issues

### Technical Constraints
1. **Backend Dependency**: App requires Node.js server running (local or hosted)
   - ⚠️ Cannot share standalone APK yet
   - 🔮 **Next priority**: Direct Gemini API integration from Android

2. **OCR Accuracy**: 
   - Works well on printed text
   - Struggles with stylized handwriting or low-light photos
   - Math equations not fully supported

3. **API Quotas**:
   - Free tier Gemini: 60 requests/minute
   - Quota errors handled gracefully
   - Need paid tier for high usage

4. **TTS Limitations**:
   - Hindi requires device voice download
   - Voice quality varies by device
   - No natural conversational voice yet

### Feature Gaps (vs Original Vision)

#### Not Yet Implemented:
- ❌ **Natural Voice Conversations**: Voice-to-voice AI chat (planned)
- ❌ **Video Summaries**: Animated explainer videos (planned)
- ❌ **System-level App Blocking**: Focus mode UI only (requires root)
- ❌ **Offline Mode**: No local AI fallback yet
- ❌ **Push Notifications**: Reminder system not scheduled
- ❌ **Social Features**: No study groups or leaderboards
- ❌ **Premium Tiers**: All features currently free

---

## 🗺️ Future Roadmap

### Phase 1: Standalone Operation (High Priority)
- [ ] Direct Gemini API from Android (remove backend)
- [ ] OAuth 2.0 API key management
- [ ] Sharable APK without server setup

### Phase 2: Enhanced AI
- [ ] Natural voice conversations (Speech-to-Text + advanced TTS)
- [ ] Video summary generation (D-ID/Synthesia integration)
- [ ] Offline AI with MediaPipe LLM or Gemma-2B

### Phase 3: Premium Features
- [ ] Free tier: 20 summaries/month, basic features
- [ ] Premium ($4.99/month): Unlimited AI, voice, videos
- [ ] Student tier ($2.99/month): 100 summaries/month

### Phase 4: Social & Collaboration
- [ ] Study groups & shared libraries
- [ ] Leaderboards & friend challenges
- [ ] Real-time collaboration

### Phase 5: Advanced Features
- [ ] Spaced repetition algorithm
- [ ] AI tutor with personalized study plans
- [ ] Subject-specific models (math, science)
- [ ] Whiteboard mode with diagram recognition
- [ ] LMS integration (Google Classroom, Canvas)

---

## 🛠️ Development Setup

### Requirements
- **Android**: Android Studio Hedgehog+, JDK 17, SDK 24-34
- **Backend**: Node.js v20+, npm v10+
- **Firebase**: Free account + project
- **Google AI**: API key from [ai.google.dev](https://ai.google.dev)

### Environment Variables

**Backend** (`.env` in `padhai-backend/`):
```env
GEMINI_API_KEY=AIzaSy...your-key-here
MODEL_PROVIDER=google
GEMINI_MODEL=gemini-2.0-flash-exp
PORT=4000
```

**Android** (`gradle.properties` in `padhai-android/`):
```properties
BACKEND_BASE_URL=http://10.0.2.2:4000
PHONE_BACKEND_BASE_URL=http://192.168.1.100:4000
```

---

## 📖 Documentation

- **Android Setup**: [`padhai-android/GETTING_STARTED.md`](padhai-android/GETTING_STARTED.md)
- **Backend API**: [`padhai-backend/API_REFERENCE.md`](padhai-backend/API_REFERENCE.md)
- **Feature List**: [`FEATURES.md`](FEATURES.md)
- **Web App Setup**: [`GETTING_STARTED.md`](GETTING_STARTED.md)

---

## 🤝 Contributing

Areas needing help:
- [ ] Direct Gemini API integration (Android)
- [ ] Offline AI with MediaPipe LLM
- [ ] Video summary generation
- [ ] Natural voice conversations
- [ ] UI/UX improvements
- [ ] Bug fixes

See `padhai-android/README.md` for contribution guidelines.

---

## 📄 License

MIT License

---

## 🙏 Acknowledgments

- **Google Gemini 2.5 Flash**: Core AI model
- **Firebase**: Authentication & cloud storage
- **Google ML Kit**: On-device OCR
- **Material Design 3**: Android UI components
- **Kotlin & Jetpack**: Modern Android development

---

## 📱 Screenshots & Demo

Coming soon! Check GitHub Issues for updates.

---

**Happy studying! 📚✨**
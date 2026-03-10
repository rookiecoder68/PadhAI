# PadhAI - Full Feature Release

## What is PadhAI?

PadhAI is an **AI-powered learning app** that helps students study smarter, not harder. Featuring:
- **Note Summarization** (text, image upload [jpg/png/etc] with automatic OCR, camera capture, PDF text & scanned page support)
  - built‑in fallback summarizer works even without cloud keys
  - view as text, listen to audio, or download a quick video explanation
- **Interactive Quizzes & Flashcards** (auto-generated from notes)
- **Short Notes & Key Takeaways** (extract key points)
- **Focus Mode** (block distracting apps)
- **Pomodoro Timer** (customizable work/break cycles)
- **Rewards & Daily Streaks** (gamified learning)
- **User Profiles** (save goals, preferences, language settings)
- **Progress Analytics** (track study sessions, insights)
- **Notes Library** (save and organize notes by subject)
- **Toast Notifications** (real-time feedback)

---

## Current Features (MVP - Ready to Use)

### 1. **Learn Tab**
- **Note Upload**: Upload text files (.txt) or photos
- **Camera Capture**: Take photos of handwritten notes
- **Summarization**: Get brief or detailed summaries (local fallback available if Azure/Google keys are not set)
- **Short Notes**: Auto-generate key takeaways
- **Notes Library**: Save notes by subject, search, and load

### 2. **Focus Tab**
- **Focus Mode**: 
  - Set custom duration (1-120 minutes)
  - Block distracting apps (Social Media, YouTube, Netflix, custom)
  - Live timer display
  - Completion notifications
  
- **Pomodoro Timer**:
  - Default: 25 min work + 5 min break
  - Fully customizable
  - Session counter
  - Auto-switch between work/break

### 3. **Quiz Tab**
- **Interactive Quizzes**: Auto-generated from your notes
  - Multiple choice questions
  - Instant scoring
  - Progress tracking
  
- **Flashcards**: Flip-based card review
  - Navigate deck
  - Manual edits
  - Supports any note content

### 4. **Profile Tab**
- **Edit Profile**: Name, learning goal, language preference
- **Settings**: 
  - Enable/disable notifications
  - Set reminder times
  - Choose language (English, Hindi, Spanish)
- **View**: Membership date, current settings

### 5. **Analytics Tab**
- **Study Statistics**:
  - Total sessions logged
  - Total minutes studied
  - Average session length
  - This week's study time
  - Study streak tracking
  
- **Recent Sessions**: View last 10 study logs
- **Insights**: Personalized learning feedback
- **Manual Logging**: Add study sessions manually

### 6. **Rewards Tab**
- **Level System**: Earn XP and level up
- **Day Streak**: Track consecutive study days
- **Daily Quests**:
  - Use app 10+ minutes (+10 pts)
  - Complete a quiz (+20 pts)
  - Review 5+ flashcards (+15 pts)
  - Use Pomodoro timer (+25 pts)
  - Bonus: +5 pts for completing all daily quests
  
- **Persistent**: Data saved to browser localStorage

---

## Setup Instructions

### Prerequisites
- **Node.js** v20+ (installed)
- **npm** v10+ (installed with Node.js)
- Azure credentials (optional, for future TTS/summarization)

### 1. Install Dependencies

**Backend:**
```bash
cd padhai/padhai-backend
npm install
```

**Frontend:**
```bash
cd padhai/padhai-frontend
npm install
```

### 2. Setup Environment Variables (Optional)

Create `.env` in `padhai-backend/`:
```
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-key
OPENAI_DEPLOYMENT_NAME=your-deployment
AZURE_SPEECH_KEY=your-speech-key
AZURE_SPEECH_REGION=your-region
```

### 3. Run Both Servers

**Terminal 1 - Backend:**
```bash
cd padhai/padhai-backend
npm run dev
# or
node server.js
```
Backend runs on: `http://localhost:4000`

**Terminal 2 - Frontend:**
```bash
cd padhai/padhai-frontend
npm run dev
# or
npm run build && npm run preview
```
Frontend runs on: `http://localhost:5173` (opens in browser)

---

## Data Persistence

All data is saved to **browser localStorage**:
- User profile & settings
- Notes library
- Study sessions
- Rewards & streaks
- Daily quest progress

**Clear all data**: Open DevTools (F12) → Console → `localStorage.clear()` → Reload

---

## Upcoming Features (Awaiting Azure Credentials)

- **Text-to-Speech Audio**
  - English (US, UK, Accents)
  - Hindi (India)
  - Multiple quality levels (brief/detailed)
  - Down-loadable audio files

- **Image-to-Text (OCR)**
  - Auto-extract text from photos
  - Powered by Azure Computer Vision

- **Video Explanations**
  - Podcast-style AI narration
  - Virtual trainer personalization

- **Cloud Sync**
  - Cross-device sync
  - Real user authentication
  - Cloud backup

---

## File Structure

```
padhai/
├── padhai-backend/
│   ├── server.js           # Express server
│   ├── src/
│   │   ├── azureClient.js  # Azure OpenAI & Speech APIs
│   │   └── routes/
│   │       └── notes.js    # /api/notes endpoints
│   ├── package.json
│   └── .env.example
│
├── padhai-frontend/
│   ├── src/
│   │   ├── App.jsx         # Main app with tabs
│   │   ├── main.jsx        # React entry
│   │   └── components/
│   │       ├── UploadNote.jsx         # Note upload & camera
│   │       ├── SummaryView.jsx        # Summarization display
│   │       ├── ShortNotes.jsx         # Key takeaways
│   │       ├── NotesLibrary.jsx       # Save/search notes
│   │       ├── QuizAndFlashcards.jsx  # Q&A and cards
│   │       ├── PomodoroTimer.jsx      # Timer
│   │       ├── FocusMode.jsx          # Focus blocking
│   │       ├── UserProfile.jsx        # User settings
│   │       ├── RewardsAndStreaks.jsx  # Gamification
│   │       ├── ProgressAnalytics.jsx  # Analytics
│   │       └── NotificationCenter.jsx # Toast notifications
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## Keyboard Shortcuts & Tips

- **F12**: Open DevTools (debug, clear localStorage)
- **Ctrl+R**: Refresh browser
- **Focus Mode**: Click "Start Focus Mode" to activate timer
- **Pomodoro**: Customize work/break duration before starting
- **Quizzes**: Can't modify questions until quiz is completed
- **Flashcards**: Click card to flip
- **Notes Library**: Search by subject or title
- **Rewards**: All quests reset daily at midnight

---

## Troubleshooting

### App won't start
```bash
# Clear node_modules and reinstall
rm -r node_modules
npm install
npm run dev
```

### Backend not responding
- Check if running on `localhost:4000`
- Restart: Ctrl+C then `npm run dev`
- Check for port conflicts: `netstat -ano | findstr :4000`

### Notes won't save
- Check browser's localStorage quota
- Open DevTools → Storage → LocalStorage
- Ensure cookies/storage not blocked

### Camera not working
- Grant camera permission (browser will ask)
- Check System Settings → Privacy → Camera
- Try different browser (Chrome, Firefox, Safari)

---

## Future Roadmap

- [ ] Cloud authentication (Google/GitHub login)
- [ ] Real-time collaboration (shared notes)
- [ ] Advanced AI features (custom learning paths)
- [ ] Mobile native apps (iOS, Android)
- [ ] Spaced repetition algorithm (smart flashcards)
- [ ] Teacher dashboard (class management)
- [ ] API for integrations (LMS, calendar sync)

---

## Support & Feedback

For issues or feature requests, please refer to the documentation or contact the development team.

**Made with ❤️ by PadhAI Team**

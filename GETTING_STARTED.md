# PadhAI - Getting Started Guide

## Quick Start (5 minutes)

### Step 1: Prerequisites Check
```bash
node --version    # Should be v20.0.0 or newer
npm --version     # Should be v10.0.0 or newer
```

If not installed, download from [nodejs.org](https://nodejs.org)

### Step 2: Clone/Enter Project
```bash
cd padhai
```

### Step 3: Install & Run Backend
```bash
cd padhai-backend
npm install       # ~1 minute
# before starting, edit .env to set your model provider and keys
# examples:
#   MODEL_PROVIDER=azure
#   MODEL_PROVIDER=hf
#   MODEL_PROVIDER=google
npm run dev       # Starts on port 4000
```

**Expected Output:**
```
PadhAI backend listening on 4000
```

### Step 4: Install & Run Frontend (New Terminal)
```bash
cd padhai/padhai-frontend
npm install       # ~1 minute
npm run dev       # Starts on port 5173
```

**Expected Output:**
```
  VITE v5.4.21  ready in 1129 ms
  Local:   http://localhost:5173/
```

### Step 5: Open in Browser
- Click the link in terminal, or
- Manually go to: **http://localhost:5173**

**You're ready to go!**

---

## Feature Guides

### 1. Taking Notes
1. Click **Learn** tab
2. Paste notes or click **Take Photo** / **Upload File**
3. Choose "Brief" or "Detailed" summary level
4. Click **Summarize** (needs Azure credentials)
5. View summary, listen to audio, or save to library

### 2. Generating Quizzes
1. Paste notes in Learn tab
2. Click **Quiz** tab
3. Click **Start Quiz**
4. Answer questions and see your score
5. Or try **Flashcards** to review cards

### 3. Using Pomodoro Timer
1. Click **Focus** tab
2. Adjust work/break minutes (default: 25/5)
3. Click **Start**
4. Timer will auto-switch between work and break
5. Sessions are counted at the top

### 4. Focus Mode (Block Distractions)
1. In **Focus** tab
2. Customize blocked apps (click to remove, + Add to add more)
3. Click **Start Focus Mode**
4. Blocked apps show in red during focus session
5. Exit anytime with **Exit Focus Mode**

### 5. Saving Your Progress
All data is saved automatically to your browser:
- Notes library
- Quiz scores
- Study sessions
- User profile
- Rewards & streaks

### 6. Viewing Analytics
1. Click **Analytics** tab
2. See total study time, sessions, streaks
3. Click **+ Log Session** to manually add study time
4. View recent 10 sessions

### 7. Tracking Rewards
1. Click **Rewards** tab
2. Complete daily quests for points
3. Earn points → Level up
4. Maintain streak by using app daily
5. All progress saved automatically

---

## Settings & Preferences

### User Profile
1. Click **Profile** tab
2. Edit name, learning goal, language
3. Toggle notifications on/off
4. Click **Save Changes**

### Notes Library
1. In **Learn** tab, scroll down to **Notes Library**
2. Click **+ Save Current Notes** to save
3. Add title and subject
4. Search and load saved notes anytime

### Short Notes
1. Paste notes in editor
2. Click **Generate Key Points**
3. Auto-generates takeaways
4. Can add custom notes with **+ Add Note**
5. Download with **Download**

---

## Tips & Tricks

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| F12 | Open DevTools (debug) |
| Ctrl+R | Refresh page |
| Ctrl+Shift+I | Open Inspector |

### Power Tips
1. **Save notes first** before starting quizzes (quizzes use saved notes)
2. **Take multiple Pomodoro breaks** (data tracks all sessions)
3. **Complete daily quests** for max XP (resets daily)
4. **Use camera for handwritten notes** (later you can type/copy text)
5. **Enable notifications** in profile settings

### Browser Storage
- **Max Size**: ~5-10MB per domain (browser dependent)
- **Persistent**: Data survives page refresh
- **Clear**: Open DevTools → Storage → LocalStorage → Select padhai → Delete

---

## Troubleshooting

### "npm is not recognized"
**Solution**: Node.js not installed or not in PATH
```bash
# Option 1: Reinstall Node.js
# Download from nodejs.org and run installer

# Option 2: Use full path
"C:\Program Files\nodejs\npm.cmd" install
```

### "Cannot connect to localhost:4000"
**Solution**: Backend not running
```bash
# In backend terminal, check:
1. Is it running? (should show "listening on 4000")
2. If not, start it: cd padhai-backend && npm run dev
3. Check for port conflicts: netstat -ano | findstr :4000
```

### "Camera not working"
**Solution**: Permission denied
```
1. Allow camera access (browser will ask)
2. Check system settings: Settings → Privacy → Camera
3. Try different browser
4. Use file upload instead
```

### "Notes won't save"
**Solution**: localStorage is full or blocked
```javascript
// In browser console (F12):
localStorage.clear()  // Clear all data
location.reload()     // Refresh page
```

### "Quiz not loading"
**Solution**: No notes provided
```
1. Go to Learn tab
2. Paste or upload notes
3. Then switch to Quiz tab
4. Start quiz
```

### "I cleared all data by accident"
**Solution**: No recovery possible
- LocalStorage is permanent one-way
- Next time, download notes first! (**⬇️ Download** button in Short Notes)

---

## 📱 Mobile Support

PadhAI works on mobile! Best features:
- ✅ Camera capture (system camera app)
- ✅ Notes library
- ✅ Quizzes & flashcards
- ✅ Pomodoro timer
- ✅ Focus mode
- ✅ All settings

**Tips for mobile use:**
- Use portrait orientation
- Tap buttons clearly
- Use device camera for photo notes
- Notifications work with browser permissions

---

## 🚀 Development

### Project Structure
```
padhai/
├── padhai-backend/         # Node.js + Express API
│   ├── server.js          # Main entry
│   ├── src/
│   │   ├── azureClient.js # Azure integration
│   │   └── routes/        # API endpoints
│   └── package.json
│
├── padhai-frontend/        # React + Vite
│   ├── src/
│   │   ├── App.jsx        # Main app
│   │   └── components/    # All UI components
│   ├── index.html
│   └── package.json
│
├── README.md              # Project overview
├── FEATURES.md           # Full feature list
├── GETTING_STARTED.md    # This file
└── .gitignore
```

### Adding a New Feature

**Backend (API)**:
```javascript
// padhai-backend/src/routes/newfeature.js
router.post('/newendpoint', async (req, res) => {
  const { data } = req.body;
  // Process data
  res.json({ result: "..." });
});
```

**Frontend (Component)**:
```jsx
// padhai-frontend/src/components/NewFeature.jsx
export default function NewFeature() {
  return <div>...</div>
}
```

**Add to App.jsx**:
```jsx
import NewFeature from './components/NewFeature'

// In JSX:
{activeTab === 'newfeature' && <NewFeature />}
```

---

## 📞 Support & Feedback

### Where to Get Help
1. **Browser DevTools** (F12) - Check console for errors
2. **Backend Logs** - Check terminal running `npm run dev`
3. **GitHub Issues** - Open an issue for bugs
4. **Documentation** - See FEATURES.md for full feature list

### Report a Bug
Include:
1. What you were doing
2. Error message (from console F12)
3. Browser & OS info
4. Steps to reproduce

---

## 🎓 Learning Resources

### Understanding the Code
- **React Hooks**: useState, useEffect in all components
- **localStorage API**: Data persistence without backend
- **Fetch API**: Frontend calls to backend
- **Express.js**: Backend routing and middleware

### Improving Features
- Add more quiz question types (true/false, fill-blank, etc.)
- Implement spaced repetition algorithm for flashcards
- Add dark mode theme toggle
- Create course/curriculum builder

---

**Ready to start learning? Open http://localhost:5173 and enjoy PadhAI! 🎉**

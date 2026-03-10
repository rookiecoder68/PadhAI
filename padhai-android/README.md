# PadhAI - Android Mobile App

> **AI-Powered Study Companion for Smarter Learning**

An Android app built with Kotlin that brings AI-powered learning to your mobile device. Transform messy notes into summaries, quizzes, flashcards, and audio explanations—all with bilingual support (English & Hindi).

---

## 🎯 What is PadhAI?

PadhAI helps students study smarter with AI-driven features:
- **Smart Summarization**: Text, images (OCR), PDFs, camera capture
- **AI Chat Assistant**: Ask questions about your notes in English or Hindi
- **Auto-Generated Quizzes & Flashcards**: Test your knowledge instantly
- **Focus Mode with Pomodoro Timer**: Stay productive with distraction blocking
- **Progress Analytics**: Track study sessions, streaks, and habits
- **Rewards & Gamification**: Earn XP, complete daily quests, maintain streaks
- **Bilingual Support**: Summarize, chat, and listen in English or Hindi
- **Text-to-Speech**: Listen to summaries in your preferred language

---

## 🚀 Technology Stack

- **Language**: Kotlin
- **Architecture**: MVVM with LiveData & Coroutines
- **UI**: Material Design 3, View Binding
- **AI Model**: **Google Gemini 2.5 Flash** (via Node.js backend)
- **Backend**: Node.js Express + Firebase Functions (optional)
- **Database**: Firebase Firestore (cloud storage) + SharedPreferences (local cache)
- **Authentication**: Firebase Auth (Email/Password)
- **ML/OCR**: Google ML Kit Text Recognition (on-device)
- **Camera**: CameraX API
- **Navigation**: Jetpack Navigation Component
- **Networking**: Retrofit + OkHttp
- **Image Loading**: Glide

---

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Android Studio**: Hedgehog (2023.1.1) or newer  
   Download: [https://developer.android.com/studio](https://developer.android.com/studio)

2. **JDK**: Java 17 or newer  
   (Usually bundled with Android Studio)

3. **Android SDK**: 
   - Minimum SDK: API 24 (Android 7.0)
   - Target SDK: API 34 (Android 14)

4. **Node.js**: v20+ (for backend)  
   Download: [https://nodejs.org](https://nodejs.org)

5. **Firebase Account**: Free account at [console.firebase.google.com](https://console.firebase.google.com)

6. **Google AI API Key**: Free tier available at [https://ai.google.dev](https://ai.google.dev)

---

## 🔧 Complete Setup Guide

### Step 1: Firebase Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click "Add Project"
   - Enter project name (e.g., "PadhAI")
   - Disable Google Analytics (optional)

2. **Add Android App**:
   - In Firebase Console, click "Add App" → Android (robot icon)
   - **Package name**: `com.padhai.app` (must match exactly)
   - App nickname: PadhAI Android
   - **Download `google-services.json`**
   - Place `google-services.json` in: `padhai-android/app/` directory

3. **Enable Firebase Authentication**:
   - Navigate to **Build → Authentication**
   - Click "Get Started"
   - Enable **Email/Password** sign-in method
   - Save changes

4. **Create Firestore Database**:
   - Navigate to **Build → Firestore Database**
   - Click "Create Database"
   - Start in **Test Mode** (for development)
   - Choose your region (closest to you)
   - Click "Enable"

5. **Firestore Security Rules** (Optional for production):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

---

### Step 2: Backend Setup

1. **Navigate to Backend Directory**:
   ```bash
   cd padhai/padhai-backend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Get Google AI API Key**:
   - Visit [https://ai.google.dev](https://ai.google.dev)
   - Click "Get API Key in Google AI Studio"
   - Create a new API key
   - Copy the key (starts with `AIzaSy...`)

4. **Configure Environment Variables**:
   
   Create a `.env` file in `padhai-backend/`:
   ```env
   # Server Configuration
   PORT=4000
   
   # Google Gemini API (Required)
   GEMINI_API_KEY=AIzaSy...your-api-key-here
   
   # Model Configuration
   MODEL_PROVIDER=google
   GEMINI_MODEL=gemini-2.0-flash-exp
   ```

5. **Start Backend Server**:
   ```bash
   npm run dev
   ```
   
   Expected output:
   ```
   PadhAI backend listening on 4000
   Using model provider: google (Gemini 2.5 Flash)
   ```

---

### Step 3: Android App Configuration

1. **Open Project in Android Studio**:
   - Launch Android Studio
   - Select "Open an Existing Project"
   - Navigate to `padhai/padhai-android/`
   - Click "OK"

2. **Add `google-services.json`**:
   - Verify `google-services.json` is in `app/` directory
   - If missing, download again from Firebase Console

3. **Configure Backend URLs** (Optional):
   
   Create/edit `gradle.properties` in project root:
   ```properties
   # For Android Emulator (localhost:4000)
   BACKEND_BASE_URL=http://10.0.2.2:4000
   
   # For Physical Device (replace with your laptop's local IP)
   PHONE_BACKEND_BASE_URL=http://192.168.1.100:4000
   
   # Optional: Direct Gemini API key (for future offline mode)
   SUMMARIZATION_API_KEY=
   ```

   **Finding Your Local IP (Windows)**:
   ```powershell
   ipconfig
   # Look for "IPv4 Address" under your active network adapter
   ```

4. **Sync Gradle**:
   - Click "File → Sync Project with Gradle Files"
   - Wait for sync to complete (~2-5 minutes first time)

---

### Step 4: Build and Run

1. **Build the Project**:
   - Click "Build → Make Project" or press `Ctrl+F9`
   - Wait for build to complete successfully

2. **Setup Emulator** (if you don't have a physical device):
   - Click "Tools → Device Manager"
   - Create a new Virtual Device
   - Choose: Pixel 5, API 34 (Android 14)

3. **Run the App**:
   - Ensure backend server is running on port 4000
   - Click "Run → Run 'app'" or press `Shift+F10`
   - Select your device/emulator
   - Wait for app to install and launch

4. **First Launch**:
   - Splash screen → Login/Signup screen
   - Create an account with email/password
   - Start summarizing notes!

---

## 📱 Key Features Implemented

### ✅ Currently Working

- ✅ **User Authentication**: Email/password signup and login
- ✅ **AI Summarization**: 
  - Text notes (paste or type)
  - Image uploads with OCR (ML Kit)
  - PDF documents (text extraction)
  - Camera capture of handwritten notes
  - Brief vs Detailed modes
  - **Bilingual**: English & Hindi summaries
- ✅ **AI Chat Assistant**: 
  - Ask questions about your notes
  - Context-aware responses
  - Conversation history saved per note
  - English & Hindi support
- ✅ **Quiz Generation**: 
  - Auto-generated multiple-choice questions
  - Instant scoring
  - Progress tracking
- ✅ **Flashcards**: 
  - Front/back card format
  - Swipe navigation
  - Auto-generated from notes
- ✅ **Pomodoro Timer**: 
  - Customizable work/break intervals
  - Background notifications
  - Session counting
  - Sound alerts
- ✅ **Focus Mode**: 
  - Session duration tracking
  - Distraction time logging (UI only)
  - Auto-save progress
- ✅ **Progress Analytics**: 
  - Total study time
  - Session counts
  - Study streaks
  - Recent sessions log
  - Manual session logging
- ✅ **Rewards System**: 
  - XP and leveling
  - Daily quest system
  - Study streaks
  - Persistent progress
- ✅ **Notes Library**: 
  - Save notes to Firestore
  - Subject categorization
  - Load and view saved notes
  - Chat history per note
- ✅ **Text-to-Speech**: 
  - Listen to summaries
  - English & Hindi voices
  - Device voice download support
- ✅ **User Profile**: 
  - Edit name and goals
  - View account details
  - Logout functionality

### 🔄 Limitations & Known Issues

#### Technical Limitations:
1. **Backend Dependency**: Current version requires a Node.js backend running on localhost or accessible server
   - ⚠️ **Not yet standalone**: Cannot share APK to others without backend setup
   - 🔮 **Planned**: Direct Gemini API integration from Android (removes laptop dependency)

2. **OCR Accuracy**: Google ML Kit OCR works well for printed text but may struggle with:
   - Heavily stylized handwriting
   - Low-light or blurry photos
   - Complex mathematical equations

3. **AI Model Quota**: 
   - Free tier Gemini API has rate limits
   - Quota exceeded errors handled with user-friendly messages
   - HTTP 429 errors displayed when quota exhausted

4. **TTS Voice Availability**:
   - Hindi TTS requires device to have Hindi voice data installed
   - App prompts user to download if missing
   - Quality varies by device manufacturer

#### Feature Gaps (vs Original Vision):
- ❌ **Natural Voice Conversations**: Original idea had voice-to-voice AI chat (not implemented)
- ❌ **Video Summaries**: Planned animated video explanations (not implemented)
- ❌ **App Blocking (System-level)**: Focus mode tracks time but doesn't enforce app blocks (requires root/admin)
- ❌ **Offline Mode**: No local AI fallback yet (planned with MediaPipe LLM or TensorFlow Lite)
- ❌ **Push Notifications**: Reminder system UI exists but notifications aren't scheduled
- ❌ **Social Features**: No study groups, leaderboards, or friend challenges
- ❌ **Premium Features**: No tiered subscription model (all features free)

---

## 🗺️ Future Roadmap

### Phase 1: Standalone Operation (Next Priority)
- [ ] Direct Gemini API integration from Android
- [ ] Remove backend dependency for APK sharing
- [ ] Implement OAuth 2.0 for API key security
- [ ] **Goal**: Share APK to anyone without setup

### Phase 2: Enhanced AI Capabilities
- [ ] **Natural Voice Conversations**: 
  - Speech-to-Text input (Google Speech API)
  - Voice responses (advanced TTS with Gemini voice models)
  - Real-time voice chat with AI tutor
- [ ] **Video Summaries**:
  - Auto-generated explainer videos
  - Animated visual summaries
  - Integration with D-ID or Synthesia APIs
- [ ] **Offline AI Fallback**:
  - MediaPipe LLM Inference API
  - Gemma-2B on-device model
  - Basic summarization without internet

### Phase 3: Premium Features (Monetization)
- [ ] **Free Tier**: 
  - 20 summaries/month
  - 10 quiz generations/month
  - Basic TTS
- [ ] **Premium Tier** ($4.99/month):
  - Unlimited AI features
  - Natural voice conversations
  - Video summaries
  - Priority processing
  - No ads
  - Cloud backup
- [ ] **Student Tier** ($2.99/month):
  - 100 summaries/month
  - All quiz features
  - Advanced TTS

### Phase 4: Social & Collaboration
- [ ] Study groups
- [ ] Shared note libraries
- [ ] Leaderboards
- [ ] Friend challenges
- [ ] Real-time collaboration

### Phase 5: Advanced Features
- [ ] Spaced repetition algorithm for flashcards
- [ ] Personalized study plans (AI tutor)
- [ ] Subject-specific AI models (math, science, history)
- [ ] Whiteboard mode with diagram recognition
- [ ] Integration with Google Classroom, Canvas LMS
- [ ] Export to Notion, Anki, Quizlet

---

## 🏗️ Project Structure

```
padhai-android/
├── app/
│   ├── src/main/
│   │   ├── java/com/padhai/app/
│   │   │   ├── PadhAIApplication.kt          # Application class
│   │   │   ├── ui/
│   │   │   │   ├── auth/                     # Login, Signup, Splash
│   │   │   │   ├── learn/                    # Summarization & Chat
│   │   │   │   │   ├── LearnFragment.kt
│   │   │   │   │   ├── LearnViewModel.kt    # AI API calls
│   │   │   │   │   └── ChatAdapter.kt        # Chat UI
│   │   │   │   ├── focus/                    # Pomodoro & Focus Mode
│   │   │   │   │   ├── FocusFragment.kt
│   │   │   │   │   └── PomodoroAlarmReceiver.kt
│   │   │   │   ├── quiz/                     # Quiz & Flashcards
│   │   │   │   ├── analytics/                # Progress tracking
│   │   │   │   ├── profile/                  # User settings
│   │   │   │   ├── camera/                   # Camera capture
│   │   │   │   └── MainActivity.kt           # Bottom nav host
│   │   │   ├── data/
│   │   │   │   ├── StudyDataManager.kt       # Local persistence
│   │   │   │   └── model/                    # Data classes
│   │   │   └── utils/
│   │   │       ├── TTSManager.kt             # Text-to-Speech
│   │   │       ├── RewardsManager.kt         # XP & Quests
│   │   │       ├── PomodoroSettings.kt       # Timer config
│   │   │       └── ThemeManager.kt           # Dark mode
│   │   ├── res/
│   │   │   ├── layout/                       # XML UI files
│   │   │   ├── drawable/                     # Icons & images
│   │   │   ├── values/                       # Strings, colors, themes
│   │   │   ├── navigation/                   # Nav graph
│   │   │   └── menu/                         # Bottom nav menu
│   │   └── AndroidManifest.xml
│   ├── build.gradle                          # App dependencies
│   └── google-services.json                  # Firebase config (YOU ADD THIS)
├── gradle.properties                         # Build config (BACKEND_BASE_URL)
└── build.gradle                              # Project config
```

---

## 🐛 Troubleshooting

### Common Issues

**1. "google-services.json not found"**
- Download from Firebase Console → Project Settings → Your Apps
- Place in `padhai-android/app/` directory
- Sync Gradle again

**2. "Unable to connect to backend"**
- Ensure backend server is running (`npm run dev` in padhai-backend)
- **Emulator**: Use `http://10.0.2.2:4000` (localhost redirect)
- **Physical device**: Use your laptop's local IP (e.g., `http://192.168.1.100:4000`)
- Check firewall settings (allow port 4000)

**3. "AI quota exceeded" errors**
- Free tier Gemini API has rate limits
- Wait 1 minute and try again
- Upgrade to paid tier for higher limits

**4. "Hindi voice not available" for TTS**
- Android settings → Accessibility → Text-to-Speech → Install Hindi voice data
- Or download from Play Store: "Google Text-to-Speech"

**5. OCR not detecting text**
- Ensure good lighting
- Hold camera steady
- Use printed or clear handwriting
- Check camera permissions granted

**6. Build errors in Android Studio**
- Update Android Studio to latest version
- File → Invalidate Caches → Restart
- Clean build: Build → Clean Project → Rebuild Project

---

## 📦 Building Release APK

### For Testing (Debug APK)
```bash
cd padhai-android
./gradlew assembleDebug
```
APK location: `app/build/outputs/apk/debug/app-debug.apk`

### For Production (Signed Release APK)

1. **Generate Signing Key**:
   ```bash
   keytool -genkey -v -keystore padhai-release-key.jks \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias padhai-key
   ```
   - Enter a strong password
   - Fill in your details
   - Keep `.jks` file safe (don't commit to Git)

2. **Configure Signing in `app/build.gradle`**:
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file('path/to/padhai-release-key.jks')
               storePassword 'your-password'
               keyAlias 'padhai-key'
               keyPassword 'your-password'
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled true
               proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

3. **Build Release APK**:
   ```bash
   ./gradlew assembleRelease
   ```
   APK location: `app/build/outputs/apk/release/app-release.apk`

4. **Install on Device**:
   ```bash
   adb install app-release.apk
   ```

---

## 🤝 Contributing

Contributions are welcome! Areas needing help:
- [ ] Direct Gemini API integration (remove backend dependency)
- [ ] Offline AI with MediaPipe LLM
- [ ] Video summary generation
- [ ] Natural voice conversations
- [ ] UI/UX improvements
- [ ] Bug fixes

### Development Guidelines:
1. Follow MVVM architecture
2. Use Kotlin coroutines for async work
3. Add proper error handling
4. Write unit tests for ViewModels
5. Follow Material Design 3 guidelines
6. Document public APIs with KDoc

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙋 Support & Contact

- **Issues**: Report bugs on GitHub Issues
- **Documentation**: See `GETTING_STARTED.md` for detailed setup
- **Backend API**: See `../padhai-backend/API_REFERENCE.md`

---

## 🙏 Acknowledgments

- **Google Gemini 2.5 Flash**: Core AI model
- **Firebase**: Authentication and cloud storage
- **Google ML Kit**: On-device OCR
- **Material Design 3**: UI components
- **CameraX**: Modern camera API
- **Kotlin Coroutines**: Async programming
- `padhai-backend/API_REFERENCE.md`
- `padhai/GETTING_STARTED.md`

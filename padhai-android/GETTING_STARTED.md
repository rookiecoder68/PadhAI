# PadhAI Android - Complete Setup Guide

> **⏱️ Total Setup Time: 20-30 minutes**

This guide walks you through setting up PadhAI Android from scratch, even if you're new to Android development.

---

## 📚 Table of Contents

1. [Prerequisites Installation](#prerequisites-installation)
2. [Firebase Configuration](#firebase-configuration)
3. [Backend Server Setup](#backend-server-setup)
4. [Android App Setup](#android-app-setup)
5. [Testing the App](#testing-the-app)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites Installation

### 1. Install Android Studio (15 minutes)

**Download**:
- Visit: [https://developer.android.com/studio](https://developer.android.com/studio)
- Click "Download Android Studio"
- Run installer (Windows: `.exe`, Mac: `.dmg`)

**Installation Steps**:
1. Run the installer
2. Choose "Standard" installation type
3. Select theme (Light/Dark)
4. Click "Finish" and wait for component downloads
5. Launch Android Studio when complete

**Verify Installation**:
```bash
# Open Android Studio → Help → About
# Should show version 2023.1.1 or newer
```

---

### 2. Install Node.js (5 minutes)

**Download**:
- Visit: [https://nodejs.org](https://nodejs.org)
- Click "LTS" version (v20.x or newer)
- Run installer

**Verify Installation**:
```powershell
node --version
# Output: v20.11.0 (or higher)

npm --version
# Output: v10.2.4 (or higher)
```

---

### 3. Create Firebase Account (Free)

- Visit: [https://console.firebase.google.com](https://console.firebase.google.com)
- Sign in with Google account
- You're ready for Step 2!

---

### 4. Get Google AI API Key (Free)

- Visit: [https://ai.google.dev](https://ai.google.dev)
- Click "Get API Key in Google AI Studio"
- Sign in with Google account
- Click "Create API Key"
- Copy the key (starts with `AIzaSy...`)
- Save it somewhere safe (notepad)

---

## Firebase Configuration

### Step 1: Create Firebase Project (3 minutes)

1. Open [Firebase Console](https://console.firebase.google.com)
2. Click **"Add Project"**
3. Project name: `PadhAI` (or your choice)
4. Click "Continue"
5. **Disable Google Analytics** (not needed for now)
6. Click "Create Project"
7. Wait 30 seconds for setup
8. Click "Continue"

---

### Step 2: Add Android App (4 minutes)

1. In Firebase Console, click **Android icon** (robot)
2. Fill in form:
   - **Android package name**: `com.padhai.app` ⚠️ MUST BE EXACT
   - **App nickname**: `PadhAI Android`
   - **Debug signing certificate**: Leave blank (optional)
3. Click "Register App"
4. **Download `google-services.json`** (blue button)
5. Save file to your Downloads folder (we'll move it later)
6. Click "Next" → "Next" → "Continue to Console"

---

### Step 3: Enable Authentication (2 minutes)

1. In Firebase Console, left sidebar: **Build → Authentication**
2. Click **"Get Started"**
3. Click **"Email/Password"** provider
4. Toggle **Enable** switch (first one only, not "Email link")
5. Click **"Save"**

---

### Step 4: Create Firestore Database (3 minutes)

1. Left sidebar: **Build → Firestore Database**
2. Click **"Create Database"**
3. Choose **"Start in Test Mode"** (for development)
4. Click "Next"
5. Choose location: **us-central (or closest to you)**
6. Click "Enable"
7. Wait for database to be created

---

## Backend Server Setup

### Step 1: Navigate to Backend Folder

```powershell
# Open PowerShell (Windows) or Terminal (Mac)
cd "C:\Users\YourName\Desktop\MS\padhai\padhai-backend"
# Replace YourName with your actual username
```

---

### Step 2: Install Dependencies (2 minutes)

```powershell
npm install
```

Expected output:
```
added 245 packages in 47s
```

---

### Step 3: Configure Environment

1. Create a new file: `.env` in `padhai-backend` folder
2. Open with Notepad
3. Paste this (replace with your real API key):

```env
# Server Configuration
PORT=4000

# Google Gemini API Key
GEMINI_API_KEY=AIzaSy...your-actual-api-key-here

# Model Configuration
MODEL_PROVIDER=google
GEMINI_MODEL=gemini-2.0-flash-exp
```

4. **Replace** `AIzaSy...your-actual-api-key-here` with your Google AI API key from earlier
5. Save and close

---

### Step 4: Start Backend Server

```powershell
npm run dev
```

**Expected Output**:
```
PadhAI backend listening on 4000
Using model provider: google (Gemini 2.5 Flash)
```

✅ **Keep this terminal window open!** Backend must run while using the app.

---

## Android App Setup

### Step 1: Open Project in Android Studio (2 minutes)

1. Launch **Android Studio**
2. Click **"Open"**
3. Navigate to: `C:\Users\YourName\Desktop\MS\padhai\padhai-android\`
4. Click **"OK"**
5. Wait for project to load (30-60 seconds)
6. Wait for Gradle sync to complete (bottom status bar)

---

### Step 2: Add Firebase Config File

1. Find the `google-services.json` file you downloaded earlier (in Downloads)
2. **Copy** the file
3. In Android Studio, switch to **"Project"** view (top-left dropdown)
4. Navigate to: `app/` folder
5. **Paste** `google-services.json` here
6. File structure should look like:
   ```
   padhai-android/
   └── app/
       ├── build.gradle
       └── google-services.json  ← HERE
   ```

---

### Step 3: Configure Backend URL (if using physical device)

**For Emulator**: Skip this step (default works)

**For Physical Device**:

1. **Find Your Computer's Local IP**:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., `192.168.1.100`)

2. **Edit `gradle.properties`**:
   - Open file: `padhai-android/gradle.properties`
   - Add these lines:
     ```properties
     BACKEND_BASE_URL=http://10.0.2.2:4000
     PHONE_BACKEND_BASE_URL=http://192.168.1.100:4000
     ```
   - Replace `192.168.1.100` with YOUR actual IP from step 1

---

### Step 4: Sync and Build (3 minutes)

1. Click **"File → Sync Project with Gradle Files"**
2. Wait for sync to finish (watch bottom status bar)
3. Click **"Build → Make Project"** (or `Ctrl+F9`)
4. Wait for build to complete (2-5 minutes first time)
5. Look for "BUILD SUCCESSFUL" in Build tab

---

### Step 5: Setup Emulator (if needed)

**If you have a physical Android device**:
1. Enable Developer Options: Settings → About Phone → Tap "Build Number" 7 times
2. Enable USB Debugging: Settings → Developer Options → USB Debugging
3. Connect device with USB cable
4. Click "Allow" on phone when prompted

**If using emulator**:
1. Click **"Tools → Device Manager"**
2. Click **"Create Device"**
3. Select: **Pixel 5**
4. Click "Next"
5. Download: **API 34 (Android 14)** (click download icon)
6. Wait for download (1-2 GB)
7. Click "Next" → "Finish"

---

### Step 6: Run the App! 🚀

1. **Ensure backend is still running** (check the PowerShell window from earlier)
2. In Android Studio, click the green **"Run"** button (▶) or press `Shift+F10`
3. Select your device/emulator from the list
4. Click "OK"
5. Wait for app to install and launch (1-2 minutes first time)

---

## Testing the App

### First Launch: Create Account

1. **Splash Screen** → Tap screen to continue
2. **Login Screen** → Click "Sign Up"
3. **Signup Screen**:
   - Name: Your name
   - Email: test@example.com (or real email)
   - Password: Test1234 (minimum 6 chars)
   - Confirm Password: Test1234
4. Click **"Sign Up"**
5. Wait for account creation
6. You're in! 🎉

---

### Test Feature 1: Summarize Text Notes

1. Go to **"Learn"** tab (bottom nav)
2. Paste some notes in the text box:
   ```
   Photosynthesis is the process by which plants convert light energy into chemical energy. 
   It occurs in the chloroplasts and requires sunlight, water, and carbon dioxide. 
   The end products are glucose and oxygen.
   ```
3. Select **"Brief"** summary level
4. Click **"Summarize"**
5. Wait 3-5 seconds
6. View summary! Try clicking **"🔊 Listen"** for TTS

---

### Test Feature 2: Take Photo of Notes

1. In **Learn** tab, click **"Camera"** icon
2. Grant camera permission if prompted
3. Point camera at printed text or book
4. Tap capture button
5. Click **"Use Photo"**
6. Click **"Summarize"**
7. AI will extract text and summarize!

---

### Test Feature 3: AI Chat

1. After summarizing notes, scroll down to **"Chat with AI"** section
2. Type a question: "What is photosynthesis?"
3. Click **"Send"**
4. Wait for AI response
5. Try changing language to **"हिन्दी"** and ask again!

---

### Test Feature 4: Quiz Generation

1. Summarize some notes (any topic)
2. Go to **"Quiz"** tab (bottom nav)
3. Click **"Generate Quiz"**
4. Wait 5-10 seconds
5. Answer 10 multiple-choice questions
6. See your score!

---

### Test Feature 5: Pomodoro Timer

1. Go to **"Focus"** tab
2. Set: 25 min work, 5 min break (default)
3. Click **"Start Focus Session"**
4. Timer counts down
5. You'll get a notification when time is up!

---

## Troubleshooting

### ❌ Error: "Unable to connect to backend"

**Cause**: Backend server not running or wrong URL

**Solution**:
1. Check backend terminal is still running (should show "listening on 4000")
2. If closed, restart: `cd padhai-backend` → `npm run dev`
3. **For physical device**: 
   - Ensure phone and laptop on same WiFi network
   - Verify PHONE_BACKEND_BASE_URL in gradle.properties matches your IP
   - Disable firewall temporarily to test

---

### ❌ Error: "google-services.json not found"

**Cause**: Firebase config file not in correct location

**Solution**:
1. Download `google-services.json` from Firebase Console again
2. Place in `padhai-android/app/` directory (NOT `app/src/`)
3. In Android Studio: File → Sync Project with Gradle Files

---

### ❌ Error: "AI quota exceeded"

**Cause**: Free tier Gemini API rate limit reached

**Solution**:
1. Wait 1 minute and try again
2. Free tier resets every minute
3. For unlimited: Upgrade to paid Gemini API plan

---

### ❌ Error: "Authentication failed"

**Cause**: Firebase Authentication not enabled or wrong email/password

**Solution**:
1. Check Firebase Console → Authentication → Email/Password is enabled
2. Try logging out and creating a new account
3. Ensure password is at least 6 characters

---

### ❌ Error: "OCR not working"

**Cause**: Poor image quality or camera permission denied

**Solution**:
1. Grant camera permission: Android Settings → Apps → PadhAI → Permissions → Camera
2. Ensure good lighting
3. Use printed text (clearer than handwriting)
4. Hold phone steady when capturing

---

### ❌ Error: "Hindi TTS not available"

**Cause**: Device doesn't have Hindi voice data installed

**Solution**:
1. Android Settings → Accessibility → Text-to-Speech
2. Click "⚙️" on "Google Text-to-Speech Engine"
3. Click "Install voice data"
4. Download "Hindi (India)"
5. Restart app

---

### ❌ Build Error: "SDK not found"

**Cause**: Android SDK not installed properly

**Solution**:
1. Android Studio → Tools → SDK Manager
2. Check "Android 14.0 (API 34)" is installed
3. Check "Android SDK Build-Tools 34" is installed
4. Click "Apply" to install missing components
5. Sync Gradle again

---

## Next Steps

### ✅ You're All Set!

Now you can:
- ✅ Summarize text, images, PDFs
- ✅ Chat with AI about your notes
- ✅ Generate quizzes and flashcards
- ✅ Use Pomodoro timer
- ✅ Track your study progress
- ✅ Earn rewards and XP

### 📖 Further Reading

- **README.md**: Full feature list and roadmap
- **Backend API_REFERENCE.md**: API endpoint documentation
- **Android Docs**: [developer.android.com](https://developer.android.com)

### 🚀 Advanced Topics

- Building release APK (for sharing)
- Setting up CI/CD with GitHub Actions
- Implementing offline mode
- Integrating direct Gemini API (no backend needed)

---

## 🎓 Learning Resources

**New to Android Development?**
- [Android Basics with Compose](https://developer.android.com/courses/android-basics-compose/course)
- [Kotlin Bootcamp](https://developer.android.com/courses/kotlin-bootcamp/overview)

**Want to Contribute?**
- Check GitHub Issues for beginner-friendly tasks
- Read CONTRIBUTING.md for guidelines
- Join our community discussions

---

## 💡 Tips for Best Experience

1. **Keep Backend Running**: Don't close the backend terminal while using app
2. **Use Good Internet**: AI features require stable connection
3. **Grant Permissions**: Camera, notifications for full features
4. **Update Regularly**: Pull latest code for bug fixes
5. **Report Bugs**: Help us improve by reporting issues!

---

## ❓ Still Stuck?

- **Check README.md**: More detailed troubleshooting
- **GitHub Issues**: Search existing issues or create new one
- **Backend Logs**: Check terminal for error messages
- **Android Logcat**: Android Studio → View → Tool Windows → Logcat

---

## 🎉 Success!

If you've reached this point and the app is working, congratulations! You've successfully set up PadhAI Android. 

**Happy studying! 📚✨**

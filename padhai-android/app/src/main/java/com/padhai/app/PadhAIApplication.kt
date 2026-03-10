package com.padhai.app

import android.app.Application
import android.util.Log
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.padhai.app.utils.ThemeManager

class PadhAIApplication : Application() {
    companion object {
        private const val TAG = "PadhAIApplication"
        private const val FIREBASE_APP_ID = "...."
        private const val FIREBASE_API_KEY = "A..."
        private const val FIREBASE_PROJECT_ID = "padhai"
        private const val FIREBASE_STORAGE_BUCKET = "padhai.app"
        private const val FIREBASE_GCM_SENDER_ID = ".."
    }

    override fun onCreate() {
        super.onCreate()
        
        // Initialize theme based on saved preference
        ThemeManager.initializeTheme(this)

        val existing = FirebaseApp.getApps(this)
        if (existing.isNotEmpty()) {
            return
        }

        val defaultApp = FirebaseApp.initializeApp(this)
        if (defaultApp != null) {
            Log.d(TAG, "Firebase initialized using default app config")
            return
        }

        val optionsFromResources = FirebaseOptions.fromResource(this)
        if (optionsFromResources != null) {
            FirebaseApp.initializeApp(this, optionsFromResources)
            Log.d(TAG, "Firebase initialized from resources fallback")
            return
        }

        try {
            val hardcodedOptions = FirebaseOptions.Builder()
                .setApplicationId(FIREBASE_APP_ID)
                .setApiKey(FIREBASE_API_KEY)
                .setProjectId(FIREBASE_PROJECT_ID)
                .setStorageBucket(FIREBASE_STORAGE_BUCKET)
                .setGcmSenderId(FIREBASE_GCM_SENDER_ID)
                .build()
            FirebaseApp.initializeApp(this, hardcodedOptions)
            Log.d(TAG, "Firebase initialized using hardcoded options fallback")
        } catch (e: Exception) {
            Log.e(TAG, "Firebase initialization failed in all fallback modes", e)
        }
    }
}

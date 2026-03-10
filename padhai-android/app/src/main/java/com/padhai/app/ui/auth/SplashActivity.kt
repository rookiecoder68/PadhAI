package com.padhai.app.ui.auth

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.auth.FirebaseAuth
import com.padhai.app.R
import com.padhai.app.ui.MainActivity

class SplashActivity : AppCompatActivity() {
    
    private var auth: FirebaseAuth? = null
    
    companion object {
        private const val TAG = "SplashActivity"
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        try {
            auth = FirebaseAuth.getInstance()
        } catch (e: Exception) {
            Log.e(TAG, "Firebase initialization failed", e)
        }
        
        // Check if user is already logged in after a delay
        Handler(Looper.getMainLooper()).postDelayed({
            checkAuthState()
        }, 2000)
    }
    
    private fun checkAuthState() {
        val currentUser = auth?.currentUser
        val intent = if (currentUser != null) {
            // User is signed in, go to main activity
            Intent(this, MainActivity::class.java)
        } else {
            // No user signed in, go to login
            Intent(this, LoginActivity::class.java)
        }
        startActivity(intent)
        finish()
    }
}

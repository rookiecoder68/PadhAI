package com.padhai.app.ui.auth

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.UserProfileChangeRequest
import com.google.firebase.firestore.FirebaseFirestore
import com.padhai.app.databinding.ActivitySignupBinding
import com.padhai.app.ui.MainActivity
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class SignupActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivitySignupBinding
    private lateinit var auth: FirebaseAuth
    private lateinit var firestore: FirebaseFirestore
    
    companion object {
        private const val TAG = "SignupActivity"
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySignupBinding.inflate(layoutInflater)
        setContentView(binding.root)

        try {
            auth = FirebaseAuth.getInstance()
            firestore = FirebaseFirestore.getInstance()
        } catch (e: Exception) {
            Log.e(TAG, "Firebase initialization failed", e)
            Toast.makeText(
                this,
                "Firebase initialization failed. Please reinstall and sync project once.",
                Toast.LENGTH_LONG
            ).show()
            return
        }

        setupListeners()
    }
    
    private fun setupListeners() {
        binding.btnSignup.setOnClickListener {
            val name = binding.etName.text.toString().trim()
            val email = binding.etEmail.text.toString().trim()
            val password = binding.etPassword.text.toString().trim()
            val confirmPassword = binding.etConfirmPassword.text.toString().trim()
            
            if (validateInput(name, email, password, confirmPassword)) {
                signupUser(name, email, password)
            }
        }
        
        binding.tvLogin.setOnClickListener {
            finish()
        }
    }
    
    private fun validateInput(
        name: String,
        email: String,
        password: String,
        confirmPassword: String
    ): Boolean {
        if (name.isEmpty()) {
            binding.etName.error = "Name is required"
            return false
        }
        
        if (email.isEmpty()) {
            binding.etEmail.error = "Email is required"
            return false
        }
        
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.etEmail.error = "Invalid email format"
            return false
        }
        
        if (password.isEmpty()) {
            binding.etPassword.error = "Password is required"
            return false
        }
        
        if (password.length < 6) {
            binding.etPassword.error = "Password must be at least 6 characters"
            return false
        }
        
        if (password != confirmPassword) {
            binding.etConfirmPassword.error = "Passwords do not match"
            return false
        }
        
        return true
    }
    
    private fun signupUser(name: String, email: String, password: String) {
        binding.btnSignup.isEnabled = false
        binding.progressBar.visibility = android.view.View.VISIBLE
        
        lifecycleScope.launch {
            try {
                // Create user account
                val result = auth.createUserWithEmailAndPassword(email, password).await()
                val user = result.user
                
                // Update user profile with name
                val profileUpdates = UserProfileChangeRequest.Builder()
                    .setDisplayName(name)
                    .build()
                user?.updateProfile(profileUpdates)?.await()
                
                // Create user document in Firestore
                user?.let {
                    val userData = hashMapOf(
                        "uid" to it.uid,
                        "name" to name,
                        "email" to email,
                        "createdAt" to System.currentTimeMillis(),
                        "learningGoal" to "",
                        "language" to "English",
                        "totalStudyTime" to 0,
                        "studyStreak" to 0,
                        "level" to 1,
                        "xp" to 0
                    )
                    
                    firestore.collection("users")
                        .document(it.uid)
                        .set(userData)
                        .await()
                }
                
                Toast.makeText(
                    this@SignupActivity,
                    "Account created successfully!",
                    Toast.LENGTH_SHORT
                ).show()
                
                // Navigate to main activity
                val intent = Intent(this@SignupActivity, MainActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                finish()
                
            } catch (e: Exception) {
                Log.e(TAG, "Signup failed: ${e.message}", e)
                Toast.makeText(
                    this@SignupActivity,
                    "Signup failed: ${e.message}",
                    Toast.LENGTH_LONG
                ).show()
            } finally {
                binding.btnSignup.isEnabled = true
                binding.progressBar.visibility = android.view.View.GONE
            }
        }
    }
}

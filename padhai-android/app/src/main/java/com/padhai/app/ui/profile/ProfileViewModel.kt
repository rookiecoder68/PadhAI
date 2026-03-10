package com.padhai.app.ui.profile

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.*

data class UserProfile(
    val name: String,
    val email: String,
    val learningGoal: String,
    val language: String,
    val memberSince: String,
    val level: Int,
    val xp: Int
)

class ProfileViewModel : ViewModel() {
    
    private val _userProfile = MutableLiveData<UserProfile?>()
    val userProfile: LiveData<UserProfile?> = _userProfile
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _message = MutableLiveData<String?>()
    val message: LiveData<String?> = _message
    
    private val auth = FirebaseAuth.getInstance()
    private val firestore = FirebaseFirestore.getInstance()
    
    fun loadUserProfile() {
        viewModelScope.launch {
            _isLoading.value = true
            
            try {
                val userId = auth.currentUser?.uid ?: return@launch
                val userEmail = auth.currentUser?.email ?: ""
                
                val document = firestore.collection("users")
                    .document(userId)
                    .get()
                    .await()
                
                if (document.exists()) {
                    val name = document.getString("name") ?: ""
                    val learningGoal = document.getString("learningGoal") ?: ""
                    val language = document.getString("language") ?: "English"
                    val createdAt = document.getLong("createdAt") ?: System.currentTimeMillis()
                    val level = document.getLong("level")?.toInt() ?: 1
                    val xp = document.getLong("xp")?.toInt() ?: 0
                    
                    val dateFormat = SimpleDateFormat("MMM yyyy", Locale.getDefault())
                    val memberSince = dateFormat.format(Date(createdAt))
                    
                    _userProfile.value = UserProfile(
                        name, userEmail, learningGoal, language, memberSince, level, xp
                    )
                }
                
            } catch (e: Exception) {
                _message.value = "Failed to load profile: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun updateProfile(name: String, learningGoal: String, language: String) {
        viewModelScope.launch {
            _isLoading.value = true
            
            try {
                val userId = auth.currentUser?.uid ?: return@launch
                
                val updates = hashMapOf<String, Any>(
                    "name" to name,
                    "learningGoal" to learningGoal,
                    "language" to language
                )
                
                firestore.collection("users")
                    .document(userId)
                    .update(updates)
                    .await()
                
                _message.value = "Profile updated successfully"
                loadUserProfile() // Reload profile
                
            } catch (e: Exception) {
                _message.value = "Failed to update profile: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
}

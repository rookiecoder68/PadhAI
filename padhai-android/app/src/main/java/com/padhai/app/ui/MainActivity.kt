package com.padhai.app.ui

import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.navigation.findNavController
import androidx.navigation.ui.AppBarConfiguration
import androidx.navigation.ui.setupActionBarWithNavController
import androidx.navigation.ui.setupWithNavController
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.firebase.auth.FirebaseAuth
import com.padhai.app.R
import com.padhai.app.databinding.ActivityMainBinding
import com.padhai.app.ui.auth.LoginActivity

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var auth: FirebaseAuth
    
    companion object {
        private const val TAG = "MainActivity"
    }

    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (!granted) {
            Log.w(TAG, "POST_NOTIFICATIONS permission denied; timer notifications may be hidden")
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        auth = FirebaseAuth.getInstance()
        requestNotificationPermissionIfNeeded()
        
        // Check if user is authenticated
        if (auth.currentUser == null) {
            Log.d(TAG, "No authenticated user found, redirecting to login")
            redirectToLogin()
            return
        }
        
        Log.d(TAG, "User authenticated: ${auth.currentUser?.email}")
        // Use post to ensure View hierarchy is fully created
        binding.root.post {
            try {
                setupNavigation()
            } catch (e: Exception) {
                Log.e(TAG, "Error setting up navigation: ${e.message}", e)
            }
        }
    }
    
    private fun setupNavigation() {
        try {
            val navView: BottomNavigationView = binding.navView
            val navController = findNavController(R.id.nav_host_fragment_activity_main)
            
            Log.d(TAG, "NavController found, setting up bottom navigation")
            
            // Setup bottom navigation with nav controller
            val appBarConfiguration = AppBarConfiguration(
                setOf(
                    R.id.navigation_learn,
                    R.id.navigation_focus,
                    R.id.navigation_quiz,
                    R.id.navigation_analytics,
                    R.id.navigation_profile
                )
            )
            
            setupActionBarWithNavController(navController, appBarConfiguration)
            navView.setupWithNavController(navController)
            
            Log.d(TAG, "Navigation setup completed successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Exception in setupNavigation: ${e.message}", e)
            throw e
        }
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                this,
                android.Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED

            if (!granted) {
                notificationPermissionLauncher.launch(android.Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }
    
    private fun redirectToLogin() {
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
    
    fun logout() {
        auth.signOut()
        redirectToLogin()
    }
    
    override fun onSupportNavigateUp(): Boolean {
        return try {
            val navController = findNavController(R.id.nav_host_fragment_activity_main)
            navController.navigateUp() || super.onSupportNavigateUp()
        } catch (e: Exception) {
            Log.e(TAG, "Error in onSupportNavigateUp: ${e.message}", e)
            super.onSupportNavigateUp()
        }
    }
}

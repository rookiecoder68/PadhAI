package com.padhai.app.ui.profile

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import com.padhai.app.databinding.FragmentProfileBinding
import com.padhai.app.ui.MainActivity

class ProfileFragment : Fragment() {
    
    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var viewModel: ProfileViewModel
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        viewModel = ViewModelProvider(this)[ProfileViewModel::class.java]
        _binding = FragmentProfileBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupUI()
        observeViewModel()
        viewModel.loadUserProfile()
    }
    
    private fun setupUI() {
        // Load current theme
        val currentTheme = com.padhai.app.utils.ThemeManager.getThemeMode(requireContext())
        when (currentTheme) {
            com.padhai.app.utils.ThemeManager.THEME_LIGHT -> binding.rbLight.isChecked = true
            com.padhai.app.utils.ThemeManager.THEME_DARK -> binding.rbDark.isChecked = true
            com.padhai.app.utils.ThemeManager.THEME_SYSTEM -> binding.rbSystem.isChecked = true
        }
        
        // Handle theme changes
        binding.rgTheme.setOnCheckedChangeListener { _, checkedId ->
            val mode = when (checkedId) {
                binding.rbLight.id -> com.padhai.app.utils.ThemeManager.THEME_LIGHT
                binding.rbDark.id -> com.padhai.app.utils.ThemeManager.THEME_DARK
                binding.rbSystem.id -> com.padhai.app.utils.ThemeManager.THEME_SYSTEM
                else -> com.padhai.app.utils.ThemeManager.THEME_SYSTEM
            }
            com.padhai.app.utils.ThemeManager.saveThemeMode(requireContext(), mode)
        }
        
        binding.btnSaveChanges.setOnClickListener {
            saveProfile()
        }
        
        binding.btnLogout.setOnClickListener {
            showLogoutDialog()
        }
    }
    
    private fun observeViewModel() {
        viewModel.userProfile.observe(viewLifecycleOwner) { profile ->
            profile?.let {
                binding.etName.setText(it.name)
                binding.etLearningGoal.setText(it.learningGoal)
                binding.tvEmail.text = it.email
                binding.tvMemberSince.text = "Member since: ${it.memberSince}"
                binding.tvLevel.text = "Level ${it.level}"
                binding.tvXp.text = "${it.xp} XP"
            }
        }
        
        viewModel.isLoading.observe(viewLifecycleOwner) { isLoading ->
            binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        }
        
        viewModel.message.observe(viewLifecycleOwner) { message ->
            message?.let {
                Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun saveProfile() {
        val name = binding.etName.text.toString()
        val learningGoal = binding.etLearningGoal.text.toString()
        val selectedLanguage = when (binding.spinnerLanguage.selectedItemPosition) {
            0 -> "English"
            1 -> "Hindi"
            2 -> "Spanish"
            else -> "English"
        }
        
        viewModel.updateProfile(name, learningGoal, selectedLanguage)
    }
    
    private fun showLogoutDialog() {
        AlertDialog.Builder(requireContext())
            .setTitle("Logout")
            .setMessage("Are you sure you want to logout?")
            .setPositiveButton("Yes") { _, _ ->
                (activity as? MainActivity)?.logout()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

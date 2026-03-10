package com.padhai.app.ui.learn

import android.Manifest
import android.app.AlertDialog
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.OpenableColumns
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.RelativeSizeSpan
import android.text.style.StyleSpan
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.padhai.app.data.StudyDataManager
import com.padhai.app.databinding.FragmentLearnBinding
import com.padhai.app.ui.camera.CameraActivity
import com.padhai.app.utils.TTSManager
import kotlinx.coroutines.launch
import java.util.Locale

class LearnFragment : Fragment() {
    
    private var _binding: FragmentLearnBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var viewModel: LearnViewModel
    private lateinit var chatAdapter: ChatAdapter
    private var ttsManager: TTSManager? = null
    private var selectedImageUri: Uri? = null
    private var selectedPdfUri: Uri? = null
    
    companion object {
        private const val TAG = "LearnFragment"
        private const val PREFS_AUTO_SAVE = "learn_auto_save"
        private const val KEY_LAST_AUTO_SAVE_HASH = "last_auto_save_hash"
    }
    
    private val pickImageLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { handleImageSelected(it) }
    }

    private val pickPdfLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { handlePdfSelected(it) }
    }
    
    private val takeCameraLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == android.app.Activity.RESULT_OK) {
            result.data?.data?.let { uri ->
                Log.d(TAG, "Photo captured: $uri")
                handleImageSelected(uri)
            }
        }
    }
    
    private val requestCameraPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            openCamera()
        } else {
            Toast.makeText(context, "Camera permission denied", Toast.LENGTH_SHORT).show()
        }
    }
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        viewModel = ViewModelProvider(this)[LearnViewModel::class.java]
        _binding = FragmentLearnBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupChatRecyclerView()
        setupTTS()
        setupUI()
        observeViewModel()
    }
    
    private fun setupChatRecyclerView() {
        chatAdapter = ChatAdapter()
        binding.rvChat.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = chatAdapter
        }
    }
    
    private fun setupTTS() {
        ttsManager = TTSManager(requireContext()) { initialized ->
            binding.btnReadAloud.isEnabled = initialized
            if (!initialized) {
                Toast.makeText(context, "Text-to-speech not available", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun setupUI() {
        binding.btnLoadSavedNotes.setOnClickListener {
            showLoadSavedNotesDialog()
        }

        binding.btnNewSession.setOnClickListener {
            startNewSession()
        }

        binding.btnUploadImage.setOnClickListener {
            pickImageLauncher.launch("image/*")
        }
        
        binding.btnTakePhoto.setOnClickListener {
            checkCameraPermission()
        }

        binding.btnUploadPdf.setOnClickListener {
            pickPdfLauncher.launch("application/pdf")
        }
        
        binding.btnRemoveImage.setOnClickListener {
            selectedImageUri = null
            binding.imagePreview.visibility = View.GONE
            binding.btnRemoveImage.visibility = View.GONE
            binding.imagePreview.setImageDrawable(null)
        }

        binding.btnRemovePdf.setOnClickListener {
            selectedPdfUri = null
            binding.tvSelectedPdf.visibility = View.GONE
            binding.btnRemovePdf.visibility = View.GONE
        }
        
        binding.btnSummarize.setOnClickListener {
            val notes = binding.etNotes.text.toString()
            val language = if (binding.rbHindi.isChecked) "hi" else "en"
            when {
                selectedPdfUri != null -> {
                    viewModel.summarizePdfFromUri(requireContext(), selectedPdfUri!!, "brief", language)
                }
                selectedImageUri != null -> {
                    viewModel.summarizeImageFromUri(requireContext(), selectedImageUri!!, "brief", language)
                }
                notes.isNotEmpty() -> {
                // Save current notes for Quiz/Flashcard tab
                StudyDataManager.setCurrentNotes(requireContext(), notes, "")
                viewModel.summarizeNotes(notes, "brief", language)
                }
                else -> {
                    Toast.makeText(context, "Please enter notes or select an image/PDF", Toast.LENGTH_SHORT).show()
                }
            }
        }
        
        binding.btnReadAloud.setOnClickListener {
            val summary = binding.tvSummary.text.toString()
            if (summary.isNotEmpty()) {
                val language = if (binding.rbHindi.isChecked) "hi" else "en"
                val languageApplied = ttsManager?.setLanguage(language) == true
                if (!languageApplied && language == "hi") {
                    Toast.makeText(context, "Hindi voice not available on this device. Falling back to English.", Toast.LENGTH_SHORT).show()
                }
                val started = ttsManager?.speak(summary) == true
                binding.btnStopReading.isEnabled = started
                if (!started) {
                    Toast.makeText(context, "Text-to-speech unavailable on this device", Toast.LENGTH_SHORT).show()
                }
            }
        }
        
        binding.btnStopReading.setOnClickListener {
            ttsManager?.stop()
            binding.btnStopReading.isEnabled = false
        }
        
        binding.btnSendChat.setOnClickListener {
            val question = binding.etChatInput.text.toString().trim()
            val language = if (binding.rbHindi.isChecked) "hi" else "en"
            if (question.isNotEmpty()) {
                viewModel.sendChatMessage(question, language)
                binding.etChatInput.text?.clear()
            } else {
                Toast.makeText(context, "Please enter a question", Toast.LENGTH_SHORT).show()
            }
        }

        binding.btnNewChat.setOnClickListener {
            startNewSession()
        }
        
        binding.etChatInput.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == android.view.inputmethod.EditorInfo.IME_ACTION_SEND) {
                binding.btnSendChat.performClick()
                true
            } else {
                false
            }
        }
        
        binding.btnSaveNotes.setOnClickListener {
            val notes = binding.etNotes.text.toString()
            val summary = binding.tvSummary.text.toString()
            if (notes.isNotEmpty() || summary.isNotEmpty()) {
                showSaveDialog(notes.ifBlank { summary }, summary)
            } else {
                Toast.makeText(context, "Please add notes before saving", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun observeViewModel() {
        viewModel.summary.observe(viewLifecycleOwner) { summary ->
            binding.tvSummary.text = styleSummaryText(summary)
            binding.summaryCard.visibility = if (summary.isNotEmpty()) View.VISIBLE else View.GONE
            binding.chatCard.visibility = if (summary.isNotEmpty()) View.VISIBLE else View.GONE
            if (summary.isNotEmpty()) {
                // Update stored notes with fresh summary for Quiz tab
                val notes = binding.etNotes.text.toString().ifBlank { summary }
                StudyDataManager.setCurrentNotes(requireContext(), notes, summary)
                autoSaveSummaryIfNeeded(notes, summary)
            }
        }
        
        viewModel.isLoading.observe(viewLifecycleOwner) { isLoading ->
            binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
            binding.btnSummarize.isEnabled = !isLoading
            binding.btnUploadImage.isEnabled = !isLoading
            binding.btnTakePhoto.isEnabled = !isLoading
        }
        
        viewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                Toast.makeText(context, it, Toast.LENGTH_LONG).show()
            }
        }
        
        viewModel.chatMessages.observe(viewLifecycleOwner) { messages ->
            chatAdapter.submitList(messages)
            if (messages.isNotEmpty()) {
                binding.rvChat.smoothScrollToPosition(messages.size - 1)
            }
        }
        
        viewModel.chatLoading.observe(viewLifecycleOwner) { isLoading ->
            binding.chatProgressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
            binding.btnSendChat.isEnabled = !isLoading
            binding.etChatInput.isEnabled = !isLoading
        }
    }
    
    private fun checkCameraPermission() {
        when {
            ContextCompat.checkSelfPermission(
                requireContext(),
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED -> {
                openCamera()
            }
            shouldShowRequestPermissionRationale(Manifest.permission.CAMERA) -> {
                Toast.makeText(context, "Camera permission is required to take photos", Toast.LENGTH_SHORT).show()
                requestCameraPermission.launch(Manifest.permission.CAMERA)
            }
            else -> {
                requestCameraPermission.launch(Manifest.permission.CAMERA)
            }
        }
    }
    
    private fun openCamera() {
        Log.d(TAG, "Opening camera")
        val intent = Intent(requireContext(), CameraActivity::class.java)
        takeCameraLauncher.launch(intent)
    }
    
    private fun handleImageSelected(uri: Uri) {
        Log.d(TAG, "Processing image: $uri")
        selectedImageUri = uri
        selectedPdfUri = null

        binding.tvSelectedPdf.visibility = View.GONE
        binding.btnRemovePdf.visibility = View.GONE

        binding.imagePreview.visibility = View.VISIBLE
        binding.btnRemoveImage.visibility = View.VISIBLE
        Glide.with(this)
            .load(uri)
            .into(binding.imagePreview)

        Toast.makeText(context, "Image selected. Tap Summarize to analyze with AI.", Toast.LENGTH_SHORT).show()
    }

    private fun handlePdfSelected(uri: Uri) {
        selectedPdfUri = uri
        selectedImageUri = null

        binding.imagePreview.visibility = View.GONE
        binding.btnRemoveImage.visibility = View.GONE
        binding.imagePreview.setImageDrawable(null)

        val fileName = resolveDisplayName(uri)
        binding.tvSelectedPdf.text = "Selected PDF: $fileName"
        binding.tvSelectedPdf.visibility = View.VISIBLE
        binding.btnRemovePdf.visibility = View.VISIBLE

        Toast.makeText(context, "PDF selected. Tap Summarize to analyze with AI.", Toast.LENGTH_SHORT).show()
    }

    private fun resolveDisplayName(uri: Uri): String {
        val cursor = requireContext().contentResolver.query(uri, null, null, null, null) ?: return "document.pdf"
        cursor.use {
            val nameIndex = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (nameIndex >= 0 && it.moveToFirst()) {
                return it.getString(nameIndex) ?: "document.pdf"
            }
        }
        return "document.pdf"
    }
    
    private fun showSaveDialog(notes: String, summary: String) {
        val builder = AlertDialog.Builder(requireContext())
        builder.setTitle("Save Notes")
        
        // Create an EditText for the title
        val titleInput = android.widget.EditText(requireContext())
        titleInput.hint = "Enter a title for these notes"
        titleInput.setText(generateTitle(summary, notes))
        
        builder.setView(titleInput)
        builder.setPositiveButton("Save") { _, _ ->
            val title = titleInput.text.toString().ifEmpty { "Untitled" }
            // Convert chat messages to ChatHistoryEntry for saving
            val chatHistory = viewModel.chatMessages.value?.map {
                com.padhai.app.data.ChatHistoryEntry(it.role, it.content, it.timestamp)
            } ?: emptyList()
            viewModel.saveNotes(notes, summary, title, "General")
            // Also save to local StudyDataManager for quiz access and tracking
            StudyDataManager.saveNote(requireContext(), title, "General", notes, summary, chatHistory)
            StudyDataManager.addSession(requireContext(), 2)
            Toast.makeText(context, "Notes saved successfully", Toast.LENGTH_SHORT).show()
        }
        builder.setNegativeButton("Cancel", null)
        builder.show()
    }

    private fun styleSummaryText(text: String): CharSequence {
        val builder = SpannableStringBuilder()
        val lines = text.split('\n')

        lines.forEachIndexed { index, rawLine ->
            val line = rawLine.trimEnd()
            if (line.isNotBlank()) {
                val start = builder.length
                builder.append(line)
                val end = builder.length

                val isBullet = line.startsWith("•") || line.matches(Regex("^\\d+\\)\\s+.*"))
                val looksLikeHeading = !isBullet && line.length <= 80 && (
                    line.endsWith(":") ||
                    line.uppercase(Locale.US) == line ||
                    line.matches(Regex("^[A-Z][A-Za-z0-9\\s&/()'-]{2,60}$"))
                )

                if (looksLikeHeading) {
                    builder.setSpan(StyleSpan(android.graphics.Typeface.BOLD), start, end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                    builder.setSpan(RelativeSizeSpan(1.15f), start, end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                } else if (!isBullet && line.contains(":")) {
                    val colonIndex = line.indexOf(':')
                    if (colonIndex in 2..32) {
                        val labelEnd = start + colonIndex + 1
                        builder.setSpan(
                            StyleSpan(android.graphics.Typeface.BOLD),
                            start,
                            labelEnd,
                            Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                        )
                    }
                }
            }
            if (index < lines.lastIndex) builder.append("\n")
        }

        return builder
    }

    private fun generateTitle(summary: String, notes: String): String {
        val source = (summary.ifBlank { notes })
            .lines()
            .map { it.trim().trimStart('•', '-', '*').trim() }
            .firstOrNull { it.isNotBlank() }
            .orEmpty()

        if (source.isBlank()) return "Study Notes"

        return source
            .split(Regex("\\s+"))
            .take(6)
            .joinToString(" ")
            .replace(Regex("[^A-Za-z0-9\\s]"), "")
            .ifBlank { "Study Notes" }
    }

    private fun autoSaveSummaryIfNeeded(notes: String, summary: String) {
        val normalized = "${notes.trim()}|${summary.trim()}"
        if (normalized.isBlank()) return

        val hash = normalized.hashCode().toString()
        val prefs = requireContext().getSharedPreferences(PREFS_AUTO_SAVE, android.content.Context.MODE_PRIVATE)
        val lastHash = prefs.getString(KEY_LAST_AUTO_SAVE_HASH, "")
        if (hash == lastHash) return

        val title = generateTitle(summary, notes)
        val contentToSave = notes.ifBlank { summary }
        
        // Convert chat messages to ChatHistoryEntry for saving
        val chatHistory = viewModel.chatMessages.value?.map {
            com.padhai.app.data.ChatHistoryEntry(it.role, it.content, it.timestamp)
        } ?: emptyList()

        viewModel.saveNotes(contentToSave, summary, title, "General")
        StudyDataManager.saveNote(requireContext(), title, "General", contentToSave, summary, chatHistory)
        prefs.edit().putString(KEY_LAST_AUTO_SAVE_HASH, hash).apply()
    }

    private fun startNewSession() {
        selectedImageUri = null
        selectedPdfUri = null

        binding.etNotes.setText("")
        binding.tvSummary.text = ""
        binding.etChatInput.text?.clear()

        binding.imagePreview.visibility = View.GONE
        binding.imagePreview.setImageDrawable(null)
        binding.btnRemoveImage.visibility = View.GONE

        binding.tvSelectedPdf.visibility = View.GONE
        binding.btnRemovePdf.visibility = View.GONE

        binding.summaryCard.visibility = View.GONE
        binding.chatCard.visibility = View.GONE

        viewModel.clearChat(keepContext = false)
        StudyDataManager.setCurrentNotes(requireContext(), "", "")

        Toast.makeText(context, "New chat started. Upload notes, image, or PDF.", Toast.LENGTH_SHORT).show()
    }

    private fun showLoadSavedNotesDialog() {
        val savedNotes = StudyDataManager.getNotesList(requireContext())
        if (savedNotes.isEmpty()) {
            Toast.makeText(context, "No saved notes found", Toast.LENGTH_SHORT).show()
            return
        }

        val items = savedNotes.map { note ->
            val title = note.title.ifBlank { "Untitled" }
            val date = note.date.take(10)
            "$title  •  $date"
        }.toTypedArray()

        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Load Saved Notes")
            .setItems(items) { _, which ->
                val selected = savedNotes[which]
                binding.etNotes.setText(selected.content)
                binding.tvSummary.text = styleSummaryText(selected.summary)
                binding.summaryCard.visibility = if (selected.summary.isNotBlank()) View.VISIBLE else View.GONE
                binding.chatCard.visibility = if (selected.summary.isNotBlank()) View.VISIBLE else View.GONE

                selectedImageUri = null
                selectedPdfUri = null
                binding.imagePreview.visibility = View.GONE
                binding.btnRemoveImage.visibility = View.GONE
                binding.tvSelectedPdf.visibility = View.GONE
                binding.btnRemovePdf.visibility = View.GONE

                viewModel.clearChat(keepContext = false)
                viewModel.setContextFromLoadedNotes(selected.content, selected.summary)
                
                // Restore chat history
                if (selected.chatHistory.isNotEmpty()) {
                    selected.chatHistory.forEach { historyEntry ->
                        viewModel.addChatMessageFromHistory(
                            com.padhai.app.data.model.ChatMessage(
                                role = historyEntry.role,
                                content = historyEntry.content,
                                timestamp = historyEntry.timestamp
                            )
                        )
                    }
                }
                
                StudyDataManager.setCurrentNotes(requireContext(), selected.content, selected.summary)

                Toast.makeText(context, "Loaded: ${selected.title}", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    override fun onDestroyView() {
        ttsManager?.shutdown()
        super.onDestroyView()
        _binding = null
    }
}

package com.padhai.app.ui.learn

import android.graphics.Bitmap
import android.content.Context
import android.net.Uri
import android.os.Build
import android.util.Log
import android.util.Base64
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.padhai.app.BuildConfig
import com.padhai.app.data.model.ChatMessage
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.ConnectException
import java.net.HttpURLConnection
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import java.net.URL

class LearnViewModel : ViewModel() {
    
    private val _summary = MutableLiveData<String>()
    val summary: LiveData<String> = _summary
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error
    
    private val _extractedText = MutableLiveData<String>()
    val extractedText: LiveData<String> = _extractedText
    
    private val _chatMessages = MutableLiveData<List<ChatMessage>>()
    val chatMessages: LiveData<List<ChatMessage>> = _chatMessages
    
    private val _chatLoading = MutableLiveData<Boolean>()
    val chatLoading: LiveData<Boolean> = _chatLoading
    
    private var context: String = ""
    
    private val auth = FirebaseAuth.getInstance()
    private val firestore = FirebaseFirestore.getInstance()
    private val emulatorBaseUrl = BuildConfig.BACKEND_BASE_URL.trimEnd('/')
    private val phoneBaseUrl = BuildConfig.PHONE_BACKEND_BASE_URL.trim().trimEnd('/')
    private val summarizeApiKey = BuildConfig.SUMMARIZATION_API_KEY
    
    companion object {
        private const val TAG = "LearnViewModel"
    }
    
    init {
        _chatMessages.value = emptyList()
    }
    
    fun summarizeNotes(notes: String, detail: String, language: String = "en") {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            try {
                val responseText = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
                    val activeBaseUrl = resolveBaseUrl()
                    val url = URL("$activeBaseUrl/api/notes/summarize")
                    val conn = (url.openConnection() as HttpURLConnection).apply {
                        requestMethod = "POST"
                        setRequestProperty("Content-Type", "application/json")
                        if (summarizeApiKey.isNotBlank()) {
                            setRequestProperty("x-api-key", summarizeApiKey)
                        }
                        doOutput = true
                        connectTimeout = 15000
                        readTimeout = 60000
                    }

                    val body = JSONObject()
                        .put("text", notes)
                        .put("detail", detail)
                        .put("language", language)
                        .toString()

                    OutputStreamWriter(conn.outputStream).use { it.write(body) }

                    val code = conn.responseCode
                    val stream = if (code in 200..299) conn.inputStream else conn.errorStream
                    val text = stream?.bufferedReader()?.use { it.readText() }.orEmpty()

                    if (code !in 200..299) {
                        throw RuntimeException(parseBackendError(text, code))
                    }

                    text
                }

                val parsed = JSONObject(responseText)
                val apiSummary = parsed.optString("summary", "").trim()
                if (apiSummary.isEmpty()) {
                    throw RuntimeException("Empty summary returned from server")
                }
                val displaySummary = cleanMarkdownForDisplay(apiSummary)
                _summary.value = displaySummary
                context = notes // Store context for chat
                
                // Add confirmation message to chat
                val confirmMsg = ChatMessage(
                    role = "ai",
                    content = "✅ Summary ready! You can ask me any questions about this content.",
                    isConfirmation = true
                )
                addChatMessage(confirmMsg)
                
            } catch (e: Exception) {
                Log.e(TAG, "Summarization failed", e)
                _error.value = "Failed to summarize: ${toReadableError(e)}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun summarizeImageFromUri(appContext: Context, imageUri: Uri, detail: String, language: String = "en") {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            try {
                val responseText = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
                    val imageBase64 = appContext.contentResolver.openInputStream(imageUri)?.use { stream ->
                        val bytes = stream.readBytes()
                        Base64.encodeToString(bytes, Base64.NO_WRAP)
                    } ?: throw RuntimeException("Unable to read selected image")

                    val activeBaseUrl = resolveBaseUrl()
                    val url = URL("$activeBaseUrl/api/notes/summarize")
                    val conn = (url.openConnection() as HttpURLConnection).apply {
                        requestMethod = "POST"
                        setRequestProperty("Content-Type", "application/json")
                        if (summarizeApiKey.isNotBlank()) {
                            setRequestProperty("x-api-key", summarizeApiKey)
                        }
                        doOutput = true
                        connectTimeout = 15000
                        readTimeout = 60000
                    }

                    val body = JSONObject()
                        .put("imageBase64", imageBase64)
                        .put("detail", detail)
                        .put("language", language)
                        .toString()

                    OutputStreamWriter(conn.outputStream).use { it.write(body) }

                    val code = conn.responseCode
                    val stream = if (code in 200..299) conn.inputStream else conn.errorStream
                    val text = stream?.bufferedReader()?.use { it.readText() }.orEmpty()

                    if (code !in 200..299) {
                        throw RuntimeException(parseBackendError(text, code))
                    }

                    text
                }

                val parsed = JSONObject(responseText)
                val apiSummary = parsed.optString("summary", "").trim()
                if (apiSummary.isEmpty()) {
                    throw RuntimeException("Empty summary returned from server")
                }

                val displaySummary = cleanMarkdownForDisplay(apiSummary)
                _summary.value = displaySummary
                this@LearnViewModel.context = displaySummary

                val confirmMsg = ChatMessage(
                    role = "ai",
                    content = "✅ Summary ready! You can ask me questions about this image.",
                    isConfirmation = true
                )
                addChatMessage(confirmMsg)
            } catch (e: Exception) {
                Log.e(TAG, "Image summarization failed", e)
                _error.value = "Failed to summarize image: ${toReadableError(e)}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun summarizePdfFromUri(appContext: Context, pdfUri: Uri, detail: String, language: String = "en") {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            try {
                val responseText = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
                    val pdfBase64 = appContext.contentResolver.openInputStream(pdfUri)?.use { stream ->
                        val bytes = stream.readBytes()
                        Base64.encodeToString(bytes, Base64.NO_WRAP)
                    } ?: throw RuntimeException("Unable to read selected PDF")

                    val activeBaseUrl = resolveBaseUrl()
                    val url = URL("$activeBaseUrl/api/notes/pdf")
                    val conn = (url.openConnection() as HttpURLConnection).apply {
                        requestMethod = "POST"
                        setRequestProperty("Content-Type", "application/json")
                        if (summarizeApiKey.isNotBlank()) {
                            setRequestProperty("x-api-key", summarizeApiKey)
                        }
                        doOutput = true
                        connectTimeout = 15000
                        readTimeout = 60000
                    }

                    val body = JSONObject()
                        .put("pdfBase64", pdfBase64)
                        .put("detail", detail)
                        .put("language", language)
                        .toString()

                    OutputStreamWriter(conn.outputStream).use { it.write(body) }

                    val code = conn.responseCode
                    val stream = if (code in 200..299) conn.inputStream else conn.errorStream
                    val text = stream?.bufferedReader()?.use { it.readText() }.orEmpty()

                    if (code !in 200..299) {
                        throw RuntimeException(parseBackendError(text, code))
                    }

                    text
                }

                val parsed = JSONObject(responseText)
                val apiSummary = parsed.optString("summary", "").trim()
                if (apiSummary.isEmpty()) {
                    throw RuntimeException("Empty summary returned from server")
                }

                val displaySummary = cleanMarkdownForDisplay(apiSummary)
                _summary.value = displaySummary
                this@LearnViewModel.context = displaySummary

                val confirmMsg = ChatMessage(
                    role = "ai",
                    content = "✅ Summary ready! You can ask me questions about this PDF.",
                    isConfirmation = true
                )
                addChatMessage(confirmMsg)
            } catch (e: Exception) {
                Log.e(TAG, "PDF summarization failed", e)
                _error.value = "Failed to summarize PDF: ${toReadableError(e)}"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun sendChatMessage(question: String, language: String = "en") {
        viewModelScope.launch {
            _chatLoading.value = true
            
            // Add user message
            val userMsg = ChatMessage(role = "user", content = question)
            addChatMessage(userMsg)
            
            try {
                val responseText = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
                    val activeBaseUrl = resolveBaseUrl()
                    val url = URL("$activeBaseUrl/api/notes/chat")
                    val conn = (url.openConnection() as HttpURLConnection).apply {
                        requestMethod = "POST"
                        setRequestProperty("Content-Type", "application/json")
                        doOutput = true
                        connectTimeout = 15000
                        readTimeout = 60000
                    }

                    // Build history array from chat messages
                    val history = JSONArray()
                    _chatMessages.value?.takeLast(10)?.forEach { msg ->
                        if (!msg.isConfirmation) {
                            history.put(JSONObject().apply {
                                put("role", msg.role)
                                put("content", msg.content)
                            })
                        }
                    }

                    val body = JSONObject()
                        .put("context", context)
                        .put("question", question)
                        .put("history", history)
                        .put("lang", language)
                        .toString()

                    OutputStreamWriter(conn.outputStream).use { it.write(body) }

                    val code = conn.responseCode
                    val stream = if (code in 200..299) conn.inputStream else conn.errorStream
                    val text = stream?.bufferedReader()?.use { it.readText() }.orEmpty()

                    if (code !in 200..299) {
                        throw RuntimeException(parseBackendError(text, code))
                    }

                    text
                }

                val parsed = JSONObject(responseText)
                val answer = parsed.optString("answer", "").trim()
                if (answer.isNotEmpty()) {
                    val aiMsg = ChatMessage(role = "ai", content = cleanMarkdownForDisplay(answer))
                    addChatMessage(aiMsg)
                } else {
                    throw RuntimeException("Empty answer from server")
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Chat failed", e)
                val errorMsg = ChatMessage(role = "ai", content = "❌ Error: ${toReadableError(e)}")
                addChatMessage(errorMsg)
            } finally {
                _chatLoading.value = false
            }
        }
    }

    private fun resolveBaseUrl(): String {
        return if (isEmulator()) {
            emulatorBaseUrl
        } else {
            phoneBaseUrl.ifBlank { emulatorBaseUrl }
        }
    }

    private fun isEmulator(): Boolean {
        return Build.FINGERPRINT.contains("generic", ignoreCase = true) ||
            Build.MODEL.contains("Emulator", ignoreCase = true) ||
            Build.MODEL.contains("Android SDK built for", ignoreCase = true) ||
            Build.MANUFACTURER.contains("Genymotion", ignoreCase = true)
    }

    private fun toReadableError(e: Exception): String {
        val activeBaseUrl = resolveBaseUrl()
        val message = e.message.orEmpty()
        val lowerMessage = message.lowercase()
        val isConnectionIssue =
            e is ConnectException || e is UnknownHostException || e is SocketTimeoutException

        if (isConnectionIssue && !isEmulator() && activeBaseUrl.contains("10.0.2.2")) {
            return "Cannot reach backend from physical phone. Set PHONE_BACKEND_BASE_URL in gradle.properties to your computer LAN IP (example: http://192.168.1.10:4000), then rebuild and reinstall the app."
        }

        if (lowerMessage.contains("quota") || lowerMessage.contains("429") || lowerMessage.contains("resource_exhausted")) {
            return "AI quota exceeded. Please try again later or switch to a lower-usage model/API key."
        }

        if (e is SocketTimeoutException || lowerMessage.contains("timed out") || lowerMessage.contains("timeout")) {
            return "The AI request timed out. Please retry in a few seconds."
        }

        return e.message ?: "Unknown error"
    }
    
    private fun addChatMessage(message: ChatMessage) {
        val currentMessages = _chatMessages.value.orEmpty().toMutableList()
        currentMessages.add(message)
        _chatMessages.value = currentMessages
    }
    
    fun addChatMessageFromHistory(message: ChatMessage) {
        addChatMessage(message)
    }
    
    fun clearChat(keepContext: Boolean = true) {
        _chatMessages.value = emptyList()
        if (!keepContext) {
            context = ""
        }
    }

    fun setContextFromLoadedNotes(notes: String, summary: String) {
        context = when {
            summary.isNotBlank() -> summary
            notes.isNotBlank() -> notes
            else -> ""
        }
    }

    private fun parseBackendError(responseText: String, code: Int): String {
        return try {
            val obj = JSONObject(responseText)
            val error = obj.optString("error").ifBlank { "request failed" }
            val details = obj.optString("details")
            if (details.isNotBlank()) {
                "$error ($code): $details"
            } else {
                "$error ($code)"
            }
        } catch (_: Exception) {
            if (responseText.isNotBlank()) {
                "HTTP $code: $responseText"
            } else {
                "HTTP $code: summarization failed"
            }
        }
    }

    private fun cleanMarkdownForDisplay(text: String): String {
        return text
            .replace("\r\n", "\n")
            .replace("```", "")
            .replace(Regex("(?m)^#{1,6}\\s*"), "")
            .replace(Regex("\\*\\*|__|~~"), "")
            .replace("`", "")
            .replace(Regex("(?m)^\\s*[-*+]\\s+"), "• ")
            .replace(Regex("(?m)^\\s*(\\d+)\\.\\s+"), "$1) ")
            .replace(Regex("(?m)^>\\s?"), "")
            .replace(Regex("\n{3,}"), "\n\n")
            .trim()
    }
    
    fun extractTextFromImage(imageBitmap: Bitmap) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            try {
                // Initialize TextRecognizer
                val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
                val image = InputImage.fromBitmap(imageBitmap, 0)
                
                val result = recognizer.process(image).await()
                val extractedText = result.text
                
                Log.d(TAG, "Extracted text: $extractedText")
                
                if (extractedText.isNotEmpty()) {
                    _extractedText.value = extractedText
                } else {
                    _error.value = "No text detected in image. Please try another image."
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "OCR failed: ${e.message}", e)
                _error.value = "Failed to extract text: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun saveNotes(notes: String, summary: String, title: String, subject: String) {
        viewModelScope.launch {
            try {
                val userId = auth.currentUser?.uid ?: return@launch
                
                val noteData = hashMapOf(
                    "userId" to userId,
                    "title" to title,
                    "subject" to subject,
                    "notes" to notes,
                    "summary" to summary,
                    "createdAt" to System.currentTimeMillis()
                )
                
                firestore.collection("notes")
                    .add(noteData)
                    .await()
                    
            } catch (e: Exception) {
                _error.value = "Failed to save notes: ${e.message}"
            }
        }
    }
}

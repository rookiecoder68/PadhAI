package com.padhai.app.utils

import android.content.Context
import android.speech.tts.TextToSpeech
import android.util.Log
import java.util.*

class TTSManager(context: Context, private val onInitialized: (Boolean) -> Unit) {
    
    private var tts: TextToSpeech? = null
    private var isInitialized = false
    
    companion object {
        private const val TAG = "TTSManager"
    }
    
    init {
        tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                val resultUs = tts?.setLanguage(Locale.US) ?: TextToSpeech.LANG_NOT_SUPPORTED
                val languageOk = resultUs != TextToSpeech.LANG_MISSING_DATA && resultUs != TextToSpeech.LANG_NOT_SUPPORTED

                if (!languageOk) {
                    val resultDefault = tts?.setLanguage(Locale.getDefault()) ?: TextToSpeech.LANG_NOT_SUPPORTED
                    isInitialized = resultDefault != TextToSpeech.LANG_MISSING_DATA && resultDefault != TextToSpeech.LANG_NOT_SUPPORTED
                } else {
                    isInitialized = true
                }

                tts?.setSpeechRate(1.0f)
                tts?.setPitch(1.0f)
                Log.d(TAG, "TTS initialized successfully")
                onInitialized(isInitialized)
            } else {
                Log.e(TAG, "TTS initialization failed")
                onInitialized(false)
            }
        }
    }
    
    fun speak(text: String): Boolean {
        if (isInitialized) {
            // Clean markdown for TTS
            val cleanedText = text
                .replace(Regex("#{1,6}\\s+"), "")
                .replace(Regex("\\*\\*(.+?)\\*\\*"), "$1")
                .replace(Regex("\\*(.+?)\\*"), "$1")
                .replace(Regex("`(.+?)`"), "$1")
                .replace(Regex("^[*\\-●•]\\s*", RegexOption.MULTILINE), "")
                .replace(Regex("^\\d+\\.\\s+", RegexOption.MULTILINE), "")
                .replace(Regex("---+"), "")
                .trim()

            if (cleanedText.isBlank()) return false

            val speakResult = tts?.speak(cleanedText, TextToSpeech.QUEUE_FLUSH, null, "summaryTTS")
            return speakResult == TextToSpeech.SUCCESS
        } else {
            Log.w(TAG, "TTS not initialized")
            return false
        }
    }
    
    fun setLanguage(languageCode: String): Boolean {
        val locale = when (languageCode) {
            "hi" -> Locale("hi", "IN")
            "en" -> Locale.US
            else -> Locale.US
        }
        
        val result = tts?.setLanguage(locale)
        if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
            Log.w(TAG, "Language $languageCode not supported, falling back to English")
            tts?.setLanguage(Locale.US)
            return false
        } else {
            Log.d(TAG, "Language set to $languageCode")
            return true
        }
    }
    
    fun stop() {
        tts?.stop()
    }
    
    fun pause() {
        stop() // TTS doesn't support pause/resume natively
    }
    
    fun isSpeaking(): Boolean {
        return tts?.isSpeaking == true
    }
    
    fun shutdown() {
        tts?.stop()
        tts?.shutdown()
    }
}

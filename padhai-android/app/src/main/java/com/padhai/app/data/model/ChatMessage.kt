package com.padhai.app.data.model

data class ChatMessage(
    val id: String = java.util.UUID.randomUUID().toString(),
    val role: String, // "user" or "ai"
    val content: String,
    val timestamp: Long = System.currentTimeMillis(),
    val isConfirmation: Boolean = false
)

package com.padhai.app.data

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

data class StudySession(
    val date: String = "",
    val durationMinutes: Int = 0
)

data class PomodoroSession(
    val date: String = "",
    val durationMinutes: Int = 0
)

data class QuizHistoryEntry(
    val date: String = "",
    val score: Int = 0,
    val total: Int = 0,
    val pct: Int = 0,
    val subject: String = "General"
)

data class SavedNote(
    val id: Long = 0L,
    val title: String = "",
    val subject: String = "",
    val content: String = "",
    val summary: String = "",
    val date: String = "",
    val chatHistory: List<ChatHistoryEntry> = emptyList()
)

data class ChatHistoryEntry(
    val role: String,
    val content: String,
    val timestamp: Long = System.currentTimeMillis()
)

object StudyDataManager {
    private const val PREFS_NAME = "padhai_data"
    private const val KEY_SESSIONS = "study_sessions"
    private const val KEY_POMODORO = "pomodoro_sessions"
    private const val KEY_QUIZ_HISTORY = "quiz_history"
    private const val KEY_NOTES_LIBRARY = "notes_library"
    private const val KEY_FLASHCARD_VIEWS = "flashcard_views"
    private const val KEY_CURRENT_NOTES = "current_notes"
    private const val KEY_CURRENT_SUMMARY = "current_summary"
    
    private val gson = Gson()
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
    
    private fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    
    fun nowISO(): String = dateFormat.format(Date())
    
    fun isToday(isoDate: String): Boolean {
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        return isoDate.startsWith(today)
    }
    
    fun isThisWeek(isoDate: String): Boolean {
        return try {
            val date = dateFormat.parse(isoDate) ?: return false
            val diff = Date().time - date.time
            diff < 7L * 24 * 60 * 60 * 1000
        } catch (e: Exception) { false }
    }
    
    // Study Sessions
    fun getSessions(context: Context): List<StudySession> {
        val json = prefs(context).getString(KEY_SESSIONS, "[]") ?: "[]"
        return try {
            val type = object : TypeToken<List<StudySession>>() {}.type
            gson.fromJson(json, type) ?: emptyList()
        } catch (e: Exception) { emptyList() }
    }
    
    fun addSession(context: Context, durationMinutes: Int) {
        val sessions = getSessions(context).toMutableList()
        sessions.add(StudySession(nowISO(), durationMinutes))
        // Keep last 200
        val trimmed = if (sessions.size > 200) sessions.takeLast(200) else sessions
        prefs(context).edit().putString(KEY_SESSIONS, gson.toJson(trimmed)).apply()
    }
    
    // Pomodoro Sessions
    fun getPomodoroSessions(context: Context): List<PomodoroSession> {
        val json = prefs(context).getString(KEY_POMODORO, "[]") ?: "[]"
        return try {
            val type = object : TypeToken<List<PomodoroSession>>() {}.type
            gson.fromJson(json, type) ?: emptyList()
        } catch (e: Exception) { emptyList() }
    }
    
    fun addPomodoroSession(context: Context, durationMinutes: Int) {
        val sessions = getPomodoroSessions(context).toMutableList()
        sessions.add(PomodoroSession(nowISO(), durationMinutes))
        val trimmed = if (sessions.size > 200) sessions.takeLast(200) else sessions
        prefs(context).edit().putString(KEY_POMODORO, gson.toJson(trimmed)).apply()
    }
    
    // Quiz History
    fun getQuizHistory(context: Context): List<QuizHistoryEntry> {
        val json = prefs(context).getString(KEY_QUIZ_HISTORY, "[]") ?: "[]"
        return try {
            val type = object : TypeToken<List<QuizHistoryEntry>>() {}.type
            gson.fromJson(json, type) ?: emptyList()
        } catch (e: Exception) { emptyList() }
    }
    
    fun addQuizResult(context: Context, score: Int, total: Int, subject: String = "General") {
        val history = getQuizHistory(context).toMutableList()
        val pct = if (total > 0) (score * 100 / total) else 0
        history.add(0, QuizHistoryEntry(nowISO(), score, total, pct, subject))
        val trimmed = if (history.size > 20) history.take(20) else history
        prefs(context).edit().putString(KEY_QUIZ_HISTORY, gson.toJson(trimmed)).apply()
    }
    
    // Flashcard views
    fun incrementFlashcardViews(context: Context) {
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        val existing = prefs(context).getInt("fc_views_$today", 0)
        prefs(context).edit().putInt("fc_views_$today", existing + 1).apply()
    }
    
    fun getFlashcardViewsToday(context: Context): Int {
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        return prefs(context).getInt("fc_views_$today", 0)
    }
    
    // Notes Library
    fun getNotesList(context: Context): List<SavedNote> {
        val json = prefs(context).getString(KEY_NOTES_LIBRARY, "[]") ?: "[]"
        return try {
            val type = object : TypeToken<List<SavedNote>>() {}.type
            gson.fromJson(json, type) ?: emptyList()
        } catch (e: Exception) { emptyList() }
    }
    
    fun saveNote(context: Context, title: String, subject: String, content: String, summary: String, chatHistory: List<ChatHistoryEntry> = emptyList()): SavedNote {
        val notes = getNotesList(context).toMutableList()
        val note = SavedNote(System.currentTimeMillis(), title, subject, content, summary, nowISO(), chatHistory)
        notes.add(0, note)
        prefs(context).edit().putString(KEY_NOTES_LIBRARY, gson.toJson(notes)).apply()
        return note
    }
    
    fun deleteNote(context: Context, id: Long) {
        val notes = getNotesList(context).filter { it.id != id }
        prefs(context).edit().putString(KEY_NOTES_LIBRARY, gson.toJson(notes)).apply()
    }
    
    // Current session notes (pass between fragments)
    fun setCurrentNotes(context: Context, notes: String, summary: String) {
        prefs(context).edit()
            .putString(KEY_CURRENT_NOTES, notes)
            .putString(KEY_CURRENT_SUMMARY, summary)
            .apply()
    }
    
    fun getCurrentNotes(context: Context): String =
        prefs(context).getString(KEY_CURRENT_NOTES, "") ?: ""
    
    fun getCurrentSummary(context: Context): String =
        prefs(context).getString(KEY_CURRENT_SUMMARY, "") ?: ""
    
    // Streak calculation
    fun calcStreak(sessions: List<StudySession>): Int {
        if (sessions.isEmpty()) return 0
        val days = sessions
            .map { SimpleDateFormat("yyyy-MM-dd", Locale.US).format(dateFormat.parse(it.date) ?: Date()) }
            .toSet()
            .sortedDescending()
        
        var streak = 0
        val cal = Calendar.getInstance()
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        
        for (day in days) {
            val calDay = Calendar.getInstance()
            try {
                val d = SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(day) ?: break
                calDay.time = d
                calDay.set(Calendar.HOUR_OF_DAY, 0)
                calDay.set(Calendar.MINUTE, 0)
                calDay.set(Calendar.SECOND, 0)
                calDay.set(Calendar.MILLISECOND, 0)
                val diff = ((cal.timeInMillis - calDay.timeInMillis) / 86400000).toInt()
                if (diff == 0 || diff == 1) {
                    streak++
                    cal.timeInMillis = calDay.timeInMillis
                } else break
            } catch (e: Exception) { break }
        }
        return streak
    }
    
    // XP / Level calculation
    data class RewardsData(
        val totalPoints: Int,
        val level: Int,
        val progressPct: Int,
        val streak: Int,
        val badges: List<String>
    )
    
    fun getRewards(context: Context): RewardsData {
        val sessions = getSessions(context)
        val quizHistory = getQuizHistory(context)
        val pomodoroSessions = getPomodoroSessions(context)
        
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        val todayMinutes = sessions.filter { it.date.startsWith(today) }.sumOf { it.durationMinutes }
        val quizToday = quizHistory.any { isToday(it.date) }
        val pomodoroToday = pomodoroSessions.any { isToday(it.date) }
        val fcViewsToday = getFlashcardViewsToday(context)
        
        // Quest points
        var questPoints = 0
        if (todayMinutes >= 10) questPoints += 10
        if (quizToday) questPoints += 20
        if (fcViewsToday >= 5) questPoints += 15
        if (pomodoroToday) questPoints += 25
        
        // Quiz bonus
        val quizBonus = quizHistory.sumOf { (it.pct / 10) }
        val totalPoints = questPoints + quizBonus
        
        val level = (totalPoints / 50) + 1
        val progressPct = ((totalPoints % 50) * 100 / 50).coerceIn(0, 100)
        val streak = calcStreak(sessions)
        
        val badges = mutableListOf<String>()
        if (streak >= 3) badges.add("${streak} Day Streak")
        if (totalPoints >= 50) badges.add("Star Learner")
        if (totalPoints >= 100) badges.add("Champion")
        if (quizHistory.any { it.pct >= 90 }) badges.add("Perfect Score")
        if (quizHistory.size >= 5) badges.add("Quiz Master")
        
        return RewardsData(totalPoints, level, progressPct, streak, badges)
    }
}

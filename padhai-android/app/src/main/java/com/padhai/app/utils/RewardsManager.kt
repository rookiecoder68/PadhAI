package com.padhai.app.utils

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.padhai.app.data.model.Badge
import com.padhai.app.data.model.DailyQuest
import com.padhai.app.data.model.RewardData
import com.padhai.app.data.model.StudySession
import java.text.SimpleDateFormat
import java.util.*

object RewardsManager {
    private const val PREFS_NAME = "padhai_rewards"
    private const val KEY_TOTAL_POINTS = "total_points"
    private const val KEY_STREAK = "streak"
    private const val KEY_LAST_SESSION_DATE = "last_session_date"
    private const val KEY_SESSIONS = "study_sessions"
    private const val KEY_POMODOROS = "pomodoro_sessions"
    private const val KEY_QUIZ_HISTORY = "quiz_history"
    
    private val gson = Gson()
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    
    fun getRewardData(context: Context): RewardData {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val totalPoints = prefs.getInt(KEY_TOTAL_POINTS, 0)
        val streak = calculateStreak(context)
        val level = (totalPoints / 50) + 1
        val badges = calculateBadges(context, totalPoints, streak)
        val quests = checkDailyQuests(context)
        
        return RewardData(
            totalPoints = totalPoints,
            level = level,
            streak = streak,
            badges = badges,
            dailyQuests = quests
        )
    }
    
    fun addPoints(context: Context, points: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val current = prefs.getInt(KEY_TOTAL_POINTS, 0)
        prefs.edit().putInt(KEY_TOTAL_POINTS, current + points).apply()
    }
    
    fun recordStudySession(context: Context, durationMinutes: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val sessions = getStudySessions(context).toMutableList()
        sessions.add(StudySession(
            date = dateFormat.format(Date()),
            durationMinutes = durationMinutes
        ))
        
        val json = gson.toJson(sessions)
        prefs.edit().putString(KEY_SESSIONS, json).apply()
        
        // Update streak
        updateStreak(context)
    }
    
    fun recordPomodoroSession(context: Context, durationMinutes: Int = 25) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val sessions = getPomodoroSessions(context).toMutableList()
        sessions.add(StudySession(
            date = dateFormat.format(Date()),
            durationMinutes = durationMinutes
        ))
        
        val json = gson.toJson(sessions)
        prefs.edit().putString(KEY_POMODOROS, json).apply()
        addPoints(context, 25) // 25 points for completing a pomodoro
    }
    
    private fun getStudySessions(context: Context): List<StudySession> {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val json = prefs.getString(KEY_SESSIONS, null) ?: return emptyList()
        val type = object : TypeToken<List<StudySession>>() {}.type
        return gson.fromJson(json, type)
    }
    
    private fun getPomodoroSessions(context: Context): List<StudySession> {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val json = prefs.getString(KEY_POMODOROS, null) ?: return emptyList()
        val type = object : TypeToken<List<StudySession>>() {}.type
        return gson.fromJson(json, type)
    }
    
    private fun calculateStreak(context: Context): Int {
        val sessions = getStudySessions(context)
        if (sessions.isEmpty()) return 0
        
        val dates = sessions.map { it.date }.distinct().sorted().reversed()
        var streak = 0
        val today = dateFormat.format(Date())
        val calendar = Calendar.getInstance()
        
        for (date in dates) {
            calendar.time = dateFormat.parse(date) ?: continue
            val daysDiff = daysBetween(calendar.time, dateFormat.parse(today) ?: Date())
            
            if (daysDiff == streak || (daysDiff == 1 && streak == 0)) {
                streak++
            } else {
                break
            }
        }
        
        return streak
    }
    
    private fun updateStreak(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val today = dateFormat.format(Date())
        val lastSessionDate = prefs.getString(KEY_LAST_SESSION_DATE, null)
        
        if (lastSessionDate != today) {
            val streak = calculateStreak(context)
            prefs.edit()
                .putInt(KEY_STREAK, streak)
                .putString(KEY_LAST_SESSION_DATE, today)
                .apply()
        }
    }
    
    private fun calculateBadges(context: Context, totalPoints: Int, streak: Int): List<Badge> {
        val badges = mutableListOf<Badge>()
        
        if (streak >= 3) badges.add(Badge("🔥", "$streak Day Streak"))
        if (totalPoints >= 50) badges.add(Badge("⭐", "Star Learner"))
        if (totalPoints >= 100) badges.add(Badge("🏆", "Champion"))
        if (totalPoints >= 500) badges.add(Badge("👑", "Master"))
        
        // Check quiz performance
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val quizHistory = prefs.getString(KEY_QUIZ_HISTORY, null)
        if (quizHistory != null && quizHistory.contains("90")) {
            badges.add(Badge("🎯", "Perfect Score"))
        }
        
        return badges
    }
    
    private fun checkDailyQuests(context: Context): List<DailyQuest> {
        val today = dateFormat.format(Date())
        val sessions = getStudySessions(context)
        val pomodoroSessions = getPomodoroSessions(context)
        
        val todayMinutes = sessions
            .filter { it.date == today }
            .sumOf { it.durationMinutes }
        
        val pomodoroToday = pomodoroSessions.any { it.date == today }
        
        return listOf(
            DailyQuest(1, "Study for 10+ minutes today", 10, todayMinutes >= 10),
            DailyQuest(2, "Complete a quiz today", 20, false), // Would need quiz data
            DailyQuest(3, "Review 5+ flashcards today", 15, false), // Would need flashcard data
            DailyQuest(4, "Complete a Pomodoro session", 25, pomodoroToday)
        )
    }
    
    private fun daysBetween(date1: Date, date2: Date): Int {
        val diff = date2.time - date1.time
        return (diff / (1000 * 60 * 60 * 24)).toInt()
    }
}

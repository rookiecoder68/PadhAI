package com.padhai.app.utils

import android.content.Context
import android.content.SharedPreferences

object PomodoroSettings {
    private const val PREFS_NAME = "pomodoro_settings"
    private const val KEY_WORK_MINUTES = "work_minutes"
    private const val KEY_SHORT_BREAK_MINUTES = "short_break_minutes"
    private const val KEY_LONG_BREAK_MINUTES = "long_break_minutes"
    
    const val DEFAULT_WORK_MINUTES = 25
    const val DEFAULT_SHORT_BREAK = 5
    const val DEFAULT_LONG_BREAK = 15
    
    fun getWorkMinutes(context: Context): Int {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getInt(KEY_WORK_MINUTES, DEFAULT_WORK_MINUTES)
    }
    
    fun getShortBreakMinutes(context: Context): Int {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getInt(KEY_SHORT_BREAK_MINUTES, DEFAULT_SHORT_BREAK)
    }
    
    fun getLongBreakMinutes(context: Context): Int {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getInt(KEY_LONG_BREAK_MINUTES, DEFAULT_LONG_BREAK)
    }
    
    fun setWorkMinutes(context: Context, minutes: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putInt(KEY_WORK_MINUTES, minutes).apply()
    }
    
    fun setShortBreakMinutes(context: Context, minutes: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putInt(KEY_SHORT_BREAK_MINUTES, minutes).apply()
    }
    
    fun setLongBreakMinutes(context: Context, minutes: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putInt(KEY_LONG_BREAK_MINUTES, minutes).apply()
    }
}

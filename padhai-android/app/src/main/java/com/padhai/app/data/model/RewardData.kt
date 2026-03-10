package com.padhai.app.data.model

data class RewardData(
    val totalPoints: Int = 0,
    val level: Int = 1,
    val streak: Int = 0,
    val badges: List<Badge> = emptyList(),
    val dailyQuests: List<DailyQuest> = emptyList()
)

data class Badge(
    val emoji: String,
    val label: String
)

data class DailyQuest(
    val id: Int,
    val task: String,
    val points: Int,
    val completed: Boolean = false
)

data class StudySession(
    val date: String,
    val durationMinutes: Int
)

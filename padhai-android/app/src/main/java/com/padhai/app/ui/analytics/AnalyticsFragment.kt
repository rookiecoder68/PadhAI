package com.padhai.app.ui.analytics

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import com.padhai.app.R
import com.padhai.app.data.StudyDataManager
import com.padhai.app.databinding.FragmentAnalyticsBinding
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class AnalyticsFragment : Fragment() {

    private var _binding: FragmentAnalyticsBinding? = null
    private val binding get() = _binding!!
    private lateinit var viewModel: AnalyticsViewModel

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentAnalyticsBinding.inflate(inflater, container, false)
        viewModel = ViewModelProvider(this)[AnalyticsViewModel::class.java]
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        observeViewModel()
        loadAnalytics()
    }

    override fun onResume() {
        super.onResume()
        loadAnalytics()
    }
    
    private fun observeViewModel() {
        viewModel.rewardData.observe(viewLifecycleOwner) { rewards ->
            // Update level and streak
            binding.tvLevel.text = "${rewards.level}"
            binding.tvStreakValue.text = "${rewards.streak}"
            binding.tvTotalPoints.text = "${rewards.totalPoints} XP"
            
            // Update XP progress
            val progressPct = (rewards.totalPoints % 50) * 100 / 50
            binding.xpProgressBar.progress = progressPct
            binding.tvXpProgress.text = "$progressPct% to next level"
            
            // Update badges
            if (rewards.badges.isEmpty()) {
                binding.tvBadgesEmpty.visibility = View.VISIBLE
                binding.tvBadgesList.visibility = View.GONE
            } else {
                binding.tvBadgesEmpty.visibility = View.GONE
                binding.tvBadgesList.visibility = View.VISIBLE
                binding.tvBadgesList.text = rewards.badges.joinToString("  ") { "${it.emoji} ${it.label}" }
            }
            
            // Update daily quests with completion status
            val quests = rewards.dailyQuests
            if (quests.isNotEmpty()) {
                updateQuestUI(binding.tvQuest1, quests.getOrNull(0))
                updateQuestUI(binding.tvQuest2, quests.getOrNull(1))
                updateQuestUI(binding.tvQuest3, quests.getOrNull(2))
                updateQuestUI(binding.tvQuest4, quests.getOrNull(3))
            }
        }
    }
    
    private fun updateQuestUI(textView: TextView, quest: com.padhai.app.data.model.DailyQuest?) {
        quest?.let {
            val prefix = if (it.completed) "✅ " else "○ "
            textView.text = "$prefix${it.task}"
            textView.setTextColor(
                ContextCompat.getColor(
                    requireContext(),
                    if (it.completed) R.color.success_green else R.color.text_primary
                )
            )
        }
    }

    private fun loadAnalytics() {
        val ctx = requireContext()
        
        // Load rewards data
        viewModel.loadRewards(ctx)
        
        // Load other analytics data
        val sessions = StudyDataManager.getSessions(ctx)
        val quizHistory = StudyDataManager.getQuizHistory(ctx)
        val pomodoroSessions = StudyDataManager.getPomodoroSessions(ctx)

        val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        val thisWeekMinutes = sessions.filter { StudyDataManager.isThisWeek(it.date) }.sumOf { it.durationMinutes }
        val todayMinutes = sessions.filter { it.date.startsWith(today) }.sumOf { it.durationMinutes }
        val avgQuizScore = if (quizHistory.isNotEmpty()) quizHistory.sumOf { it.pct } / quizHistory.size else 0
        val bestScore = quizHistory.maxOfOrNull { it.pct } ?: 0
        val pomodoroCount = pomodoroSessions.size
        val flashcardsToday = StudyDataManager.getFlashcardViewsToday(ctx)

        // Study time
        binding.tvTotalTime.text = formatMinutes(thisWeekMinutes)
        binding.tvTodayTime.text = formatMinutes(todayMinutes)

        // Quiz stats
        binding.tvQuizCount.text = "${quizHistory.size}"
        binding.tvAvgScore.text = "$avgQuizScore%"
        binding.tvBestScore.text = "$bestScore%"

        // Pomodoro
        binding.tvPomodoroCount.text = "$pomodoroCount"
        binding.tvFlashcardViews.text = "$flashcardsToday"

        // Quiz history list
        if (quizHistory.isEmpty()) {
            binding.tvQuizHistoryEmpty.visibility = View.VISIBLE
            binding.quizHistoryContainer.visibility = View.GONE
        } else {
            binding.tvQuizHistoryEmpty.visibility = View.GONE
            binding.quizHistoryContainer.visibility = View.VISIBLE
            val sb = StringBuilder()
            quizHistory.take(5).forEachIndexed { i, e ->
                val star = when {
                    e.pct >= 90 -> "⭐⭐⭐"
                    e.pct >= 70 -> "⭐⭐"
                    else -> "⭐"
                }
                sb.appendLine("${e.date.take(10)}   ${e.score}/${e.total} (${e.pct}%)  $star")
            }
            binding.tvQuizHistoryItems.text = sb.toString().trimEnd()
        }
    }

    private fun formatMinutes(minutes: Int): String {
        return when {
            minutes >= 60 -> "${minutes / 60}h ${minutes % 60}m"
            else -> "${minutes}m"
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

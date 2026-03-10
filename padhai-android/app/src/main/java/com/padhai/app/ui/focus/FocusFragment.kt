package com.padhai.app.ui.focus

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.CountDownTimer
import android.provider.Settings
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.animation.AnimationUtils
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.padhai.app.R
import com.padhai.app.data.StudyDataManager
import com.padhai.app.databinding.FragmentFocusBinding
import kotlin.math.max
import java.util.Locale

class FocusFragment : Fragment() {

    companion object {
        private const val TAG = "FocusFragment"
        private const val PREFS_TIMER_STATE = "focus_timer_state"
        private const val KEY_IS_RUNNING = "is_running"
        private const val KEY_IS_PAUSED = "is_paused"
        private const val KEY_IS_BREAK = "is_break"
        private const val KEY_REMAINING_MS = "remaining_ms"
        private const val KEY_END_AT_MS = "end_at_ms"
        private const val KEY_SESSIONS_COMPLETED = "sessions_completed"
        private const val KEY_PENDING_FINISH = "pending_finish"
        private const val KEY_PENDING_WAS_BREAK = "pending_was_break"
        private const val ACTION_POMODORO_COMPLETE = "com.padhai.app.POMODORO_COMPLETE"
        private const val EXTRA_IS_BREAK = "extra_is_break"
    }

    private var _binding: FragmentFocusBinding? = null
    private val binding get() = _binding!!

    private var timer: CountDownTimer? = null
    private var isRunning = false
    private var isPaused = false
    private var isBreak = false
    private var focusModeActive = false

    private var workMinutes = 25
    private var shortBreakMinutes = 5
    private var remainingMs = 25 * 60 * 1000L
    private var sessionsCompleted = 0
    private var timerEndAtMs: Long = 0L

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentFocusBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        loadSettings()
        restoreTimerState()
        setupUI()
        updateTimerDisplay(remainingMs)
        updateSessionIndicators()
        updateSessionTypeUI()
        handlePendingCompletionIfNeeded()

        when {
            isRunning && remainingMs > 0L -> startOrResumeTimer()
            isPaused -> {
                binding.btnStartPomodoro.text = "Resume"
                binding.btnStartPomodoro.icon = ContextCompat.getDrawable(requireContext(), R.drawable.ic_play)
            }
            else -> {
                binding.btnStartPomodoro.text = "Start"
                binding.btnStartPomodoro.icon = ContextCompat.getDrawable(requireContext(), R.drawable.ic_play)
            }
        }
    }
    
    private fun loadSettings() {
        workMinutes = com.padhai.app.utils.PomodoroSettings.getWorkMinutes(requireContext())
        shortBreakMinutes = com.padhai.app.utils.PomodoroSettings.getShortBreakMinutes(requireContext())
        if (!isRunning && !isPaused) {
            remainingMs = workMinutes * 60 * 1000L
        }
    }

    private fun timerPrefs() = context?.getSharedPreferences(PREFS_TIMER_STATE, Context.MODE_PRIVATE)

    private fun saveTimerState() {
        timerPrefs()?.edit()
            ?.putBoolean(KEY_IS_RUNNING, isRunning)
            ?.putBoolean(KEY_IS_PAUSED, isPaused)
            ?.putBoolean(KEY_IS_BREAK, isBreak)
            ?.putLong(KEY_REMAINING_MS, remainingMs)
            ?.putLong(KEY_END_AT_MS, timerEndAtMs)
            ?.putInt(KEY_SESSIONS_COMPLETED, sessionsCompleted)
            ?.apply()
    }

    private fun restoreTimerState() {
        val prefs = timerPrefs() ?: return
        isRunning = prefs.getBoolean(KEY_IS_RUNNING, false)
        isPaused = prefs.getBoolean(KEY_IS_PAUSED, false)
        isBreak = prefs.getBoolean(KEY_IS_BREAK, false)
        sessionsCompleted = prefs.getInt(KEY_SESSIONS_COMPLETED, 0)

        val fallbackRemaining = workMinutes * 60 * 1000L
        remainingMs = prefs.getLong(KEY_REMAINING_MS, fallbackRemaining)
        timerEndAtMs = prefs.getLong(KEY_END_AT_MS, 0L)

        if (isRunning && timerEndAtMs > 0L) {
            val wasBreak = isBreak
            remainingMs = max(0L, timerEndAtMs - System.currentTimeMillis())
            if (remainingMs == 0L) {
                prefs.edit()
                    .putBoolean(KEY_PENDING_FINISH, true)
                    .putBoolean(KEY_PENDING_WAS_BREAK, wasBreak)
                    .apply()
                isRunning = false
                isPaused = false
                isBreak = wasBreak
                remainingMs = if (wasBreak) shortBreakMinutes * 60 * 1000L else fallbackRemaining
                timerEndAtMs = 0L
            }
        }
    }

    private fun handlePendingCompletionIfNeeded() {
        val prefs = timerPrefs() ?: return
        if (!prefs.getBoolean(KEY_PENDING_FINISH, false)) return

        val wasBreak = prefs.getBoolean(KEY_PENDING_WAS_BREAK, false)
        prefs.edit()
            .putBoolean(KEY_PENDING_FINISH, false)
            .putBoolean(KEY_PENDING_WAS_BREAK, false)
            .apply()

        isBreak = wasBreak
        onTimerFinish()
    }

    private fun setupUI() {
        binding.btnStartPomodoro.setOnClickListener {
            if (!isRunning || isPaused) startOrResumeTimer()
            else pauseTimer()
        }

        binding.btnStopPomodoro.setOnClickListener {
            stopTimer()
        }

        binding.btnStartFocus.setOnClickListener {
            toggleFocusMode()
        }
        
        binding.btnPomodoroSettings.setOnClickListener {
            showSettingsDialog()
        }
    }

    private fun alarmManager(context: Context): AlarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    private fun completionPendingIntent(context: Context, isBreakSession: Boolean): PendingIntent {
        val intent = Intent(context, PomodoroAlarmReceiver::class.java).apply {
            action = ACTION_POMODORO_COMPLETE
            putExtra(EXTRA_IS_BREAK, isBreakSession)
        }
        return PendingIntent.getBroadcast(
            context,
            4001,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private fun scheduleCompletionAlarm(delayMs: Long, isBreakSession: Boolean) {
        val currentContext = context ?: return
        if (delayMs <= 0L) return
        val triggerAt = System.currentTimeMillis() + delayMs
        val pendingIntent = completionPendingIntent(currentContext, isBreakSession)
        try {
            val manager = alarmManager(currentContext)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (manager.canScheduleExactAlarms()) {
                    manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
                } else {
                    manager.setAlarmClock(
                        AlarmManager.AlarmClockInfo(triggerAt, pendingIntent),
                        pendingIntent
                    )
                }
            } else {
                manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
            }
        } catch (se: SecurityException) {
            Log.w(TAG, "Exact alarm denied, using inexact alarm", se)
            alarmManager(currentContext).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed scheduling completion alarm", e)
        }
    }

    private fun cancelCompletionAlarm() {
        val currentContext = context ?: return
        val manager = alarmManager(currentContext)
        manager.cancel(completionPendingIntent(currentContext, isBreak))
        manager.cancel(completionPendingIntent(currentContext, !isBreak))
    }
    
    private fun showSettingsDialog() {
        val dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_pomodoro_settings, null)
        val etWork = dialogView.findViewById<android.widget.EditText>(R.id.etWorkMinutes)
        val etBreak = dialogView.findViewById<android.widget.EditText>(R.id.etBreakMinutes)
        
        etWork.setText(workMinutes.toString())
        etBreak.setText(shortBreakMinutes.toString())
        
        MaterialAlertDialogBuilder(requireContext())
            .setTitle("⚙️ Pomodoro Settings")
            .setView(dialogView)
            .setPositiveButton("Save") { _, _ ->
                val newWork = etWork.text.toString().toIntOrNull() ?: workMinutes
                val newBreak = etBreak.text.toString().toIntOrNull() ?: shortBreakMinutes
                
                workMinutes = newWork.coerceIn(1, 120)
                shortBreakMinutes = newBreak.coerceIn(1, 60)
                
                com.padhai.app.utils.PomodoroSettings.setWorkMinutes(requireContext(), workMinutes)
                com.padhai.app.utils.PomodoroSettings.setShortBreakMinutes(requireContext(), shortBreakMinutes)
                
                if (!isRunning && !isPaused) {
                    remainingMs = workMinutes * 60 * 1000L
                    updateTimerDisplay(remainingMs)
                }

                saveTimerState()
                
                Toast.makeText(context, "Settings saved!", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun startOrResumeTimer() {
        isPaused = false
        isRunning = true
        timerEndAtMs = System.currentTimeMillis() + remainingMs
        scheduleCompletionAlarm(remainingMs, isBreak)
        binding.btnStartPomodoro.text = "Pause"
        binding.btnStartPomodoro.icon = ContextCompat.getDrawable(requireContext(), R.drawable.ic_pause)
        animateTimerStart()
        saveTimerState()

        timer = object : CountDownTimer(remainingMs, 1000L) {
            override fun onTick(ms: Long) {
                remainingMs = ms
                if (_binding != null) {
                    updateTimerDisplay(ms)
                }
                saveTimerState()
            }
            override fun onFinish() {
                onTimerFinish()
            }
        }.start()
    }

    private fun pauseTimer() {
        timer?.cancel()
        isPaused = true
        isRunning = false
        timerEndAtMs = 0L
        cancelCompletionAlarm()
        binding.btnStartPomodoro.text = "Resume"
        binding.btnStartPomodoro.icon = ContextCompat.getDrawable(requireContext(), R.drawable.ic_play)
        saveTimerState()
    }

    private fun stopTimer() {
        timer?.cancel()
        isRunning = false
        isPaused = false
        isBreak = false
        timerEndAtMs = 0L
        cancelCompletionAlarm()
        remainingMs = workMinutes * 60 * 1000L
        updateTimerDisplay(remainingMs)
        binding.btnStartPomodoro.text = "Start"
        binding.btnStartPomodoro.icon = ContextCompat.getDrawable(requireContext(), R.drawable.ic_play)
        binding.tvSessionType.text = "Work Session"
        binding.tvSessionType.setTextColor(ContextCompat.getColor(requireContext(), R.color.primary))
        saveTimerState()
    }

    private fun onTimerFinish() {
        cancelCompletionAlarm()
        isRunning = false
        isPaused = false
        timerEndAtMs = 0L

        val currentContext = context
        val hasActiveView = _binding != null && currentContext != null

        if (!isBreak) {
            // Work session done
            sessionsCompleted++
            currentContext?.let {
                StudyDataManager.addPomodoroSession(it, workMinutes)
                StudyDataManager.addSession(it, workMinutes)
            }
            showNotification("Work session complete!", "Great focus! Time for a break.")

            if (hasActiveView) {
                updateSessionIndicators()
                currentContext?.let {
                    MaterialAlertDialogBuilder(it)
                        .setTitle("Session Complete!")
                        .setMessage("You completed a 25-minute work session.\nSession #$sessionsCompleted done. Time for a ${shortBreakMinutes}-min break!")
                        .setPositiveButton("Start Break") { _, _ -> startBreak() }
                        .setNegativeButton("Skip Break") { _, _ -> resetToWork() }
                        .show()
                }
            } else {
                timerPrefs()?.edit()
                    ?.putBoolean(KEY_PENDING_FINISH, true)
                    ?.putBoolean(KEY_PENDING_WAS_BREAK, false)
                    ?.apply()
            }
        } else {
            // Break done
            showNotification("Break over!", "Ready to focus again?")

            if (hasActiveView) {
                currentContext?.let {
                    MaterialAlertDialogBuilder(it)
                        .setTitle("Break Over!")
                        .setMessage("Break time is up. Ready to start the next work session?")
                        .setPositiveButton("Start Work") { _, _ -> resetToWork(); startOrResumeTimer() }
                        .setNegativeButton("Not yet") { _, _ -> resetToWork() }
                        .show()
                }
            } else {
                timerPrefs()?.edit()
                    ?.putBoolean(KEY_PENDING_FINISH, true)
                    ?.putBoolean(KEY_PENDING_WAS_BREAK, true)
                    ?.apply()
                isBreak = false
                remainingMs = workMinutes * 60 * 1000L
            }
        }

        if (hasActiveView) {
            binding.btnStartPomodoro.text = "Start"
            binding.btnStartPomodoro.icon = currentContext?.let { ContextCompat.getDrawable(it, R.drawable.ic_play) }
        }
        saveTimerState()
    }

    private fun startBreak() {
        isBreak = true
        remainingMs = shortBreakMinutes * 60 * 1000L
        if (_binding != null) {
            updateSessionTypeUI()
        }
        saveTimerState()
        startOrResumeTimer()
    }

    private fun resetToWork() {
        isBreak = false
        remainingMs = workMinutes * 60 * 1000L
        if (_binding != null) {
            updateTimerDisplay(remainingMs)
            updateSessionTypeUI()
        }
        saveTimerState()
    }

    private fun updateSessionTypeUI() {
        val currentContext = context ?: return
        val currentBinding = _binding ?: return
        if (isBreak) {
            currentBinding.tvSessionType.text = "Break Time"
            currentBinding.tvSessionType.setTextColor(ContextCompat.getColor(currentContext, R.color.success_green))
        } else {
            currentBinding.tvSessionType.text = "Work Session"
            currentBinding.tvSessionType.setTextColor(ContextCompat.getColor(currentContext, R.color.primary))
        }
    }

    private fun updateTimerDisplay(ms: Long) {
        val currentBinding = _binding ?: return
        val minutes = (ms / 1000 / 60).toInt()
        val seconds = (ms / 1000 % 60).toInt()
        currentBinding.tvTimer.text = String.format(Locale.US, "%02d:%02d", minutes, seconds)

        // Update circular progress (0-100 based on remaining)
        val totalMs = if (isBreak) shortBreakMinutes * 60 * 1000L else workMinutes * 60 * 1000L
        val progress = ((totalMs - ms) * 100 / totalMs).toInt()
        currentBinding.circularProgress.progress = progress
    }

    private fun updateSessionIndicators() {
        val currentBinding = _binding ?: return
        currentBinding.tvSessionsCompleted.text = "Sessions completed: $sessionsCompleted"
        val totalFromPrefs = context?.let { StudyDataManager.getPomodoroSessions(it).size } ?: 0
        currentBinding.tvTotalPomodoros.text = "All-time sessions: $totalFromPrefs"
    }

    private fun toggleFocusMode() {
        focusModeActive = !focusModeActive

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val notificationManager = requireContext().getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (focusModeActive && !notificationManager.isNotificationPolicyAccessGranted) {
                Toast.makeText(context, "Grant Do Not Disturb access to block notifications", Toast.LENGTH_LONG).show()
                startActivity(Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS))
                focusModeActive = false
            } else {
                try {
                    notificationManager.setInterruptionFilter(
                        if (focusModeActive) NotificationManager.INTERRUPTION_FILTER_NONE
                        else NotificationManager.INTERRUPTION_FILTER_ALL
                    )
                } catch (e: SecurityException) {
                    Log.e(TAG, "Unable to change interruption filter", e)
                    Toast.makeText(context, "Couldn't toggle notification blocking", Toast.LENGTH_SHORT).show()
                    focusModeActive = false
                }
            }
        }

        if (focusModeActive) {
            binding.btnStartFocus.text = "Deactivate Focus Mode"
            binding.focusModeCard.setCardBackgroundColor(ContextCompat.getColor(requireContext(), R.color.focus_active_bg))
            binding.tvFocusStatus.text = "Focus Mode Active — Stay off distracting apps!"
            binding.tvFocusStatus.setTextColor(ContextCompat.getColor(requireContext(), R.color.primary))
        } else {
            binding.btnStartFocus.text = "Activate Focus Mode"
            binding.focusModeCard.setCardBackgroundColor(ContextCompat.getColor(requireContext(), R.color.card_background))
            binding.tvFocusStatus.text = "Block distractions and stay focused on studying."
            binding.tvFocusStatus.setTextColor(ContextCompat.getColor(requireContext(), R.color.text_secondary))
        }
    }

    private fun animateTimerStart() {
        val pulse = AnimationUtils.loadAnimation(requireContext(), android.R.anim.fade_in)
        binding.tvTimer.startAnimation(pulse)
    }

    private fun showNotification(title: String, text: String) {
        val ctx = context ?: return
        val channelId = "padhai_pomodoro"
        val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val ch = NotificationChannel(channelId, "Pomodoro Timer", NotificationManager.IMPORTANCE_DEFAULT)
            nm.createNotificationChannel(ch)
        }
        val n = NotificationCompat.Builder(ctx, channelId)
            .setSmallIcon(R.drawable.ic_timer)
            .setContentTitle(title)
            .setContentText(text)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()
        try {
            nm.notify(System.currentTimeMillis().toInt(), n)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to post timer notification", e)
        }
    }

    override fun onDestroyView() {
        if (isRunning && timerEndAtMs > 0L) {
            remainingMs = max(0L, timerEndAtMs - System.currentTimeMillis())
            if (remainingMs == 0L) {
                isRunning = false
                isPaused = false
                isBreak = false
                timerEndAtMs = 0L
                remainingMs = workMinutes * 60 * 1000L
            }
        }
        saveTimerState()
        if (!isRunning) {
            timer?.cancel()
        }
        super.onDestroyView()
        _binding = null
    }

    override fun onDestroy() {
        if (!isRunning) {
            timer?.cancel()
        }
        super.onDestroy()
    }
}

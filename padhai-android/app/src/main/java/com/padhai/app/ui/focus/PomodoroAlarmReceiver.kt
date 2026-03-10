package com.padhai.app.ui.focus

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.padhai.app.R
import com.padhai.app.ui.MainActivity

class PomodoroAlarmReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "PomodoroAlarmReceiver"
    }

    override fun onReceive(context: Context, intent: Intent?) {
        try {
            val isBreak = intent?.getBooleanExtra("extra_is_break", false) == true
            val title = if (isBreak) "Break Over" else "Pomodoro Complete"
            val text = if (isBreak) "Break ended. Time to resume work." else "Work session finished. Time for a break."

            val channelId = "padhai_pomodoro"
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    channelId,
                    "Pomodoro Timer",
                    NotificationManager.IMPORTANCE_HIGH
                )
                nm.createNotificationChannel(channel)
            }

            val openIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val openPending = PendingIntent.getActivity(
                context,
                5001,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val notification = NotificationCompat.Builder(context, channelId)
                .setSmallIcon(R.drawable.ic_timer)
                .setContentTitle(title)
                .setContentText(text)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setContentIntent(openPending)
                .build()

            nm.notify(System.currentTimeMillis().toInt(), notification)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to show Pomodoro alarm notification", e)
        }
    }
}

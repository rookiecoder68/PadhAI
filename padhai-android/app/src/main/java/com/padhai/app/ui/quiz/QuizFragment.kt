package com.padhai.app.ui.quiz

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.os.Build
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.padhai.app.BuildConfig
import com.padhai.app.R
import com.padhai.app.data.StudyDataManager
import com.padhai.app.databinding.FragmentQuizBinding
import kotlinx.coroutines.*
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

data class QuizQuestion(
    val question: String,
    val options: List<String>,
    val answer: String
)

data class Flashcard(
    val front: String,
    val back: String
)

class QuizFragment : Fragment() {

    companion object {
        private const val PREFS_QUIZ_STATE = "quiz_state"
        private const val KEY_SAVED_QUIZ = "saved_quiz"
        private const val KEY_SAVED_INDEX = "saved_index"
        private const val KEY_SAVED_SCORE = "saved_score"
    }

    private var _binding: FragmentQuizBinding? = null
    private val binding get() = _binding!!

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private val emulatorBaseUrl = BuildConfig.BACKEND_BASE_URL.trimEnd('/')
    private val phoneBaseUrl = BuildConfig.PHONE_BACKEND_BASE_URL.trim().trimEnd('/')

    // Quiz state
    private var quizQuestions = listOf<QuizQuestion>()
    private var currentQuestionIndex = 0
    private var score = 0

    // Flashcard state
    private var flashcards = listOf<Flashcard>()
    private var currentCardIndex = 0
    private var isCardFlipped = false

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentQuizBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupUI()
        showHomeScreen()
    }

    private fun setupUI() {
        binding.btnStartQuiz.setOnClickListener {
            val notes = getNotes()
            if (notes.isBlank()) {
                Toast.makeText(context, "Please go to the Learn tab and add some notes first!", Toast.LENGTH_LONG).show()
            } else {
                clearSavedQuizState()
                fetchQuiz(notes)
            }
        }

        binding.btnResumeQuiz.setOnClickListener {
            if (restoreSavedQuizState()) {
                showQuestion(currentQuestionIndex)
            } else {
                Toast.makeText(context, "No saved quiz found", Toast.LENGTH_SHORT).show()
            }
        }

        binding.btnFlashcards.setOnClickListener {
            val notes = getNotes()
            if (notes.isBlank()) {
                Toast.makeText(context, "Please go to the Learn tab and add some notes first!", Toast.LENGTH_LONG).show()
            } else {
                fetchFlashcards(notes)
            }
        }

        // Quiz answer buttons
        binding.btnOptionA.setOnClickListener { checkAnswer(binding.btnOptionA.text.toString()) }
        binding.btnOptionB.setOnClickListener { checkAnswer(binding.btnOptionB.text.toString()) }
        binding.btnOptionC.setOnClickListener { checkAnswer(binding.btnOptionC.text.toString()) }
        binding.btnOptionD.setOnClickListener { checkAnswer(binding.btnOptionD.text.toString()) }

        binding.btnNextQuestion.setOnClickListener { nextQuestion() }
        binding.btnSaveExitQuiz.setOnClickListener {
            saveQuizState()
            showHomeScreen()
            Toast.makeText(context, "Quiz progress saved", Toast.LENGTH_SHORT).show()
        }

        // Flashcard controls
        binding.flashcard.setOnClickListener { flipCard() }
        binding.btnPrevCard.setOnClickListener { prevCard() }
        binding.btnNextCard.setOnClickListener { nextCard() }
        binding.btnDoneFlashcards.setOnClickListener { showHomeScreen() }

        binding.btnRetryQuiz.setOnClickListener {
            currentQuestionIndex = 0
            score = 0
            showQuestion(0)
        }
        binding.btnQuitQuiz.setOnClickListener { showHomeScreen() }
    }

    private fun getNotes(): String {
        val notes = StudyDataManager.getCurrentNotes(requireContext())
        if (notes.isNotBlank()) return notes
        return StudyDataManager.getCurrentSummary(requireContext())
    }

    private fun resolveBaseUrl(): String {
        return if (isEmulator()) emulatorBaseUrl else phoneBaseUrl.ifBlank { emulatorBaseUrl }
    }

    private fun isEmulator(): Boolean {
        return Build.FINGERPRINT.contains("generic", ignoreCase = true) ||
            Build.MODEL.contains("Emulator", ignoreCase = true) ||
            Build.MODEL.contains("Android SDK built for", ignoreCase = true) ||
            Build.MANUFACTURER.contains("Genymotion", ignoreCase = true)
    }

    private fun fetchQuiz(notes: String) {
        showLoading("Generating quiz questions...")
        scope.launch {
            try {
                val json = withContext(Dispatchers.IO) {
                    val url = URL("${resolveBaseUrl()}/api/notes/quiz")
                    val conn = url.openConnection() as HttpURLConnection
                    conn.requestMethod = "POST"
                    conn.setRequestProperty("Content-Type", "application/json")
                    conn.doOutput = true
                    conn.connectTimeout = 15000
                    conn.readTimeout = 30000
                    val body = JSONObject().put("notes", notes).toString()
                    OutputStreamWriter(conn.outputStream).use { it.write(body) }
                    val code = conn.responseCode
                    val stream = if (code in 200..299) conn.inputStream else conn.errorStream
                    val text = stream?.bufferedReader()?.readText().orEmpty()
                    if (code !in 200..299) throw RuntimeException("Quiz API failed ($code): $text")
                    text
                }
                parseAndShowQuiz(json)
            } catch (e: Exception) {
                hideLoading()
                showHomeScreen()
                Toast.makeText(context, "Failed to generate quiz: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun parseAndShowQuiz(json: String) {
        try {
            val cleaned = json.trim().removePrefix("```json").removePrefix("```").removeSuffix("```").trim()
            val obj = JSONObject(cleaned)
            val arr = obj.optJSONArray("quiz") ?: obj.optJSONArray("questions") ?: JSONArray()
            quizQuestions = (0 until arr.length()).map { i ->
                val q = arr.getJSONObject(i)
                val opts = q.getJSONArray("options")
                val options = (0 until opts.length()).map { opts.getString(it) }
                val answerText = when {
                    q.has("answer") -> q.getString("answer")
                    q.has("correct") -> options.getOrNull(q.optInt("correct", -1)).orEmpty()
                    else -> ""
                }
                QuizQuestion(
                    q.getString("question"),
                    options,
                    answerText
                )
            }.filter { it.answer.isNotBlank() && it.options.isNotEmpty() }
            if (quizQuestions.isEmpty()) {
                hideLoading()
                showHomeScreen()
                Toast.makeText(context, "AI returned invalid quiz format", Toast.LENGTH_LONG).show()
                return
            }
            currentQuestionIndex = 0
            score = 0
            hideLoading()
            showQuestion(0)
        } catch (e: Exception) {
            hideLoading()
            showHomeScreen()
            Toast.makeText(context, "Failed to parse quiz: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    private fun showDemoQuiz() {
        quizQuestions = listOf(
            QuizQuestion("What is the primary purpose of studying active recall?",
                listOf("A) Memorizing by reading", "B) Testing yourself to strengthen memory", "C) Taking detailed notes", "D) Highlighting text"),
                "B) Testing yourself to strengthen memory"),
            QuizQuestion("Which technique involves spacing out review sessions over time?",
                listOf("A) Pomodoro technique", "B) Mind mapping", "C) Spaced repetition", "D) Topic clustering"),
                "C) Spaced repetition")
        )
        currentQuestionIndex = 0
        score = 0
        showQuestion(0)
    }

    private fun showQuestion(index: Int) {
        if (index >= quizQuestions.size) { showResults(); return }
        val q = quizQuestions[index]
        binding.quizScreen.visibility = View.VISIBLE
        binding.homeScreen.visibility = View.GONE
        binding.flashcardScreen.visibility = View.GONE
        binding.resultsScreen.visibility = View.GONE

        binding.tvQuestionNumber.text = "Question ${index + 1} of ${quizQuestions.size}"
        binding.tvQuestionText.text = q.question
        binding.quizProgressBar.max = quizQuestions.size
        binding.quizProgressBar.progress = index + 1

        val opts = q.options
        val buttons = listOf(binding.btnOptionA, binding.btnOptionB, binding.btnOptionC, binding.btnOptionD)
        buttons.forEachIndexed { i, btn ->
            if (i < opts.size) {
                btn.text = opts[i]
                btn.visibility = View.VISIBLE
                btn.isEnabled = true
                btn.setBackgroundColor(ContextCompat.getColor(requireContext(), R.color.card_background))
                btn.setTextColor(ContextCompat.getColor(requireContext(), R.color.text_primary))
            } else {
                btn.visibility = View.GONE
            }
        }
        binding.btnNextQuestion.visibility = View.GONE
        binding.tvAnswerFeedback.visibility = View.GONE
    }

    private fun checkAnswer(selected: String) {
        val q = quizQuestions[currentQuestionIndex]
        val isCorrect = selected.trim().equals(q.answer.trim(), ignoreCase = true) ||
            q.answer.contains(selected.trim(), ignoreCase = true) ||
            selected.trim().contains(q.answer.trim(), ignoreCase = true)

        val buttons = listOf(binding.btnOptionA, binding.btnOptionB, binding.btnOptionC, binding.btnOptionD)
        buttons.forEach { it.isEnabled = false }

        if (isCorrect) {
            score++
            binding.tvAnswerFeedback.text = "Correct!"
            binding.tvAnswerFeedback.setTextColor(ContextCompat.getColor(requireContext(), R.color.success_green))
        } else {
            binding.tvAnswerFeedback.text = "Incorrect. Correct answer: ${q.answer}"
            binding.tvAnswerFeedback.setTextColor(ContextCompat.getColor(requireContext(), R.color.error_red))
        }
        binding.tvAnswerFeedback.visibility = View.VISIBLE
        binding.btnNextQuestion.visibility = View.VISIBLE
    }

    private fun nextQuestion() {
        currentQuestionIndex++
        if (currentQuestionIndex < quizQuestions.size) {
            showQuestion(currentQuestionIndex)
        } else {
            showResults()
        }
    }

    private fun showResults() {
        binding.quizScreen.visibility = View.GONE
        binding.resultsScreen.visibility = View.VISIBLE
        clearSavedQuizState()
        val pct = if (quizQuestions.isNotEmpty()) score * 100 / quizQuestions.size else 0
        binding.tvResultScore.text = "$score / ${quizQuestions.size}"
        binding.tvResultPercent.text = "$pct%"
        val message = when {
            pct >= 90 -> "Excellent! You're a master!"
            pct >= 70 -> "Great job! Keep it up!"
            pct >= 50 -> "Good effort! Review the material."
            else -> "Keep studying! You'll improve."
        }
        binding.tvResultMessage.text = message
        StudyDataManager.addQuizResult(requireContext(), score, quizQuestions.size)
        StudyDataManager.addSession(requireContext(), 5)
    }

    // FLASHCARDS
    private fun fetchFlashcards(notes: String) {
        showLoading("Generating flashcards...")
        scope.launch {
            try {
                val json = withContext(Dispatchers.IO) {
                    val url = URL("${resolveBaseUrl()}/api/notes/flashcards")
                    val conn = url.openConnection() as HttpURLConnection
                    conn.requestMethod = "POST"
                    conn.setRequestProperty("Content-Type", "application/json")
                    conn.doOutput = true
                    conn.connectTimeout = 15000
                    conn.readTimeout = 30000
                    val body = JSONObject().put("notes", notes).toString()
                    OutputStreamWriter(conn.outputStream).use { it.write(body) }
                    val code = conn.responseCode
                    val stream = if (code in 200..299) conn.inputStream else conn.errorStream
                    val text = stream?.bufferedReader()?.readText().orEmpty()
                    if (code !in 200..299) throw RuntimeException("Flashcards API failed ($code): $text")
                    text
                }
                parseAndShowFlashcards(json)
            } catch (e: Exception) {
                hideLoading()
                showHomeScreen()
                Toast.makeText(context, "Failed to generate flashcards: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun parseAndShowFlashcards(json: String) {
        try {
            val cleaned = json.trim().removePrefix("```json").removePrefix("```").removeSuffix("```").trim()
            val obj = JSONObject(cleaned)
            val arr = obj.getJSONArray("cards")
            flashcards = (0 until arr.length()).map { i ->
                val c = arr.getJSONObject(i)
                Flashcard(c.getString("front"), c.getString("back"))
            }
            if (flashcards.isEmpty()) {
                hideLoading()
                showHomeScreen()
                Toast.makeText(context, "AI returned no flashcards", Toast.LENGTH_LONG).show()
                return
            }
            currentCardIndex = 0
            hideLoading()
            showFlashcardScreen()
        } catch (e: Exception) {
            hideLoading()
            showHomeScreen()
            Toast.makeText(context, "Failed to parse flashcards: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    private fun showDemoFlashcards() {
        flashcards = listOf(
            Flashcard("What is Active Recall?", "A study technique where you test yourself on material rather than passively re-reading it."),
            Flashcard("What is Spaced Repetition?", "A learning method that increases intervals between review sessions to improve long-term retention."),
            Flashcard("What is the Pomodoro Technique?", "A time management method using 25-minute focused work sessions followed by short 5-minute breaks.")
        )
        currentCardIndex = 0
        showFlashcardScreen()
    }

    private fun showFlashcardScreen() {
        binding.homeScreen.visibility = View.GONE
        binding.quizScreen.visibility = View.GONE
        binding.resultsScreen.visibility = View.GONE
        binding.flashcardScreen.visibility = View.VISIBLE
        isCardFlipped = false
        updateFlashcard()
    }

    private fun updateFlashcard() {
        if (flashcards.isEmpty()) return
        val card = flashcards[currentCardIndex]
        isCardFlipped = false
        binding.tvCardFace.text = card.front
        binding.tvCardHint.text = "Tap card to reveal answer"
        binding.tvCardCounter.text = "${currentCardIndex + 1} / ${flashcards.size}"
        StudyDataManager.incrementFlashcardViews(requireContext())
    }

    private fun flipCard() {
        val card = flashcards.getOrNull(currentCardIndex) ?: return
        val flipOut = ObjectAnimator.ofFloat(binding.flashcard, "rotationY", 0f, 90f).apply { duration = 150 }
        val flipIn = ObjectAnimator.ofFloat(binding.flashcard, "rotationY", -90f, 0f).apply { duration = 150 }
        flipOut.addListener(object : android.animation.AnimatorListenerAdapter() {
            override fun onAnimationEnd(animation: android.animation.Animator) {
                isCardFlipped = !isCardFlipped
                if (isCardFlipped) {
                    binding.tvCardFace.text = card.back
                    binding.tvCardHint.text = "Tap to see question"
                    binding.flashcard.setCardBackgroundColor(ContextCompat.getColor(requireContext(), R.color.primary))
                    binding.tvCardFace.setTextColor(ContextCompat.getColor(requireContext(), android.R.color.white))
                } else {
                    binding.tvCardFace.text = card.front
                    binding.tvCardHint.text = "Tap card to reveal answer"
                    binding.flashcard.setCardBackgroundColor(ContextCompat.getColor(requireContext(), R.color.card_background))
                    binding.tvCardFace.setTextColor(ContextCompat.getColor(requireContext(), R.color.text_primary))
                }
                AnimatorSet().apply { play(flipIn); start() }
            }
        })
        AnimatorSet().apply { play(flipOut); start() }
    }

    private fun prevCard() {
        if (currentCardIndex > 0) { currentCardIndex--; updateFlashcard() }
    }

    private fun nextCard() {
        if (currentCardIndex < flashcards.size - 1) { currentCardIndex++; updateFlashcard() }
        else Toast.makeText(context, "Last card! All done.", Toast.LENGTH_SHORT).show()
    }

    private fun showHomeScreen() {
        binding.homeScreen.visibility = View.VISIBLE
        binding.quizScreen.visibility = View.GONE
        binding.flashcardScreen.visibility = View.GONE
        binding.resultsScreen.visibility = View.GONE
        binding.loadingScreen.visibility = View.GONE
        binding.btnResumeQuiz.visibility = if (hasSavedQuizState()) View.VISIBLE else View.GONE
        loadHistory()
    }

    private fun quizPrefs() = requireContext().getSharedPreferences(PREFS_QUIZ_STATE, android.content.Context.MODE_PRIVATE)

    private fun hasSavedQuizState(): Boolean = quizPrefs().contains(KEY_SAVED_QUIZ)

    private fun saveQuizState() {
        if (quizQuestions.isEmpty()) return
        val quizArray = JSONArray()
        quizQuestions.forEach { q ->
            val obj = JSONObject()
                .put("question", q.question)
                .put("answer", q.answer)
                .put("options", JSONArray(q.options))
            quizArray.put(obj)
        }

        quizPrefs().edit()
            .putString(KEY_SAVED_QUIZ, quizArray.toString())
            .putInt(KEY_SAVED_INDEX, currentQuestionIndex)
            .putInt(KEY_SAVED_SCORE, score)
            .apply()
    }

    private fun restoreSavedQuizState(): Boolean {
        val quizJson = quizPrefs().getString(KEY_SAVED_QUIZ, null) ?: return false
        return try {
            val arr = JSONArray(quizJson)
            val restored = (0 until arr.length()).map { i ->
                val q = arr.getJSONObject(i)
                val opts = q.getJSONArray("options")
                QuizQuestion(
                    question = q.getString("question"),
                    options = (0 until opts.length()).map { idx -> opts.getString(idx) },
                    answer = q.getString("answer")
                )
            }

            if (restored.isEmpty()) return false
            quizQuestions = restored
            currentQuestionIndex = quizPrefs().getInt(KEY_SAVED_INDEX, 0).coerceIn(0, restored.lastIndex)
            score = quizPrefs().getInt(KEY_SAVED_SCORE, 0).coerceIn(0, restored.size)
            true
        } catch (_: Exception) {
            false
        }
    }

    private fun clearSavedQuizState() {
        quizPrefs().edit()
            .remove(KEY_SAVED_QUIZ)
            .remove(KEY_SAVED_INDEX)
            .remove(KEY_SAVED_SCORE)
            .apply()
    }

    private fun loadHistory() {
        val history = StudyDataManager.getQuizHistory(requireContext())
        if (history.isEmpty()) {
            binding.tvHistoryEmpty.visibility = View.VISIBLE
            binding.tvHistoryItems.visibility = View.GONE
        } else {
            binding.tvHistoryEmpty.visibility = View.GONE
            binding.tvHistoryItems.visibility = View.VISIBLE
            val sb = StringBuilder()
            history.take(5).forEach { e ->
                sb.appendLine("${e.date.take(10)} — ${e.score}/${e.total} (${e.pct}%)")
            }
            binding.tvHistoryItems.text = sb.toString().trimEnd()
        }
    }

    private fun showLoading(message: String) {
        binding.loadingScreen.visibility = View.VISIBLE
        binding.tvLoadingMessage.text = message
        binding.homeScreen.visibility = View.GONE
        binding.quizScreen.visibility = View.GONE
        binding.flashcardScreen.visibility = View.GONE
        binding.resultsScreen.visibility = View.GONE
    }

    private fun hideLoading() {
        binding.loadingScreen.visibility = View.GONE
    }

    override fun onDestroyView() {
        scope.cancel()
        super.onDestroyView()
        _binding = null
    }
}

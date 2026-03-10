package com.padhai.app.ui.learn

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.graphics.Typeface
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.RelativeSizeSpan
import android.text.style.StyleSpan
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.padhai.app.R
import com.padhai.app.data.model.ChatMessage

class ChatAdapter : ListAdapter<ChatMessage, ChatAdapter.ChatViewHolder>(ChatDiffCallback()) {
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ChatViewHolder {
        val layoutId = when (viewType) {
            VIEW_TYPE_USER -> R.layout.item_chat_user
            VIEW_TYPE_AI -> R.layout.item_chat_ai
            else -> R.layout.item_chat_ai
        }
        val view = LayoutInflater.from(parent.context).inflate(layoutId, parent, false)
        return ChatViewHolder(view)
    }
    
    override fun onBindViewHolder(holder: ChatViewHolder, position: Int) {
        holder.bind(getItem(position))
    }
    
    override fun getItemViewType(position: Int): Int {
        return when (getItem(position).role) {
            "user" -> VIEW_TYPE_USER
            else -> VIEW_TYPE_AI
        }
    }
    
    class ChatViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvMessage: TextView = itemView.findViewById(R.id.tvMessage)
        
        fun bind(message: ChatMessage) {
            tvMessage.text = if (message.role == "ai") renderMarkdownLike(message.content) else message.content
        }

        private fun renderMarkdownLike(text: String): CharSequence {
            val normalized = text
                .replace("\r\n", "\n")
                .replace("```", "")
                .replace(Regex("(?m)^\\s*[-*+]\\s+"), "  • ")
                .replace(Regex("(?m)^\\s*(\\d+)\\.\\s+"), "  $1. ")
                .replace(Regex("(?m)^>\\s?"), "❝ ")
                .replace(Regex("\n{3,}"), "\n\n")
                .replace("\n", "\n")
                .trim()

            val builder = SpannableStringBuilder(normalized)

            // Headings (#, ## ...)
            Regex("(?m)^(#{1,6})\\s*(.+)$").findAll(normalized).toList().asReversed().forEach { match ->
                val level = match.groupValues[1].length
                val fullStart = match.range.first
                val fullEnd = match.range.last + 1
                val titleStart = fullStart + level + 1
                if (titleStart <= fullEnd) {
                    builder.replace(fullStart, titleStart, "")
                    val newEnd = fullEnd - (titleStart - fullStart)
                    builder.setSpan(StyleSpan(Typeface.BOLD), fullStart, newEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                    val size = when (level) {
                        1 -> 1.18f
                        2 -> 1.12f
                        else -> 1.06f
                    }
                    builder.setSpan(RelativeSizeSpan(size), fullStart, newEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                }
            }

            // Bold text **...**
            Regex("\\*\\*(.+?)\\*\\*").findAll(builder.toString()).toList().asReversed().forEach { match ->
                val inner = match.groupValues[1]
                val start = match.range.first
                val end = match.range.last + 1
                builder.replace(start, end, inner)
                builder.setSpan(StyleSpan(Typeface.BOLD), start, start + inner.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            }

            // inline code `...`
            Regex("`(.+?)`").findAll(builder.toString()).toList().asReversed().forEach { match ->
                val inner = match.groupValues[1]
                val start = match.range.first
                val end = match.range.last + 1
                builder.replace(start, end, inner)
            }

            return builder
        }
    }
    
    private class ChatDiffCallback : DiffUtil.ItemCallback<ChatMessage>() {
        override fun areItemsTheSame(oldItem: ChatMessage, newItem: ChatMessage): Boolean {
            return oldItem.id == newItem.id
        }
        
        override fun areContentsTheSame(oldItem: ChatMessage, newItem: ChatMessage): Boolean {
            return oldItem == newItem
        }
    }
    
    companion object {
        private const val VIEW_TYPE_USER = 1
        private const val VIEW_TYPE_AI = 2
    }
}

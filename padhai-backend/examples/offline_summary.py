"""Example Python script that runs a free/open-source summarization model locally.

Requires:
    pip install transformers torch

This avoids Azure entirely; you just need enough disk/CPU to download the model.
"""
from transformers import pipeline
import sys

MODEL = "sshleifer/distilbart-cnn-12-6"  # small summarization model

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python offline_summary.py 'your text here'")
        sys.exit(1)
    text = sys.argv[1]
    summarizer = pipeline("summarization", model=MODEL)
    summary = summarizer(text, max_length=150, min_length=40, do_sample=False)
    print("=== summary ===")
    print(summary[0]['summary_text'])

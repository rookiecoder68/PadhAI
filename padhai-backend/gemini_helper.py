#!/usr/bin/env python3
"""
Gemini AI helper called by the Node.js backend via child_process.
Reads a JSON payload from stdin, calls Gemini, prints JSON result to stdout.

Operations:
  summarize_text  – summarise plain text notes
  summarize_image – analyse a base64-encoded image (handwritten notes, etc.)
  summarize_pdf   – analyse a base64-encoded PDF document
"""
import sys
import json
import base64

def main():
    try:
        input_data = json.loads(sys.stdin.read())
        api_key   = input_data['api_key']
        operation = input_data['operation']
        detail    = input_data.get('detail', 'brief')
        detail_desc = "detailed and comprehensive" if detail == "detailed" else "concise"

        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        model  = "gemini-2.0-flash"

        if operation == 'summarize_text':
            prompt = (
                f"You are an expert AI tutor. Summarise the following notes in a {detail_desc} way.\n"
                "- Use clear bullet points for key concepts and definitions.\n"
                "- Highlight the most important takeaways.\n"
                "- Do NOT copy-paste sentences verbatim; rephrase and condense.\n\n"
                f"Notes:\n{input_data['text']}"
            )
            response = client.models.generate_content(model=model, contents=prompt)

        elif operation == 'summarize_image':
            image_bytes = base64.b64decode(input_data['image_base64'])
            mime_type   = input_data.get('mime_type', 'image/jpeg')
            prompt = (
                f"You are an expert AI tutor. Analyse this image which may contain handwritten or typed notes.\n"
                f"Produce a {detail_desc} summary:\n"
                "- Transcribe all visible text accurately.\n"
                "- Organise the content into clear bullet points.\n"
                "- Highlight key concepts, definitions, and important takeaways."
            )
            response = client.models.generate_content(
                model=model,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    prompt
                ]
            )

        elif operation == 'summarize_pdf':
            pdf_bytes = base64.b64decode(input_data['pdf_base64'])
            prompt = (
                f"You are an expert AI tutor. Analyse this PDF document and produce a {detail_desc} summary.\n"
                "- Use clear bullet points for key concepts and definitions.\n"
                "- Highlight the most important takeaways.\n"
                "- If the content contains equations or diagrams, describe them in plain text.\n"
                "- Do NOT copy-paste paragraphs verbatim; summarise and condense."
            )
            response = client.models.generate_content(
                model=model,
                contents=[
                    types.Part.from_bytes(data=pdf_bytes, mime_type='application/pdf'),
                    prompt
                ]
            )

        else:
            print(json.dumps({"error": f"Unknown operation: {operation}"}))
            sys.exit(1)

        print(json.dumps({"result": response.text}))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()

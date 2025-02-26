from flask import Flask, request, jsonify, send_file
import whisper
from groq import Groq
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
)
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from datetime import datetime
import json
import os

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
REPORT_FOLDER = "reports"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(REPORT_FOLDER, exist_ok=True)

API_KEY = "your_groq_api_key"  # Replace with your actual API key


def analyze_psychiatric_speech(mp3_file_path):
    model = whisper.load_model("small")
    transcription = model.transcribe(mp3_file_path)
    transcribed_text = transcription["text"]

    client = Groq(api_key=API_KEY)
    prompt = f"""
    Analyze the following text from a psychiatric patient speaking in the first person.
    1. Identify the *emotions* expressed.
    2. Explain *possible reasons* behind these emotions.
    3. Provide *suggestions* for emotional support.

    Text: "{transcribed_text}"

    Output format (JSON):
    {{
      "Emotions": ["List of emotions"],
      "Reasons": "Explanation of possible reasons",
      "Suggestions": ["List of practical advice"]
    }}
    """

    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a mental health analysis assistant."},
            {"role": "user", "content": prompt},
        ],
        model="llama-3.3-70b-versatile",
    )

    api_output = chat_completion.choices[0].message.content

    try:
        start_idx = api_output.index('{')
        end_idx = api_output.rindex('}') + 1
        json_str = api_output[start_idx:end_idx]
    except ValueError:
        json_str = api_output

    return json_str


def generate_pdf(api_response, filename):
    data = json.loads(api_response)
    filepath = os.path.join(REPORT_FOLDER, filename)

    doc = SimpleDocTemplate(filepath, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(name="TitleStyle", parent=styles['Title'], alignment=TA_CENTER, fontSize=22)
    subtitle_style = ParagraphStyle(name="SubtitleStyle", parent=styles['Normal'], alignment=TA_CENTER, fontSize=12,
                                    italic=True)
    header_style = ParagraphStyle(name="HeaderStyle", parent=styles['Heading2'])
    normal_style = ParagraphStyle(name="NormalStyle", parent=styles['Normal'], fontSize=10)
    justified_style = ParagraphStyle(name="JustifiedStyle", parent=styles['Normal'], alignment=TA_JUSTIFY, fontSize=10)
    footer_style = ParagraphStyle(name="FooterStyle", parent=styles['Normal'], fontSize=8, alignment=TA_CENTER)

    elements.append(Paragraph("Mental Health Analysis Report", title_style))
    elements.append(Paragraph("Automated Emotional Analysis Based on Transcribed Speech", subtitle_style))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("Emotions Identified:", header_style))

    for emotion in data.get("Emotions", []):
        elements.append(Paragraph(f"• {emotion}", normal_style))

    elements.append(Spacer(1, 20))
    elements.append(Paragraph("Possible Reasons Behind These Emotions:", header_style))
    elements.append(Paragraph(data.get("Reasons", "No reasons provided."), justified_style))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("Emotional Support Suggestions:", header_style))

    for suggestion in data.get("Suggestions", []):
        elements.append(Paragraph(f"✔ {suggestion}", normal_style))

    elements.append(Spacer(1, 20))
    elements.append(
        Paragraph("This analysis is AI-generated and should not replace professional advice.", footer_style))
    doc.build(elements)

    return filepath


@app.route('/analyze', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    api_response = analyze_psychiatric_speech(filepath)
    pdf_filename = f"report_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    pdf_path = generate_pdf(api_response, pdf_filename)

    return send_file(pdf_path, as_attachment=True)


if __name__ == '__main__':
    app.run(debug=True,port=5001)

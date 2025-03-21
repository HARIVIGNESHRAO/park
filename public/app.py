from flask import Flask, request, jsonify, send_file
import whisper
import os
from werkzeug.utils import secure_filename
from groq import Groq
import json
from flask_cors import CORS
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from googletrans import Translator, LANGUAGES
app = Flask(__name__)
CORS(app)

# Load Whisper model once at startup
model = whisper.load_model("small")
translator = Translator()
UPLOAD_FOLDER = "uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

ALLOWED_EXTENSIONS = {"mp3", "wav", "m4a"}

client = Groq(api_key="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")

# Supported languages for Whisper (partial list, expand as needed)
SUPPORTED_LANGUAGES = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "zh": "Chinese",
    "te": "Telugu",
    "hi": "Hindi"
}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def clean_response(response):
    """Clean up API response by removing markdown code blocks if present"""
    if response.startswith('```json'):
        response = response[7:-3].strip()
    elif response.startswith('```'):
        response = response[3:-3].strip()
    return response


def analyze_transcription(transcribed_text, language="en"):
    language_name = SUPPORTED_LANGUAGES.get(language, "English")
    prompt = f"""
    Return only a valid JSON object with the following structure, without any explanations or extra text:
    {{
      "Emotions": ["List of emotions"],
      "Reasons": "Explanation of possible reasons",
      "Suggestions": ["List of practical advice"],
      "Language": "{language_name}"
    }}
    Analyze the given text accordingly, considering it is in {language_name}:
    Text: "{transcribed_text}"
    """
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a mental health analysis assistant."},
                {"role": "user", "content": prompt},
            ],
            model="llama-3.3-70b-versatile",
        )
        response = clean_response(chat_completion.choices[0].message.content)
        print("Raw API response:", response)  # Debug output

        try:
            json.loads(response)
            return response
        except json.JSONDecodeError:
            return json.dumps({
                "Emotions": [],
                "Reasons": "Error processing response",
                "Suggestions": [],
                "Language": language_name,
                "error": f"Invalid JSON from API: {response}"
            })
    except Exception as e:
        return json.dumps({"error": f"Groq API error: {str(e)}", "Language": language_name})


def draw_border(canvas, doc):
    width, height = A4
    margin = 20
    canvas.setLineWidth(2)
    canvas.setStrokeColor(colors.darkblue)
    canvas.rect(margin, margin, width - 2 * margin, height - 2 * margin)


def generate_pdf(api_response, filename="mental_health_report.pdf"):
    data = json.loads(api_response)
    doc = SimpleDocTemplate(filename, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("TitleStyle", parent=styles['Title'], alignment=TA_CENTER, fontSize=22, spaceAfter=12)
    normal_style = ParagraphStyle("NormalStyle", parent=styles['Normal'], fontSize=10, spaceAfter=6)
    justified_style = ParagraphStyle("JustifiedStyle", parent=styles['Normal'], alignment=TA_JUSTIFY, fontSize=10,
                                     spaceAfter=12)

    elements.append(Paragraph("Mental Health Analysis Report", title_style))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
    elements.append(Paragraph(f"Language: {data.get('Language', 'English')}", normal_style))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph("Emotions Identified:", styles['Heading2']))
    for emotion in data.get("Emotions", []):
        elements.append(Paragraph(f"• {emotion}", normal_style))
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("Possible Reasons Behind These Emotions:", styles['Heading2']))
    elements.append(Paragraph(data.get("Reasons", "No reasons provided."), justified_style))
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("Emotional Support Suggestions:", styles['Heading2']))
    for suggestion in data.get("Suggestions", []):
        elements.append(Paragraph(f"✔ {suggestion}", normal_style))
    elements.append(Spacer(1, 20))

    doc.build(elements, onFirstPage=draw_border, onLaterPages=draw_border)
    return filename


@app.route("/analyze_audio", methods=["POST"])
def analyze_audio():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    language = request.form.get("language", "en")  # Get language from form data, default to English

    if file.filename == "" or not allowed_file(file.filename):
        return jsonify({"error": "Invalid or no selected file"}), 400

    if language not in SUPPORTED_LANGUAGES:
        return jsonify({"error": f"Unsupported language: {language}"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    try:
        # Transcribe with specified language
        transcription = model.transcribe(filepath, language=language)
        transcribed_text = transcription["text"]
        api_output = analyze_transcription(transcribed_text, language)
        os.remove(filepath)

        try:
            analysis = json.loads(api_output)
            result = {
                "transcription": transcribed_text,
                "analysis": analysis,
                "language": language
            }
        except json.JSONDecodeError:
            result = {
                "transcription": transcribed_text,
                "analysis_raw": api_output,
                "error": "Failed to parse API output as JSON",
                "language": language
            }

        return jsonify(result)
    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({"error": f"Processing error: {str(e)}"}), 500


@app.route("/generate_pdf", methods=["POST"])
def generate_pdf_route():
    try:
        data = request.get_json()
        if not data or "analysis" not in data:
            return jsonify({"error": "Missing analysis data"}), 400

        pdf_filename = generate_pdf(json.dumps(data["analysis"]))
        return send_file(pdf_filename, as_attachment=True)
    except Exception as e:
        return jsonify({"error": f"PDF generation error: {str(e)}"}), 500
@app.route('/translate', methods=['POST'])
def translate_text():
    try:
        # Get data from the request
        data = request.get_json()
        text = data.get('text')
        target_language = data.get('targetLanguage', 'en')  # Default to English

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        # Perform translation
        translated = translator.translate(text, dest=target_language)
        translated_text = translated.text

        return jsonify({'translatedText': translated_text}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
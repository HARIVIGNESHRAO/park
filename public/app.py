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
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from googletrans import Translator
import librosa
import numpy as np
import traceback

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
    if response.startswith('```json'):
        return response[7:-3].strip()
    elif response.startswith('```'):
        return response[3:-3].strip()
    return response


def extract_acoustic_features(filepath):
    """Extract acoustic features from audio file using librosa."""
    try:
        y, sr = librosa.load(filepath, sr=None)

        # Pitch (fundamental frequency)
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
        pitch_mean = np.mean(pitches[pitches > 0]) if np.any(pitches > 0) else 0

        # Energy (RMS - Root Mean Square)
        rms = librosa.feature.rms(y=y)[0]
        energy_mean = np.mean(rms)

        # Jitter (pitch variation)
        pitch_values = pitches[pitches > 0]
        jitter = np.mean(np.abs(np.diff(pitch_values))) if len(pitch_values) > 1 else 0

        # Shimmer (amplitude variation)
        shimmer = np.mean(np.abs(np.diff(rms))) if len(rms) > 1 else 0

        # Pauses (silence detection)
        silence_threshold = 0.01 * np.max(np.abs(y))
        pauses = librosa.effects.split(y, top_db=20)
        pause_count = len(pauses) - 1
        pause_duration = np.sum(np.diff(pauses, axis=1)) / sr if pause_count > 0 else 0

        return {
            "pitch_mean": float(pitch_mean),
            "energy_mean": float(energy_mean),
            "jitter": float(jitter),
            "shimmer": float(shimmer),
            "pause_count": int(pause_count),
            "pause_duration": float(pause_duration)
        }
    except Exception as e:
        raise Exception(f"Failed to extract acoustic features: {str(e)}")


def analyze_transcription(transcribed_text, acoustic_features, language="en"):
    language_name = SUPPORTED_LANGUAGES.get(language, "English")
    prompt = f"""
    Return only a valid JSON object with the following structure, without any explanations or extra text:
    {{
      "Tones": ["List of detected tones"],
      "Emotions": ["List of inferred emotions, including 'sarcasm' if text and acoustic features conflict"],
      "Reasons": "Explanation of how tones, words, and acoustic features suggest these emotions, noting any conflict between text and acoustic features",
      "Suggestions": ["List of practical advice based on emotions"],
      "Language": "{language_name}",
      "AcousticAnalysis": {{
        "Pitch": "Interpretation of pitch_mean",
        "Energy": "Interpretation of energy_mean",
        "Jitter": "Interpretation of jitter",
        "Shimmer": "Interpretation of shimmer",
        "Pauses": "Interpretation of pause_count and pause_duration"
      }}
    }}
    Analyze the given transcribed speech text and acoustic features in {language_name}. 
    - Detect tones based on punctuation, phrasing, structure, and acoustic features (e.g., happy, sad, angry, calm, excited, anxious, sarcastic, neutral).
    - Identify key emotional words or phrases that carry emotional weight.
    - Infer emotions by combining tones, emotional words, and acoustic features (pitch, energy, jitter, shimmer, pauses).
    - If text and acoustic features conflict, prioritize acoustic features, note the conflict in 'Reasons', and include 'sarcasm' in 'Emotions' if the conflict suggests it (e.g., positive text with flat or low-energy acoustics).
    Text: "{transcribed_text}"
    Acoustic Features: {json.dumps(acoustic_features)}
    """
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system",
                 "content": "You are an emotion analysis assistant that combines text and acoustic feature analysis for transcribed speech."},
                {"role": "user", "content": prompt},
            ],
            model="llama-3.3-70b-versatile",
        )
        response = clean_response(chat_completion.choices[0].message.content)
        print("Raw API response:", response)

        try:
            json.loads(response)
            return response
        except json.JSONDecodeError:
            return json.dumps({
                "Tones": [],
                "Emotions": [],
                "Reasons": "Error processing response",
                "Suggestions": [],
                "Language": language_name,
                "AcousticAnalysis": {},
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

    elements.append(Paragraph("Inferred Emotions:", styles['Heading2']))
    for emotion in data.get("Emotions", []):
        elements.append(Paragraph(f"• {emotion}", normal_style))
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("Reasons Behind These Emotions:", styles['Heading2']))
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
    print("Received request to /analyze_audio")
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    language = request.form.get("language", "en")

    if file.filename == "" or not allowed_file(file.filename):
        return jsonify({"error": "Invalid or no selected file"}), 400

    if language not in SUPPORTED_LANGUAGES:
        return jsonify({"error": f"Unsupported language: {language}"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    try:
        # Transcribe audio
        print("Transcribing audio...")
        transcription = model.transcribe(filepath, language=language)
        transcribed_text = transcription["text"]
        print(f"Transcription: {transcribed_text}")

        # Extract acoustic features
        print("Extracting acoustic features...")
        acoustic_features = extract_acoustic_features(filepath)
        print(f"Acoustic Features: {acoustic_features}")

        # Analyze with both text and acoustic features
        print("Analyzing transcription...")
        api_output = analyze_transcription(transcribed_text, acoustic_features, language)
        print(f"API Output: {api_output}")

        os.remove(filepath)
        print("Temporary file removed")

        try:
            analysis = json.loads(api_output)
            result = {
                "transcription": transcribed_text,
                "analysis": analysis,
                "acoustic_features": acoustic_features,
                "language": language
            }
        except json.JSONDecodeError as e:
            result = {
                "transcription": transcribed_text,
                "analysis_raw": api_output,
                "error": f"Failed to parse API output as JSON: {str(e)}",
                "language": language
            }

        print("Returning result:", result)
        return jsonify(result)
    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        error_msg = f"Processing error: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        return jsonify({"error": error_msg}), 500


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
        data = request.get_json()
        text = data.get('text')
        target_language = data.get('targetLanguage', 'en')

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        translated = translator.translate(text, dest=target_language)
        return jsonify({'translatedText': translated.text}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)

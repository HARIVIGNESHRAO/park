import whisper
import time

# Load the "small" model
print("Loading Whisper 'base' model...")
start_time = time.time()

try:
    model = whisper.load_model("small")
    print(f"Model loaded successfully in {time.time() - start_time:.2f} seconds")
except Exception as e:
    print(f"Failed to load model: {e}")
    exit()

# Test with an audio file (replace with your audio file path)
audio_path = "./uploads/mic_recording.wav"  # Use a short WAV, MP3, or similar file
print(f"Transcribing {audio_path}...")
start_time = time.time()

try:
    result = model.transcribe(audio_path)
    print(f"Transcription completed in {time.time() - start_time:.2f} seconds")
    print("Transcription result:", result["text"])
except Exception as e:
    print(f"Transcription failed: {e}")
from pyannote.audio import Pipeline

HF_TOKEN = "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"
try:
    pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization", use_auth_token=HF_TOKEN)
    audio_file = "./"
    diarization = pipeline(audio_file)
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        print(f"Speaker {speaker}: {turn.start:.1f}s to {turn.end:.1f}s")
except Exception as e:
    print(f"Error: {str(e)}")
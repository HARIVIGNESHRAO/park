import React, { useState, useRef, useEffect } from "react";
import { Mic, Upload, FileText, X, Sparkles, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./home.css";

// Helper function to create a WAV file from raw audio data
function createWavBlob(audioBlob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Decode the audio data
      audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
        const sampleRate = audioBuffer.sampleRate;
        const channels = audioBuffer.numberOfChannels;
        const samples = audioBuffer.length;
        const bitsPerSample = 16; // Standard for WAV

        // Create WAV file header
        const headerSize = 44;
        const fileSize = headerSize + samples * channels * (bitsPerSample / 8);
        const buffer = new ArrayBuffer(fileSize);
        const view = new DataView(buffer);

        // RIFF header
        writeString(view, 0, "RIFF");
        view.setUint32(4, fileSize - 8, true);
        writeString(view, 8, "WAVE");

        // fmt chunk
        writeString(view, 12, "fmt ");
        view.setUint32(16, 16, true); // Subchunk size
        view.setUint16(20, 1, true); // PCM format
        view.setUint16(22, channels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * channels * (bitsPerSample / 8), true);
        view.setUint16(32, channels * (bitsPerSample / 8), true);
        view.setUint16(34, bitsPerSample, true);

        // data chunk
        writeString(view, 36, "data");
        view.setUint32(40, samples * channels * (bitsPerSample / 8), true);

        // Copy audio data
        const channelData = audioBuffer.getChannelData(0); // Mono for simplicity
        let offset = headerSize;
        for (let i = 0; i < channelData.length; i++, offset += 2) {
          const sample = Math.max(-1, Math.min(1, channelData[i]));
          view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        }

        // Create Blob
        const wavBlob = new Blob([buffer], { type: "audio/wav" });
        resolve(wavBlob);
      });
    };
    reader.readAsArrayBuffer(audioBlob);
  });
}

// Helper function to write strings to DataView
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

const HomePage = () => {
  const [isListening, setIsListening] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [liveTranscript, setLiveTranscript] = useState("");
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "zh", name: "Chinese" },
    { code: "te", name: "Telugu" },
    { code: "hi", name: "Hindi" },
  ];

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" }); // Use WebM for better compatibility
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error("Speech Recognition API not supported in this browser.");
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = selectedLanguage === "zh" ? "zh-CN" : selectedLanguage;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.continuous = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");
        setLiveTranscript(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setLiveTranscript("Error recognizing speech. Please try again.");
      };

      recognitionRef.current.start();
      mediaRecorderRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      alert(`Failed to start recording: ${err.message}`);
      setIsListening(false);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      recognitionRef.current?.stop();

      // Wait for the stop event to complete
      await new Promise((resolve) => {
        mediaRecorderRef.current.onstop = () => {
          mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
          resolve();
        };
      });

      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      try {
        const wavBlob = await createWavBlob(audioBlob); // Convert to WAV
        const audioFile = new File([wavBlob], "mic_recording.wav", { type: "audio/wav" });
        submitAudio(audioFile);
      } catch (err) {
        console.error("Error converting to WAV:", err);
        alert("Failed to process recorded audio.");
      }

      setIsListening(false);
      setLiveTranscript("");
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      recognitionRef.current?.stop();
      const stream = mediaRecorderRef.current.stream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      audioChunksRef.current = [];
      mediaRecorderRef.current = null;
      setIsListening(false);
      setLiveTranscript("");
    }
  };

  const handleMicClick = () => {
    if (!isListening) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0 && !isLoading) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isLoading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => setIsDragging(false);

  const clearFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitAudio = async (file) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", selectedLanguage);

    try {
      const response = await fetch("http://127.0.0.1:5000/analyze_audio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      navigate("/result", {
        state: {
          transcription: data.transcription,
          analysis: data.analysis || data.analysis_raw,
          language: selectedLanguage,
        },
      });
    } catch (err) {
      console.error("Submit error:", err);
      alert(`Failed to process audio: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (uploadedFile) {
      submitAudio(uploadedFile);
    } else {
      alert("Please upload a file first.");
    }
  };

  return (
    <div className="home-container" ref={containerRef}>
      <div className="bg-gradient"></div>
      <div
        className="bg-spotlight"
        style={{ left: `${mousePosition.x}px`, top: `${mousePosition.y}px` }}
      ></div>
      <div className="particles-container">
        {[...Array(15)].map((_, index) => (
          <div
            key={index}
            className="particle"
            style={{
              animationDelay: `${Math.random() * 5}s`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          ></div>
        ))}
      </div>

      <div className="content-glass">
        {isLoading && (
          <div className="loading-overlay">
            <div className="loader">
              <div className="spinner"></div>
              <div className="dot dot1"></div>
              <div className="dot dot2"></div>
              <div className="dot dot3"></div>
            </div>
            <p className="loading-text">Processing your audio...</p>
          </div>
        )}
        <h1 className={`page-title ${isListening ? "fade-out" : ""}`}>
          <span className="title-highlight">How are you feeling today?</span>
        </h1>

        <div className={`mic-container ${isListening ? "listening-active" : ""}`}>
          <div
            className={`mic-button ${isListening ? "listening" : ""}`}
            onClick={isLoading ? null : handleMicClick}
            style={isLoading ? { cursor: "not-allowed", opacity: 0.6 } : {}}
          >
            <Mic className={`mic-icon ${isListening ? "listening-blink" : "normal"}`} />
            {isListening && (
              <>
                <div className="ripple-inner"></div>
                <div className="ripple-middle"></div>
                <div className="ripple-outer"></div>
              </>
            )}
          </div>
          {isListening && (
            <div className="listening-indicator">
              <p className="indicator-text">Recording... Check your text below</p>
              <div className="live-transcript">
                <p>{liveTranscript || "Speak now, text will appear here..."}</p>
              </div>
              <div className="audio-waves">
                {[...Array(9)].map((_, index) => (
                  <div key={index} className="audio-wave"></div>
                ))}
              </div>
              <div className="listening-controls">
                <button onClick={stopRecording} className="stop-button">
                  Stop & Submit
                </button>
                <button onClick={cancelRecording} className="cancel-button">
                  Cancel
                </button>
              </div>
              <div className="listening-sparkles">
                <Sparkles className="sparkle-icon left" />
                <Sparkles className="sparkle-icon right" />
              </div>
            </div>
          )}
        </div>

        <div className={`upload-container ${isListening ? "fade-out" : ""}`}>
          <div className="language-selector">
            <Globe className="globe-icon" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="language-dropdown"
              disabled={isLoading || isListening}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div
            className={`drop-zone ${isDragging ? "dragging" : ""} ${uploadedFile ? "has-file" : ""}`}
            onDragOver={isLoading ? null : handleDragOver}
            onDragLeave={isLoading ? null : handleDragLeave}
            onDrop={isLoading ? null : handleDrop}
            style={isLoading ? { cursor: "not-allowed" } : {}}
          >
            {!uploadedFile ? (
              <>
                <div className="upload-icon">
                  <Upload className="upload-icon-svg" />
                </div>
                <p className="upload-text">Drag and drop your file here</p>
                <div className="upload-or-container">
                  <span className="upload-or">or</span>
                  <button
                    onClick={isLoading ? null : () => fileInputRef.current.click()}
                    className="browse-button"
                    disabled={isLoading}
                    style={isLoading ? { cursor: "not-allowed", opacity: 0.6 } : {}}
                  >
                    Browse Files
                  </button>
                  <input
                    type="file"
                    className="file-input"
                    onChange={isLoading ? null : handleFileChange}
                    ref={fileInputRef}
                    accept="audio/*"
                    disabled={isLoading}
                  />
                </div>
              </>
            ) : (
              <div className="file-display">
                <div className="file-info">
                  <FileText className="file-icon" />
                  <span className="file-name">{uploadedFile.name}</span>
                </div>
                <button onClick={isLoading ? null : clearFile} className="file-remove">
                  <X className="file-remove-icon" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={`options-container ${isListening ? "fade-out" : ""}`}>
          <button
            className="action-button record-button"
            onClick={handleMicClick}
            disabled={isLoading}
          >
            <Mic className="button-icon" />
            <span>{isListening ? "Stop Recording" : "Record Audio"}</span>
          </button>
          <button
            className="action-button upload-button"
            onClick={handleSubmit}
            disabled={isLoading || !uploadedFile}
          >
            <Upload className="button-icon" />
            <span>{isLoading ? "Processing..." : "Submit"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

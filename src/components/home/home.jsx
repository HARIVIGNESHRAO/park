import React, { useState, useRef, useEffect } from "react";
import { Mic, Upload, FileText, X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./home.css";

const HomePage = () => {
  const [isListening, setIsListening] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const navigate = useNavigate();

  // Track mouse position for interactive background effect
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

  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const audioFile = new File([audioBlob], "mic_recording.wav", {
          type: "audio/wav",
        });
        submitAudio(audioFile);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Failed to access microphone. Please check permissions.");
      setIsListening(false);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  // Handle mic click - toggle recording
  const handleMicClick = () => {
    if (!isListening) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  // Handle file upload
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  // Clear file
  const clearFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Submit audio to Flask API
  const submitAudio = async (file) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:5000/analyze_audio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      navigate("/result", {
        state: {
          transcription: data.transcription,
          analysis: data.analysis || data.analysis_raw,
        },
      });
    } catch (err) {
      console.error("Error submitting audio:", err);
      alert(`Failed to process audio: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle submit button click
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
        <h1 className={`page-title ${isListening ? "fade-out" : ""}`}>
          <span className="title-highlight">How are you feeling today?</span>
        </h1>

        <div className={`mic-container ${isListening ? "listening-active" : ""}`}>
          <div
            className={`mic-button ${isListening ? "listening" : ""}`}
            onClick={handleMicClick}
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
              <p className="indicator-text">
                {isListening ? "Recording... Click to stop" : "We are listening..."}
              </p>
              <div className="audio-waves">
                {[...Array(9)].map((_, index) => (
                  <div key={index} className="audio-wave"></div>
                ))}
              </div>
              <div className="listening-sparkles">
                <Sparkles className="sparkle-icon left" />
                <Sparkles className="sparkle-icon right" />
              </div>
            </div>
          )}
        </div>

        <div className={`upload-container ${isListening ? "fade-out" : ""}`}>
          <div
            className={`drop-zone ${isDragging ? "dragging" : ""} ${uploadedFile ? "has-file" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
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
                    onClick={() => fileInputRef.current.click()}
                    className="browse-button"
                  >
                    Browse Files
                  </button>
                  <input
                    type="file"
                    className="file-input"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    accept="audio/*"
                  />
                </div>
              </>
            ) : (
              <div className="file-display">
                <div className="file-info">
                  <FileText className="file-icon" />
                  <span className="file-name">{uploadedFile.name}</span>
                </div>
                <button onClick={clearFile} className="file-remove">
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
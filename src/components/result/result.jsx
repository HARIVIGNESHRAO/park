import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import "./result.css";

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [transcription, setTranscription] = useState("");
  const [analysis, setAnalysis] = useState({});
  const [isEnglish, setIsEnglish] = useState(false);
  const [translatedText, setTranslatedText] = useState({});
  const username = Cookies.get("username");
  useEffect(() => {
    if (!username) {
    } else {
      if (location.state) {
        setTranscription(location.state.transcription);
        setAnalysis(location.state.analysis);
      } else {
        fetchAnalysisFromServer();
      }
    }
  }, [location.state, username, navigate]);

  const fetchAnalysisFromServer = async () => {
    try {
      const response = await fetch(`http://localhost:5001/analyze_audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch analysis");
      }

      const data = await response.json();
      setTranscription(data.transcription);
      setAnalysis(data.analysis);
    } catch (error) {
      console.error("Error fetching analysis:", error);
    }
  };
const translateToEnglish = async (text) => {
    if (!text || text === "Not identified" || text === "Not provided" || text === "No transcription available") {
        return text;
    }
    try {
        const response = await fetch("http://localhost:5000/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, targetLanguage: "en" }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Translation failed: ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        return data.translatedText;
    } catch (error) {
        console.error("Error translating text:", error.message);
        return text;
    }
};

  const handleToggleChange = async () => {
    const newIsEnglish = !isEnglish;
    setIsEnglish(newIsEnglish);

    if (newIsEnglish && !translatedText.transcription) {
      const translatedTranscription = await translateToEnglish(transcription);
      const translatedTones = await translateToEnglish(analysis.Tones?.join(", ") || "Not identified");
      const translatedEmotionalWords = await translateToEnglish(analysis.EmotionalWords?.join(", ") || "Not identified");
      const translatedEmotions = await translateToEnglish(analysis.Emotions?.join(", ") || "Not identified");
      const translatedReasons = await translateToEnglish(analysis.Reasons || "Not provided");
      const translatedSuggestions = await translateToEnglish(analysis.Suggestions?.join("; ") || "Not provided");

      setTranslatedText({
        transcription: translatedTranscription,
        tones: translatedTones,
        emotionalWords: translatedEmotionalWords,
        emotions: translatedEmotions,
        reasons: translatedReasons,
        suggestions: translatedSuggestions,
      });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const saveResponse = await fetch("http://localhost:5001/save_analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          transcription: isEnglish ? translatedText.transcription : transcription,
          analysis: {
            Tones: isEnglish ? translatedText.tones.split(", ") : analysis.Tones,
            EmotionalWords: isEnglish ? translatedText.emotionalWords.split(", ") : analysis.EmotionalWords,
            Emotions: isEnglish ? translatedText.emotions.split(", ") : analysis.Emotions,
            Reasons: isEnglish ? translatedText.reasons : analysis.Reasons,
            Suggestions: isEnglish ? translatedText.suggestions.split("; ") : analysis.Suggestions,
          },
        }),
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save data to MongoDB");
      }

      console.log("Analysis successfully saved to MongoDB!");

      const pdfResponse = await fetch("http://localhost:5000/generate_pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcription: isEnglish ? translatedText.transcription : transcription,
          analysis: {
            Tones: isEnglish ? translatedText.tones.split(", ") : analysis.Tones,
            EmotionalWords: isEnglish ? translatedText.emotionalWords.split(", ") : analysis.EmotionalWords,
            Emotions: isEnglish ? translatedText.emotions.split(", ") : analysis.Emotions,
            Reasons: isEnglish ? translatedText.reasons : analysis.Reasons,
            Suggestions: isEnglish ? translatedText.suggestions.split("; ") : analysis.Suggestions,
          },
          username,
        }),
      });

      if (!pdfResponse.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await pdfResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Analysis_Report.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log("PDF successfully downloaded!");
    } catch (error) {
      console.error("Error:", error.message);
    }
  };

  if (!username) {
    return (
      <div className="result-container">
        <h1 className="result-title">Access Denied</h1>
        <p>Please login to access this page.</p>
          <a href="/login">Login</a>
      </div>
    );
  }

  return (
    <div className="result-container">
      <h1 className="result-title">Your Results</h1>

      <div className="toggle-container">
        <label htmlFor="language-toggle">Translate to English: </label>
        <input
          type="checkbox"
          id="language-toggle"
          checked={isEnglish}
          onChange={handleToggleChange}
        />
      </div>

      <div className="transcription-box">
        <h2>Transcription</h2>
        <p className="transcription-text">
          {isEnglish ? translatedText.transcription || transcription : transcription || "No transcription available"}
        </p>
        <h2>Emotional Analysis</h2>
        <p>
          <strong>Emotions:</strong>{" "}
          {isEnglish ? translatedText.emotions || analysis.Emotions?.join(", ") : analysis.Emotions?.join(", ") || "Not identified"}
        </p>
        <p>
          <strong>Reasons:</strong>{" "}
          {isEnglish ? translatedText.reasons || analysis.Reasons : analysis.Reasons || "Not provided"}
        </p>
        <p>
          <strong>Suggestions:</strong>{" "}
          {isEnglish ? translatedText.suggestions || analysis.Suggestions?.join("; ") : analysis.Suggestions?.join("; ") || "Not provided"}
        </p>
      </div>
      <button className="back-button" onClick={() => navigate("/dashboard")}>
        Back to Home
      </button>
      <button className="back-button" onClick={handleDownloadPDF}>
        Download PDF
      </button>
    </div>
  );
};

export default ResultPage;
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./result.css";

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [transcription, setTranscription] = useState("");
  const [analysis, setAnalysis] = useState({});
  const [isEnglish, setIsEnglish] = useState(false); // Toggle state for English translation
  const [translatedText, setTranslatedText] = useState({}); // Store translated content

  // Get username from localStorage
  const username = localStorage.getItem("username");

  useEffect(() => {
    if (location.state) {
      setTranscription(location.state.transcription);
      setAnalysis(location.state.analysis);
    } else {
      fetchAnalysisFromServer(); // Fetch from backend if not in state
    }
  }, [location.state]);

  // Fetch latest analysis from backend (if page is refreshed)
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

  // Function to translate text to English
  const translateToEnglish = async (text) => {
    // Skip translation for empty or placeholder text
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
        throw new Error("Translation failed");
      }

      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      console.error("Error translating text:", error);
      return text; // Return original text if translation fails
    }
  };

  // Handle toggle change and fetch translations
  const handleToggleChange = async () => {
    const newIsEnglish = !isEnglish;
    setIsEnglish(newIsEnglish);

    if (newIsEnglish && !translatedText.transcription) {
      // Translate all text when toggling to English
      const translatedTranscription = await translateToEnglish(transcription);
      const translatedEmotions = await translateToEnglish(analysis.Emotions?.join(", ") || "Not identified");
      const translatedReasons = await translateToEnglish(analysis.Reasons || "Not provided");
      const translatedSuggestions = await translateToEnglish(analysis.Suggestions?.join("; ") || "Not provided");

      setTranslatedText({
        transcription: translatedTranscription,
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

  return (
    <div className="result-container">
      <h1 className="result-title">Your Results</h1>

      {/* Toggle Switch */}
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
      <button className="back-button" onClick={() => navigate("/home")}>
        Back to Home
      </button>
      <button className="back-button" onClick={handleDownloadPDF}>
        Download PDF
      </button>
    </div>
  );
};

export default ResultPage;
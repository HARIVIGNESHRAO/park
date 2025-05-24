import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import "./result1.css";

const ResultPage1 = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState({ speaker_1: {}, speaker_2: {} });
  const [isEnglish, setIsEnglish] = useState(false);
  const [translatedResults, setTranslatedResults] = useState({ speaker_1: {}, speaker_2: {} });

  const username = Cookies.get("username");

  useEffect(() => {
    if (location.state) {
      setResults(location.state);
    } else {
      fetchAnalysisFromServer();
    }
  }, [location.state]);

  const fetchAnalysisFromServer = async () => {
    try {
      const response = await fetch(`https://salaar1-production.up.railway.app/analyze_audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) throw new Error("Failed to fetch analysis");

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error fetching analysis:", error);
    }
  };

  const translateToEnglish = async (text) => {
    if (!text || text === "Not identified" || text === "Not provided" || text === "No transcription available") {
      return text;
    }
    try {
      const response = await fetch("http://localhost:5012/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLanguage: "en" }),
      });

      if (!response.ok) throw new Error("Translation failed");

      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      console.error("Error translating text:", error);
      return text;
    }
  };

  const handleToggleChange = async () => {
    const newIsEnglish = !isEnglish;
    setIsEnglish(newIsEnglish);

    if (newIsEnglish) {
      const translated = {};
      for (const speaker of ["speaker_1", "speaker_2"]) {
        if (results[speaker]?.transcription) {
          const { transcription, analysis } = results[speaker];
          translated[speaker] = {
            transcription: await translateToEnglish(transcription),
            emotions: await translateToEnglish(analysis.Emotions?.join(", ") || "Not identified"),
            reasons: await translateToEnglish(analysis.Reasons || "Not provided"),
            suggestions: await translateToEnglish(analysis.Suggestions?.join("; ") || "Not provided"),
          };
        }
      }
      setTranslatedResults(translated);
    }
  };

  const handleDownloadPDF = async (speaker) => {
    try {
      const data = results[speaker];
      const translatedData = translatedResults[speaker] || {};

      const saveResponse = await fetch("https://salaar1-production.up.railway.app/save_analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          transcription: isEnglish ? translatedData.transcription : data.transcription,
          analysis: {
            Emotions: isEnglish ? translatedData.emotions?.split(", ") : data.analysis.Emotions,
            Reasons: isEnglish ? translatedData.reasons : data.analysis.Reasons,
            Suggestions: isEnglish ? translatedData.suggestions?.split("; ") : data.analysis.Suggestions,
          },
        }),
      });

      if (!saveResponse.ok) throw new Error("Failed to save data to MongoDB");

      const pdfResponse = await fetch("http://localhost:5012/generate_pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcription: isEnglish ? translatedData.transcription : data.transcription,
          analysis: {
            Emotions: isEnglish ? translatedData.emotions?.split(", ") : data.analysis.Emotions,
            Reasons: isEnglish ? translatedData.reasons : data.analysis.Reasons,
            Suggestions: isEnglish ? translatedData.suggestions?.split("; ") : data.analysis.Suggestions,
          },
          username,
        }),
      });

      if (!pdfResponse.ok) throw new Error("Failed to generate PDF");

      const blob = await pdfResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Analysis_Report_${speaker}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error downloading PDF for ${speaker}:`, error.message);
    }
  };

  const renderSpeakerSection = (speaker, label) => {
    const data = results[speaker] || {};
    const translatedData = translatedResults[speaker] || {};

    return (
      <div className="speaker-section">
        <h2>{label}</h2>
        <div className="transcription-box">
          <h3>Transcription</h3>
          <p className="transcription-text">
            {isEnglish
              ? translatedData.transcription || data.transcription
              : data.transcription || "No transcription available"}
          </p>
          <h3>Emotional Analysis</h3>
          <p>
            <strong>Emotions:</strong>{" "}
            {isEnglish
              ? translatedData.emotions || data.analysis?.Emotions?.join(", ")
              : data.analysis?.Emotions?.join(", ") || "Not identified"}
          </p>
          <p>
            <strong>Reasons:</strong>{" "}
            {isEnglish
              ? translatedData.reasons || data.analysis?.Reasons
              : data.analysis?.Reasons || "Not provided"}
          </p>
          <p>
            <strong>Suggestions:</strong>{" "}
            {isEnglish
              ? translatedData.suggestions || data.analysis?.Suggestions?.join("; ")
              : data.analysis?.Suggestions?.join("; ") || "Not provided"}
          </p>
        </div>
        <button className="download-button" onClick={() => handleDownloadPDF(speaker)}>
          Download PDF
        </button>
      </div>
    );
  };

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

      <div className="speakers-container">
        {renderSpeakerSection("speaker_1", "Speaker 1")}
        {renderSpeakerSection("speaker_2", "Speaker 2")}
      </div>

      <button className="back-button" onClick={() => navigate("/dashboard")}>
        Back to Home
      </button>
    </div>
  );
};

export default ResultPage1;
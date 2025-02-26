import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./result.css";

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [transcription, setTranscription] = useState("");
  const [analysis, setAnalysis] = useState({});

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

 const handleDownloadPDF = async () => {
  try {
    // Step 1: Save Data to MongoDB
    const saveResponse = await fetch("http://localhost:5001/save_analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        transcription,
        analysis
      }),
    });

    if (!saveResponse.ok) {
      throw new Error("Failed to save data to MongoDB");
    }

    console.log("Analysis successfully saved to MongoDB!");

    // Step 2: Generate PDF After Saving
    const pdfResponse = await fetch("http://localhost:5000/generate_pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcription,
        analysis,
        username
      }),
    });

    if (!pdfResponse.ok) {
      throw new Error("Failed to generate PDF");
    }

    console.log("PDF generation started...");

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
      <div className="transcription-box">
        <h2>Transcription</h2>
        <p className="transcription-text">{transcription || "No transcription available"}</p>
        <h2>Emotional Analysis</h2>
        <p><strong>Emotions:</strong> {analysis.Emotions?.join(", ") || "Not identified"}</p>
        <p><strong>Reasons:</strong> {analysis.Reasons || "Not provided"}</p>
        <p><strong>Suggestions:</strong> {analysis.Suggestions?.join("; ") || "Not provided"}</p>
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

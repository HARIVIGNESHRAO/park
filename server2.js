const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");
const FormData = require("form-data");
require("dotenv").config();

const app = express();
const upload = multer({ dest: "uploads/" });

// Enable CORS for frontend
app.use(cors({ origin: "http://localhost:3000" }));

app.post("/emotion-detection", upload.single("audio"), async (req, res) => {
  let audioPath;
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }
    audioPath = req.file.path;

    // Validate file type
    if (!req.file.mimetype.startsWith("audio/")) {
      throw new Error("Uploaded file is not an audio file");
    }

    // Read audio file as buffer
    const audioBuffer = await fs.readFile(audioPath);

    // Create FormData for Hume AI
    const formData = new FormData();
    formData.append("file", audioBuffer, {
      filename: "recording.webm",
      contentType: req.file.mimetype || "audio/webm",
    });

    // Start Hume AI batch job
    const jobResponse = await axios.post("https://api.hume.ai/v0/batch/jobs", formData, {
      headers: {
        "X-Hume-Api-Key": process.env.HUME_AI_API_KEY || "RFv74PjcvU7HxHMPPAAEALwzoaY9EqgiMtcIK4rsIM4f32OO",
        ...formData.getHeaders(),
        Accept: "application/json",
      },
    });

    const jobId = jobResponse.data.job_id;

    // Poll for job results with exponential backoff
    let jobResults;
    let attempts = 0;
    const maxAttempts = 20; // ~60s max wait
    const baseDelay = 1000; // 1 second
    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, baseDelay * Math.pow(1.5, attempts)));
      const resultResponse = await axios.get(`https://api.hume.ai/v0/batch/jobs/${jobId}`, {
        headers: {
          "X-Hume-Api-Key": process.env.HUME_AI_API_KEY || "RFv74PjcvU7HxHMPPAAEALwzoaY9EqgiMtcIK4rsIM4f32OO",
          Accept: "application/json",
        },
      });
      jobResults = resultResponse.data;
      if (jobResults.state.status === "COMPLETED") break;
      if (jobResults.state.status === "FAILED") {
        throw new Error(`Hume AI job failed: ${jobResults.state.message || "Unknown error"}`);
      }
      attempts++;
    }

    if (jobResults.state.status !== "COMPLETED") {
      throw new Error(`Hume AI job did not complete after ${attempts} attempts`);
    }

    // Validate response structure
    if (!jobResults.results || !jobResults.results.predictions || !Array.isArray(jobResults.results.predictions)) {
      console.error("Invalid API response structure:", JSON.stringify(jobResults, null, 2));
      throw new Error("No predictions found in Hume AI response");
    }

    // Extract emotions from results
    const predictions = jobResults.results.predictions;
    if (!predictions[0]?.models?.prosody?.grouped_predictions?.[0]?.predictions?.[0]?.emotions) {
      console.error("No emotions found in predictions:", JSON.stringify(predictions, null, 2));
      throw new Error("No emotions detected in the audio");
    }

    const emotions = predictions[0].models.prosody.grouped_predictions[0].predictions[0].emotions;
    const primaryEmotion = emotions.reduce((prev, curr) =>
      prev.score > curr.score ? prev : curr
    );

    // Map to frontend format
    const responseData = {
      primaryEmotion: primaryEmotion.name,
      confidence: primaryEmotion.score,
      emotionDistribution: emotions.map((emo) => ({
        emotion: emo.name,
        confidence: emo.score,
      })),
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error processing audio:", error.message, error.response?.data || error);
    res.status(error.response?.status || 500).json({
      error: error.message || "Failed to process audio",
      details: error.response?.data || null,
    });
  } finally {
    // Clean up uploaded file
    if (audioPath) {
      try {
        await fs.unlink(audioPath);
      } catch (unlinkError) {
        console.error("Failed to delete uploaded file:", unlinkError.message);
      }
    }
  }
});

// Create uploads directory
const uploadsDir = path.join(__dirname, "uploads");
fs.mkdir(uploadsDir, { recursive: true });

const PORT = 3012;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
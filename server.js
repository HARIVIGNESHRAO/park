const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const cookieParser = require("cookie-parser");

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());

// MongoDB Atlas Connection
mongoose
  .connect(
    "mongodb+srv://harisonu151:zZYoHOEqz8eiI3qP@salaar.st5tm.mongodb.net/park",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  analyses: [
    {
      transcription: String,
      analysis: {
        Emotions: [String],
        Reasons: String,
        Suggestions: [String],
      },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

const User = mongoose.model("User", userSchema);

// File upload configuration
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /mp3|wav|m4a/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb("Error: Invalid file type!");
  },
});

// Mock analysis function
const analyzeTranscription = (transcription) => {
  return {
    Emotions: ["happy", "calm"],
    Reasons: "The tone suggests positive feelings",
    Suggestions: ["Continue positive activities", "Maintain routine"],
  };
};

// Register Route
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, analyses: [] });
    await user.save();

    res.status(201).json({ message: "Registration successful" });
  } catch (error) {
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// Login Route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    res.status(200).json({ message: "Login successful", username });
  } catch (error) {
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("username", { path: "/" });
  res.status(200).json({ message: "Logout successful" });
});

// Analyze Audio Route
app.post("/analyze_audio", upload.single("file"), async (req, res) => {
  const { username } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const transcription = "Sample transcription from audio";
    const analysis = analyzeTranscription(transcription);

    user.analyses.push({ transcription, analysis });
    await user.save();

    fs.unlinkSync(req.file.path);

    res.json({ username, transcription, analysis });
  } catch (error) {
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// Generate PDF Route
app.post("/generate_pdf", async (req, res) => {
  const { transcription, analysis, username } = req.body;

  if (!analysis || !username) {
    return res.status(400).json({ error: "Missing required data" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid username" });
    }

    const doc = new PDFDocument();
    const filename = `mental_health_report_${Date.now()}.pdf`;
    doc.pipe(fs.createWriteStream(filename));

    doc.fontSize(22).text("Mental Health Analysis Report", { align: "center" });
    doc.fontSize(10).text(`Date: ${new Date().toLocaleString()}`, { align: "left" });
    doc.moveDown();

    doc.fontSize(14).text("Transcription:");
    doc.fontSize(10).text(transcription || "Not provided", { align: "left" });
    doc.moveDown();

    doc.fontSize(14).text("Emotions Identified:");
    (analysis.Emotions || []).forEach((emotion) => doc.text(`• ${emotion}`));
    doc.moveDown();

    doc.fontSize(14).text("Possible Reasons:");
    doc.fontSize(10).text(analysis.Reasons || "Not provided", { align: "justify" });
    doc.moveDown();

    doc.fontSize(14).text("Suggestions:");
    (analysis.Suggestions || []).forEach((suggestion) => doc.text(`✔ ${suggestion}`));

    doc.end();

    res.download(filename, "Analysis_Report.pdf", (err) => {
      if (!err) {
        fs.unlinkSync(filename);
      } else {
        console.error("Download error:", err);
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

app.post("/save_analysis", async (req, res) => {
  const { username, transcription, analysis } = req.body;

  if (!username || !transcription || !analysis) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.analyses.push({ transcription, analysis });
    await user.save();

    console.log(`Analysis saved for ${username}:`, { transcription, analysis });

    res.json({ message: "Analysis saved successfully" });
  } catch (error) {
    console.error("Error saving analysis:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get All Users Route
app.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password").lean();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json({
      message: "Users retrieved successfully",
      count: users.length,
      users: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

app.delete("/users/:id", async (req, res) => {
  const userId = req.params.id;
  console.log('Attempting to delete user with ID:', userId); // Log the ID
  try {
    const user = await User.findById(userId);
    console.log('Found user:', user); // Log the user (or null)
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await User.deleteOne({ _id: userId });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});
// Start Server
const PORT = 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

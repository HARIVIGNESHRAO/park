const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());

// MongoDB Atlas Connection
mongoose.connect(
  "mongodb+srv://harisonu151:zZYoHOEqz8eiI3qP@salaar.st5tm.mongodb.net/park",
  { useNewUrlParser: true, useUnifiedTopology: true }
)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Updated User Schema with age field
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String },
  email: { type: String, required: true, unique: true },
  googleId: { type: String, unique: true, sparse: true },
  githubId: { type: String, unique: true, sparse: true },
  avatar: { type: String },
  age: { type: Number, min: 1, max: 120 }, // Added age field with validation
  analyses: [{
    transcription: String,
    analysis: {
      Emotions: [String],
      Reasons: String,
      Suggestions: [String],
    },
    createdAt: { type: Date, default: Date.now }
  }]
});

const User = mongoose.model("User", userSchema);

// File upload configuration
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /mp3|wav|m4a/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb('Error: Invalid file type!');
  }
});

// Mock analysis function
const analyzeTranscription = (transcription) => {
  return {
    Emotions: ['happy', 'calm'],
    Reasons: 'The tone suggests positive feelings',
    Suggestions: ['Continue positive activities', 'Maintain routine']
  };
};

// Authentication Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const username = req.cookies.username;
    if (!username) {
      return res.status(401).json({ error: "Please log in first" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: "Authentication error: " + error.message });
  }
};

// Register Route - Updated to include age
app.post("/register", async (req, res) => {
  const { username, password, email, avatar, age } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ error: "Username, password, and email are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (age && (isNaN(age) || age < 1 || age > 120)) {
    return res.status(400).json({ error: "Age must be a number between 1 and 120" });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      if (existingUser.username === username) return res.status(400).json({ error: "Username already exists" });
      if (existingUser.email === email) return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      avatar,
      age, // Include age if provided
      analyses: []
    });
    await user.save();

    res.status(201).json({ message: "Registration successful", username, email, avatar, age });
  } catch (error) {
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// Login Route - Updated to return age
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

    res.cookie('username', username, { httpOnly: true });
    res.status(200).json({
      message: "Login successful",
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      age: user.age // Include age
    });
  } catch (error) {
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// Logout Route
app.post("/logout", (req, res) => {
  res.clearCookie('username', { path: '/' });
  res.status(200).json({ message: "Logout successful" });
});

// Google Login Endpoint - Updated to return age
const googleClient = new OAuth2Client("423273358250-erqvredg1avk5pr09ugj8uve1rg11m3m.apps.googleusercontent.com");
app.post('/google-login', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: "423273358250-erqvredg1avk5pr09ugj8uve1rg11m3m.apps.googleusercontent.com",
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let user = await User.findOne({ googleId });
    if (!user) {
      const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        if (existingUser.username === username) return res.status(400).json({ error: "Derived username already exists" });
        if (existingUser.email === email) return res.status(400).json({ error: "Email already exists" });
      }

      user = new User({
        username,
        email,
        googleId,
        analyses: [],
        age: null // Set age to null initially, can be updated later
      });
      await user.save();
    }

    res.cookie('username', user.username, { httpOnly: true });
    res.status(200).json({
      message: "Google login successful",
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      age: user.age // Include age
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(400).json({ error: 'Google login failed' });
  }
});

// GitHub Login Endpoint - Updated to return age
app.post('/github-login', async (req, res) => {
  try {
    const { code } = req.body;

    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: "Ov23liiXOYhc1dxfIBau",
      client_secret: "54fde01a3e0a2d13c548e1ee038de1754ca5b443",
      code,
    }, { headers: { Accept: 'application/json' } });

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      return res.status(400).json({ error: 'Failed to get GitHub access token' });
    }

    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` }
    });
    const { id: githubId, login: username, email: githubEmail } = userResponse.data;

    let user = await User.findOne({ githubId });
    if (!user) {
      const existingUser = await User.findOne({ $or: [{ username }, { email: githubEmail }] });
      if (existingUser) {
        if (existingUser.username === username) return res.status(400).json({ error: "GitHub username already exists" });
        if (existingUser.email === githubEmail) return res.status(400).json({ error: "Email already exists" });
      }

      user = new User({
        username,
        email: githubEmail || `${username}@github.com`,
        githubId,
        analyses: [],
        age: null // Set age to null initially, can be updated later
      });
      await user.save();
    }

    res.cookie('username', user.username, { httpOnly: true });
    res.status(200).json({
      message: "GitHub login successful",
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      age: user.age // Include age
    });
  } catch (error) {
    console.error("GitHub login error:", error);
    res.status(400).json({ error: 'GitHub login failed' });
  }
});

// Analyze Audio Route
app.post("/analyze_audio", upload.single('file'), async (req, res) => {
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

    res.json({ username, email: user.email, transcription, analysis });
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

    doc.fontSize(22).text('Mental Health Analysis Report', { align: 'center' });
    doc.fontSize(10).text(`Date: ${new Date().toLocaleString()}`, { align: 'left' });
    doc.moveDown();

    doc.fontSize(14).text('Transcription:');
    doc.fontSize(10).text(transcription || 'Not provided', { align: 'left' });
    doc.moveDown();

    doc.fontSize(14).text('Emotions Identified:');
    (analysis.Emotions || []).forEach(emotion => doc.text(`• ${emotion}`));
    doc.moveDown();

    doc.fontSize(14).text('Possible Reasons:');
    doc.fontSize(10).text(analysis.Reasons || 'Not provided', { align: 'justify' });
    doc.moveDown();

    doc.fontSize(14).text('Suggestions:');
    (analysis.Suggestions || []).forEach(suggestion => doc.text(`✔ ${suggestion}`));

    doc.end();

    res.download(filename, 'Analysis_Report.pdf', (err) => {
      if (!err) {
        fs.unlinkSync(filename);
      } else {
        console.error('Download error:', err);
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// Save Analysis Route
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

    res.json({ message: "Analysis saved successfully", username, email: user.email });
  } catch (error) {
    console.error("Error saving analysis:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Export All Analyses Route
app.post("/users/:username/export-analyses", async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const doc = new PDFDocument();
    const filename = `all_analyses_${username}_${Date.now()}.pdf`;
    doc.pipe(fs.createWriteStream(filename));

    doc.fontSize(22).text(`All Mental Health Analyses for ${username}`, { align: 'center' });
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'left' });
    doc.moveDown();

    user.analyses.forEach((analysis, index) => {
      doc.fontSize(16).text(`Analysis ${index + 1}`, { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(14).text('Transcription:');
      doc.fontSize(10).text(analysis.transcription || 'Not provided', { align: 'left' });
      doc.moveDown();

      doc.fontSize(14).text('Emotions Identified:');
      (analysis.analysis.Emotions || []).forEach(emotion => doc.text(`• ${emotion}`));
      doc.moveDown();

      doc.fontSize(14).text('Possible Reasons:');
      doc.fontSize(10).text(analysis.analysis.Reasons || 'Not provided', { align: 'justify' });
      doc.moveDown();

      doc.fontSize(14).text('Suggestions:');
      (analysis.analysis.Suggestions || []).forEach(suggestion => doc.text(`✔ ${suggestion}`));
      doc.moveDown();

      if (index < user.analyses.length - 1) doc.addPage();
    });

    doc.end();

    res.download(filename, `All_Analyses_${username}.pdf`, (err) => {
      if (!err) {
        fs.unlinkSync(filename);
      } else {
        console.error('Export error:', err);
        res.status(500).json({ error: "Failed to export analyses" });
      }
    });
  } catch (error) {
    console.error("Export error:", error.message);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// Delete Analysis Route
app.delete("/users/:username/analyses/:analysisId", async (req, res) => {
  const { username, analysisId } = req.params;
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('users');

    const result = await collection.updateOne(
      { username },
      { $pull: { analyses: { _id: new mongoose.Types.ObjectId(analysisId) } } }
    );

    if (result.modifiedCount === 0) {
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      const analysisExists = user.analyses.some(a => a._id.toString() === analysisId);
      if (!analysisExists) {
        return res.status(404).json({ success: false, message: "Analysis not found" });
      }
      return res.status(500).json({ success: false, message: "Failed to delete analysis" });
    }

    res.status(200).json({ success: true, message: "Analysis deleted successfully" });
  } catch (error) {
    console.error("Error deleting analysis:", error.message);
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
});

// Get All Users Route - Updated to include age
app.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .lean();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json({
      message: "Users retrieved successfully",
      count: users.length,
      users: users.map(user => ({
        ...user,
        avatar: user.avatar,
        age: user.age // Include age
      }))
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// Get User by Username Route - Updated to include age
app.get("/users/username", async (req, res) => {
  try {
    const username = req.cookies.username;

    if (!username) {
      return res.status(401).json({
        success: false,
        message: "No username found in cookies. Please log in."
      });
    }

    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        age: user.age, // Include age
        analyses: user.analyses
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

// Delete User Route
app.delete("/users/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId);
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

// Profile Routes
// Get User Profile - Updated to include age
app.get("/api/user/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username })
      .select('username email name avatar age -_id'); // Include age

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      username: user.username,
      email: user.email,
      name: user.name || user.username,
      avatar: user.avatar,
      age: user.age // Include age
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// Update User Profile - Updated to handle age with corrected syntax
app.put("/api/user/profile", authMiddleware, async (req, res) => {
  const { name, email, avatar, age } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (age && (isNaN(age) || age < 1 || age > 120)) {
    return res.status(400).json({ error: "Age must be a number between 1 and 120" });
  }

  try {
    const emailInUse = await User.findOne({
      email,
      username: { $ne: req.user.username }
    });
    if (emailInUse) {
      return res.status(400).json({ error: "Email already in use" }); // Corrected syntax
    }

    const updatedUser = await User.findOneAndUpdate(
      { username: req.user.username },
      { name, email, avatar, age }, // Include age
      { new: true, runValidators: true }
    ).select('username email name avatar age -_id');

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      username: updatedUser.username,
      email: updatedUser.email,
      name: updatedUser.name,
      avatar: updatedUser.avatar,
      age: updatedUser.age // Include age
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// Start Server
const PORT = 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

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
const twilio = require('twilio');
const emailjs = require('@emailjs/nodejs');
require('dotenv').config();
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'GOOGLE_CLIENT_ID',
  'EMAILJS_PUBLIC_KEY',
  'EMAILJS_PRIVATE_KEY',
  'EMAILJS_SERVICE_ID',
  'EMAILJS_TEMPLATE_ID'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());

// Initialize EmailJS
emailjs.init({
  publicKey: process.env.EMAILJS_PUBLIC_KEY,
  privateKey: process.env.EMAILJS_PRIVATE_KEY,
});

// MongoDB Atlas Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Updated User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String },
  email: { type: String, required: true, unique: true },
  name: { type: String },
  phoneNumber: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  githubId: { type: String, unique: true, sparse: true },
  avatar: { type: String },
  age: { type: Number, min: 1, max: 120 },
  followUpRequired: { type: Boolean, default: false },
  AppointmentApproved: { type: Boolean, default: false },
  firstVisit: { type: Boolean, default: true },
  bookedSlots: { type: Map, of: [String], default: {} },
  visits: { type: Number, default: 0 },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  appointments: [{
    date: { type: String, required: true },
    time: { type: String, required: true },
    doctor: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['Scheduled', 'Rescheduled', 'Cancelled'], default: 'Scheduled' }
  }],
  analyses: [{
    transcription: { type: String },
    analysis: {
      Emotions: [String],
      Reasons: String,
      Suggestions: [String],
    },
    createdAt: { type: Date, default: Date.now }
  }],
  session: {
    sessionActive: { type: Boolean, default: false },
    question: { type: String, default: '' },
    sessionEnded: { type: Boolean, default: false },
    responses: [{
      audioPath: { type: String, required: true },
      question: { type: String, required: true },
      language: { type: String, default: 'en' },
      createdAt: { type: Date, default: Date.now }
    }],
    latestAnalysis: {
      questions: [String],
      combined_analysis: String,
      createdAt: { type: Date }
    },
    updatedAt: { type: Date, default: Date.now }
  },
  messages: [{
    senderName: { type: String, required: true },
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
});

const User = mongoose.model("User", userSchema);

// File upload configuration
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientUsername: { type: String, required: true },
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", messageSchema);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /mp3|wav|m4a|webm/;
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

// Twilio Client Setup
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Forgot Password Route
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User with this email does not exist' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = verificationCode;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    await emailjs.send(process.env.EMAILJS_SERVICE_ID, process.env.EMAILJS_TEMPLATE_ID, {
      email: email,
      passcode: verificationCode,
    });

    res.status(200).json({ message: 'Verification code sent to email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Reset Password Route
app.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, verification code, and new password are required' });
  }

  try {
    const user = await User.findOne({
      email,
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Register Route
app.post("/register", async (req, res) => {
  const { username, password, email, name, phoneNumber, avatar, age } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ error: "Username, password, and email are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(phoneNumber)) {
    return res.status(400).json({ error: "Invalid phone number format" });
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
      name,
      phoneNumber,
      avatar,
      age,
      followUpRequired: false,
      AppointmentApproved: false,
      firstVisit: true,
      bookedSlots: {},
      appointments: [],
      messages: [],
      session: { sessionActive: false, question: '', sessionEnded: false, responses: [], latestAnalysis: null }
    });
    await user.save();

    res.status(201).json({
      message: "Registration successful",
      username,
      email,
      name,
      phoneNumber,
      avatar,
      age,
      followUpRequired: false,
      AppointmentApproved: false,
      appointments: [],
      messages: []
    });
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

    res.cookie('username', username, { httpOnly: false });
    res.status(200).json({
      message: "Login successful",
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      age: user.age,
      phoneNumber: user.phoneNumber,
      followUpRequired: user.followUpRequired,
      AppointmentApproved: user.AppointmentApproved,
      appointments: user.appointments,
      messages: user.messages
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

// Google Login Endpoint
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
app.post('/google-login', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
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
        name,
        followUpRequired: false,
        AppointmentApproved: false,
        firstVisit: true,
        bookedSlots: {},
        appointments: [],
        messages: [],
        analyses: [],
        age: null,
        session: { sessionActive: false, question: '', sessionEnded: false, responses: [], latestAnalysis: null }
      });
      await user.save();
    }

    res.cookie('username', user.username, { httpOnly: false });
    res.status(200).json({
      message: "Google login successful",
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      age: user.age,
      phoneNumber: user.phoneNumber,
      followUpRequired: user.followUpRequired,
      AppointmentApproved: user.AppointmentApproved,
      appointments: user.appointments,
      messages: user.messages
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(400).json({ error: 'Google login failed' });
  }
});

// Book Appointment Route
app.post("/api/book-appointment", authMiddleware, async (req, res) => {
  const { date, time, doctor } = req.body;

  if (!date || !time || !doctor) {
    return res.status(400).json({ error: "Date, time, and doctor are required" });
  }

  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if slot is already booked
    const isSlotTaken = user.bookedSlots.get(date)?.includes(time);
    if (isSlotTaken) {
      return res.status(400).json({ error: "This time slot is already booked" });
    }

    // Update booked slots
    const updatedSlots = user.bookedSlots.get(date) || [];
    updatedSlots.push(time);
    user.bookedSlots.set(date, updatedSlots);

    // Add appointment
    const newAppointment = {
      date,
      time,
      doctor,
      status: 'Scheduled',
      createdAt: new Date()
    };
    user.appointments.push(newAppointment);
    user.AppointmentApproved = true;
    user.firstVisit = false; // Mark first visit as complete

    await user.save();

    res.status(200).json({
      message: "Appointment booked successfully",
      user: {
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        followUpRequired: user.followUpRequired,
        AppointmentApproved: user.AppointmentApproved,
        appointments: user.appointments,
        messages: user.messages,
        firstVisit: user.firstVisit
      }
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// Get Booked Slots Route
app.get("/api/booked-slots", authMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('bookedSlots');
    const allBookedSlots = {};

    users.forEach(user => {
      user.bookedSlots.forEach((times, date) => {
        if (!allBookedSlots[date]) {
          allBookedSlots[date] = [];
        }
        allBookedSlots[date].push(...times);
      });
    });

    res.status(200).json(allBookedSlots);
  } catch (error) {
    console.error("Error fetching booked slots:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// Update User Status Route
app.patch("/api/user/update-status", authMiddleware, async (req, res) => {
  const { followUpRequired, firstVisit } = req.body;

  if (typeof followUpRequired !== 'boolean' || typeof firstVisit !== 'boolean') {
    return res.status(400).json({ error: "followUpRequired and firstVisit must be booleans" });
  }

  try {
    const user = await User.findOneAndUpdate(
      { username: req.user.username },
      { followUpRequired, firstVisit },
      { new: true, runValidators: true }
    ).select('username email phoneNumber followUpRequired AppointmentApproved appointments firstVisit messages');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "User status updated successfully",
      user: {
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        followUpRequired: user.followUpRequired,
        AppointmentApproved: user.AppointmentApproved,
        appointments: user.appointments,
        firstVisit: user.firstVisit,
        messages: user.messages
      }
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});
// Message Schema


// Updated /api/messages Endpoint
// Get Messages for Authenticated User
app.get('/api/messages', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username }).select('username');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const messages = await Message.find({ recipientUsername: user.username })
      .select('senderId senderName content read createdAt')
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
      message: 'Messages retrieved successfully',
      messages: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});
app.post('/api/messages', authMiddleware, async (req, res) => {
  const { username, content } = req.body;

  if (!username || !content) {
    return res.status(400).json({ error: 'Username and message content are required' });
  }

  if (typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'Message content must be a non-empty string' });
  }

  try {
    const recipient = await User.findOne({ username });
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient user not found' });
    }

    const sender = await User.findOne({ username: req.user.username });
    if (!sender) {
      return res.status(404).json({ error: 'Sender user not found' });
    }

    const message = new Message({
      senderId: sender._id,
      recipientUsername: username,
      senderName: sender.username,
      content: content.trim(),
      read: false,
      createdAt: new Date()
    });

    await message.save();

    res.status(200).json({
      message: 'Message sent successfully',
      data: {
        senderId: message.senderId,
        recipientUsername: message.recipientUsername,
        senderName: message.senderName,
        content: message.content,
        read: message.read,
        createdAt: message.createdAt
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});
// Mark Message as Read Route
app.patch("/api/messages/:messageId/read", authMiddleware, async (req, res) => {
  const { messageId } = req.params;

  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const message = user.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    message.read = true;
    await user.save();

    res.status(200).json({
      message: "Message marked as read",
      messages: user.messages
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// Existing routes from original server.js (unchanged)
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

    res.json({
      username,
      email: user.email,
      transcription,
      analysis,
      followUpRequired: user.followUpRequired,
      AppointmentApproved: user.AppointmentApproved,
      appointments: user.appointments,
      messages: user.messages
    });
  } catch (error) {
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

app.post("/generate_pdf", async (req, res) => {
  const { analysis } = req.body;

  if (!analysis) {
    return res.status(400).json({ error: "Analysis data is required" });
  }

  try {
    const doc = new PDFDocument();
    const filename = `mental_health_report_${Date.now()}.pdf`;
    doc.pipe(fs.createWriteStream(filename));

    doc.fontSize(22).text('Mental Health Analysis Report', { align: 'center' });
    doc.fontSize(10).text(`Date: ${new Date().toLocaleString()}`, { align: 'left' });
    doc.moveDown();

    doc.fontSize(14).text('Emotions Identified:');
    (analysis.Emotions || []).forEach(emotion => doc.text(`• ${emotion}`));
    doc.moveDown();

    doc.fontSize(14).text('Tones Identified:');
    (analysis.Tones || []).forEach(tone => doc.text(`• ${tone}`));
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

app.post('/save_analysis', async (req, res) => {
  try {
    const { userId, transcriptions, analyses, questions, combinedAnalysis } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!transcriptions || !analyses || !questions || transcriptions.length !== analyses.length || transcriptions.length !== questions.length || transcriptions.length === 0) {
      return res.status(400).json({ error: 'Transcriptions, analyses, and questions are required and must match in length' });
    }

    if (!combinedAnalysis) {
      return res.status(400).json({ error: 'Combined analysis is required' });
    }

    const transcriptionsToSave = transcriptions.map((text, index) => ({
      question: questions[index],
      text
    }));

    const analysisData = {
      transcriptions: transcriptionsToSave,
      individual_analyses: analyses,
      combined_analysis: combinedAnalysis,
      createdAt: new Date()
    };

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'session.latestAnalysis': analysisData,
          'session.updatedAt': new Date()
        },
        $inc: { visits: 1 }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'Analysis saved successfully', visits: user.visits });
  } catch (error) {
    console.error('Error saving analysis:', error);
    res.status(500).json({ error: 'Failed to save analysis' });
  }
});

app.get('/users/username/latest_analysis', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username })
      .select('session.latestAnalysis');
    if (!user || !user.session || !user.session.latestAnalysis) {
      return res.status(404).json({ success: false, message: 'No latest analysis found' });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user.session.latestAnalysis._id || 'latest',
        combined_analysis: user.session.latestAnalysis.combined_analysis,
        createdAt: user.session.latestAnalysis.createdAt,
        questions: user.session.latestAnalysis.questions
      }
    });
  } catch (error) {
    console.error('Error fetching latest analysis:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

app.delete('/users/username/latest_analysis', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || !user.session || !user.session.latestAnalysis) {
      return res.status(404).json({ success: false, message: 'No latest analysis found' });
    }

    user.session.latestAnalysis = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Latest analysis deleted successfully' });
  } catch (error) {
    console.error('Error deleting latest analysis:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

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
      doc.fontSize(10).text(analysis.analysis.Reasons || 'Not provided', { align: 'left' });
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

app.delete("/users/:username/analyses/:analysisId", async (req, res) => {
  const { username, analysisId } = req.params;
  try {
    const result = await User.updateOne(
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

app.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .select('username email phoneNumber age followUpRequired AppointmentApproved appointments analyses googleId githubId avatar session messages')
      .lean();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json({
      message: "Users retrieved successfully",
      count: users.length,
      users
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

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
    }).select('username email phoneNumber age followUpRequired AppointmentApproved appointments analyses avatar messages');

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
        phoneNumber: user.phoneNumber,
        age: user.age,
        followUpRequired: user.followUpRequired,
        AppointmentApproved: user.AppointmentApproved,
        appointments: user.appointments,
        analyses: user.analyses,
        avatar: user.avatar,
        messages: user.messages
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

app.patch("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { followUpRequired } = req.body;

  if (typeof followUpRequired !== 'boolean') {
    return res.status(400).json({ error: "followUpRequired must be a boolean" });
  }

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { followUpRequired },
      { new: true, runValidators: true }
    ).select('username email phoneNumber age followUpRequired AppointmentApproved appointments analyses avatar messages');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Follow-up status updated successfully",
      user
    });
  } catch (error) {
    console.error("Error updating follow-up status:", error.message);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// Profile Routes
app.get("/api/user/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username })
      .select('username email name avatar age phoneNumber followUpRequired AppointmentApproved appointments visits messages');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      username: user.username,
      email: user.email,
      name: user.name || user.username,
      avatar: user.avatar,
      age: user.age,
      phoneNumber: user.phoneNumber,
      followUpRequired: user.followUpRequired,
      AppointmentApproved: user.AppointmentApproved,
      appointments: user.appointments,
      visits: user.visits,
      messages: user.messages
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

app.put("/api/user/profile", authMiddleware, async (req, res) => {
  const { name, email, avatar, age, phoneNumber } = req.body;

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

  if (phoneNumber) {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }
  }

  try {
    const emailInUse = await User.findOne({
      email,
      username: { $ne: req.user.username }
    });
    if (emailInUse) {
      return res.status(400).json({ error: "Email already in use" });
    }

    if (phoneNumber) {
      const phoneInUse = await User.findOne({
        phoneNumber,
        username: { $ne: req.user.username }
      });
      if (phoneInUse) {
        return res.status(400).json({ error: "Phone number already in use" });
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { username: req.user.username },
      { name, email, avatar, age, phoneNumber },
      { new: true, runValidators: true }
    ).select('username email name avatar age phoneNumber followUpRequired AppointmentApproved appointments messages');

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      username: updatedUser.username,
      email: updatedUser.email,
      name: updatedUser.name,
      avatar: updatedUser.avatar,
      age: updatedUser.age,
      phoneNumber: updatedUser.phoneNumber,
      followUpRequired: updatedUser.followUpRequired,
      AppointmentApproved: updatedUser.AppointmentApproved,
      appointments: updatedUser.appointments,
      messages: updatedUser.messages
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

app.post("/api/send-sms", authMiddleware, async (req, res) => {
  const { phoneNumber, date, time, status = 'Scheduled' } = req.body;
  if (!phoneNumber || !date || !time) {
    return res.status(400).json({ error: "Phone number, date, and time are required" });
  }

  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({ error: "Invalid phone number format. Must include country code (e.g., +91)" });
  }

  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || user.phoneNumber !== phoneNumber.replace('+91', '')) {
      return res.status(403).json({ error: "Phone number does not match user profile" });
    }

    let messageBody;
    switch(status) {
      case 'Rescheduled':
        messageBody = `Hi, your appointment with Dr. Prashik has been rescheduled to ${date} at ${time}`;
        break;
      case 'Cancelled':
        messageBody = `Hi, your appointment with Dr. Prashik on ${date} at ${time} has been cancelled`;
        break;
      case 'Scheduled':
      default:
        messageBody = `Hi, just a reminder: you're set to see Dr. Prashik on ${date} at ${time}`;
    }

    const message = await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log('SMS sent:', message.sid);
    res.status(200).json({ message: "SMS sent successfully", sid: message.sid });
  } catch (error) {
    console.error("Twilio error:", error);
    res.status(500).json({ error: "Failed to send SMS", details: error.message });
  }
});

app.patch("/api/user/approve-appointment", authMiddleware, async (req, res) => {
  const { date, time, doctor } = req.body;

  if (!date || !time || !doctor) {
    return res.status(400).json({ error: "Date, time, and doctor are required" });
  }

  try {
    const user = await User.findOneAndUpdate(
      { username: req.user.username },
      {
        $set: { AppointmentApproved: true },
        $push: {
          appointments: {
            date,
            time,
            doctor,
            status: 'Scheduled',
            createdAt: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    ).select('username email phoneNumber AppointmentApproved followUpRequired appointments messages');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Appointment approved and saved successfully",
      user: {
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        AppointmentApproved: user.AppointmentApproved,
        followUpRequired: user.followUpRequired,
        appointments: user.appointments,
        messages: user.messages
      }
    });
  } catch (error) {
    console.error("Error approving appointment:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

app.post("/api/reschedule-appointment", authMiddleware, async (req, res) => {
  const { userId, appointmentIndex, newDate, newTime } = req.body;

  if (!userId || appointmentIndex === undefined || !newDate || !newTime) {
    return res.status(400).json({ error: "User ID, appointment index, new date, and new time are required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.appointments || user.appointments.length <= appointmentIndex) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    user.appointments[appointmentIndex] = {
      ...user.appointments[appointmentIndex].toObject(),
      date: newDate,
      time: newTime,
      status: 'Rescheduled',
      createdAt: new Date()
    };

    await user.save();

    if (user.phoneNumber) {
      let formattedPhoneNumber = user.phoneNumber;
      if (!formattedPhoneNumber.startsWith('+')) {
        formattedPhoneNumber = `+91${formattedPhoneNumber}`;
      }
      try {
        await client.messages.create({
          body: `Hi, your appointment with Dr. Prashik has been rescheduled to ${newDate} at ${newTime}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedPhoneNumber
        });
      } catch (smsError) {
        console.error("Failed to send SMS:", smsError.message);
      }
    }

    res.status(200).json({
      message: "Appointment rescheduled successfully",
      appointment: user.appointments[appointmentIndex]
    });
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

app.post("/api/cancel-appointment", authMiddleware, async (req, res) => {
  const { userId, appointmentIndex } = req.body;

  if (!userId || appointmentIndex === undefined) {
    return res.status(400).json({ error: "User ID and appointment index are required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.appointments || user.appointments.length <= appointmentIndex) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const cancelledAppointment = user.appointments[appointmentIndex].toObject();
    user.appointments[appointmentIndex] = {
      ...cancelledAppointment,
      status: 'Cancelled'
    };

    const hasActiveAppointments = user.appointments.some(appt => appt.status !== 'Cancelled');
    user.AppointmentApproved = hasActiveAppointments;

    await user.save();

    if (user.phoneNumber) {
      let formattedPhoneNumber = user.phoneNumber;
      if (!formattedPhoneNumber.startsWith('+')) {
        formattedPhoneNumber = `+91${formattedPhoneNumber}`;
      }
      try {
        await client.messages.create({
          body: `Hi, your appointment with Dr. Prashik on ${cancelledAppointment.date} at ${cancelledAppointment.time} has been cancelled`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedPhoneNumber
        });
      } catch (smsError) {
        console.error("Failed to send SMS:", smsError.message);
      }
    }

    res.status(200).json({
      message: "Appointment cancelled successfully",
      appointments: user.appointments,
      AppointmentApproved: user.AppointmentApproved
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

app.get('/api/session/active', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username })
      .select('session');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({
      active: user.session.sessionActive,
      question: user.session.question,
      sessionEnded: user.session.sessionEnded
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.post('/api/session/start', authMiddleware, async (req, res) => {
  const { userId, question } = req.body;

  if (!userId || !question) {
    return res.status(400).json({ error: 'User ID and question are required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'session.sessionActive': true,
          'session.question': question,
          'session.sessionEnded': false,
          'session.responses': [],
          'session.latestAnalysis': null,
          'session.updatedAt': new Date()
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`Session started for user ${userId} with question: ${question}`);
    res.status(200).json({ message: 'Session started' });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.post('/api/session/record_response', authMiddleware, upload.single('file'), async (req, res) => {
  const { question, language } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'Audio file is required' });
  }

  if (!question || !language) {
    return res.status(400).json({ error: 'Question and language are required' });
  }

  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.session.sessionActive || user.session.question !== question) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'No active session or invalid question' });
    }

    if (user.session.responses.length > 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Response already recorded for this session' });
    }

    const response = {
      audioPath: req.file.path,
      question,
      language,
      createdAt: new Date()
    };

    user.session.responses.push(response);
    await user.save();

    res.status(200).json({ message: 'Response recorded successfully' });
  } catch (error) {
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error recording response:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.get('/api/session/responses/:userId', authMiddleware, async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.session.sessionActive) {
      return res.status(400).json({ error: 'No active session for this user' });
    }

    const responses = user.session.responses.map(response => ({
      audioPath: response.audioPath,
      question: response.question,
      language: response.language,
      createdAt: response.createdAt
    }));

    res.status(200).json({ responses });
  } catch (error) {
    console.error('Error fetching session responses:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.post('/api/session/save_analysis', authMiddleware, async (req, res) => {
  const { userId, questions, combinedAnalysis } = req.body;

  if (!userId || !questions || !combinedAnalysis) {
    return res.status(400).json({ error: 'User ID, questions, and combined analysis are required' });
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Questions must be a non-empty array' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.session.latestAnalysis = {
      questions,
      combined_analysis: combinedAnalysis,
      createdAt: new Date()
    };

    user.visits += 1;

    user.session.responses.forEach(response => {
      if (fs.existsSync(response.audioPath)) {
        fs.unlinkSync(response.audioPath);
      }
    });

    user.session.responses = [];
    await user.save();

    res.status(200).json({ message: 'Analysis saved successfully', visits: user.visits });
  } catch (error) {
    console.error('Error saving session analysis:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.get('/api/session/latest_analysis', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username })
      .select('session.latestAnalysis');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      analysis: user.session.latestAnalysis
    });
  } catch (error) {
    console.error('Error fetching latest analysis:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.get('/api/session/latest_analysis1', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username })
      .select('session.latestAnalysis');
    if (!user) {
      console.log('User not found for username:', req.user.username);
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.session || !user.session.latestAnalysis) {
      console.log('No latest analysis for user:', req.user.username);
      return res.status(404).json({ error: 'No latest analysis available' });
    }

    const response = {
      analysis: {
        questions: user.session.latestAnalysis.questions || [],
        combined_analysis: user.session.latestAnalysis.combined_analysis || 'Not provided',
        createdAt: user.session.latestAnalysis.createdAt || new Date()
      }
    };
    console.log('Sending latest analysis for user:', req.user.username, response);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching latest analysis:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.post('/api/session/end', authMiddleware, async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.session.sessionActive) {
      return res.status(400).json({ error: 'No active session for this user' });
    }

    user.session.responses.forEach(response => {
      if (fs.existsSync(response.audioPath)) {
        fs.unlinkSync(response.audioPath);
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'session.sessionActive': false,
          'session.question': '',
          'session.sessionEnded': true,
          'session.responses': [],
          'session.updatedAt': new Date()
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`Session ended for user ${userId}`);
    res.status(200).json({ message: 'Session ended' });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});
app.patch('/api/messages/:messageId/read', authMiddleware, async (req, res) => {
  const { messageId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    return res.status(400).json({ error: 'Invalid Message ID' });
  }

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const user = await User.findOne({ username: req.user.username });
    if (!user || message.recipientId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to mark this message as read' });
    }

    message.read = true;
    await message.save();

    res.status(200).json({
      message: 'Message marked as read',
      data: {
        _id: message._id,
        senderId: message.senderId,
        senderName: message.senderName,
        content: message.content,
        read: message.read,
        createdAt: message.createdAt
      }
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});
const PORT = process.env.PORT1 || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

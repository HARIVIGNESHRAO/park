const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 4200; // Changed to match the frontend axios call port

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://harisonu151:zZYoHOEqz8eiI3qP@salaar.st5tm.mongodb.net/park', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Contact Schema & Model
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  date: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema, 'contact');

// Journal Entry Schema & Model
const journalEntrySchema = new mongoose.Schema({
  username: String,
  content: String,
  mood: String,
  date: { type: Date, default: Date.now }
});

const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema, 'journalEntries');

// Routes for Contact
app.post('/api/contact', async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();
    res.status(201).json({ message: 'Contact form submitted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving contact form', error });
  }
});

// Routes for Journal Entries
// Save a new journal entry
app.post('/api/journal', async (req, res) => {
  try {
    const { username, content, mood } = req.body;
    const journalEntry = new JournalEntry({ username, content, mood });
    await journalEntry.save();
    res.status(201).json({ message: 'Journal entry saved successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving journal entry', error });
  }
});

// Get journal entries for a specific user
app.get('/api/journal/:username', async (req, res) => {
  try {
    const entries = await JournalEntry.find({ username: req.params.username }).sort({ date: -1 });
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching journal entries', error });
  }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
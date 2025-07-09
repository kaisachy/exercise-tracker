require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User');
const Exercise = require('./models/Exercise');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Database connection
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

// Routes
// Create User
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    const newUser = new User({ username });
    const savedUser = await newUser.save();
    res.json({ username: savedUser.username, _id: savedUser._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get All Users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const userId = req.params._id;
    const { description, duration, date } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const newExercise = new Exercise({
      userId,
      description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date()
    });
    
    const savedExercise = await newExercise.save();
    
    res.json({
      _id: user._id,
      username: user.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: savedExercise.date.toDateString()
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get Exercise Log
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const userId = req.params._id;
    const { from, to, limit } = req.query;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    let filter = { userId };
    let dateFilter = {};
    
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    if (from || to) filter.date = dateFilter;
    
    let query = Exercise.find(filter);
    if (limit) query = query.limit(parseInt(limit));
    
    const exercises = await query.exec();
    
    const log = exercises.map(ex => ({
      description: ex.description,
      duration: ex.duration,
      date: ex.date.toDateString()
    }));
    
    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');
const Notification = require('../models/Notification');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify token and check role
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

const instructorOnly = (req, res, next) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ message: 'Access denied. Instructors only.' });
  }
  next();
};

// Get all polls
router.get('/', authMiddleware, async (req, res) => {
  try {
    const polls = await Poll.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(polls);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching polls', error: error.message });
  }
});

// Create poll (instructor only)
router.post('/', authMiddleware, instructorOnly, async (req, res) => {
  try {
    const { question, options } = req.body;
    
    const poll = new Poll({
      question,
      options: options.map(opt => ({ text: opt, votes: 0, voters: [] })),
      instructorId: req.user.userId,
      instructorName: req.user.username
    });

    await poll.save();

    // Create notifications for all students
    const students = await User.find({ role: 'student' });
    if (students.length > 0) {
      const notifications = students.map(student => ({
        userId: student._id,
        type: 'poll',
        title: 'New Poll Created',
        message: `${req.user.username} created a new poll: ${question}`,
        link: '/polls'
      }));

      await Notification.insertMany(notifications);

      // Emit real-time notification via Socket.io to connected students
      const io = req.app.get('io');
      const connectedUsers = req.app.get('connectedUsers');
      
      students.forEach(student => {
        const studentId = student._id.toString();
        const socketId = connectedUsers.get(studentId);
        
        if (socketId) {
          io.to(socketId).emit('notification', {
            userId: studentId,
            type: 'poll',
            title: 'New Poll Created',
            message: `${req.user.username} created: ${question}`,
            link: '/polls',
            timestamp: new Date()
          });
          console.log(`📧 Sent poll notification to student ${studentId}`);
        }
      });
    }

    res.status(201).json(poll);
  } catch (error) {
    res.status(500).json({ message: 'Error creating poll', error: error.message });
  }
});

// Vote on poll (students only)
router.post('/:id/vote', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can vote' });
    }

    const { optionIndex } = req.body;
    const poll = await Poll.findById(req.params.id);
    
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Check if user already voted
    const alreadyVoted = poll.options.some(opt => 
      opt.voters.some(voter => voter.toString() === req.user.userId)
    );

    if (alreadyVoted) {
      return res.status(400).json({ message: 'You have already voted on this poll' });
    }

    // Add vote
    poll.options[optionIndex].votes += 1;
    poll.options[optionIndex].voters.push(req.user.userId);
    await poll.save();

    res.json(poll);
  } catch (error) {
    res.status(500).json({ message: 'Error voting on poll', error: error.message });
  }
});

// Delete poll (instructor only)
router.delete('/:id', authMiddleware, instructorOnly, async (req, res) => {
  try {
    const poll = await Poll.findByIdAndDelete(req.params.id);
    
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    res.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting poll', error: error.message });
  }
});

module.exports = router;

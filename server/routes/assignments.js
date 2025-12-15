const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
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

// Get all assignments
router.get('/', authMiddleware, async (req, res) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
});

// Create assignment (instructor only)
router.post('/', authMiddleware, instructorOnly, async (req, res) => {
  try {
    const { title, description, dueDate, isEditable, type } = req.body;
    
    const assignment = new Assignment({
      title,
      description,
      dueDate,
      isEditable,
      type: type || 'individual',
      instructorId: req.user.userId,
      instructorName: req.user.username
    });

    await assignment.save();

    // Create notifications for all students
    const students = await User.find({ role: 'student' });
    console.log(`📊 Found ${students.length} students in database`);
    
    if (students.length > 0) {
      const notifications = students.map(student => ({
        userId: student._id,
        type: 'assignment',
        title: 'New Assignment Posted',
        message: `${req.user.username} posted a new assignment: ${title}`,
        link: `/room/${title.toLowerCase().replace(/\s+/g, '-')}`
      }));

      await Notification.insertMany(notifications);
      console.log(`💾 Saved ${notifications.length} notifications to database`);

      // Emit real-time notification via Socket.io to connected students
      const io = req.app.get('io');
      const connectedUsers = req.app.get('connectedUsers');
      console.log(`👥 Connected users:`, Array.from(connectedUsers.keys()));
      
      students.forEach(student => {
        const studentId = student._id.toString();
        const socketId = connectedUsers.get(studentId);
        
        if (socketId) {
          io.to(socketId).emit('notification', {
            userId: studentId,
            type: 'assignment',
            title: 'New Assignment Posted',
            message: `${req.user.username} posted: ${title}`,
            link: `/room/${title.toLowerCase().replace(/\s+/g, '-')}`,
            timestamp: new Date()
          });
          console.log(`📧 Sent assignment notification to student ${studentId} (socket: ${socketId})`);
        } else {
          console.log(`⚠️  Student ${studentId} (${student.username}) not connected`);
        }
      });
    }

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating assignment', error: error.message });
  }
});

// Update assignment editability (instructor only)
router.patch('/:id/editability', authMiddleware, instructorOnly, async (req, res) => {
  try {
    const { isEditable } = req.body;
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { isEditable },
      { new: true }
    );
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating assignment', error: error.message });
  }
});

// Get submissions for an assignment (instructor only)
router.get('/:id/submissions', authMiddleware, instructorOnly, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Get student details for each submission
    const submissionsWithDetails = await Promise.all(
      assignment.submissions.map(async (submission) => {
        const student = await User.findById(submission.studentId).select('name email username');
        return {
          _id: submission._id,
          content: submission.description,
          fileUrl: submission.fileUrl,
          fileName: submission.fileName,
          submittedAt: submission.submittedAt,
          student: {
            name: student?.name || student?.username || 'Unknown',
            email: student?.email
          }
        };
      })
    );

    res.json(submissionsWithDetails);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
});

// Submit assignment (student only)
router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    const { description, fileUrl, fileName } = req.body;
    
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if assignment type is individual
    if (assignment.type !== 'individual') {
      return res.status(400).json({ message: 'This is a group assignment. Use the collaboration room instead.' });
    }

    // Check if student already submitted
    const existingSubmission = assignment.submissions.find(
      sub => sub.studentId.toString() === req.user.userId
    );

    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this assignment' });
    }

    // Add submission
    assignment.submissions.push({
      studentId: req.user.userId,
      studentName: req.user.username,
      description,
      fileUrl,
      fileName,
      submittedAt: new Date()
    });

    await assignment.save();

    res.json({ message: 'Assignment submitted successfully', assignment });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ message: 'Error submitting assignment', error: error.message });
  }
});

// Delete assignment (instructor only)
router.delete('/:id', authMiddleware, instructorOnly, async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting assignment', error: error.message });
  }
});

module.exports = router;

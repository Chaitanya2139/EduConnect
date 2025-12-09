const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Student', 'Instructor', 'TA'], 
    default: 'Student' 
  },
  // "Crazy" Feature: Gamification badges for the dashboard
  badges: [{ 
    title: String, 
    icon: String, 
    awardedAt: Date 
  }],
  // Track which courses they are actively viewing for "Who's Online" features
  activeSessionId: { type: String, default: null } 
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
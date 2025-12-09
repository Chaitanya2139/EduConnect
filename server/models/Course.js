const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // The Modules (Lectures/Materials)
  modules: [{
    title: String,
    type: { type: String, enum: ['video', 'document', 'quiz'] },
    contentUrl: String, // URL to video or static asset
    
    // For collaborative docs, we store the initial "template" state
    // The live edits happen via WebSocket, periodically saved back here
    documentContent: { type: Object, default: {} } 
  }],

  // Real-time Chat Channels for this specific course
  channels: [{
    name: String, // e.g., "General", "Project-Help"
    type: { type: String, enum: ['text', 'voice'] }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatarColor: { type: String, default: '#3b82f6' } // Store a unique color for their cursor
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
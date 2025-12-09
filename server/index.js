const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Setup Socket.io for Real-time
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your Vite Client URL
    methods: ["GET", "POST"]
  }
});

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/educonnect')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Simple Test Route
app.get('/', (req, res) => res.send('Server is running'));

// Socket Event Listeners
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // We will add collaboration logic here later
});

server.listen(3001, () => {
  console.log('SERVER RUNNING ON PORT 3001');
});
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const WebSocket = require('ws');
const cors = require('cors');
const mongoose = require('mongoose');
const Y = require('yjs');
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

// Setup WebSocket for Y.js collaboration on a specific path
const wss = new WebSocket.Server({ 
  noServer: true  // We'll handle upgrade manually
});

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/educonnect')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Define Schema for storing Yjs updates
const DocumentSchema = new mongoose.Schema({
  name: String,
  data: Buffer,
});
const DocModel = mongoose.model('Document', DocumentSchema);

// Connected users map for Socket.io
const connectedUsers = new Map(); // Map userId to socketId

// Import Routes
const authRoutes = require('./routes/auth');
const assignmentRoutes = require('./routes/assignments');
const pollRoutes = require('./routes/polls');
const notificationRoutes = require('./routes/notifications');

// Make io and connectedUsers available to routes
app.set('io', io);
app.set('connectedUsers', connectedUsers);

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/notifications', notificationRoutes);

// Simple Test Route
app.get('/', (req, res) => res.send('Server is running'));

// --- Y.js Document Storage ---
const docs = new Map();

/**
 * Gets a Y.Doc from memory. If not found, tries to load from MongoDB.
 */
const getYDoc = async (docname) => {
  if (docs.has(docname)) {
    return docs.get(docname);
  }

  const doc = new Y.Doc();
  docs.set(docname, doc);

  // Load from MongoDB
  const dbDoc = await DocModel.findOne({ name: docname });
  if (dbDoc && dbDoc.data) {
    console.log(`📂 Loaded "${docname}" from DB`);
    Y.applyUpdate(doc, dbDoc.data);
  } else {
    console.log(`🆕 Created new doc "${docname}"`);
  }

  return doc;
};

/**
 * Saves a Y.Doc to MongoDB
 */
const saveToDB = (docname, doc) => {
  const update = Y.encodeStateAsUpdate(doc);
  DocModel.findOneAndUpdate(
    { name: docname },
    { data: Buffer.from(update) },
    { upsert: true, new: true }
  ).then(() => {
    // console.log(`💾 Saved "${docname}"`);
  }).catch(err => console.error('Save Error:', err));
};

// --- WebSocket Logic for Y.js Collaboration ---
wss.on('connection', async (conn, req) => {
  console.log('🔌 WebSocket client connected:', req.url);
  
  // Heartbeat to keep connection alive
  conn.isAlive = true;
  conn.on('pong', () => { conn.isAlive = true; });

  // Parse room name from URL (e.g., ws://localhost:3001/room-name)
  const docName = req.url.slice(1).split('?')[0] || 'default';
  console.log('📝 Document name:', docName);
  
  // Get or load document from database
  const doc = await getYDoc(docName);
  
  // Set the doc on the connection object for easy access later
  conn.doc = doc;

  // --- INITIAL SYNC ---
  // When a client connects, send them the current document state immediately.
  const encoder = Y.encodeStateAsUpdate(doc);
  if (encoder.length > 0) {
      const message = new Uint8Array([0, ...encoder]);
      conn.send(message);
  }

  // --- HANDLE INCOMING MESSAGES ---
  conn.on('message', (message) => {
    try {
      // Convert to Uint8Array to read bytes
      const data = new Uint8Array(message);
      const messageType = data[0];
      const payload = data.slice(1);
      
      if (messageType === 0) {
        // Document update - apply to server's document
        Y.applyUpdate(doc, payload);
        
        // Save to MongoDB
        saveToDB(docName, doc);
      }
      
      // Broadcast to everyone else in this room (both doc and awareness)
      wss.clients.forEach(client => {
          if (client !== conn && client.readyState === WebSocket.OPEN && client.doc === doc) {
              client.send(message);
          }
      });
    } catch (error) {
      console.error('Error processing update:', error);
    }
  });

  conn.on('close', () => {
    // Cleanup logic could go here
  });
});

// --- Keep-Alive Loop ---
setInterval(() => {
  wss.clients.forEach(conn => {
    if (conn.isAlive === false) return conn.terminate();
    conn.isAlive = false;
    conn.ping();
  });
}, 30000);

// Socket.io Event Listeners (for notifications and video chat)
io.on('connection', (socket) => {
  console.log(`🔌 Socket.io client connected: ${socket.id}`);

  // Register user
  socket.on('register', (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`👤 User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    // Remove user from map
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`👋 User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Handle WebSocket upgrade manually
server.on('upgrade', (request, socket, head) => {
  const pathname = request.url;
  console.log('⬆️  Upgrade request received for:', pathname);
  
  // Only handle non-socket.io WebSocket connections
  if (!pathname.startsWith('/socket.io')) {
    console.log('✅ Handling WebSocket upgrade for Y.js');
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    console.log('⏩ Skipping socket.io upgrade');
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
});
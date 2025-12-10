const http = require('http');
const WebSocket = require('ws');
const Y = require('yjs');
const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./models/User');

// --- 1. Database Setup ---
const mongoURI = 'mongodb://127.0.0.1:27017/educonnect';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Define Schema for storing Yjs updates
const DocumentSchema = new mongoose.Schema({
  name: String,
  data: Buffer,
});
const DocModel = mongoose.model('Document', DocumentSchema);

const JWT_SECRET = 'your_super_secret_key_123'; // In production, use .env

// --- 2. Basic Server Setup ---
const app = express();
app.use(cors());
app.use(express.json());

// --- API ROUTES ---

// 1. SIGNUP
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const randomColor = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)];
    
    const user = await User.create({
      username, 
      email, 
      password: hashedPassword,
      avatarColor: randomColor
    });

    res.json({ message: 'User created' });
  } catch (err) {
    res.status(400).json({ error: 'User already exists' });
  }
});

// 2. LOGIN
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  
  if (!user) return res.status(400).json({ error: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

  // Create Token
  const token = jwt.sign({ id: user._id, username: user.username, color: user.avatarColor }, JWT_SECRET);
  
  res.json({ token, user: { username: user.username, email: user.email, color: user.avatarColor } });
});

const port = process.env.PORT || 1234;
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// --- 3. Document Storage ---
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

// --- 4. WebSocket Logic ---
wss.on('connection', async (conn, req) => {
  // Heartbeat to keep connection alive
  conn.isAlive = true;
  conn.on('pong', () => { conn.isAlive = true; });

  // Parse room name from URL (e.g., ws://localhost:1234/room-name)
  const docName = req.url.slice(1).split('?')[0] || 'default';
  
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

// --- 5. Keep-Alive Loop ---
setInterval(() => {
  wss.clients.forEach(conn => {
    if (conn.isAlive === false) return conn.terminate();
    conn.isAlive = false;
    conn.ping();
  });
}, 30000);

// --- 6. Start ---
server.listen(port, () => {
  console.log(`🚀 Persisted Collaboration Server running on port ${port}`);
});
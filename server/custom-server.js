const http = require('http');
const WebSocket = require('ws');
const Y = require('yjs');

// --- 1. Basic Server Setup ---
const port = process.env.PORT || 1234;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Pure Collaboration Server Running');
});
const wss = new WebSocket.Server({ server });

// --- 2. Document Storage ---
const docs = new Map();

// Helper: Get or create a Y.Doc for a specific room
const getYDoc = (docname) => {
  if (!docs.has(docname)) {
    const doc = new Y.Doc();
    docs.set(docname, doc);
  }
  return docs.get(docname);
};

// --- 3. The Logic ---
wss.on('connection', (conn, req) => {
  // Heartbeat to keep connection alive
  conn.isAlive = true;
  conn.on('pong', () => { conn.isAlive = true; });

  // Parse room name from URL (e.g., ws://localhost:1234/room-name)
  const docName = req.url.slice(1).split('?')[0] || 'default';
  const doc = getYDoc(docName);
  
  // Set the doc on the connection object for easy access later
  conn.doc = doc;

  // --- INITIAL SYNC ---
  // When a client connects, send them the current document state immediately.
  const encoder = Y.encodeStateAsUpdate(doc);
  if (encoder.length > 0) {
      conn.send(encoder);
  }

  // --- HANDLE INCOMING MESSAGES ---
  conn.on('message', (message) => {
    try {
      // Convert to Uint8Array to read bytes
      const update = new Uint8Array(message);
      
      // Apply update to the server's document
      Y.applyUpdate(doc, update);
      
      // Broadcast to everyone else in this room
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

// --- 4. Keep-Alive Loop ---
setInterval(() => {
  wss.clients.forEach(conn => {
    if (conn.isAlive === false) return conn.terminate();
    conn.isAlive = false;
    conn.ping();
  });
}, 30000);

// --- 5. Start ---
server.listen(port, () => {
  console.log(`🚀 Pure Collaboration Server running on port ${port}`);
});
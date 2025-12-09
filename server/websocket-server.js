const http = require('http');
const WebSocket = require('ws');
const Y = require('yjs');

const port = 1234;

// Simple in-memory document store
const docs = new Map();

function getYDoc(docname) {
  if (!docs.has(docname)) {
    docs.set(docname, new Y.Doc());
  }
  return docs.get(docname);
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Collaboration Server Running');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const roomName = req.url.slice(1) || 'default';
  
  const doc = getYDoc(roomName);
  const clients = wss.clients;
  
  // Send current document state to new client
  const state = Y.encodeStateAsUpdate(doc);
  if (state.byteLength > 0) {
    try {
      ws.send(state, { binary: true });
    } catch (error) {
      console.error('Error sending initial state:', error);
    }
  }
  
  // Listen for updates from this client
  const updateHandler = (update, origin) => {
    if (origin !== ws) {
      // Broadcast to all clients in this room except sender
      clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          try {
            client.send(update, { binary: true });
          } catch (error) {
            console.error('Error broadcasting update:', error);
          }
        }
      });
    }
  };
  
  // Apply updates from client to document
  ws.on('message', (message) => {
    try {
      const update = new Uint8Array(message);
      Y.applyUpdate(doc, update, ws);
      
      // Broadcast to all other clients
      clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          try {
            client.send(message, { binary: true });
          } catch (error) {
            console.error('Error sending to client:', error);
          }
        }
      });
    } catch (error) {
      console.error('Error processing update:', error);
    }
  });
  
  doc.on('update', updateHandler);
  
  // Keep connection alive with ping/pong
  let isAlive = true;
  ws.on('pong', () => {
    isAlive = true;
  });
  
  const pingInterval = setInterval(() => {
    if (!isAlive) {
      clearInterval(pingInterval);
      ws.terminate();
      return;
    }
    isAlive = false;
    ws.ping();
  }, 30000);
  
  ws.on('close', () => {
    clearInterval(pingInterval);
    doc.off('update', updateHandler);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message);
    clearInterval(pingInterval);
  });
});

server.listen(port, () => {
  console.log(`🚀 Collaboration server running on ws://localhost:${port}`);
  console.log('   Rooms are created automatically when clients connect');
});

import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import config from '../config';

// Our custom WebSocket provider that works with our server
class SimpleWebsocketProvider {
  constructor(url, roomName, doc, { awareness = new awarenessProtocol.Awareness(doc) } = {}) {
    this.url = url;
    this.roomName = roomName;
    this.doc = doc;
    this.document = doc;
    this.awareness = awareness;
    
    if (this.awareness) {
      this.awareness.doc = doc;
      this.awareness.document = doc;
    }
    
    this.ws = null;
    this.connected = false;
    this.shouldConnect = true;
    this.connect();
    
    this.updateHandler = (update, origin) => {
      if (origin !== this && this.ws && this.ws.readyState === WebSocket.OPEN) {
        const message = new Uint8Array([0, ...update]);
        this.ws.send(message);
      }
    };
    
    this.awarenessUpdateHandler = ({ added, updated, removed }, origin) => {
      const changedClients = added.concat(updated).concat(removed);
      const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients);
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const message = new Uint8Array([1, ...awarenessUpdate]);
        this.ws.send(message);
      }
    };
    
    this.doc.on('update', this.updateHandler);
    this.awareness.on('update', this.awarenessUpdateHandler);
  }
  
  connect() {
    if (!this.shouldConnect) return;
    
    // Prevent multiple connections
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    const wsUrl = `${this.url}/${this.roomName}`;
    this.ws = new WebSocket(wsUrl);
    this.ws.binaryType = 'arraybuffer';
    
    this.ws.onopen = () => {
      this.connected = true;
      console.log('✅ Connected to room:', this.roomName);
    };
    
    this.ws.onmessage = (event) => {
      const data = new Uint8Array(event.data);
      if (data.length === 0) return;
      
      try {
        const messageType = data[0];
        if (messageType === 0) {
          const update = data.slice(1);
          if (update.length > 0) {
            Y.applyUpdate(this.doc, update, this);
          }
        } else if (messageType === 1) {
          const awarenessUpdate = data.slice(1);
          if (awarenessUpdate.length > 0) {
            awarenessProtocol.applyAwarenessUpdate(this.awareness, awarenessUpdate, this);
          }
        }
      } catch (error) {
        if (data[0] === 0) {
          console.error('Error applying document update:', error);
        }
      }
    };
    
    this.ws.onclose = (event) => {
      this.connected = false;
      // Only reconnect if it wasn't a clean close (1000) or intentional close (1005)
      if (this.shouldConnect && event.code !== 1000 && event.code !== 1005) {
        console.log('🔄 Reconnecting in 2 seconds...');
        setTimeout(() => this.connect(), 2000);
      }
    };
    
    this.ws.onerror = (error) => {
      // Suppress error logging - the onclose will handle it
    };
  }
  //     if (this.shouldConnect && event.code !== 1000) {
  //       setTimeout(() => this.connect(), 2000);
  //     }
  //   };
    
  //   this.ws.onerror = (error) => {
  //     console.error('WebSocket error:', error);
  //   };
  // }
  
  destroy() {
    this.shouldConnect = false;
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, 'Client closing');
      }
    }
    this.awareness.off('update', this.awarenessUpdateHandler);
    this.doc.off('update', this.updateHandler);
  }
}

export const useCollaboration = (roomId) => {
  const [isReady, setIsReady] = useState(false);
  const providerRef = useRef(null);
  const docRef = useRef(null);

  useEffect(() => {
    // Cleanup previous connection
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (docRef.current) {
      docRef.current.destroy();
      docRef.current = null;
    }

    const doc = new Y.Doc();
    const provider = new SimpleWebsocketProvider(
      config.wsUrl,
      roomId,
      doc
    );

    providerRef.current = provider;
    docRef.current = doc;

    // Set ready after a short delay to ensure connection
    setTimeout(() => setIsReady(true), 500);

    return () => {
      if (providerRef.current) providerRef.current.destroy();
      if (docRef.current) docRef.current.destroy();
    };
  }, [roomId]);

  return { 
    provider: providerRef.current, 
    ydoc: docRef.current, 
    isReady 
  };
};
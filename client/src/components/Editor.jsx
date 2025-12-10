import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { Bold, Italic, Code, List, ListOrdered, Quote, Undo, Redo } from 'lucide-react';
import * as awarenessProtocol from 'y-protocols/awareness';

// WebSocket Provider for Yjs with proper Awareness
class SimpleWebsocketProvider {
  constructor(url, roomName, doc, { awareness = new awarenessProtocol.Awareness(doc) } = {}) {
    this.url = url;
    this.roomName = roomName;
    this.doc = doc;
    this.document = doc; // CollaborationCursor looks for .document
    this.awareness = awareness;
    
    // CRITICAL: Set doc on awareness BEFORE anything else
    // CollaborationCursor accesses provider.awareness.doc during init
    if (this.awareness) {
      this.awareness.doc = doc;
      this.awareness.document = doc;
    }
    
    this.ws = null;
    this.connected = false;
    this.shouldConnect = true;
    this.connect();
    
    // Listen for document updates and send to server
    this.updateHandler = (update, origin) => {
      if (origin !== this && this.ws && this.ws.readyState === WebSocket.OPEN) {
        const message = new Uint8Array([0, ...update]);
        this.ws.send(message);
      }
    };
    
    // Listen for awareness updates
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
    
    const wsUrl = `${this.url}/${this.roomName}`;
    
    this.ws = new WebSocket(wsUrl);
    this.ws.binaryType = 'arraybuffer';
    
    this.ws.onopen = () => {
      this.connected = true;
    };
    
    this.ws.onmessage = (event) => {
      const data = new Uint8Array(event.data);
      
      if (data.length === 0) return;
      
      try {
        const messageType = data[0];
        
        if (messageType === 0) {
          // Document update
          const update = data.slice(1);
          if (update.length > 0) {
            Y.applyUpdate(this.doc, update, this);
          }
        } else if (messageType === 1) {
          // Awareness update
          const awarenessUpdate = data.slice(1);
          if (awarenessUpdate.length > 0) {
            awarenessProtocol.applyAwarenessUpdate(this.awareness, awarenessUpdate, this);
          }
        }
      } catch (error) {
        // Silently ignore malformed messages
        if (data[0] === 0) {
          console.error('Error applying document update:', error);
        }
      }
    };
    
    this.ws.onclose = (event) => {
      this.connected = false;
      
      // Only reconnect if we should stay connected
      if (this.shouldConnect && event.code !== 1000) {
        setTimeout(() => this.connect(), 2000);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  destroy() {
    this.shouldConnect = false;
    if (this.ws) {
      // Only close if connection is actually open
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, 'Client closing');
      }
    }
    this.awareness.off('update', this.awarenessUpdateHandler);
    this.doc.off('update', this.updateHandler);
  }
}

// --- Toolbar Component ---
const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const buttons = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), isActive: 'bold' },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), isActive: 'italic' },
    { icon: Code, action: () => editor.chain().focus().toggleCode().run(), isActive: 'code' },
    { type: 'divider' },
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), isActive: 'bulletList' },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), isActive: 'orderedList' },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), isActive: 'blockquote' },
    { type: 'divider' },
    { icon: Undo, action: () => editor.chain().focus().undo().run() },
    { icon: Redo, action: () => editor.chain().focus().redo().run() },
  ];

  return (
    <div className="flex items-center gap-1 p-2 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-xl mb-4 w-fit mx-auto shadow-2xl sticky top-2 z-50">
      {buttons.map((btn, index) => (
        btn.type === 'divider' ? (
          <div key={index} className="w-px h-4 bg-white/10 mx-2" />
        ) : (
          <button
            key={index}
            onClick={btn.action}
            className={`p-2 rounded-lg transition-all ${
              btn.isActive && editor.isActive(btn.isActive)
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <btn.icon size={16} />
          </button>
        )
      ))}
    </div>
  );
};

// --- Tiptap Editor Instance ---
const TiptapEditor = ({ ydoc, provider }) => {
  const getRandomColor = () => ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FADB', '#B9F18D'][Math.floor(Math.random() * 7)];
  const userColor = useMemo(() => getRandomColor(), []);
  // Use client ID to create unique user names
  const userName = useMemo(() => `User ${ydoc.clientID}`, [ydoc]);
  const [peerCount, setPeerCount] = useState(0);

  // Validate provider setup before rendering
  if (!provider || !provider.awareness || !provider.awareness.doc) {
    console.error('Provider not properly initialized:', { 
      hasProvider: !!provider, 
      hasAwareness: !!provider?.awareness,
      hasDoc: !!provider?.awareness?.doc 
    });
    return <div className="p-8 text-red-500">Error: Collaboration provider not initialized</div>;
  }

  // Monitor peer connections using awareness
  useEffect(() => {
    if (!provider || !provider.awareness) return;

    const updatePeerCount = () => {
      const states = provider.awareness.getStates();
      setPeerCount(states.size - 1); // Subtract self
    };

    provider.awareness.on('change', updatePeerCount);
    updatePeerCount();

    return () => {
      provider.awareness.off('change', updatePeerCount);
    };
  }, [provider]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ 
        history: false, // Disable history since Collaboration has its own
      }), 
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: userName,
          color: userColor,
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] text-zinc-300',
      },
    },
    onCreate: ({ editor }) => {
      // Editor created successfully
    },
  }, [ydoc, provider, userName, userColor]);

  return (
    <div className="flex flex-col h-full relative">
      {/* Connection Status Banner */}
      <div className={`px-4 py-2 text-xs font-medium ${peerCount > 0 ? 'bg-green-900/30 text-green-400 border-b border-green-800/50' : 'bg-yellow-900/30 text-yellow-400 border-b border-yellow-800/50'}`}>
        {peerCount > 0 ? (
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            {peerCount} {peerCount === 1 ? 'person' : 'people'} connected • Room: edu-connect-room-1
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Waiting for collaborators • Room: edu-connect-room-1
          </span>
        )}
      </div>

      <MenuBar editor={editor} />
      <div className="flex-1 overflow-y-auto p-4 bg-zinc-950/30 rounded-xl border border-white/5">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

// --- Main Wrapper ---
const Editor = () => {
  const [isReady, setIsReady] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const providerRef = useRef(null);
  const ydocRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Initialize once
  useEffect(() => {
    // Skip if already initialized
    if (isInitializedRef.current) {
      return;
    }
    
    isInitializedRef.current = true;

    const doc = new Y.Doc();
    const provider = new SimpleWebsocketProvider(
      'ws://localhost:1234',
      'edu-connect-room-1',
      doc
    );
    
    providerRef.current = provider;
    ydocRef.current = doc;
    
    // Set ready after connection
    setTimeout(() => {
      setIsReady(true);
    }, 500);

    // Cleanup - but DON'T destroy in Strict Mode double-invoke
    return () => {
      // Only destroy if this is a real unmount (not Strict Mode)
      // We check if the ref is still initialized
      if (isInitializedRef.current) {
        return;
      }
      
      if (providerRef.current) {
        providerRef.current.destroy();
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
      }
    };
  }, []); // Empty deps - run once

  const provider = providerRef.current;
  const ydoc = ydocRef.current;

  if (!isReady || !ydoc || !provider) {
    return <div className="p-8 text-zinc-500 animate-pulse">Connecting to collaboration server...</div>;
  }

  return <TiptapEditor key={renderKey} ydoc={ydoc} provider={provider} />;
};

export default Editor;
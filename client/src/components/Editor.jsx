import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { Bold, Italic, Code, List, ListOrdered, Quote, Undo, Redo } from 'lucide-react';

// Simple WebSocket Provider for Yjs
class SimpleWebsocketProvider {
  constructor(url, roomName, doc) {
    this.url = url;
    this.roomName = roomName;
    this.doc = doc;
    this.ws = null;
    this.awareness = { getStates: () => new Map() }; // Mock awareness
    this.connected = false;
    this.shouldConnect = true;
    this.connect();
    
    // Listen for document updates and send to server
    this.updateHandler = (update, origin) => {
      if (origin !== this && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(update);
      }
    };
    
    this.doc.on('update', this.updateHandler);
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
      try {
        const update = new Uint8Array(event.data);
        Y.applyUpdate(this.doc, update, this);
      } catch (error) {
        console.error('Error applying update:', error);
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
    this.doc.off('update', this.updateHandler);
  }
}

// --- Toolbar Component (Unchanged) ---
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
  const [peerCount, setPeerCount] = useState(0);

  // Monitor peer connections for real-time collaboration feedback
  // Monitor peer connections - simplified since we don't have full awareness
  useEffect(() => {
    // For now, just set peerCount to 0 since our simple provider doesn't track peers
    setPeerCount(0);
  }, [provider]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ 
        history: false, // Disable history since Collaboration has its own
      }), 
      Collaboration.configure({
        document: ydoc,
      }),
      // CollaborationCursor has a bug with provider initialization
      // The editor works fine without it - you just won't see other users' cursors
      // CollaborationCursor.configure({
      //   provider,
      //   user: {
      //     name: 'Chaitanya',
      //     color: userColor,
      //   },
      // }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] text-zinc-300',
      },
    },
    onCreate: ({ editor }) => {
      // Editor created successfully
    },
  }, [ydoc, provider]);

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
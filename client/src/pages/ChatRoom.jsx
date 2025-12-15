import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Users, Copy, Check, MoreVertical, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';

// Simple WebSocket Provider for Chat
class ChatWebsocketProvider {
  constructor(url, roomName, doc) {
    this.url = url;
    this.roomName = roomName;
    this.doc = doc;
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
    
    this.doc.on('update', this.updateHandler);
  }
  
  connect() {
    if (!this.shouldConnect) return;
    
    const wsUrl = `${this.url}/chat-${this.roomName}`;
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
          const update = data.slice(1);
          if (update.length > 0) {
            Y.applyUpdate(this.doc, update, this);
          }
        }
      } catch (error) {
        console.error('Error applying update:', error);
      }
    };
    
    this.ws.onclose = (event) => {
      this.connected = false;
      if (this.shouldConnect && event.code !== 1000) {
        setTimeout(() => this.connect(), 2000);
      }
    };
  }
  
  destroy() {
    this.shouldConnect = false;
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, 'Client closing');
      }
    }
    this.doc.off('update', this.updateHandler);
  }
}

const ChatRoom = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(1);
  const [activeMenu, setActiveMenu] = useState(null);
  const chatEndRef = useRef(null);
  const providerRef = useRef(null);
  const ydocRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user')) || { username: 'Anonymous' };
  const userId = localStorage.getItem('educonnect-user-id') || `user-${Date.now()}`;
  
  // Get deleted messages from localStorage
  const getDeletedMessages = () => {
    try {
      const deleted = localStorage.getItem(`deleted-messages-${roomCode}`);
      return deleted ? JSON.parse(deleted) : [];
    } catch {
      return [];
    }
  };
  
  // Save deleted message to localStorage
  const saveDeletedMessage = (messageId) => {
    try {
      const deleted = getDeletedMessages();
      if (!deleted.includes(messageId)) {
        deleted.push(messageId);
        localStorage.setItem(`deleted-messages-${roomCode}`, JSON.stringify(deleted));
      }
    } catch (error) {
      console.error('Failed to save deleted message:', error);
    }
  };

  useEffect(() => {
    // Initialize Yjs document and provider
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    
    const provider = new ChatWebsocketProvider(config.wsUrl, roomCode, ydoc);
    providerRef.current = provider;

    const yMessages = ydoc.getArray('messages');
    
    // Load initial messages and ensure they have IDs
    const initialMessages = yMessages.toArray().map((msg, idx) => {
      if (!msg.id) {
        return {
          ...msg,
          id: `existing-${idx}-${Date.now()}`
        };
      }
      return msg;
    });
    
    // If we added IDs to old messages, update the array
    if (initialMessages.some((msg, idx) => msg.id !== yMessages.toArray()[idx]?.id)) {
      yMessages.delete(0, yMessages.length);
      yMessages.push(initialMessages);
    }
    
    setMessages(initialMessages);

    // Listen for updates
    const observer = () => {
      const messagesArray = yMessages.toArray();
      let needsUpdate = false;
      
      const updatedMessages = messagesArray.map((msg, idx) => {
        if (!msg.id) {
          needsUpdate = true;
          return {
            ...msg,
            id: `msg-${idx}-${Date.now()}`
          };
        }
        return msg;
      });
      
      // If we added IDs, update the Yjs array so IDs persist
      if (needsUpdate) {
        yMessages.delete(0, yMessages.length);
        yMessages.push(updatedMessages);
      }
      
      setMessages(updatedMessages);
    };
    
    yMessages.observe(observer);

    return () => {
      yMessages.unobserve(observer);
      provider.destroy();
    };
  }, [roomCode]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any delete menu
      if (!event.target.closest('.delete-menu-container')) {
        setActiveMenu(null);
      }
    };

    if (activeMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [activeMenu]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !ydocRef.current) return;

    const yMessages = ydocRef.current.getArray('messages');
    
    yMessages.push([{
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: newMessage,
      sender: user.username,
      senderId: userId,
      timestamp: Date.now(),
      color: user.color || '#3b82f6',
      deletedForMe: [] // Array of userIds who deleted this for themselves
    }]);
    
    setNewMessage('');
  };

  const handleDeleteForEveryone = (messageId) => {
    if (!ydocRef.current) return;
    
    console.log('Deleting for everyone:', messageId);
    const yMessages = ydocRef.current.getArray('messages');
    const messagesArray = yMessages.toArray();
    const index = messagesArray.findIndex(msg => msg.id === messageId);
    
    if (index !== -1) {
      const message = messagesArray[index];
      const deletedMessage = {
        id: message.id,
        text: "🚫 This message was deleted",
        sender: message.sender,
        senderId: message.senderId,
        timestamp: message.timestamp,
        color: message.color,
        deletedForEveryone: true,
        deletedBy: user.username,
        deletedAt: Date.now(),
        deletedForMe: message.deletedForMe || []
      };
      
      // Replace with deleted message placeholder
      yMessages.delete(index, 1);
      yMessages.insert(index, [deletedMessage]);
    }
    setActiveMenu(null);
  };

  const handleDeleteForMe = (messageId) => {
    if (!ydocRef.current) return;
    
    const yMessages = ydocRef.current.getArray('messages');
    const messagesArray = yMessages.toArray();
    const index = messagesArray.findIndex(msg => msg.id === messageId);
    
    if (index !== -1) {
      const message = messagesArray[index];
      
      // Check if already deleted for this user
      if (message.deletedForMe?.includes(userId)) {
        setActiveMenu(null);
        return;
      }
      
      const updatedMessage = {
        ...message,
        deletedForMe: [...(message.deletedForMe || []), userId]
      };
      
      // Replace the message with updated deletedForMe array
      yMessages.delete(index, 1);
      yMessages.insert(index, [updatedMessage]);
      
      // Save to localStorage for persistence
      saveDeletedMessage(messageId);
    }
    setActiveMenu(null);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-screen w-full bg-black flex items-center justify-center p-4">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-4xl h-[90vh] bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-zinc-900/80 border-b border-white/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 rounded-full bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Chat Room</h1>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Users size={14} />
                <span>{onlineUsers} online</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={copyRoomCode}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700 text-white rounded-xl transition-colors text-sm"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            <span className="font-mono font-bold">{roomCode}</span>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages
              .filter(msg => {
                // Filter out messages deleted for this user (from Yjs or localStorage)
                const deletedInYjs = msg.deletedForMe?.includes(userId);
                const deletedInStorage = getDeletedMessages().includes(msg.id);
                return !deletedInYjs && !deletedInStorage;
              })
              .map((msg, idx) => {
              const isSelf = msg.senderId === userId;
              const isMenuOpen = activeMenu === msg.id;
              
              return (
                <motion.div
                  key={msg.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`flex gap-3 ${isSelf ? 'flex-row-reverse' : ''} group`}
                >
                  <div 
                    className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: msg.color || '#3b82f6' }}
                  >
                    {msg.sender?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-1 max-w-[70%] relative">
                    {!isSelf && (
                      <span className="text-xs text-zinc-500 px-2">{msg.sender}</span>
                    )}
                    <div className="flex items-start gap-2">
                      <div
                        className={`p-3 rounded-2xl text-sm ${
                          msg.deletedForEveryone
                            ? 'bg-zinc-800/50 text-zinc-500 italic border border-white/5'
                            : isSelf
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-zinc-800 text-zinc-300 rounded-tl-none border border-white/5'
                        }`}
                      >
                        {msg.text}
                      </div>
                      
                      {/* Delete Menu - Show for all messages */}
                      <div className="relative delete-menu-container">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveMenu(prev => prev === msg.id ? null : msg.id);
                            }}
                            className={`${isMenuOpen ? 'opacity-100 bg-zinc-800' : 'opacity-0 group-hover:opacity-100'} p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all`}
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {isMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.1 }}
                              className={`absolute ${isSelf ? 'right-0' : 'left-0'} top-10 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[9999] w-52`}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteForMe(msg.id);
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-3"
                              >
                                <Trash2 size={16} />
                                <span>Delete for me</span>
                              </button>
                              {/* Only show "Delete for everyone" if you're the sender and not already deleted */}
                              {isSelf && !msg.deletedForEveryone && (
                                <>
                                  <div className="border-t border-white/5"></div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeleteForEveryone(msg.id);
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3"
                                  >
                                    <Trash2 size={16} />
                                    <span>Delete for everyone</span>
                                  </button>
                                </>
                              )}
                            </motion.div>
                          )}
                        </div>
                    </div>
                    <span className="text-[10px] text-zinc-600 px-2">
                      {msg.deletedForEveryone 
                        ? `Deleted by ${msg.deletedBy}`
                        : new Date(msg.timestamp).toLocaleTimeString()
                      }
                    </span>
                  </div>
                </motion.div>
              );
            })}
            <div ref={chatEndRef} />
          </AnimatePresence>
          
          {messages.filter(msg => !msg.deletedForMe?.includes(userId)).length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <Users size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">Be the first to say hello!</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-zinc-900/50">
          <div className="flex items-center gap-3 bg-zinc-800/50 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-blue-500/50 transition-colors">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-zinc-600 text-white"
              placeholder="Type a message..."
            />
            <button
              type="submit"
              className="text-blue-500 hover:text-blue-400 transition-colors p-2 hover:bg-blue-500/10 rounded-xl"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;

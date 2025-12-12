import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoChat from './VideoChat';

const RoomSidebar = ({ ydoc, provider }) => {
  const [activeTab, setActiveTab] = useState('chat');
  
  // Real-time Chat State
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);
  
  // Get or create persistent user ID
  const getUserId = () => {
    let userId = localStorage.getItem('educonnect-user-id');
    if (!userId) {
      userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('educonnect-user-id', userId);
    }
    return userId;
  };
  
  const userId = useRef(getUserId()).current;
  
  // Get authenticated user info
  const user = JSON.parse(localStorage.getItem('user')) || { username: `User ${userId.slice(-4)}` };

  useEffect(() => {
    if (!ydoc) return;
    
    // 1. Get the shared array
    const yMessages = ydoc.getArray('chat-messages');
    
    // 2. Load initial messages
    setMessages(yMessages.toArray());

    // 3. Listen for updates (when others type)
    const observer = () => {
      setMessages(yMessages.toArray());
    };
    
    yMessages.observe(observer);

    return () => yMessages.unobserve(observer);
  }, [ydoc]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !ydoc) return;

    const yMessages = ydoc.getArray('chat-messages');
    
    // Add message to shared array with persistent user ID and username
    yMessages.push([{
      text: newMessage,
      sender: user.username, // Use real username from localStorage
      senderId: userId, // Use persistent user ID instead of client ID
      timestamp: Date.now()
    }]);
    
    setNewMessage('');
  };

  return (
    <div className="w-80 h-full flex flex-col gap-4">
      {/* 1. Real Video Chat Component */}
      <VideoChat provider={provider} ydoc={ydoc} user={user} />

      {/* 2. Chat Panel */}
      <div className="flex-1 bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="flex border-b border-white/5">
          <button className="flex-1 py-3 text-sm font-medium text-white bg-white/5 border-b-2 border-blue-500">Chat</button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 relative space-y-4">
          <AnimatePresence>
            {messages.map((msg, idx) => {
              const isSelf = msg.senderId === userId;
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${isSelf ? 'flex-row-reverse' : ''}`}
                >
                   <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${isSelf ? 'bg-blue-500 text-white' : 'bg-zinc-700 text-zinc-300'}`}>
                     {msg.sender?.charAt(msg.sender.length - 1) || '?'}
                   </div>
                   <div className="flex flex-col gap-1 max-w-[70%]">
                     {!isSelf && <span className="text-xs text-zinc-500 px-2">{msg.sender}</span>}
                     <div className={`p-3 rounded-2xl text-sm ${isSelf ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-300 rounded-tl-none border border-white/5'}`}>
                        {msg.text}
                     </div>
                   </div>
                </motion.div>
              );
            })}
            <div ref={chatEndRef} />
          </AnimatePresence>
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-2 bg-zinc-800/50 border border-white/10 rounded-full px-4 py-2 focus-within:border-blue-500/50 transition-colors">
             <input 
               value={newMessage}
               onChange={(e) => setNewMessage(e.target.value)}
               className="bg-transparent border-none outline-none text-sm w-full placeholder:text-zinc-600 text-white" 
               placeholder="Type a message..." 
             />
             <button type="submit" className="text-blue-500 hover:text-blue-400 transition-colors">
               <Send size={18} />
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomSidebar;
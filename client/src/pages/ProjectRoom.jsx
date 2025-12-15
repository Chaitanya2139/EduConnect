import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Video, Code } from 'lucide-react';
import Layout from '../Layout';
import Editor from '../components/Editor';
import RoomSidebar from '../components/RoomSidebar';
import { useCollaboration } from '../hooks/useCollaboration';

const ProjectRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { provider, ydoc, isReady } = useCollaboration(roomId || 'default');
  const [mobileView, setMobileView] = useState('editor'); // 'editor', 'chat', 'video'

  if (!isReady || !provider || !ydoc) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-zinc-500 gap-3">
          <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
          Connecting to secure room...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-full flex flex-col md:flex-row gap-3 md:gap-4 pb-20 md:pb-0">
        
        {/* LEFT: Editor (receives shared doc) */}
        <div className={`flex-1 flex flex-col h-full min-w-0 ${mobileView !== 'editor' ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 px-2 gap-3">
            <div className="flex items-center gap-3 md:gap-4">
               {/* Back Button */}
               <button 
                 onClick={() => navigate('/')}
                 className="p-2 rounded-full bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors border border-white/5"
                 title="Back to Dashboard"
               >
                 <ArrowLeft size={18} />
               </button>
               
               <div>
                 <h1 className="text-lg md:text-2xl font-bold text-white mb-0.5 md:mb-1 capitalize">
                   {roomId?.replace(/-/g, ' ') || 'Untitled Project'}
                 </h1>
                 <div className="flex items-center gap-2 text-xs md:text-sm text-zinc-400">
                   <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                   Live Collaboration
                 </div>
               </div>
            </div>
            {/* Avatars placeholder */}
            <div className="flex -space-x-2 self-end md:self-center">
               {[1,2].map(i => <div key={i} className="w-7 md:w-8 h-7 md:h-8 rounded-full bg-zinc-700 border-2 border-black" />)}
            </div>
          </div>

          <div className="flex-1 bg-zinc-900/30 rounded-2xl md:rounded-[2rem] border border-white/5 p-1 relative overflow-hidden shadow-inner backdrop-blur-sm">
             {/* Pass provider down */}
             <Editor provider={provider} ydoc={ydoc} />
          </div>
        </div>

        {/* RIGHT: Chat & Video Sidebar - Hidden on small screens, shown with toggle */}
        <div className={`${mobileView !== 'editor' ? 'flex' : 'hidden'} md:flex flex-col h-full w-full md:w-auto`}>
          <RoomSidebar provider={provider} ydoc={ydoc} roomName={roomId} mobileView={mobileView} />
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-lg border-t border-white/10 z-50">
          <div className="flex items-center justify-around p-2">
            <button
              onClick={() => setMobileView('editor')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors ${
                mobileView === 'editor' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Code size={20} />
              <span className="text-xs font-medium">Editor</span>
            </button>
            <button
              onClick={() => setMobileView('chat')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors ${
                mobileView === 'chat' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <MessageSquare size={20} />
              <span className="text-xs font-medium">Chat</span>
            </button>
            <button
              onClick={() => setMobileView('video')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors ${
                mobileView === 'video' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Video size={20} />
              <span className="text-xs font-medium">Video</span>
            </button>
          </div>
        </div>
        
      </div>
    </Layout>
  );
};

export default ProjectRoom;
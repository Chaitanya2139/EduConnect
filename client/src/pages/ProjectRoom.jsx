import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Layout from '../Layout';
import Editor from '../components/Editor';
import RoomSidebar from '../components/RoomSidebar';
import { useCollaboration } from '../hooks/useCollaboration';

const ProjectRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { provider, ydoc, isReady } = useCollaboration(roomId || 'default');

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
      <div className="h-full flex gap-4">
        
        {/* LEFT: Editor (receives shared doc) */}
        <div className="flex-1 flex flex-col h-full min-w-0">
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-4">
               {/* Back Button */}
               <button 
                 onClick={() => navigate('/')}
                 className="p-2 rounded-full bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors border border-white/5"
                 title="Back to Dashboard"
               >
                 <ArrowLeft size={20} />
               </button>
               
               <div>
                 <h1 className="text-2xl font-bold text-white mb-1 capitalize">
                   {roomId?.replace(/-/g, ' ') || 'Untitled Project'}
                 </h1>
                 <div className="flex items-center gap-2 text-sm text-zinc-400">
                   <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                   Live Collaboration
                 </div>
               </div>
            </div>
            {/* Avatars placeholder */}
            <div className="flex -space-x-2">
               {[1,2].map(i => <div key={i} className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-black" />)}
            </div>
          </div>

          <div className="flex-1 bg-zinc-900/30 rounded-[2rem] border border-white/5 p-1 relative overflow-hidden shadow-inner backdrop-blur-sm">
             {/* Pass provider down */}
             <Editor provider={provider} ydoc={ydoc} />
          </div>
        </div>

        {/* RIGHT: Chat (receives shared doc) */}
        <RoomSidebar provider={provider} ydoc={ydoc} roomName={roomId} />
        
      </div>
    </Layout>
  );
};

export default ProjectRoom;
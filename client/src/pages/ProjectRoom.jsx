import React from 'react';
import Layout from '../Layout';
import Editor from '../components/Editor';
import { Users, Video, Mic, Share } from 'lucide-react';

const ProjectRoom = () => {
  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Room Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
             <h1 className="text-2xl font-bold text-white mb-1">System Architecture Design</h1>
             <div className="flex items-center gap-2 text-sm text-zinc-400">
               <span className="w-2 h-2 rounded-full bg-green-500" />
               3 Members Online
             </div>
          </div>

          <div className="flex items-center gap-3">
             {/* Fake Avatars */}
             <div className="flex -space-x-2 mr-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-black" />
                <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-black" />
             </div>
             
             <button className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"><Mic size={20} /></button>
             <button className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"><Video size={20} /></button>
             <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-500 flex items-center gap-2">
                <Share size={16} /> Share
             </button>
          </div>
        </div>

        {/* The Editor Canvas */}
        <div className="flex-1 bg-zinc-900/30 rounded-2xl border border-white/5 p-1 relative overflow-hidden shadow-inner">
           <Editor />
        </div>
      </div>
    </Layout>
  );
};

export default ProjectRoom;
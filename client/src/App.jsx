import React, { useState } from 'react';
import Layout from './Layout';
import SpotlightCard from './components/SpotlightCard';
import ProjectRoom from './pages/ProjectRoom'; // Make sure this path is correct
import { ArrowUpRight, Users, Clock } from 'lucide-react';

function App() {
  // This state controls which page you see
  const [view, setView] = useState('dashboard');

  // If view is 'room', show the Editor page
  if (view === 'room') {
    return <ProjectRoom />;
  }

  // Otherwise, show the Dashboard
  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-medium tracking-tight mb-2">
              Good afternoon, <span className="text-zinc-400">Chaitanya.</span>
            </h1>
            <p className="text-zinc-500">You have 2 upcoming group sessions today.</p>
          </div>
          <button className="bg-white text-black px-5 py-2.5 rounded-full font-medium text-sm hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            + New Project
          </button>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Main Active Project - CLICK THIS TO ENTER ROOM */}
          <div className="col-span-12 md:col-span-8 h-full">
            <SpotlightCard 
              className="h-full p-8 group cursor-pointer relative min-h-[400px]" 
              onClick={() => setView('room')} // <--- The Trigger
            >
              <div className="absolute top-6 right-6 p-2 rounded-full bg-zinc-800/50 text-zinc-400 group-hover:bg-white group-hover:text-black transition-colors">
                <ArrowUpRight size={20} />
              </div>
              
              <div className="mb-6">
                <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 rounded">Active Now</span>
              </div>
              
              <h2 className="text-3xl font-medium mb-2">System Architecture</h2>
              <p className="text-zinc-400 mb-8 max-w-md">Collaborative editing session for the main architecture schema.</p>

              {/* Editor Preview Visual */}
              <div className="w-full bg-[#050505] rounded-lg border border-white/5 p-4 font-mono text-sm text-zinc-500 relative overflow-hidden h-40">
                <div className="flex gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/20" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20" />
                </div>
                <p><span className="text-purple-400">import</span> React <span className="text-purple-400">from</span> 'react';</p>
                <p className="pl-4 text-zinc-600">// Click to enter live session...</p>
                
                {/* Fake Cursor Animation */}
                <div className="absolute top-24 left-10 w-0.5 h-4 bg-blue-500 animate-pulse" />
              </div>
            </SpotlightCard>
          </div>

          {/* Side Stats */}
          <div className="col-span-12 md:col-span-4 space-y-6">
            <SpotlightCard className="p-6">
              <div className="flex items-center gap-3 mb-2 text-zinc-400">
                <Clock size={18} /> <span className="text-sm font-medium">Study Hours</span>
              </div>
              <div className="text-4xl font-semibold">24.5<span className="text-lg text-zinc-600 font-normal">h</span></div>
            </SpotlightCard>

            <SpotlightCard className="p-6 flex-1 flex flex-col justify-between min-h-[200px]">
              <div>
                <div className="flex items-center gap-3 mb-2 text-zinc-400">
                  <Users size={18} /> <span className="text-sm font-medium">Team Chat</span>
                </div>
                <div className="space-y-3 mt-4">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10" />
                     <div className="text-sm text-zinc-300">Hey, are we meeting?</div>
                   </div>
                </div>
              </div>
              <button className="w-full mt-4 py-2 text-xs font-medium border border-zinc-700 rounded hover:bg-zinc-800 transition-colors">
                Open Chat
              </button>
            </SpotlightCard>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default App;
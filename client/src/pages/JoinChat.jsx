import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowRight, Hash, ArrowLeft } from 'lucide-react';

const JoinChat = () => {
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const generateRoomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    return code;
  };

  const handleCreateRoom = () => {
    const newCode = generateRoomCode();
    navigate(`/chat/${newCode}`);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomCode.trim()) {
      navigate(`/chat/${roomCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="h-screen w-full bg-black flex items-center justify-center relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-[480px] bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl z-10">
        <button 
          onClick={() => navigate('/')}
          className="mb-6 p-2 rounded-full bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <MessageSquare className="text-white" size={32} />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center text-white mb-2">
          Chat Rooms
        </h2>
        <p className="text-zinc-500 text-center text-sm mb-8">
          Create a new room or join an existing one with a room code.
        </p>

        <div className="space-y-4">
          {/* Create Room Button */}
          <button
            onClick={handleCreateRoom}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
          >
            Create New Room <ArrowRight size={18} />
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900/50 px-2 text-zinc-500">Or</span>
            </div>
          </div>

          {/* Join Room Form */}
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
              <input
                type="text"
                placeholder="Enter Room Code"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white text-center text-lg font-mono font-bold uppercase focus:border-blue-500 focus:outline-none transition-colors placeholder:text-zinc-600"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
            >
              Join Room <ArrowRight size={18} />
            </button>
          </form>
        </div>

        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-xs text-blue-400 text-center">
            💡 Room codes are case-insensitive and can contain letters and numbers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinChat;

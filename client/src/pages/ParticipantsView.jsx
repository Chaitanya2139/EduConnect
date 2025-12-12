import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, Video as VideoIcon, VideoOff, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import Peer from 'peerjs';

const ParticipantsView = () => {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const [myStream, setMyStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [participantNames, setParticipantNames] = useState({});
  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  
  const myVideoRef = useRef();
  const peerInstance = useRef(null);
  const myPeerIdRef = useRef(null);
  const peersRef = useRef({});

  const user = JSON.parse(localStorage.getItem('user')) || { username: 'Guest' };

  // Get provider from room (you'll need to pass this)
  useEffect(() => {
    // This will connect to the same Y.js provider as the room
    const initVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setMyStream(stream);
        if (myVideoRef.current) myVideoRef.current.srcObject = stream;

        if (!peerInstance.current) {
          const peer = new Peer();
          peerInstance.current = peer;

          peer.on('open', (id) => {
            myPeerIdRef.current = id;
            // Broadcast to awareness with username
            const provider = window.roomProvider; // Get from global
            if (provider && provider.awareness) {
              provider.awareness.setLocalStateField('peerId', id);
              provider.awareness.setLocalStateField('username', user.username);
            }
          });

          peer.on('call', (call) => {
            const remotePeerId = call.peer;
            
            if (!peersRef.current[remotePeerId]) {
              call.answer(stream);
              
              call.on('stream', (userVideoStream) => {
                setRemoteStreams(prevStreams => {
                  if (prevStreams[remotePeerId]) return prevStreams;
                  return { ...prevStreams, [remotePeerId]: userVideoStream };
                });
              });
              
              call.on('close', () => {
                delete peersRef.current[remotePeerId];
                setRemoteStreams(prev => {
                  const updated = { ...prev };
                  delete updated[remotePeerId];
                  return updated;
                });
                setParticipantNames(prev => {
                  const updated = { ...prev };
                  delete updated[remotePeerId];
                  return updated;
                });
              });
              
              peersRef.current[remotePeerId] = call;
            }
          });
        }

      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    };

    initVideo();

    return () => {
      Object.values(peersRef.current).forEach(call => {
        if (call) call.close();
      });
      
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
      
      if (peerInstance.current) {
        peerInstance.current.destroy();
        peerInstance.current = null;
      }
    };
  }, []);

  // Listen to awareness for peer names
  useEffect(() => {
    const provider = window.roomProvider;
    if (!provider || !provider.awareness) return;

    const handleAwarenessChange = () => {
      const states = provider.awareness.getStates();
      const myPeerId = myPeerIdRef.current;
      
      if (!myPeerId) return;
      
      const activePeerIds = new Set();
      const names = {};
      
      states.forEach((state, clientId) => {
        if (state.peerId && state.peerId !== myPeerId) {
          activePeerIds.add(state.peerId);
          names[state.peerId] = state.username || 'Anonymous';
        }
      });
      
      setParticipantNames(names);
      
      // Remove disconnected peers
      Object.keys(peersRef.current).forEach(peerId => {
        if (!activePeerIds.has(peerId)) {
          if (peersRef.current[peerId]) {
            peersRef.current[peerId].close();
          }
          delete peersRef.current[peerId];
          
          setRemoteStreams(prev => {
            const updated = { ...prev };
            delete updated[peerId];
            return updated;
          });
        }
      });
      
      // Connect to new peers
      activePeerIds.forEach((remotePeerId) => {
        if (peersRef.current[remotePeerId]) return;
        
        const call = peerInstance.current.call(remotePeerId, myStream);
        
        call.on('stream', (userVideoStream) => {
          setRemoteStreams(prev => {
            if (prev[remotePeerId]) return prev;
            return { ...prev, [remotePeerId]: userVideoStream };
          });
        });
        
        call.on('close', () => {
          delete peersRef.current[remotePeerId];
          setRemoteStreams(prev => {
            const updated = { ...prev };
            delete updated[remotePeerId];
            return updated;
          });
        });

        peersRef.current[remotePeerId] = call;
      });
    };

    provider.awareness.on('change', handleAwarenessChange);
    return () => provider.awareness.off('change', handleAwarenessChange);
  }, [myStream]);

  // Toggle Mute/Video
  useEffect(() => {
    if (myStream) {
      myStream.getAudioTracks().forEach(track => track.enabled = micOn);
      myStream.getVideoTracks().forEach(track => track.enabled = videoOn);
    }
  }, [micOn, videoOn, myStream]);

  const totalParticipants = Object.keys(remoteStreams).length + 1;

  return (
    <div className="h-screen w-full bg-black flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700 text-white rounded-xl transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Room</span>
        </button>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border border-white/10 rounded-xl">
          <Users size={20} className="text-blue-400" />
          <span className="text-white font-medium">{totalParticipants} Participants</span>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button 
            onClick={() => setMicOn(!micOn)} 
            className={`p-3 rounded-full transition-all ${micOn ? 'bg-zinc-800 text-white' : 'bg-red-500/20 text-red-500'}`}
          >
            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          <button 
            onClick={() => setVideoOn(!videoOn)} 
            className={`p-3 rounded-full transition-all ${videoOn ? 'bg-zinc-800 text-white' : 'bg-red-500/20 text-red-500'}`}
          >
            {videoOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className={`flex-1 grid gap-4 ${
        totalParticipants === 1 ? 'grid-cols-1' :
        totalParticipants === 2 ? 'grid-cols-2' :
        totalParticipants <= 4 ? 'grid-cols-2 grid-rows-2' :
        totalParticipants <= 6 ? 'grid-cols-3 grid-rows-2' :
        'grid-cols-4 auto-rows-fr'
      }`}>
        {/* My Video */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-2xl overflow-hidden border-2 border-blue-500 bg-black"
        >
          <video 
            ref={myVideoRef} 
            muted 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover transform scale-x-[-1]" 
          />
          <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-white text-sm font-medium">{user.username} (You)</span>
          </div>
        </motion.div>

        {/* Remote Videos */}
        {Object.entries(remoteStreams).map(([peerId, stream]) => (
          <motion.div 
            key={peerId}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-2xl overflow-hidden border border-white/10 bg-black"
          >
            <VideoPlayer stream={stream} />
            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-white text-sm font-medium">
                {participantNames[peerId] || 'Loading...'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Helper component
const VideoPlayer = ({ stream }) => {
  const videoRef = useRef();
  
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  return <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />;
};

export default ParticipantsView;

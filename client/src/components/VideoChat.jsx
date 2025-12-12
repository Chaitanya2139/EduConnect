import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Peer from 'peerjs';
import { Mic, MicOff, Video, VideoOff, Maximize2 } from 'lucide-react';

const VideoChat = ({ provider, ydoc, user, roomName }) => {
  const [myStream, setMyStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // Store video streams
  const [participantNames, setParticipantNames] = useState({}); // Store usernames
  const [micOn, setMicOn] = useState(false); // Default off to prevent feedback loop
  const [videoOn, setVideoOn] = useState(true);
  const navigate = useNavigate();
  
  const myVideoRef = useRef();
  const peerInstance = useRef(null);
  const myPeerIdRef = useRef(null); // Store my peer ID in a ref
  const peersRef = useRef({}); // Use ref to track peers to avoid stale closure

  // 1. Initialize PeerJS & Get Local Stream
  useEffect(() => {
    if (!provider) return; // Wait for provider
    
    const initVideo = async () => {
      try {
        // Don't request media on mount - wait for user to enable video/mic
        // This prevents the browser from showing "Using now" until user actually wants to use camera/mic
        
        // Initialize Peer (Auto-generates an ID) - ONLY ONCE
        if (!peerInstance.current) {
          const peer = new Peer();
          peerInstance.current = peer;

          peer.on('open', (id) => {
            console.log('My Peer ID:', id);
            myPeerIdRef.current = id; // Store in ref
            
            // Store provider globally for participants view
            window.roomProvider = provider;
            
            // CRITICAL: Broadcast my Peer ID AND username via Y.js Awareness
            if (provider && provider.awareness) {
              provider.awareness.setLocalStateField('peerId', id);
              provider.awareness.setLocalStateField('username', user.username || 'Anonymous');
              
              // Manually trigger awareness change to connect to existing peers
              setTimeout(() => {
                const states = provider.awareness.getStates();
                const activePeerIds = [];
                states.forEach((state) => {
                  if (state.peerId && state.peerId !== id) {
                    activePeerIds.push(state.peerId);
                  }
                });
                console.log('Initial peer scan found:', activePeerIds);
              }, 500);
            }
          });

          // Listen for incoming calls
          peer.on('call', (call) => {
            const remotePeerId = call.peer;
            
            // Answer with current stream (might be null initially)
            if (myStream) {
              call.answer(myStream);
            } else {
              // If we don't have a stream yet, create one to answer
              navigator.mediaDevices.getUserMedia({ video: videoOn, audio: micOn })
                .then(stream => {
                  setMyStream(stream);
                  if (myVideoRef.current) myVideoRef.current.srcObject = stream;
                  call.answer(stream);
                });
            }
            
            call.on('stream', (userVideoStream) => {
              setRemoteStreams(prevStreams => {
                if (prevStreams[remotePeerId]) return prevStreams;
                return { ...prevStreams, [remotePeerId]: userVideoStream };
              });
            });
            
            // Handle call close/disconnect
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
            
            call.on('error', (err) => {
              delete peersRef.current[remotePeerId];
            });
            
            // Store the call - overwrite if exists (in case of reconnection)
            peersRef.current[remotePeerId] = call;
          });
        }

      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    };

    initVideo();

    return () => {
      // Cleanup: Close all peer connections
      Object.values(peersRef.current).forEach(call => {
        if (call) call.close();
      });
      
      // Stop all media tracks from my stream
      if (myStream) {
        myStream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      }
      
      // Clear video element
      if (myVideoRef.current && myVideoRef.current.srcObject) {
        myVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        myVideoRef.current.srcObject = null;
      }
      
      // Destroy peer instance
      if (peerInstance.current) {
        peerInstance.current.destroy();
        peerInstance.current = null;
      }
      
      // Clear awareness
      if (provider && provider.awareness) {
        provider.awareness.setLocalStateField('peerId', null);
        provider.awareness.setLocalStateField('username', null);
      }
    };
  }, [provider]); // Only depend on provider

  // 2. Watch for other users joining (via Y.js Awareness)
  useEffect(() => {
    if (!provider || !provider.awareness || !myStream || !peerInstance.current) return;

    const handleAwarenessChange = () => {
      const states = provider.awareness.getStates();
      const myPeerId = myPeerIdRef.current;
      
      console.log('Awareness change - My ID:', myPeerId);
      
      if (!myPeerId) {
        return;
      }
      
      // Get all active peer IDs from awareness
      const activePeerIds = new Set();
      const names = {};
      states.forEach((state, clientId) => {
        if (state.peerId && state.peerId !== myPeerId) {
          activePeerIds.add(state.peerId);
          names[state.peerId] = state.username || 'Anonymous';
        }
      });
      
      setParticipantNames(names);
      
      console.log('Active peer IDs:', Array.from(activePeerIds));
      console.log('Current peers:', Object.keys(peersRef.current));
      console.log('Participant names:', names);
      
      // Remove peers that are no longer in awareness (they left/disconnected)
      Object.keys(peersRef.current).forEach(peerId => {
        if (!activePeerIds.has(peerId)) {
          console.log('Removing peer:', peerId);
          // This peer is no longer active, close the connection
          if (peersRef.current[peerId]) {
            peersRef.current[peerId].close();
          }
          delete peersRef.current[peerId];
          
          // Remove the stream
          setRemoteStreams(prev => {
            const updated = { ...prev };
            delete updated[peerId];
            return updated;
          });
        }
      });
      
      // Connect to new peers
      activePeerIds.forEach((remotePeerId) => {
        // Skip if we already have this peer
        if (peersRef.current[remotePeerId]) {
          return; // Removed log to reduce console spam
        }
        
        if (!peerInstance.current) {
          return;
        }
        
        // Call them!
        const call = peerInstance.current.call(remotePeerId, myStream);
        
        if (!call) {
          return;
        }
        
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
        
        call.on('error', (err) => {
          delete peersRef.current[remotePeerId];
        });

        peersRef.current[remotePeerId] = call;
      });
    };

    provider.awareness.on('change', handleAwarenessChange);
    return () => provider.awareness.off('change', handleAwarenessChange);
  }, [provider, myStream]);

  // Toggle Mute/Video - Properly stop and restart media streams (like Google Meet)
  useEffect(() => {
    const handleMediaToggle = async () => {
      console.log('🎥 Media Toggle - VideoOn:', videoOn, 'MicOn:', micOn);
      
      if (!myStream) {
        // No stream yet - create one if needed
        if (videoOn || micOn) {
          console.log('🆕 Creating initial stream - Video:', videoOn, 'Mic:', micOn);
          try {
            const newStream = await navigator.mediaDevices.getUserMedia({ 
              video: videoOn, 
              audio: micOn 
            });
            setMyStream(newStream);
            if (myVideoRef.current) {
              myVideoRef.current.srcObject = newStream;
            }
            console.log('✅ Initial stream created');
            
            // Update all existing peer connections with new stream
            Object.values(peersRef.current).forEach(call => {
              if (call && call.peerConnection) {
                const senders = call.peerConnection.getSenders();
                newStream.getTracks().forEach(track => {
                  const sender = senders.find(s => s.track?.kind === track.kind);
                  if (sender) {
                    sender.replaceTrack(track);
                  } else {
                    call.peerConnection.addTrack(track, newStream);
                  }
                });
              }
            });
          } catch (err) {
            console.error("❌ Error creating stream:", err);
          }
        }
        return;
      }
      
      const videoTracks = myStream.getVideoTracks();
      const audioTracks = myStream.getAudioTracks();
      
      console.log('📹 Current video tracks:', videoTracks.length, videoTracks.map(t => t.readyState));
      console.log('🎤 Current audio tracks:', audioTracks.length, audioTracks.map(t => t.readyState));
      
      // Handle video toggle
      if (!videoOn && videoTracks.length > 0) {
        console.log('⛔ Turning OFF video - stopping tracks');
        videoTracks.forEach(track => {
          console.log('Stopping video track:', track.id, track.label, track.readyState);
          track.stop();
          myStream.removeTrack(track);
        });
        
        // Also stop tracks from video element if they exist
        if (myVideoRef.current?.srcObject) {
          const videoElTracks = myVideoRef.current.srcObject.getVideoTracks();
          videoElTracks.forEach(track => {
            console.log('Stopping video element track:', track.id);
            track.stop();
          });
        }
        
        // Remove video tracks from all peer connections
        Object.values(peersRef.current).forEach(call => {
          if (call && call.peerConnection) {
            const senders = call.peerConnection.getSenders();
            senders.forEach(sender => {
              if (sender.track?.kind === 'video') {
                console.log('Removing video from peer connection');
                sender.track?.stop(); // Stop the track in peer connection too
                sender.replaceTrack(null);
              }
            });
          }
        });
      } else if (videoOn && videoTracks.every(t => t.readyState === 'ended' || videoTracks.length === 0)) {
        console.log('📹 Turning ON video - requesting camera');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          const videoTrack = stream.getVideoTracks()[0];
          myStream.addTrack(videoTrack);
          
          if (myVideoRef.current) {
            myVideoRef.current.srcObject = myStream;
          }
          
          // Add video track to all peer connections
          Object.values(peersRef.current).forEach(call => {
            if (call && call.peerConnection) {
              const senders = call.peerConnection.getSenders();
              const videoSender = senders.find(s => s.track?.kind === 'video' || s.track === null);
              if (videoSender) {
                videoSender.replaceTrack(videoTrack);
              } else {
                call.peerConnection.addTrack(videoTrack, myStream);
              }
            }
          });
        } catch (err) {
          console.error("❌ Error enabling video:", err);
        }
      }
      
      // Handle audio toggle
      if (!micOn && audioTracks.length > 0) {
        console.log('🔇 Turning OFF mic - stopping tracks');
        audioTracks.forEach(track => {
          track.stop();
          myStream.removeTrack(track);
        });
        
        // Remove audio tracks from all peer connections
        Object.values(peersRef.current).forEach(call => {
          if (call && call.peerConnection) {
            const senders = call.peerConnection.getSenders();
            senders.forEach(sender => {
              if (sender.track?.kind === 'audio') {
                sender.replaceTrack(null);
              }
            });
          }
        });
      } else if (micOn && audioTracks.every(t => t.readyState === 'ended' || audioTracks.length === 0)) {
        console.log('🎤 Turning ON mic - requesting microphone');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          const audioTrack = stream.getAudioTracks()[0];
          myStream.addTrack(audioTrack);
          
          // Add audio track to all peer connections
          Object.values(peersRef.current).forEach(call => {
            if (call && call.peerConnection) {
              const senders = call.peerConnection.getSenders();
              const audioSender = senders.find(s => s.track?.kind === 'audio' || s.track === null);
              if (audioSender) {
                audioSender.replaceTrack(audioTrack);
              } else {
                call.peerConnection.addTrack(audioTrack, myStream);
              }
            }
          });
        } catch (err) {
          console.error("❌ Error enabling mic:", err);
        }
      }
      
      // Clear video element if both are off
      if (!videoOn && !micOn) {
        console.log('🗑️ Both off - clearing video element and stopping ALL tracks');
        
        // Stop ALL tracks from video element
        if (myVideoRef.current?.srcObject) {
          const allVideoElTracks = myVideoRef.current.srcObject.getTracks();
          console.log('Stopping', allVideoElTracks.length, 'tracks from video element');
          allVideoElTracks.forEach(track => {
            console.log('Final stop:', track.kind, track.id, track.readyState);
            track.stop();
          });
          myVideoRef.current.srcObject = null;
        }
        
        // Stop ALL tracks from myStream
        const allStreamTracks = myStream.getTracks();
        console.log('Stopping', allStreamTracks.length, 'tracks from myStream');
        allStreamTracks.forEach(track => {
          console.log('Final stream stop:', track.kind, track.id, track.readyState);
          track.stop();
        });
      } else if (videoOn && myVideoRef.current) {
        // Update video element if video is back on
        myVideoRef.current.srcObject = myStream;
      }
      
      console.log('✅ Toggle complete - Stream has', myStream.getTracks().length, 'tracks');
    };

    handleMediaToggle();
  }, [micOn, videoOn, myStream]);

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-4 rounded-2xl shadow-xl">
        <div className="flex justify-between items-center gap-4">
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
              {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
          </div>
          
          {Object.keys(remoteStreams).length > 0 && (
            <button
              onClick={() => navigate(`/participants/${roomName}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors text-sm font-medium"
            >
              <Maximize2 size={16} />
              <span>View All ({Object.keys(remoteStreams).length + 1})</span>
            </button>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* My Video */}
        <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video bg-black">
          <video ref={myVideoRef} muted autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
          <div className="absolute bottom-2 left-2 text-[10px] bg-black/50 px-2 py-0.5 rounded text-white">{user.username || 'You'}</div>
        </div>

        {/* Remote Videos */}
        {Object.entries(remoteStreams).map(([peerId, stream]) => (
          <div key={peerId} className="relative rounded-xl overflow-hidden border border-white/10 aspect-video bg-black">
             <VideoPlayer stream={stream} />
             <div className="absolute bottom-2 left-2 text-[10px] bg-black/50 px-2 py-0.5 rounded text-white">
               {participantNames[peerId] || 'Loading...'}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper component to handle stream binding
const VideoPlayer = ({ stream }) => {
  const videoRef = useRef();
  
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  return <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />;
};

export default VideoChat;
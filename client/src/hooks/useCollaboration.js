import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export const useCollaboration = (roomId) => {
  const [isReady, setIsReady] = useState(false);
  const providerRef = useRef(null);
  const docRef = useRef(null);

  useEffect(() => {
    // Cleanup previous connection
    if (providerRef.current) providerRef.current.destroy();
    if (docRef.current) docRef.current.destroy();

    const doc = new Y.Doc();
    const provider = new WebsocketProvider(
      'ws://localhost:1234', // Ensure this matches your server port
      roomId,
      doc
    );

    providerRef.current = provider;
    docRef.current = doc;

    const handleStatus = (event) => {
      if (event.status === 'connected') {
        setIsReady(true);
      }
    };

    provider.on('status', handleStatus);

    return () => {
      provider.off('status', handleStatus);
      provider.destroy();
      doc.destroy();
    };
  }, [roomId]);

  return { 
    provider: providerRef.current, 
    ydoc: docRef.current, 
    isReady 
  };
};
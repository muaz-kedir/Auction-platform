import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected:', socketRef.current?.id);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return socketRef.current;
}

export function useAuctionSocket(
  auctionId: string | undefined,
  onBidUpdate: (data: any) => void
) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !auctionId) return;

    console.log('🔌 Joining auction room:', auctionId);
    
    // Join the auction room
    socket.emit('joinAuction', auctionId);

    // Listen for bid updates
    socket.on('bidUpdate', (data) => {
      console.log('📥 Received bidUpdate:', data);
      onBidUpdate(data);
    });

    // Cleanup
    return () => {
      console.log('🔌 Leaving auction room:', auctionId);
      socket.off('bidUpdate');
    };
  }, [socket, auctionId, onBidUpdate]);

  return socket;
}

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Get socket URL from environment or use deployed backend
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
                   import.meta.env.VITE_API_URL?.replace('/api', '') || 
                   'https://auction-platform-jl29.onrender.com';

// Singleton socket instance - shared across all components
let socketInstance: Socket | null = null;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Reuse existing socket or create new one
    if (!socketInstance) {
      console.log('🔌 Creating new socket connection to:', SOCKET_URL);
      socketInstance = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
        timeout: 20000,
      });

      socketInstance.on('connect', () => {
        console.log('✅ Socket connected:', socketInstance?.id);
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
      });

      socketInstance.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      });
    }

    socketRef.current = socketInstance;

    // Don't disconnect on unmount - keep singleton alive
    return () => {
      // Socket stays connected for other components
    };
  }, []);

  return socketRef.current;
}

export function useAuctionSocket(
  auctionId: string | undefined,
  onBidUpdate: (data: any) => void
) {
  const socket = useSocket();
  const onBidUpdateRef = useRef(onBidUpdate);

  // Keep callback ref updated
  useEffect(() => {
    onBidUpdateRef.current = onBidUpdate;
  }, [onBidUpdate]);

  useEffect(() => {
    if (!socket || !auctionId) {
      console.log('⚠️ Socket or auctionId missing:', { 
        hasSocket: !!socket, 
        socketConnected: socket?.connected,
        auctionId 
      });
      return;
    }

    // Wait for socket to be connected before joining
    const joinRoom = () => {
      console.log('🔌 Joining auction room:', auctionId);
      console.log('🔌 Socket connected:', socket.connected);
      console.log('🔌 Socket ID:', socket.id);
      socket.emit('joinAuction', auctionId);
      
      // Confirm room join
      socket.emit('getRoomInfo', auctionId, (info: any) => {
        console.log('📊 Room info:', info);
      });
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once('connect', joinRoom);
    }

    // Listen for bid updates
    const bidUpdateHandler = (data: any) => {
      console.log('📥 Received bidUpdate event:', data);
      console.log('📥 Data auctionId:', data.auctionId);
      console.log('📥 Current auctionId:', auctionId);
      console.log('📥 Bidder:', data.bidder?.name);
      console.log('📥 Amount:', data.currentBid);
      onBidUpdateRef.current(data);
    };
    
    socket.on('bidUpdate', bidUpdateHandler);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up socket listeners for room:', auctionId);
      socket.off('bidUpdate', bidUpdateHandler);
      socket.emit('leaveAuction', auctionId);
    };
  }, [socket, auctionId]);

  return socket;
}

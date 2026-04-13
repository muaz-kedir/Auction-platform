import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinAuction(auctionId: string) {
    if (this.socket) {
      this.socket.emit('joinAuction', auctionId);
    }
  }

  onBidUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('bidUpdate', callback);
    }
  }

  offBidUpdate() {
    if (this.socket) {
      this.socket.off('bidUpdate');
    }
  }

  emitNewBid(data: { auctionId: string; amount: number; userId: string }) {
    if (this.socket) {
      this.socket.emit('newBid', data);
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;

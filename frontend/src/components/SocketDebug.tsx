import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useSocket } from '../hooks/useSocket';

export function SocketDebug({ auctionId }: { auctionId?: string }) {
  const socket = useSocket();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev].slice(0, 10));
  };

  const testConnection = () => {
    if (!socket) {
      addLog('❌ Socket is null');
      return;
    }
    addLog(`✅ Socket exists, connected: ${socket.connected}, id: ${socket.id}`);
  };

  const testJoinRoom = () => {
    if (!socket || !auctionId) {
      addLog('❌ Socket or auctionId missing');
      return;
    }
    socket.emit('joinAuction', auctionId);
    addLog(`🔌 Emitted joinAuction: ${auctionId}`);
  };

  const testBidUpdate = () => {
    if (!socket || !auctionId) {
      addLog('❌ Socket or auctionId missing');
      return;
    }
    
    const testData = {
      auctionId,
      currentBid: 999,
      bidder: { _id: 'test', name: 'Test User' },
      activity: {
        type: 'bid',
        message: 'Test User placed a bid',
        amount: 999,
        time: new Date().toISOString(),
        bidderName: 'Test User'
      }
    };
    
    socket.emit('bidUpdate', testData);
    addLog(`📤 Emitted test bidUpdate`);
  };

  const listenForUpdates = () => {
    if (!socket) {
      addLog('❌ Socket is null');
      return;
    }

    socket.on('bidUpdate', (data) => {
      addLog(`📥 Received bidUpdate: ${JSON.stringify(data).substring(0, 50)}...`);
    });
    
    addLog('👂 Listening for bidUpdate events');
  };

  return (
    <Card className="p-4 mb-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
      <h3 className="font-bold mb-2">🔧 Socket Debug Panel</h3>
      <div className="flex gap-2 mb-3 flex-wrap">
        <Button size="sm" onClick={testConnection}>Test Connection</Button>
        <Button size="sm" onClick={testJoinRoom}>Join Room</Button>
        <Button size="sm" onClick={listenForUpdates}>Listen</Button>
        <Button size="sm" onClick={testBidUpdate}>Send Test Bid</Button>
      </div>
      <div className="text-xs space-y-1 max-h-40 overflow-y-auto bg-black/5 dark:bg-black/20 p-2 rounded">
        {logs.length === 0 ? (
          <p className="text-muted-foreground">No logs yet. Click buttons to test.</p>
        ) : (
          logs.map((log, i) => <div key={i}>{log}</div>)
        )}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Auction ID: {auctionId || 'Not loaded'}
      </div>
    </Card>
  );
}

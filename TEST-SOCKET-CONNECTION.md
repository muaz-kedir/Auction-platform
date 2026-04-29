# 🔍 Socket Connection Test

## Quick Test Steps

### 1. Open Browser Console (F12)

Navigate to the auction detail page and check for these logs:

#### Expected Logs:
```
✅ Socket connected: [socket-id]
🔌 Joining auction room: [auction-id]
🔌 Socket connected: true
🔌 Socket ID: [socket-id]
```

#### If you see:
```
⚠️ Socket or auctionId missing: { socket: false, auctionId: undefined }
```
**Problem**: Socket not connecting

#### If you see:
```
⚠️ Socket or auctionId missing: { socket: true, auctionId: undefined }
```
**Problem**: Auction not loaded

### 2. Check Backend Terminal

When you place a bid, you should see:
```
🔥 [WALLET BID] Emitting bidUpdate to room: [auction-id]
🔥 [WALLET BID] Number of clients in room: 2
✅ [WALLET BID] bidUpdate emitted successfully
```

#### If you DON'T see these logs:
**Problem**: Backend not emitting events

### 3. Manual Socket Test

Open browser console and run:
```javascript
// Check if socket is connected
console.log('Socket connected:', window.socket?.connected);

// Manually emit a test event
window.socket?.emit('joinAuction', 'test-auction-id');
```

## Common Issues

### Issue 1: Socket Not Connecting
**Symptoms:**
- No "✅ Socket connected" log
- Socket is null/undefined

**Fix:**
1. Check `VITE_SOCKET_URL` in `frontend/.env`
2. Should be: `https://auction-platform-jl29.onrender.com`
3. Restart frontend: `npm run dev`

### Issue 2: Not Joining Room
**Symptoms:**
- Socket connects but no "🔌 Joining auction room" log
- `auctionId` is undefined

**Fix:**
1. Auction might not be loaded
2. Check if `auction?._id` exists
3. Wait for auction to load before socket connects

### Issue 3: Backend Not Emitting
**Symptoms:**
- Frontend connects and joins room
- But no backend logs when bidding

**Fix:**
1. Restart backend server
2. Check if `getSocket()` returns valid instance
3. Verify `initSocket(io)` was called in server.js

### Issue 4: Events Not Received
**Symptoms:**
- Backend emits (logs show)
- Frontend doesn't receive (no "📥 Received bidUpdate")

**Fix:**
1. Check if both users are in same room
2. Verify auction IDs match exactly
3. Check for CORS issues

## Debug Commands

### Check Socket URL
```bash
# In frontend directory
cat .env | grep VITE_SOCKET_URL
```

### Check Backend Running
```bash
# Should show node process
ps aux | grep node
```

### Test Socket Endpoint
```bash
# Test if backend is accessible
curl https://auction-platform-jl29.onrender.com/socket.io/
```

## Next Steps

1. Open browser console
2. Navigate to auction detail page
3. Check for socket connection logs
4. Share the logs you see
5. Place a bid and check backend terminal
6. Share what happens

This will help identify exactly where the issue is.

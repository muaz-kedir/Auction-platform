/**
 * API Usage Examples
 * 
 * This file demonstrates how to use the API service and hooks
 * in your React components.
 */

import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useAuctions } from '../hooks/useAuctions';
import { useWallet } from '../hooks/useWallet';
import { socketService } from '../services/socket';
import { toast } from 'sonner';

// Example 1: Authentication
export function LoginExample() {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Login successful!');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}

// Example 2: Fetching Auctions with Filters
export function AuctionListExample() {
  const { auctions, loading, error } = useAuctions({
    search: 'laptop',
    min: 100,
    max: 1000,
  });

  if (loading) return <div>Loading auctions...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {auctions.map((auction) => (
        <div key={auction._id}>
          <h3>{auction.title}</h3>
          <p>{auction.description}</p>
          <p>Current Bid: ${auction.currentBid || auction.startingBid}</p>
        </div>
      ))}
    </div>
  );
}

// Example 3: Placing a Bid with Real-time Updates
export function BidExample({ auctionId }: { auctionId: string }) {
  const [bidAmount, setBidAmount] = useState('');
  const [currentBid, setCurrentBid] = useState(0);

  useEffect(() => {
    // Connect to socket
    socketService.connect();
    
    // Join auction room
    socketService.joinAuction(auctionId);
    
    // Listen for bid updates
    socketService.onBidUpdate((data) => {
      if (data.auctionId === auctionId) {
        setCurrentBid(data.amount);
        toast.info(`New bid: $${data.amount}`);
      }
    });

    return () => {
      socketService.offBidUpdate();
    };
  }, [auctionId]);

  const handlePlaceBid = async () => {
    try {
      await api.bids.placeBid(auctionId, parseFloat(bidAmount));
      toast.success('Bid placed successfully!');
      setBidAmount('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to place bid');
    }
  };

  return (
    <div>
      <p>Current Bid: ${currentBid}</p>
      <input
        type="number"
        value={bidAmount}
        onChange={(e) => setBidAmount(e.target.value)}
        placeholder="Enter bid amount"
      />
      <button onClick={handlePlaceBid}>Place Bid</button>
    </div>
  );
}

// Example 4: Wallet Operations
export function WalletExample() {
  const { wallet, loading, deposit, refetch } = useWallet();
  const [amount, setAmount] = useState('');

  const handleDeposit = async () => {
    const result = await deposit(parseFloat(amount));
    if (result.success) {
      toast.success('Deposit successful!');
      setAmount('');
    } else {
      toast.error(result.error || 'Deposit failed');
    }
  };

  if (loading) return <div>Loading wallet...</div>;

  return (
    <div>
      <h2>Balance: ${wallet?.balance || 0}</h2>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount to deposit"
      />
      <button onClick={handleDeposit}>Deposit</button>
      
      <h3>Recent Transactions</h3>
      {wallet?.transactions.map((tx) => (
        <div key={tx._id}>
          <span>{tx.type}</span>
          <span>${tx.amount}</span>
          <span>{tx.description}</span>
        </div>
      ))}
    </div>
  );
}

// Example 5: Creating an Auction
export function CreateAuctionExample() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startingBid: '',
    endTime: '',
    category: '',
  });
  const [images, setImages] = useState<FileList | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('startingBid', formData.startingBid);
    data.append('endTime', formData.endTime);
    if (formData.category) data.append('category', formData.category);
    
    // Add images
    if (images) {
      Array.from(images).forEach((image) => {
        data.append('images', image);
      });
    }

    try {
      await api.auctions.create(data);
      toast.success('Auction created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create auction');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Title"
      />
      <textarea
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Description"
      />
      <input
        type="number"
        value={formData.startingBid}
        onChange={(e) => setFormData({ ...formData, startingBid: e.target.value })}
        placeholder="Starting Bid"
      />
      <input
        type="datetime-local"
        value={formData.endTime}
        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
      />
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => setImages(e.target.files)}
      />
      <button type="submit">Create Auction</button>
    </form>
  );
}

// Example 6: Fetching Categories
export function CategoriesExample() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.categories.getAll();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div>
      {categories.map((category) => (
        <div key={category._id}>{category.name}</div>
      ))}
    </div>
  );
}

// Example 7: Notifications
export function NotificationsExample() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await api.notifications.getAll();
        setNotifications(data);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(notifications.filter((n) => n._id !== id));
      toast.success('Notification marked as read');
    } catch (error: any) {
      toast.error('Failed to mark as read');
    }
  };

  return (
    <div>
      {notifications.map((notification) => (
        <div key={notification._id}>
          <p>{notification.message}</p>
          <button onClick={() => markAsRead(notification._id)}>
            Mark as Read
          </button>
        </div>
      ))}
    </div>
  );
}

// Example 8: Disputes
export function DisputeExample({ orderId }: { orderId: string }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateDispute = async () => {
    try {
      await api.disputes.create(orderId, reason, description);
      toast.success('Dispute created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create dispute');
    }
  };

  return (
    <div>
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
      />
      <button onClick={handleCreateDispute}>Create Dispute</button>
    </div>
  );
}

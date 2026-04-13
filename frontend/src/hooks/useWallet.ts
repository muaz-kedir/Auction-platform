import { useState, useEffect } from 'react';
import { api } from '../services/api';

export interface WalletData {
  balance: number;
  transactions: Array<{
    _id: string;
    type: 'deposit' | 'withdrawal' | 'bid' | 'refund' | 'payment';
    amount: number;
    description: string;
    createdAt: string;
  }>;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const data = await api.wallet.getBalance();
      setWallet(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const deposit = async (amount: number) => {
    try {
      await api.wallet.deposit(amount);
      await fetchWallet(); // Refresh wallet data
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return { wallet, loading, error, deposit, refetch: fetchWallet };
};

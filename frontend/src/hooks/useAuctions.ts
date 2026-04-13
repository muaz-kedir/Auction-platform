import { useState, useEffect } from 'react';
import { api } from '../services/api';

export interface Auction {
  _id: string;
  title: string;
  description: string;
  startingBid: number;
  currentBid?: number;
  endTime: string;
  category?: string;
  images?: string[];
  seller: {
    _id: string;
    name: string;
  };
  status: 'active' | 'ended' | 'cancelled';
  createdAt: string;
}

export const useAuctions = (filters?: {
  search?: string;
  category?: string;
  min?: number;
  max?: number;
}) => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        const data = await api.auctions.getAll(filters);
        setAuctions(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch auctions');
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, [filters?.search, filters?.category, filters?.min, filters?.max]);

  return { auctions, loading, error };
};

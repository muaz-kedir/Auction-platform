// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
};

// Generic API request function
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return handleResponse(response);
};

// API Service Object
export const api = {
  // Authentication
  auth: {
    register: (data: { name: string; email: string; password: string }) =>
      apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    login: (data: { email: string; password: string }) =>
      apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Auctions
  auctions: {
    getAll: (params?: { search?: string; category?: string; min?: number; max?: number }) => {
      const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return apiRequest(`/auctions${queryString}`);
    },
    
    getById: (id: string) => apiRequest(`/auctions/${id}`),
    
    create: (formData: FormData) =>
      apiRequest('/auctions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: formData,
      }).then(handleResponse),
  },

  // Bidding
  bids: {
    placeBid: (auctionId: string, amount: number) =>
      apiRequest(`/bids/${auctionId}`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      }),
  },

  // Wallet
  wallet: {
    getBalance: () => apiRequest('/wallet'),
    
    deposit: (amount: number) =>
      apiRequest('/wallet/deposit', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      }),
  },

  // Withdrawals
  withdraw: {
    request: (amount: number, method: string) =>
      apiRequest('/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount, method }),
      }),
    
    approve: (id: string) =>
      apiRequest(`/withdraw/${id}/approve`, {
        method: 'PUT',
      }),
  },

  // Escrow
  escrow: {
    ship: (orderId: string, trackingNumber: string) =>
      apiRequest(`/escrow/ship/${orderId}`, {
        method: 'POST',
        body: JSON.stringify({ trackingNumber }),
      }),
    
    confirm: (orderId: string) =>
      apiRequest(`/escrow/confirm/${orderId}`, {
        method: 'POST',
      }),
    
    refund: (orderId: string) =>
      apiRequest(`/escrow/refund/${orderId}`, {
        method: 'POST',
      }),
  },

  // Categories
  categories: {
    getAll: () => apiRequest('/categories'),
    
    create: (name: string, description?: string) =>
      apiRequest('/categories', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      }),
  },

  // Ratings
  ratings: {
    create: (sellerId: string, rating: number, comment?: string) =>
      apiRequest('/ratings', {
        method: 'POST',
        body: JSON.stringify({ sellerId, rating, comment }),
      }),
    
    getBySeller: (sellerId: string) => apiRequest(`/ratings/${sellerId}`),
  },

  // Notifications
  notifications: {
    getAll: () => apiRequest('/notifications'),
    
    markAsRead: (id: string) =>
      apiRequest(`/notifications/${id}/read`, {
        method: 'PUT',
      }),
  },

  // Disputes
  disputes: {
    create: (orderId: string, reason: string, description: string) =>
      apiRequest('/disputes', {
        method: 'POST',
        body: JSON.stringify({ orderId, reason, description }),
      }),
    
    resolve: (id: string, resolution: string) =>
      apiRequest(`/disputes/${id}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ resolution }),
      }),
  },

  // Admin endpoints
  admin: {
    getStats: () => apiRequest('/admin/stats'),
    
    getAllUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) => {
      const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return apiRequest(`/admin/users${queryString}`);
    },
    
    updateUserStatus: (id: string, data: { isBanned?: boolean; verified?: boolean }) => 
      apiRequest(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    
    deleteUser: (id: string) => 
      apiRequest(`/admin/users/${id}`, {
        method: 'DELETE',
      }),
    
    getAllAuctions: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
      const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return apiRequest(`/admin/auctions${queryString}`);
    },
    
    deleteAuction: (id: string) => 
      apiRequest(`/admin/auctions/${id}`, {
        method: 'DELETE',
      }),
    
    getAllDisputes: (params?: { page?: number; limit?: number; status?: string }) => {
      const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return apiRequest(`/admin/disputes${queryString}`);
    },
    
    getAllWithdrawals: (params?: { page?: number; limit?: number; status?: string }) => {
      const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return apiRequest(`/admin/withdrawals${queryString}`);
    },
    
    createAdmin: (data: { name: string; email: string; password: string; role: string }) => 
      apiRequest('/admin/admins', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    getAllAdmins: () => apiRequest('/admin/admins'),
  },
};

export default api;

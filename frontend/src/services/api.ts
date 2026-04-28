// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_PREFIX = '/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    // Try to parse as JSON first, then fall back to text
    let errorData: any;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
    } else {
      // Handle plain text error
      const textError = await response.text().catch(() => 'An error occurred');
      errorData = { message: textError || `Error: ${response.status}` };
    }
    
    console.error('API Error:', response.status, errorData);
    const err: any = new Error(errorData.message || errorData.error || `Request failed: ${response.status}`);
    err.response = { data: errorData, status: response.status };
    throw err;
  }
  return response.json();
};

// Generic API request function
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  skipAuth: boolean = false
): Promise<any> => {
  const token = getAuthToken();
  
  // Debug logging
  console.log('[API Debug] Endpoint:', endpoint);
  console.log('[API Debug] Token exists:', !!token);
  console.log('[API Debug] Skip Auth:', skipAuth);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Only add Authorization header if token exists AND skipAuth is false
  if (token && !skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('[API Debug] Token added (first 20 chars):', token.substring(0, 20) + '...');
  } else {
    console.log('[API Debug] No Authorization header added');
  }

  console.log('[API Debug] Headers:', JSON.stringify(headers, null, 2));

  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Enable credentials for CORS
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
      }, true), // Skip auth header for register
    
    login: (data: { email: string; password: string }) =>
      apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }, true), // Skip auth header for login
  },

  // Auctions
  auctions: {
    getAll: (params?: { search?: string; category?: string; min?: number; max?: number; status?: string; seller?: string; includeAll?: boolean }) => {
      const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return apiRequest(`/auctions${queryString}`);
    },

    getById: (id: string) => apiRequest(`/auctions/${id}`),

    create: (formData: FormData) => {
      const token = getAuthToken();
      console.log("Token for auction creation:", token ? "Present" : "Missing");

      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      return fetch(`${API_BASE_URL}${API_PREFIX}/auctions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }).then(handleResponse);
    },

    // Super Admin only
    getPending: () => apiRequest('/auctions/admin/pending'),

    approve: (id: string) =>
      apiRequest(`/auctions/${id}/approve`, {
        method: 'PUT',
      }),

    reject: (id: string, reason?: string) =>
      apiRequest(`/auctions/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason }),
      }),
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
    getVerificationStatus: () => apiRequest('/wallet/verification/my'),
    
    deposit: (amount: number) =>
      apiRequest('/wallet/deposit', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      }),

    submitVerification: (formData: FormData) => {
      const token = getAuthToken();
      return fetch(`${API_BASE_URL}${API_PREFIX}/wallet/verification/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }).then(handleResponse);
    },

    // Wallet Funding System
    submitFundingRequest: (data: { fullName: string; phone: string; email: string; location: string; walletAmount: number }) =>
      apiRequest('/wallet/funding/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getFundingStatus: () => apiRequest('/wallet/funding/status'),

    canBid: () => apiRequest('/wallet/can-bid'),

    placeBidWithWallet: (auctionId: string, bidAmount: number) =>
      apiRequest('/wallet/bid', {
        method: 'POST',
        body: JSON.stringify({ auctionId, bidAmount }),
      }),

    refundBid: (amount: number) =>
      apiRequest('/wallet/refund', {
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
    
    updateUser: (id: string, data: { name?: string; email?: string; role?: string; isBanned?: boolean; verified?: boolean }) => 
      apiRequest(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    deleteUser: (id: string) => 
      apiRequest(`/admin/users/${id}`, {
        method: 'DELETE',
      }),
    
    getAllAuctions: (params?: { page?: number; limit?: number; status?: string; search?: string; approvalStatus?: string }) => {
      const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return apiRequest(`/admin/auctions${queryString}`);
    },
    
    deleteAuction: (id: string) => 
      apiRequest(`/admin/auctions/${id}`, {
        method: 'DELETE',
      }),
    
    submitAuctionForApproval: (id: string) =>
      apiRequest(`/admin/auctions/${id}/submit`, {
        method: 'POST',
      }),
    
    approveAuction: (id: string) =>
      apiRequest(`/admin/auctions/${id}/approve`, {
        method: 'POST',
      }),
    
    rejectAuction: (id: string, reason: string) =>
      apiRequest(`/admin/auctions/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
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
    
    createSeller: (data: { name: string; email: string; password: string }) => 
      apiRequest('/admin/sellers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    getAllAdmins: () => apiRequest('/admin/admins'),
    getWalletVerifications: (params?: { status?: string }) => {
      const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return apiRequest(`/admin/wallet-verifications${queryString}`);
    },
    submitWalletVerificationDecision: (
      id: string,
      data: { decision: "approved" | "rejected"; maxBiddingAmount?: number }
    ) =>
      apiRequest(`/admin/wallet-verifications/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Wallet Funding Management
    getAllFundingRequests: (params?: { status?: string }) => {
      const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return apiRequest(`/admin/wallet-funding-requests${queryString}`);
    },
    
    getFundingRequest: (userId: string) => 
      apiRequest(`/admin/wallet-funding-requests/${userId}`),
    
    decideFundingRequest: (
      userId: string,
      data: { decision: "approved" | "rejected" }
    ) =>
      apiRequest(`/admin/wallet-funding-requests/${userId}/decision`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    resetFundingRequest: (userId: string) =>
      apiRequest(`/admin/wallet-funding-requests/${userId}/reset`, {
        method: 'POST',
      }),
    
    // Category Management (Super Admin only)
    getAllCategories: () => apiRequest('/admin/categories'),
    
    createCategory: (name: string) =>
      apiRequest('/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    
    updateCategory: (id: string, name: string) =>
      apiRequest(`/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
      }),
    
    deleteCategory: (id: string) =>
      apiRequest(`/admin/categories/${id}`, {
        method: 'DELETE',
      }),
  },

  // Announcements
  announcements: {
    getAll: (params?: { visibility?: string; isActive?: boolean }) => {
      const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return apiRequest(`/announcements${queryString}`);
    },
    
    getPublic: () => apiRequest('/announcements/public?isActive=true'),
    
    getById: (id: string) => apiRequest(`/announcements/${id}`),
    
    create: (data: { title: string; content: string; visibility?: string }) =>
      apiRequest('/announcements', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: { title?: string; content?: string; visibility?: string; isActive?: boolean }) =>
      apiRequest(`/announcements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id: string) =>
      apiRequest(`/announcements/${id}`, {
        method: 'DELETE',
      }),
  },

  // Profile endpoints
  profile: {
    getProfile: () => apiRequest('/profile'),
    
    updateProfile: (formData: FormData) => {
      const token = getAuthToken();
      return fetch(`${API_BASE_URL}${API_PREFIX}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }).then(handleResponse);
    },
    
    uploadImage: (formData: FormData) => {
      const token = getAuthToken();
      return fetch(`${API_BASE_URL}${API_PREFIX}/profile/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }).then(handleResponse);
    },
  },

  // Dashboard endpoints
  dashboard: {
    getStats: () => apiRequest('/dashboard/stats'),
    getActiveBids: (limit?: number) => {
      const queryString = limit ? `?limit=${limit}` : '';
      return apiRequest(`/dashboard/active-bids${queryString}`);
    },
  },
};

export default api;

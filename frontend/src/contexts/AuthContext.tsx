import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { requestNotificationPermission } from '../firebase';

interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      console.log('API URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
      
      const response = await api.auth.login({ email, password });
      console.log('Login response:', response);
      
      const { token: newToken, user: newUser } = response;
      
      if (!newToken || !newUser) {
        throw new Error('Invalid response from server');
      }
      
      // Ensure user has id field (use _id if id doesn't exist)
      const userWithId = {
        ...newUser,
        id: newUser.id || newUser._id
      };
      
      console.log('Storing user:', userWithId);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userWithId));
      
      setToken(newToken);
      setUser(userWithId);
      
      // Request notification permission and send FCM token
      try {
        const fcmToken = await requestNotificationPermission();
        if (fcmToken) {
          console.log('📱 Sending FCM token to backend');
          await api.auth.updateFcmToken({ fcmToken });
        }
      } catch (error) {
        console.error('⚠️ Failed to set up push notifications:', error);
        // Don't block login if notification setup fails
      }
      
      console.log('Login successful');
    } catch (error: any) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.auth.register({ name, email, password });
      const { token: newToken, user: newUser } = response;
      
      // Ensure user has id field (use _id if id doesn't exist)
      const userWithId = {
        ...newUser,
        id: newUser.id || newUser._id
      };
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userWithId));
      
      setToken(newToken);
      setUser(userWithId);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

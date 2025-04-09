'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for token on initial load
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData); // Store parsed user data
       // Check if user is a paid user and has a subscription end date
       if (parsedUser.subscriptionStatus === 'cancelled' && parsedUser.subscriptionEndDate) {
        const endDate = new Date(parsedUser.subscriptionEndDate);
        if (endDate < new Date()) {
            // Subscription has expired, revert to free tier
            const updatedUser = {
              ...parsedUser,
              subscriptionStatus:'inactive',
              subscription:'free',
            }; 
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
          } else {
            setUser(parsedUser);
          }
        } else {
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    // Add default subscription data if not present
    const userWithDefaults = {
      ...userData,
      isPaidUser: userData.isPaidUser || false,
      subscription: userData.subscription || 'free',
      subscriptionStatus: userData.subscriptionStatus || 'inactive',
      subscriptionEndDate: userData.subscriptionEndDate || null,
      paymentMethod: userData.paymentMethod || null
    };

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userWithDefaults));
    setUser(userWithDefaults);
  }; // Added missing closing brace for login function

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };
  const updateUser = (updatedUserData) => {
    localStorage.setItem('user', JSON.stringify(updatedUserData));
    setUser(updatedUserData);
  };
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        updateUser,
        loading, 
        isAuthenticated: !!user, 
        isPaidUser: user?.isPaidUser || false, 
        isCancelling: user?.isCancelling || false 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
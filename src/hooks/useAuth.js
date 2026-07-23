import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
let logoutTimer = null;

export const setupAxiosInterceptors = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Clear logout timer
  const clearLogoutTimer = () => {
    if (logoutTimer) {
      clearTimeout(logoutTimer);
      logoutTimer = null;
    }
  };

  // Set logout timer (4 hours)
  const setLogoutTimer = () => {
    clearLogoutTimer();
    logoutTimer = setTimeout(() => {
      console.log('Auto-logout: Session expired after 4 hours');
      logout();
      // Redirect to login
      window.location.href = '/admin';
    }, 4 * 60 * 60 * 1000); // 4 hours in milliseconds
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('upasanaToken');
    localStorage.removeItem('upasanaUser');
    localStorage.removeItem('upasanaUserID');
    setupAxiosInterceptors(null);
    clearLogoutTimer();
  };

  // Reset timer on user activity
  const resetLogoutTimer = () => {
    if (isAuthenticated) {
      setLogoutTimer();
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('upasanaToken');
    const savedUser = localStorage.getItem('upasanaUser');
    
    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(userData);
        setIsAuthenticated(true);
        setupAxiosInterceptors(savedToken);
        // Start logout timer
        setLogoutTimer();
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('upasanaToken');
        localStorage.removeItem('upasanaUser');
        localStorage.removeItem('upasanaUserID');
      }
    }
    setLoading(false);
  }, []);

  // Set up activity listeners
  useEffect(() => {
    if (isAuthenticated) {
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
      
      const handleActivity = () => {
        resetLogoutTimer();
      };
      
      events.forEach(event => {
        document.addEventListener(event, handleActivity);
      });
      
      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity);
        });
        clearLogoutTimer();
      };
    }
  }, [isAuthenticated]);

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('upasanaToken', newToken);
    localStorage.setItem('upasanaUser', JSON.stringify(userData));
    if (userData.id) {
      localStorage.setItem('upasanaUserID', userData.id.toString());
    }
    setupAxiosInterceptors(newToken);
    setLogoutTimer();
  };

  const value = { 
    user, 
    token, 
    isAuthenticated, 
    loading,
    login, 
    logout 
  };
  
  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
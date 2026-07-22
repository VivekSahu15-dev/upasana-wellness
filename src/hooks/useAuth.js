import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

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
        // console.log('Auth restored successfully');
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('upasanaToken');
        localStorage.removeItem('upasanaUser');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken, userData) => {
    console.log('Login called');
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('upasanaToken', newToken);
    localStorage.setItem('upasanaUser', JSON.stringify(userData));
    localStorage.setItem('upasanaUserID', userData.id ? userData.id.toString() : '1');
    setupAxiosInterceptors(newToken);
    console.log('Login successful, data saved');
  };

  const logout = () => {
    console.log('Logout called');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('upasanaToken');
    localStorage.removeItem('upasanaUser');
    localStorage.removeItem('upasanaUserID');
    setupAxiosInterceptors(null);
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
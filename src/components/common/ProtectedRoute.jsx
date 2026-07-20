import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if user is authenticated from localStorage
    const token = localStorage.getItem('upasanaToken');
    const userData = localStorage.getItem('upasanaUser');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role === 'admin') {
          setChecking(false);
        } else {
          toast.error('Access denied. Admin only.');
          setChecking(false);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setChecking(false);
      }
    } else {
      setChecking(false);
    }
  }, []);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E7E1D5]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#57ABB2] border-t-transparent"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  const token = localStorage.getItem('upasanaToken');
  const userData = localStorage.getItem('upasanaUser');
  
  if (!token || !userData) {
    toast.error('Please login to continue');
    return <Navigate to="/admin" replace />;
  }

  // Check for admin
  if (adminOnly) {
    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser?.role !== 'admin') {
        toast.error('Access denied. Admin only.');
        return <Navigate to="/admin" replace />;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
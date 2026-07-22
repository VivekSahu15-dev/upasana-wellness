import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const [checking, setChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check if user is authenticated from localStorage
    const token = localStorage.getItem('upasanaToken');
    const userData = localStorage.getItem('upasanaUser');
    
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
       
        
        if (adminOnly) {
          // Case-insensitive role check
          const userRole = parsedUser.role?.toLowerCase() || '';
          const isAdmin = userRole === 'admin';
          
          if (isAdmin) {
            // console.log('ProtectedRoute - Admin authorized ✅');
            setIsAuthorized(true);
          } else {
            // console.log('ProtectedRoute - Not admin, unauthorized ❌');
            setIsAuthorized(false);
          }
        } else {
          // For non-admin routes, just check if user exists
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setIsAuthorized(false);
      }
    } else {
      console.log('ProtectedRoute - No auth data ❌');
      setIsAuthorized(false);
    }
    setChecking(false);
  }, [adminOnly]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E7E1D5]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#57ABB2] border-t-transparent"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    console.log('ProtectedRoute - Redirecting to /admin');
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;
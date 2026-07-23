import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { 
  FaUsers, 
  FaClipboardList, 
  FaCreditCard, 
  FaBox,
  FaSignOutAlt,
  FaUserShield,
  FaHome,
  FaBars,
  FaTimes,
  FaSpinner
} from 'react-icons/fa';
import Patients from './Patients';
import Therapies from './Therapies';
import PaymentModes from './PaymentModes';
import Packages from './Packages';
import { toast } from 'react-toastify';
import axiosInstance from '../../utils/axiosConfig';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    patients: 0,
    therapies: 0,
    paymentModes: 0,
    packages: 0
  });
  const navigate = useNavigate();
  const location = useLocation();

  const getUserId = () => {
    const userId = localStorage.getItem('upasanaUserID');
    return userId || '1';
  };

  useEffect(() => {
    const token = localStorage.getItem('upasanaToken');
    const userData = localStorage.getItem('upasanaUser');
    
    if (!token || !userData) {
      navigate('/admin', { replace: true });
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin') {
        navigate('/admin', { replace: true });
        return;
      }
      setUser(parsedUser);
      fetchStats();
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/admin', { replace: true });
      return;
    }
    
    setIsLoading(false);
  }, [navigate]);

  const fetchStats = async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      // Fetch patients count
      const patientsRes = await axiosInstance.post(
        `/api/PatientsMasterAPI/Search/${userId}`,
        {
          ID: null,
          Name: null,
          DOB: null,
          Contact: null,
          Address: null,
          CountryID: null,
          StateID: null,
          Gender: null,
          ActiveStatus: null
        }
      );
      
      let patientsData = [];
      if (patientsRes.data) {
        if (Array.isArray(patientsRes.data)) {
          patientsData = patientsRes.data;
        } else if (patientsRes.data.data && Array.isArray(patientsRes.data.data)) {
          patientsData = patientsRes.data.data;
        }
      }

      // Fetch therapies count
      const therapiesRes = await axiosInstance.post(
        `/api/TherapyMasterAPI/Search/${userId}`,
        {
          ID: null,
          Name: null,
          Description: null,
          Price: null,
          ActiveStatus: null
        }
      );
      
      let therapiesData = [];
      if (therapiesRes.data) {
        if (Array.isArray(therapiesRes.data)) {
          therapiesData = therapiesRes.data;
        } else if (therapiesRes.data.data && Array.isArray(therapiesRes.data.data)) {
          therapiesData = therapiesRes.data.data;
        }
      }

      // Fetch payment modes count
      const paymentRes = await axiosInstance.post(
        `/api/ModeOfPaymentMasterAPI/Search/${userId}`,
        {
          ID: null,
          Name: null,
          ActiveStatus: null
        }
      );
      
      let paymentData = [];
      if (paymentRes.data) {
        if (Array.isArray(paymentRes.data)) {
          paymentData = paymentRes.data;
        } else if (paymentRes.data.data && Array.isArray(paymentRes.data.data)) {
          paymentData = paymentRes.data.data;
        }
      }

      // Fetch packages count (using TherapyMaster for now)
      const packagesRes = await axiosInstance.post(
        `/api/TherapyMasterAPI/Search/${userId}`,
        {
          ID: null,
          Name: null,
          Description: null,
          Price: null,
          ActiveStatus: null
        }
      );
      
      let packagesData = [];
      if (packagesRes.data) {
        if (Array.isArray(packagesRes.data)) {
          packagesData = packagesRes.data;
        } else if (packagesRes.data.data && Array.isArray(packagesRes.data.data)) {
          packagesData = packagesRes.data.data;
        }
      }

      setStats({
        patients: patientsData.length,
        therapies: therapiesData.length,
        paymentModes: paymentData.length,
        packages: packagesData.length
      });

      // console.log('Stats updated:', {
      //   patients: patientsData.length,
      //   therapies: therapiesData.length,
      //   paymentModes: paymentData.length,
      //   packages: packagesData.length
      // });

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('upasanaToken');
    localStorage.removeItem('upasanaUser');
    localStorage.removeItem('upasanaUserID');
    toast.success('Logged out successfully');
    navigate('/admin', { replace: true });
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: <FaHome />, label: 'Dashboard' },
    { path: '/admin/dashboard/patients', icon: <FaUsers />, label: 'Patients' },
    { path: '/admin/dashboard/therapies', icon: <FaClipboardList />, label: 'Therapies' },
    { path: '/admin/dashboard/payments', icon: <FaCreditCard />, label: 'Payment Modes' },
    // { path: '/admin/dashboard/packages', icon: <FaBox />, label: 'Packages' },
  ];

  const isActive = (path) => {
    if (path === '/admin/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E7E1D5]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#57ABB2] border-t-transparent"></div>
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E7E1D5] flex">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {sidebarOpen ? <FaTimes className="text-[#57ABB2] text-xl" /> : <FaBars className="text-[#57ABB2] text-xl" />}
      </button>

      <div className={`
        fixed lg:relative z-40
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        transition-transform duration-300 ease-in-out
        w-64 min-h-screen bg-white shadow-xl
        flex flex-col
      `}>
        <div className="p-6 border-b border-gray-100">
          <div className="items-center gap-3">
              <img src="/logo.png" alt="Upasana Wellness Logo" className="w-32 h-auto" />
            <div>
              <h2 className="font-bold text-gray-800 text-lg">Admin Panel</h2>
              <p className="text-xs text-gray-400">Upasana Wellness</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                ${isActive(item.path) 
                  ? 'bg-gradient-to-r from-[#57ABB2]/10 to-[#DE9A0E]/10 text-[#57ABB2] font-semibold' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#57ABB2]'
                }
              `}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
              {isActive(item.path) && (
                <div className="ml-auto w-1.5 h-8 bg-gradient-to-b from-[#57ABB2] to-[#DE9A0E] rounded-full"></div>
              )}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#57ABB2]/20 to-[#DE9A0E]/20 flex items-center justify-center text-[#57ABB2] font-semibold text-sm">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.username || 'admin'}</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#AE261B] hover:bg-[#AE261B]/5 transition-all duration-300 cursor-pointer group"
          >
            <FaSignOutAlt className="text-lg group-hover:rotate-180 transition-transform duration-300" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 lg:p-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 lg:p-8 min-h-[calc(100vh-2rem)]">
          <Routes>
            <Route path="/" element={<AdminOverview stats={stats} />} />
            <Route path="patients" element={<Patients />} />
            <Route path="therapies" element={<Therapies />} />
            <Route path="payments" element={<PaymentModes />} />
            <Route path="packages" element={<Packages />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </div>
      </div>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

// Admin Overview Component
const AdminOverview = ({ stats }) => {
  const statsData = [
    { label: 'Total Patients', value: stats.patients || 0, color: '#57ABB2' },
    { label: 'Active Therapies', value: stats.therapies || 0, color: '#DE9A0E' },
    { label: 'Payment Modes', value: stats.paymentModes || 0, color: '#E39D17' },
    // { label: 'Packages', value: stats.packages || 0, color: '#AE261B' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Welcome to Admin Panel</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statsData.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold mt-2" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <div className="mt-3 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full"
                style={{ 
                  width: `${Math.min(stat.value * 10, 100)}%`, 
                  backgroundColor: stat.color 
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#57ABB2]/5 to-[#DE9A0E]/5 rounded-2xl p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-2">Quick Actions</h3>
          <p className="text-sm text-gray-500">Use the sidebar to manage patients, therapies, and more.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-white rounded-full text-xs text-[#57ABB2] shadow-sm">Add Patient</span>
            <span className="px-3 py-1 bg-white rounded-full text-xs text-[#DE9A0E] shadow-sm">New Therapy</span>
            <span className="px-3 py-1 bg-white rounded-full text-xs text-[#E39D17] shadow-sm">Payment Mode</span>
          </div>
        </div>
    
      </div>
    </div>
  );
};

export default AdminDashboard;
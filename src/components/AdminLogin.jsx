import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { 
  FaArrowRight,
  FaUserShield,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaLock,
  FaSpinner,
  FaLeaf,
  FaHeart,
  FaSpa
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/axiosConfig';

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [animationError, setAnimationError] = useState(false);
  const navigate = useNavigate();

  const loginSchema = yup.object().shape({
    username: yup.string().required('Username is required'),
    password: yup.string().min(4, 'Password must be at least 4 characters').required('Password is required'),
  });

  const { 
    register, 
    handleSubmit, 
    formState: { errors }
  } = useForm({
    resolver: yupResolver(loginSchema)
  });

  useEffect(() => {
    const token = localStorage.getItem('upasanaToken');
    const user = localStorage.getItem('upasanaUser');
    const userId = localStorage.getItem('upasanaUserID');
    if (token && user && userId) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting login with:', { username: data.username });
      
      const loginFrom = 'web';
      const response = await axiosInstance.post(`/api/UserMasterAPI/Login/${loginFrom}`, {
        username: data.username,
        password: data.password
      });
      
      console.log('Login response:', response.data);
      
      const isSuccess = response.data?.loginStatus === 'ON' || response.data?.success === true;
      
      if (isSuccess) {
        // Extract User ID from the response
        const userId = response.data._dataBaseMaster?.ID || 
                       response.data.userId || 
                       response.data.id || 
                       response.data.user?.ID || 
                       response.data.user?.id;
        
        if (!userId) {
          console.error('No User ID found in response:', response.data);
          setError('User ID not found in response. Please contact support.');
          toast.error('User ID not found');
          setLoading(false);
          return;
        }
        
        console.log('Extracted User ID:', userId);
        
        const rawRole = response.data.accountType || response.data.role || 'Admin';
        const normalizedRole = rawRole.toLowerCase();
        
        const userData = {
          id: userId,
          name: response.data.userName || response.data.name || data.username,
          username: response.data.userName || data.username,
          role: normalizedRole,
          email: response.data._dataBaseMaster?.Email || '',
          contact: response.data._dataBaseMaster?.Contact || ''
        };
        
        const token = response.data.token || btoa(JSON.stringify(userData));
        
        // Store in localStorage
        localStorage.setItem('upasanaToken', token);
        localStorage.setItem('upasanaUser', JSON.stringify(userData));
        localStorage.setItem('upasanaUserID', userId.toString());
        
        console.log('Stored User ID:', localStorage.getItem('upasanaUserID'));
        
        toast.success(`Welcome ${userData.name}! Login successful.`);
        navigate('/admin/dashboard', { replace: true });
      } else {
        const errorMsg = response.data?.message || response.data?.loginStatus || 'Invalid credentials. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Login error:', err);
      
      let errorMsg = 'Something went wrong. Please try again.';
      
      if (err.response) {
        try {
          if (typeof err.response.data === 'object') {
            errorMsg = err.response.data.message || err.response.data.error || 'Server error';
          } else if (typeof err.response.data === 'string') {
            errorMsg = err.response.data;
          }
        } catch (e) {
          errorMsg = 'Server error occurred';
        }
      } else if (err.code === 'ERR_NETWORK') {
        errorMsg = 'Network error. Please check your connection and try again.';
      } else if (err.request) {
        errorMsg = 'No response from server. Please check if the server is running.';
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E7E1D5] p-4">
      <div className="w-full max-w-6xl bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        <div className="flex flex-col lg:flex-row">
          <div className="w-full lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#57ABB2]/5 via-[#E7E1D5]/30 to-[#DE9A0E]/5 p-8 lg:p-12 flex items-center justify-center min-h-[400px] lg:min-h-[600px]">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#57ABB2] rounded-full filter blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#DE9A0E] rounded-full filter blur-3xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#E39D17] rounded-full filter blur-3xl"></div>
            </div>
            
            <div className="relative z-10 flex flex-col items-center space-y-8 w-full">
              <div className="w-full max-w-md h-[300px] lg:h-[400px]">
                {!animationError ? (
                  <DotLottieReact
                    src="/animations/Signup.lottie"
                    loop
                    autoplay
                    className="w-full h-full"
                    onError={() => setAnimationError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-8xl block mb-4">🌿</span>
                  </div>
                )}
              </div>
              
              <div className="text-center space-y-3">
                <h2 className="text-3xl lg:text-4xl font-bold">
                  <span className="text-[#57ABB2]">Welcome to </span>
                  <span className="text-[#DE9A0E]">Upasana Wellness</span>
                </h2>
                <p className="text-gray-600 text-sm lg:text-base max-w-xs mx-auto">
                  Admin Panel - Manage your wellness platform
                </p>
              </div>
              
              <div className="flex items-center space-x-6">
                <FaLeaf className="text-[#57ABB2] text-2xl opacity-60" />
                <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#DE9A0E] to-transparent"></div>
                <FaHeart className="text-[#AE261B] text-2xl opacity-60" />
                <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#DE9A0E] to-transparent"></div>
                <FaSpa className="text-[#E39D17] text-2xl opacity-60" />
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-400 max-w-xs">
                  Secure admin access for Upasana Wellness management
                </p>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 p-8 lg:p-12 flex items-center">
            <div className="w-full max-w-md mx-auto">
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-[#57ABB2]/10 rounded-2xl">
                    <FaUserShield className="text-4xl text-[#57ABB2]" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold">
                  <span className="text-[#57ABB2]">Admin</span>
                  <span className="text-[#DE9A0E]"> Login</span>
                </h1>
                <p className="text-gray-500 mt-2 text-sm">Access the admin dashboard</p>
                <div className="mt-3 h-1 w-16 bg-gradient-to-r from-[#57ABB2] to-[#DE9A0E] rounded-full mx-auto"></div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-[#AE261B]/10 border-l-4 border-[#AE261B] rounded-lg">
                  <p className="text-[#AE261B] text-sm">{error}</p>
                </div>
              )}

             

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaUser className="h-5 w-5 text-[#57ABB2] group-focus-within:text-[#DE9A0E] transition-colors" />
                  </div>
                  <input
                    {...register('username')}
                    type="text"
                    placeholder="Username"
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-300 bg-white/50 focus:bg-white ${
                      errors.username ? 'border-[#AE261B] focus:border-[#AE261B]' : 'border-gray-200 focus:border-[#57ABB2]'
                    } focus:outline-none focus:shadow-lg focus:shadow-[#57ABB2]/10`}
                  />
                  {errors.username && (
                    <p className="mt-1.5 text-xs text-[#AE261B] flex items-center gap-1">
                      <span className="inline-block w-1 h-1 bg-[#AE261B] rounded-full"></span>
                      {errors.username.message}
                    </p>
                  )}
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-[#57ABB2] group-focus-within:text-[#DE9A0E] transition-colors" />
                  </div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    className={`w-full pl-12 pr-12 py-3.5 rounded-xl border-2 transition-all duration-300 bg-white/50 focus:bg-white ${
                      errors.password ? 'border-[#AE261B] focus:border-[#AE261B]' : 'border-gray-200 focus:border-[#57ABB2]'
                    } focus:outline-none focus:shadow-lg focus:shadow-[#57ABB2]/10`}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer group/eye"
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-[#57ABB2] transition-colors group-hover/eye:scale-110" />
                    ) : (
                      <FaEye className="h-5 w-5 text-gray-400 hover:text-[#57ABB2] transition-colors group-hover/eye:scale-110" />
                    )}
                  </button>
                  {errors.password && (
                    <p className="mt-1.5 text-xs text-[#AE261B] flex items-center gap-1">
                      <span className="inline-block w-1 h-1 bg-[#AE261B] rounded-full"></span>
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300 cursor-pointer group relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #57ABB2, #DE9A0E)',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Logging in...</span>
                      </>
                    ) : (
                      <>
                        <span>Admin Login</span>
                        <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400">
                  Upasana Wellness Admin Panel
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
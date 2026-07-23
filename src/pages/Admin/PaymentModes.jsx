import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch,
  FaTimes,
  FaSave,
  FaToggleOn,
  FaToggleOff,
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axiosInstance from '../../utils/axiosConfig';

const PaymentModes = () => {
  const [paymentModes, setPaymentModes] = useState([]);
  const [filteredModes, setFilteredModes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);
  const [formData, setFormData] = useState({
    ID: null,
    Name: '',
    ActiveStatus: null
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMounted = useRef(true);
  const searchTimeout = useRef(null);

  const getUserId = () => {
    const userId = localStorage.getItem('upasanaUserID');
    if (!userId) {
      window.location.href = '/admin';
      return null;
    }
    return userId;
  };

  const loadPaymentModes = useCallback(async () => {
    if (!isMounted.current) return;
    
    const userId = getUserId();
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        `/api/ModeOfPaymentMasterAPI/Search/${userId}`,
        {
          ID: null,
          Name: null,
          ActiveStatus: null
        }
      );
      
      let data = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          data = response.data.data;
        }
      }
      
      data = data.map(item => ({
        ID: item.ID || item.id || null,
        Name: item.Name || item.name || 'Unnamed',
        ActiveStatus: item.ActiveStatus || item.activeStatus || item.status || 'Inactive'
      }));
      
      setPaymentModes(data);
      setFilteredModes(data);
    } catch (error) {
      toast.error('Failed to load payment modes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    loadPaymentModes();
    
    return () => {
      isMounted.current = false;
    };
  }, [loadPaymentModes]);

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      searchPaymentModes(value);
    }, 500);
  };

  const searchPaymentModes = useCallback(async (term) => {
    if (!term || term.trim() === '') {
      setFilteredModes(paymentModes);
      return;
    }
    
    const userId = getUserId();
    if (!userId) return;
    
    setSearchLoading(true);
    try {
      const response = await axiosInstance.post(
        `/api/ModeOfPaymentMasterAPI/Search/${userId}`,
        {
          ID: null,
          Name: term.trim(),
          ActiveStatus: null
        }
      );
      
      let data = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          data = response.data.data;
        }
      }
      
      data = data.map(item => ({
        ID: item.ID || item.id || null,
        Name: item.Name || item.name || 'Unnamed',
        ActiveStatus: item.ActiveStatus || item.activeStatus || item.status || 'Inactive'
      }));
      
      setFilteredModes(data);
    } catch (error) {
      const filtered = paymentModes.filter(mode =>
        mode.Name?.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredModes(filtered);
    } finally {
      setSearchLoading(false);
    }
  }, [paymentModes]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.Name || formData.Name.trim().length < 2) {
      newErrors.Name = 'Payment mode name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.warning('Please fix the errors in the form');
      return;
    }

    const userId = getUserId();
    if (!userId) return;

    setIsSubmitting(true);
    
    try {
      const modeData = {
        ID: isEditMode ? selectedMode.ID : null,
        Name: formData.Name.trim(),
        ActiveStatus: isEditMode ? formData.ActiveStatus : null
      };

      const response = await axiosInstance.post(
        `/api/ModeOfPaymentMasterAPI/Save/${userId}`,
        modeData
      );
      
      if (response.status === 200 || response.status === 201) {
        toast.success(isEditMode ? 'Payment mode updated successfully!' : 'Payment mode added successfully!');
        closeModal();
        loadPaymentModes();
        setSearchTerm('');
      } else {
        toast.error(response.data?.message || 'Operation failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    if (!id) {
      toast.error('Cannot toggle: Invalid ID');
      return;
    }
    
    const userId = getUserId();
    if (!userId) return;
    
    try {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      
      // Find the payment mode to get all fields
      const mode = paymentModes.find(m => m.ID === id);
      if (!mode) {
        toast.error('Payment mode not found');
        return;
      }
      
      // Send ALL fields with the updated status
      const toggleData = {
        ID: mode.ID,
        Name: mode.Name || '',
        ActiveStatus: newStatus
      };
      
      const response = await axiosInstance.post(
        `/api/ModeOfPaymentMasterAPI/Save/${userId}`,
        toggleData
      );
      
      if (response.status === 200 || response.status === 201) {
        toast.success(`Payment mode ${newStatus.toLowerCase()}d successfully!`);
        loadPaymentModes();
      } else {
        toast.error(response.data?.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = (id, name) => {
    if (!id) {
      toast.error('Cannot delete: Invalid ID');
      return;
    }
    
    const confirmId = toast.info(
      <div>
        <p className="font-medium">Delete Payment Mode</p>
        <p className="text-sm text-gray-500">Are you sure you want to delete "{name}"?</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              toast.dismiss(confirmId);
              performDelete(id, name);
            }}
            className="px-4 py-1.5 bg-[#AE261B] text-white rounded-lg text-sm hover:bg-[#AE261B]/80"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(confirmId)}
            className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        position: "top-center"
      }
    );
  };

  const performDelete = async (id, name) => {
    const userId = getUserId();
    if (!userId) return;
    
    try {
      const response = await axiosInstance.post(
        `/api/ModeOfPaymentMasterAPI/Save/${userId}`,
        {
          ID: id,
          ActiveStatus: 'Inactive'
        }
      );
      
      if (response.status === 200 || response.status === 201) {
        toast.success(`Payment mode "${name}" deleted successfully!`);
        loadPaymentModes();
        setSearchTerm('');
      } else {
        toast.error(response.data?.message || 'Failed to delete payment mode');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete payment mode');
    }
  };

  const openModal = (mode = null) => {
    if (mode) {
      setIsEditMode(true);
      setSelectedMode(mode);
      setFormData({
        ID: mode.ID,
        Name: mode.Name || '',
        ActiveStatus: mode.ActiveStatus || 'Active'
      });
    } else {
      setIsEditMode(false);
      setSelectedMode(null);
      setFormData({
        ID: null,
        Name: '',
        ActiveStatus: null
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMode(null);
    setErrors({});
    setIsSubmitting(false);
  };

  const getStatusBadge = (status) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    const statusLower = status.toLowerCase();
    return statusLower === 'active' 
      ? 'bg-green-100 text-green-700'
      : 'bg-gray-100 text-gray-700';
  };

  const commonPaymentModes = ['Cash', 'Card', 'UPI', 'Net Banking', 'Wallet', 'PayPal', 'Google Pay', 'PhonePe', 'Paytm', 'Amazon Pay'];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Payment Modes</h2>
          <p className="text-gray-500 text-sm">Manage all payment methods</p>
          <p className="text-xs text-gray-400 mt-1">Total: {paymentModes.length} modes</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#57ABB2] to-[#DE9A0E] text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
          <FaPlus className="text-sm" />
          <span>Add Payment Mode</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search payment modes..."
            value={searchTerm}
            onChange={handleSearchInput}
            className="w-full pl-10 pr-12 py-2.5 rounded-xl border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors bg-white/50"
          />
          {searchLoading && (
            <FaSpinner className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#57ABB2] animate-spin" />
          )}
          {searchTerm && !searchLoading && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilteredModes(paymentModes);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <FaTimes />
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-xs text-gray-400 mt-1">
            Showing results for: <span className="font-medium text-gray-600">"{searchTerm}"</span>
            {filteredModes.length > 0 && (
              <span className="ml-1">({filteredModes.length} found)</span>
            )}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#57ABB2] border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModes.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              {searchTerm ? 'No payment modes found matching your search' : 'No payment modes added yet'}
            </div>
          ) : (
            filteredModes.map((mode) => (
              <div key={mode.ID || Math.random().toString(36).substring(2)} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{mode.Name}</h3>
                    <p className="text-xs text-gray-400 font-mono">ID: {mode.ID}</p>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(mode.ID, mode.ActiveStatus)}
                    className="text-xl cursor-pointer"
                    disabled={!mode.ID}
                  >
                    {mode.ActiveStatus && mode.ActiveStatus.toLowerCase() === 'active' ? (
                      <FaToggleOn className="text-[#57ABB2]" />
                    ) : (
                      <FaToggleOff className="text-gray-400" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(mode.ActiveStatus)}`}>
                    {mode.ActiveStatus || 'Inactive'}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={() => openModal(mode)}
                    className="flex-1 p-2 text-[#57ABB2] hover:bg-[#57ABB2]/10 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 text-sm"
                    disabled={!mode.ID}
                  >
                    <FaEdit />
                    Edit
                  </button>
                  {/* <button
                    onClick={() => handleDelete(mode.ID, mode.Name)}
                    className="flex-1 p-2 text-[#AE261B] hover:bg-[#AE261B]/10 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 text-sm"
                    disabled={!mode.ID}
                  >
                    <FaTrash />
                    Delete
                  </button> */}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal with Animation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-white rounded-3xl max-w-md w-full modal-content">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {isEditMode ? 'Edit Payment Mode' : 'Add Payment Mode'}
                </h3>
                <p className="text-sm text-gray-500">
                  {isEditMode ? 'Update payment mode' : 'Create a new payment mode'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <FaTimes className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Mode Name *
                </label>
                <input
                  type="text"
                  name="Name"
                  value={formData.Name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border-2 ${
                    errors.Name ? 'border-[#AE261B]' : 'border-gray-200'
                  } focus:border-[#57ABB2] focus:outline-none transition-colors`}
                  placeholder="e.g., Cash, Card, UPI"
                  autoFocus
                />
                {errors.Name && (
                  <p className="mt-1.5 text-xs text-[#AE261B] flex items-center gap-1">
                    <FaExclamationTriangle className="text-xs" />
                    {errors.Name}
                  </p>
                )}
                {!isEditMode && !errors.Name && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-400 mb-1">Common payment modes:</p>
                    <div className="flex flex-wrap gap-1">
                      {commonPaymentModes.map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, Name: mode }));
                            setErrors(prev => ({ ...prev, Name: '' }));
                          }}
                          className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-[#57ABB2]/10 text-gray-600 hover:text-[#57ABB2] rounded-md transition-colors cursor-pointer"
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="ActiveStatus"
                    value={formData.ActiveStatus || 'Active'}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#57ABB2] to-[#DE9A0E] text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FaSave />
                      <span>{isEditMode ? 'Update Mode' : 'Add Mode'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2.5 border-2 border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentModes;
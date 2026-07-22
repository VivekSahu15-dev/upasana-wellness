import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch,
  FaTimes,
  FaSave,
  FaBox,
  FaRupeeSign,
  FaToggleOn,
  FaToggleOff,
  FaClock,
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axiosInstance from '../../utils/axiosConfig';

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [formData, setFormData] = useState({
    ID: null,
    Name: '',
    Description: '',
    Price: '',
    Duration: '',
    Features: '',
    ActiveStatus: null
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMounted = useRef(true);

  const getUserId = () => {
    const userId = localStorage.getItem('upasanaUserID');
    return userId || '1';
  };

  const loadPackages = useCallback(async () => {
    if (!isMounted.current) return;
    
    setLoading(true);
    try {
      const userId = getUserId();
      // Assuming packages are stored in TherapyMaster or have their own API
      // Adjust the endpoint as needed
      const response = await axiosInstance.post(
        `/api/TherapyMasterAPI/Search/${userId}`,
        {
          ID: null,
          Name: null,
          Description: null,
          Price: null,
          ActiveStatus: null
        }
      );
      
      console.log('Load packages response:', response.data);
      
      let data = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          data = response.data.data;
        } else if (response.data.result && Array.isArray(response.data.result)) {
          data = response.data.result;
        }
      }
      
      setPackages(data);
      setFilteredPackages(data);
    } catch (error) {
      console.error('Error loading packages:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    loadPackages();
    
    return () => {
      isMounted.current = false;
    };
  }, [loadPackages]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        handleSearch(searchTerm);
      } else {
        setFilteredPackages(packages);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, packages]);

  const handleSearch = useCallback(async (term) => {
    setSearchLoading(true);
    try {
      const userId = getUserId();
      const response = await axiosInstance.post(
        `/api/TherapyMasterAPI/Search/${userId}`,
        {
          ID: null,
          Name: term || null,
          Description: null,
          Price: null,
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
      
      setFilteredPackages(data);
    } catch (error) {
      console.error('Error searching packages:', error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

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
      newErrors.Name = 'Package name is required';
    }
    
    if (!formData.Price || parseFloat(formData.Price) <= 0) {
      newErrors.Price = 'Please enter a valid price';
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

    setIsSubmitting(true);
    
    try {
      const userId = getUserId();
      
      const packageData = {
        ID: isEditMode ? selectedPackage.ID : null,
        Name: formData.Name.trim(),
        Description: formData.Description || '',
        Price: parseFloat(formData.Price),
        Duration: formData.Duration || '',
        Features: formData.Features || '',
        ActiveStatus: isEditMode ? formData.ActiveStatus : null
      };

      console.log('Saving package data:', packageData);

      const response = await axiosInstance.post(
        `/api/TherapyMasterAPI/Save/${userId}`,
        packageData
      );
      
      console.log('Save response:', response.data);
      
      const responseData = response.data;
      let isSuccess = false;
      let message = '';
      
      if (responseData) {
        if (responseData.ID || responseData.id || responseData.data?.ID || responseData.data?.id) {
          isSuccess = true;
          message = isEditMode ? 'Package updated successfully!' : 'Package added successfully!';
        } 
        else if (responseData.success === true || responseData.status === 'success' || responseData.status === 'Success') {
          isSuccess = true;
          message = responseData.message || (isEditMode ? 'Package updated successfully!' : 'Package added successfully!');
        }
        else if (responseData.message && !responseData.message.toLowerCase().includes('error')) {
          isSuccess = true;
          message = responseData.message;
        }
        else if (response.status === 200 || response.status === 201) {
          isSuccess = true;
          message = isEditMode ? 'Package updated successfully!' : 'Package added successfully!';
        }
      }
      
      if (isSuccess) {
        toast.success(message);
        closeModal();
        await loadPackages();
      } else {
        const errorMsg = responseData?.message || responseData?.error || 'Operation failed';
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error saving package:', error);
      
      let errorMsg = 'Operation failed. Please try again.';
      
      if (error.response) {
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          errorMsg = errorData;
        } else if (errorData?.message) {
          errorMsg = errorData.message;
        } else if (errorData?.error) {
          errorMsg = errorData.error;
        }
      } else if (error.request) {
        errorMsg = 'No response from server. Please check your connection.';
      }
      
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const userId = getUserId();
        const response = await axiosInstance.post(
          `/api/TherapyMasterAPI/Save/${userId}`,
          {
            ID: id,
            ActiveStatus: 'Inactive'
          }
        );
        
        console.log('Delete response:', response.data);
        toast.success(`Package "${name}" deleted successfully!`);
        await loadPackages();
      } catch (error) {
        console.error('Error deleting package:', error);
        toast.error(error.response?.data?.message || 'Failed to delete package');
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const userId = getUserId();
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      const response = await axiosInstance.post(
        `/api/TherapyMasterAPI/Save/${userId}`,
        {
          ID: id,
          ActiveStatus: newStatus
        }
      );
      
      console.log('Toggle status response:', response.data);
      toast.success(`Package ${newStatus.toLowerCase()}d successfully!`);
      await loadPackages();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const openModal = (pkg = null) => {
    if (pkg) {
      setIsEditMode(true);
      setSelectedPackage(pkg);
      setFormData({
        ID: pkg.ID,
        Name: pkg.Name || '',
        Description: pkg.Description || '',
        Price: pkg.Price || '',
        Duration: pkg.Duration || '',
        Features: pkg.Features || '',
        ActiveStatus: pkg.ActiveStatus || 'Active'
      });
    } else {
      setIsEditMode(false);
      setSelectedPackage(null);
      setFormData({
        ID: null,
        Name: '',
        Description: '',
        Price: '',
        Duration: '',
        Features: '',
        ActiveStatus: null
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPackage(null);
    setErrors({});
    setIsSubmitting(false);
  };

  const getStatusBadge = (status) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    return status === 'Active' 
      ? 'bg-green-100 text-green-700'
      : 'bg-gray-100 text-gray-700';
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Packages Management</h2>
          <p className="text-gray-500 text-sm">Manage all wellness packages</p>
          <p className="text-xs text-gray-400 mt-1">Total: {packages.length} packages</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#57ABB2] to-[#DE9A0E] text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
          <FaPlus className="text-sm" />
          <span>Add New Package</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search packages by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-12 py-2.5 rounded-xl border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors bg-white/50"
          />
          {searchLoading && (
            <FaSpinner className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#57ABB2] animate-spin" />
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#57ABB2] border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPackages.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              {searchTerm ? 'No packages found matching your search' : 'No packages added yet'}
            </div>
          ) : (
            filteredPackages.map((pkg) => (
              <div key={pkg.ID} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#57ABB2]/10 rounded-lg">
                      <FaBox className="text-[#57ABB2]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{pkg.Name}</h3>
                      <p className="text-xs text-gray-400 font-mono">ID: {pkg.ID}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(pkg.ID, pkg.ActiveStatus)}
                    className="text-xl cursor-pointer"
                  >
                    {pkg.ActiveStatus === 'Active' ? (
                      <FaToggleOn className="text-[#57ABB2]" />
                    ) : (
                      <FaToggleOff className="text-gray-400" />
                    )}
                  </button>
                </div>
                
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{pkg.Description || 'No description'}</p>
                
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1 text-[#57ABB2] font-semibold">
                    <FaRupeeSign className="text-sm" />
                    <span>{pkg.Price}</span>
                  </div>
                  {pkg.Duration && (
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <FaClock className="text-xs" />
                      <span>{pkg.Duration}</span>
                    </div>
                  )}
                </div>

                {pkg.Features && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 line-clamp-2">{pkg.Features}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(pkg.ActiveStatus)}`}>
                    {pkg.ActiveStatus || 'Inactive'}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={() => openModal(pkg)}
                    className="flex-1 p-2 text-[#57ABB2] hover:bg-[#57ABB2]/10 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 text-sm"
                  >
                    <FaEdit />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.ID, pkg.Name)}
                    className="flex-1 p-2 text-[#AE261B] hover:bg-[#AE261B]/10 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 text-sm"
                  >
                    <FaTrash />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {isEditMode ? 'Edit Package' : 'Add New Package'}
                </h3>
                <p className="text-sm text-gray-500">
                  {isEditMode ? 'Update package details' : 'Create a new package'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Package Name *</label>
                <input
                  type="text"
                  name="Name"
                  value={formData.Name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border-2 ${errors.Name ? 'border-[#AE261B]' : 'border-gray-200'} focus:border-[#57ABB2] focus:outline-none transition-colors`}
                  placeholder="Enter package name"
                  autoFocus
                />
                {errors.Name && (
                  <p className="mt-1.5 text-xs text-[#AE261B] flex items-center gap-1">
                    <FaExclamationTriangle className="text-xs" />
                    {errors.Name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="Description"
                  value={formData.Description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors resize-none"
                  placeholder="Describe the package..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                  <div className="relative">
                    <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      name="Price"
                      value={formData.Price}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 ${errors.Price ? 'border-[#AE261B]' : 'border-gray-200'} focus:border-[#57ABB2] focus:outline-none transition-colors`}
                      placeholder="0.00"
                      required
                      step="0.01"
                      min="0"
                    />
                  </div>
                  {errors.Price && (
                    <p className="mt-1.5 text-xs text-[#AE261B] flex items-center gap-1">
                      <FaExclamationTriangle className="text-xs" />
                      {errors.Price}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    name="Duration"
                    value={formData.Duration}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors"
                    placeholder="e.g., 30 days"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
                <textarea
                  name="Features"
                  value={formData.Features}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors resize-none"
                  placeholder="List package features..."
                />
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
                      <span>{isEditMode ? 'Update Package' : 'Add Package'}</span>
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

export default Packages;
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch,
  FaTimes,
  FaSave,
  FaRupeeSign,
  FaToggleOn,
  FaToggleOff,
  FaSpinner
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axiosInstance from '../../utils/axiosConfig';

const Therapies = () => {
  const [therapies, setTherapies] = useState([]);
  const [filteredTherapies, setFilteredTherapies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTherapy, setSelectedTherapy] = useState(null);
  const [formData, setFormData] = useState({
    ID: null,
    Name: '',
    Description: '',
    Price: '',
    ActiveStatus: null
  });
  const [errors, setErrors] = useState({});
  const isMounted = useRef(true);

  const getUserId = () => {
    const userId = localStorage.getItem('upasanaUserID');
    return userId || '1';
  };

  const loadTherapies = useCallback(async () => {
    if (!isMounted.current) return;
    
    setLoading(true);
    try {
      const userId = getUserId();
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
      
      if (response.data && response.data.success) {
        setTherapies(response.data.data || []);
        setFilteredTherapies(response.data.data || []);
      } else {
        setTherapies([]);
        setFilteredTherapies([]);
      }
    } catch (error) {
      console.error('Error loading therapies:', error);
      toast.error('Failed to load therapies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    loadTherapies();
    
    return () => {
      isMounted.current = false;
    };
  }, [loadTherapies]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        handleSearch(searchTerm);
      } else {
        setFilteredTherapies(therapies);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, therapies]);

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
      
      if (response.data && response.data.success) {
        setFilteredTherapies(response.data.data || []);
      }
    } catch (error) {
      console.error('Error searching therapies:', error);
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
      newErrors.Name = 'Therapy name is required';
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

    try {
      const userId = getUserId();
      const therapyData = {
        ID: isEditMode ? selectedTherapy.ID : null,
        Name: formData.Name,
        Description: formData.Description || '',
        Price: parseFloat(formData.Price),
        ActiveStatus: isEditMode ? formData.ActiveStatus : null
      };

      const response = await axiosInstance.post(
        `/api/TherapyMasterAPI/Save/${userId}`,
        therapyData
      );
      
      if (response.data && response.data.success) {
        toast.success(isEditMode ? 'Therapy updated successfully!' : 'Therapy added successfully!');
        closeModal();
        loadTherapies();
      } else {
        toast.error(response.data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving therapy:', error);
      toast.error(error.response?.data?.message || 'Operation failed. Please try again.');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        const userId = getUserId();
        const response = await axiosInstance.post(
          `/api/TherapyMasterAPI/Save/${userId}`,
          {
            ID: id,
            ActiveStatus: 'Inactive'
          }
        );
        
        if (response.data && response.data.success) {
          toast.success(`Therapy ${name} deleted successfully!`);
          loadTherapies();
        }
      } catch (error) {
        console.error('Error deleting therapy:', error);
        toast.error('Failed to delete therapy');
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
      
      if (response.data && response.data.success) {
        toast.success(`Therapy ${newStatus.toLowerCase()}d successfully!`);
        loadTherapies();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const openModal = (therapy = null) => {
    if (therapy) {
      setIsEditMode(true);
      setSelectedTherapy(therapy);
      setFormData({
        ID: therapy.ID,
        Name: therapy.Name || '',
        Description: therapy.Description || '',
        Price: therapy.Price || '',
        ActiveStatus: therapy.ActiveStatus || 'Active'
      });
    } else {
      setIsEditMode(false);
      setSelectedTherapy(null);
      setFormData({
        ID: null,
        Name: '',
        Description: '',
        Price: '',
        ActiveStatus: null
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTherapy(null);
    setErrors({});
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
          <h2 className="text-2xl font-bold text-gray-800">Therapies Management</h2>
          <p className="text-gray-500 text-sm">Manage all therapy offerings</p>
          <p className="text-xs text-gray-400 mt-1">Total: {therapies.length} therapies</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#57ABB2] to-[#DE9A0E] text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
          <FaPlus className="text-sm" />
          <span>Add New Therapy</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search therapies by name..."
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
          {filteredTherapies.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              {searchTerm ? 'No therapies found matching your search' : 'No therapies added yet'}
            </div>
          ) : (
            filteredTherapies.map((therapy) => (
              <div key={therapy.ID} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{therapy.Name}</h3>
                    <p className="text-xs text-gray-400 font-mono">ID: {therapy.ID}</p>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(therapy.ID, therapy.ActiveStatus)}
                    className="text-xl cursor-pointer"
                  >
                    {therapy.ActiveStatus === 'Active' ? (
                      <FaToggleOn className="text-[#57ABB2]" />
                    ) : (
                      <FaToggleOff className="text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{therapy.Description || 'No description'}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[#57ABB2] font-semibold">
                    <FaRupeeSign className="text-sm" />
                    <span>{therapy.Price}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(therapy.ActiveStatus)}`}>
                    {therapy.ActiveStatus || 'Inactive'}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={() => openModal(therapy)}
                    className="flex-1 p-2 text-[#57ABB2] hover:bg-[#57ABB2]/10 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 text-sm"
                  >
                    <FaEdit />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(therapy.ID, therapy.Name)}
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
          <div className="bg-white rounded-3xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {isEditMode ? 'Edit Therapy' : 'Add New Therapy'}
                </h3>
                <p className="text-sm text-gray-500">
                  {isEditMode ? 'Update therapy details' : 'Create a new therapy'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Therapy Name *</label>
                <input
                  type="text"
                  name="Name"
                  value={formData.Name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border-2 ${errors.Name ? 'border-[#AE261B]' : 'border-gray-200'} focus:border-[#57ABB2] focus:outline-none transition-colors`}
                  placeholder="Enter therapy name"
                />
                {errors.Name && <p className="mt-1 text-xs text-[#AE261B]">{errors.Name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="Description"
                  value={formData.Description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors resize-none"
                  placeholder="Describe the therapy..."
                />
              </div>

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
                    step="0.01"
                    min="0"
                  />
                </div>
                {errors.Price && <p className="mt-1 text-xs text-[#AE261B]">{errors.Price}</p>}
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
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#57ABB2] to-[#DE9A0E] text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                >
                  <FaSave />
                  {isEditMode ? 'Update Therapy' : 'Add Therapy'}
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

export default Therapies;
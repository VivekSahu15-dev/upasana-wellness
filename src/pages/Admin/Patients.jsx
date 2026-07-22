import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch,
  FaTimes,
  FaSave,
  FaUserPlus,
  FaPhone,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaSpinner,
  FaToggleOn,
  FaToggleOff,
  FaGlobe
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axiosInstance from '../../utils/axiosConfig';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [allStates, setAllStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({
    ID: null,
    Name: '',
    DOB: '',
    Contact: '',
    Address: '',
    CountryID: null,
    StateID: null,
    Gender: 'Male',
    ActiveStatus: null
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientCache, setPatientCache] = useState({});
  const isMounted = useRef(true);
  const countriesLoaded = useRef(false);
  const searchTimeout = useRef(null);

  const getUserId = () => {
    const userId = localStorage.getItem('upasanaUserID');
    if (!userId) {
      window.location.href = '/admin';
      return null;
    }
    return userId;
  };

  const loadCountries = useCallback(async () => {
    if (countriesLoaded.current) return;
    
    const userId = getUserId();
    if (!userId) return;
    
    try {
      const response = await axiosInstance.post(
        `/api/CountryMasterAPI/Search/${userId}`,
        {
          ID: null,
          Name: null,
          ChargeGST: null,
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
        Name: item.Name || item.name || 'Unknown'
      }));
      
      setCountries(data);
      countriesLoaded.current = true;
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  }, []);

  const loadStates = useCallback(async (countryId) => {
    if (!countryId) {
      setStates([]);
      return;
    }
    
    if (allStates[countryId]) {
      setStates(allStates[countryId]);
      return;
    }
    
    const userId = getUserId();
    if (!userId) return;
    
    try {
      const response = await axiosInstance.post(
        `/api/StateMasterAPI/Search/${userId}`,
        { CountryID: parseInt(countryId) }
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
        Name: item.Name || item.name || 'Unknown'
      }));
      
      setAllStates(prev => ({ ...prev, [countryId]: data }));
      setStates(data);
    } catch (error) {
      console.error('Error loading states:', error);
    }
  }, [allStates]);

  const loadPatients = useCallback(async () => {
    if (!isMounted.current) return;
    
    const userId = getUserId();
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await axiosInstance.post(
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
      
      let data = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          data = response.data.data;
        }
      }
      
      data = data.map(item => {
        const patientId = item.ID || item.id || null;
        const cached = patientCache[patientId] || {};
        
        return {
          ID: patientId,
          Name: item.Name || item.name || 'Unnamed',
          DOB: item.DOB || item.dob || '',
          Contact: item.Contact || item.contact || '',
          Address: item.Address || item.address || '',
          CountryID: item.CountryID || item.countryID || item.countryId || cached.CountryID || null,
          StateID: item.StateID || item.stateID || item.stateId || cached.StateID || null,
          Gender: item.Gender || item.gender || 'Male',
          ActiveStatus: item.ActiveStatus || item.activeStatus || item.status || 'Inactive'
        };
      });
      
      setPatients(data);
      setFilteredPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, [patientCache]);

  // Search patients by name
  const searchPatients = useCallback(async (term) => {
    if (!term || term.trim() === '') {
      setFilteredPatients(patients);
      return;
    }
    
    const userId = getUserId();
    if (!userId) return;
    
    setSearchLoading(true);
    try {
      // Search by Name field (as per the search API)
      const response = await axiosInstance.post(
        `/api/PatientsMasterAPI/Search/${userId}`,
        {
          ID: null,
          Name: term.trim(), // Search by name
          DOB: null,
          Contact: null,
          Address: null,
          CountryID: null,
          StateID: null,
          Gender: null,
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
      
      data = data.map(item => {
        const patientId = item.ID || item.id || null;
        const cached = patientCache[patientId] || {};
        
        return {
          ID: patientId,
          Name: item.Name || item.name || 'Unnamed',
          DOB: item.DOB || item.dob || '',
          Contact: item.Contact || item.contact || '',
          Address: item.Address || item.address || '',
          CountryID: item.CountryID || item.countryID || cached.CountryID || null,
          StateID: item.StateID || item.stateID || cached.StateID || null,
          Gender: item.Gender || item.gender || 'Male',
          ActiveStatus: item.ActiveStatus || item.activeStatus || item.status || 'Inactive'
        };
      });
      
      setFilteredPatients(data);
    } catch (error) {
      console.error('Error searching patients:', error);
      // Fallback to client-side filtering by name
      const filtered = patients.filter(patient =>
        patient.Name?.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredPatients(filtered);
    } finally {
      setSearchLoading(false);
    }
  }, [patientCache, patients]);

  // Handle search input with debounce
  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      searchPatients(value);
    }, 500);
  };

  useEffect(() => {
    isMounted.current = true;
    
    const initData = async () => {
      await loadCountries();
      await loadPatients();
    };
    
    initData();
    
    return () => {
      isMounted.current = false;
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [loadCountries, loadPatients]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (name === 'CountryID') {
      setFormData(prev => ({ ...prev, [name]: value, StateID: null }));
      if (value) {
        loadStates(value);
      } else {
        setStates([]);
      }
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.Name || formData.Name.trim().length < 2) {
      newErrors.Name = 'Name must be at least 2 characters';
    }
    
    if (!formData.Contact || formData.Contact.length !== 10) {
      newErrors.Contact = 'Please enter a valid 10-digit phone number';
    }
    
    if (!formData.DOB) {
      newErrors.DOB = 'Date of birth is required';
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
      const patientData = {
        ID: isEditMode ? selectedPatient.ID : null,
        Name: formData.Name,
        DOB: formData.DOB,
        Contact: formData.Contact,
        Address: formData.Address || '',
        CountryID: formData.CountryID ? parseInt(formData.CountryID) : null,
        StateID: formData.StateID ? parseInt(formData.StateID) : null,
        Gender: formData.Gender,
        ActiveStatus: isEditMode ? formData.ActiveStatus : null
      };

      const response = await axiosInstance.post(
        `/api/PatientsMasterAPI/Save/${userId}`,
        patientData
      );
      
      if (response.status === 200 || response.status === 201) {
        toast.success(isEditMode ? 'Patient updated successfully!' : 'Patient created successfully!');
        
        const patientId = isEditMode ? selectedPatient.ID : (response.data?.ID || response.data?.id || Date.now());
        setPatientCache(prev => ({
          ...prev,
          [patientId]: {
            CountryID: patientData.CountryID,
            StateID: patientData.StateID
          }
        }));
        
        closeModal();
        await loadCountries();
        await loadPatients();
        setSearchTerm('');
      } else {
        toast.error(response.data?.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error(error.response?.data?.message || 'Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id, name) => {
    if (!id) {
      toast.error('Cannot delete: Invalid ID');
      return;
    }
    
    const confirmId = toast.info(
      <div>
        <p className="font-medium">Delete Patient</p>
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
        `/api/PatientsMasterAPI/Save/${userId}`,
        {
          ID: id,
          ActiveStatus: 'Inactive'
        }
      );
      
      if (response.status === 200 || response.status === 201) {
        toast.success(`Patient "${name}" deleted successfully!`);
        setPatientCache(prev => {
          const newCache = { ...prev };
          delete newCache[id];
          return newCache;
        });
        await loadPatients();
        setSearchTerm('');
      } else {
        toast.error(response.data?.message || 'Failed to delete patient');
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error(error.response?.data?.message || 'Failed to delete patient');
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
      
      const patient = patients.find(p => p.ID === id);
      if (!patient) {
        toast.error('Patient not found');
        return;
      }
      
      const toggleData = {
        ID: patient.ID,
        Name: patient.Name || '',
        DOB: patient.DOB || '',
        Contact: patient.Contact || '',
        Address: patient.Address || '',
        CountryID: patient.CountryID || null,
        StateID: patient.StateID || null,
        Gender: patient.Gender || 'Male',
        ActiveStatus: newStatus
      };
      
      const response = await axiosInstance.post(
        `/api/PatientsMasterAPI/Save/${userId}`,
        toggleData
      );
      
      if (response.status === 200 || response.status === 201) {
        toast.success(`Patient ${newStatus.toLowerCase()}d successfully!`);
        await loadPatients();
      } else {
        toast.error(response.data?.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const openModal = (patient = null) => {
    if (patient) {
      setIsEditMode(true);
      setSelectedPatient(patient);
      
      let dobValue = patient.DOB || '';
      if (dobValue && dobValue.includes('T')) {
        dobValue = dobValue.split('T')[0];
      }
      
      const countryId = patient.CountryID || null;
      const stateId = patient.StateID || null;
      
      setFormData({
        ID: patient.ID || null,
        Name: patient.Name || '',
        DOB: dobValue,
        Contact: patient.Contact || '',
        Address: patient.Address || '',
        CountryID: countryId,
        StateID: stateId,
        Gender: patient.Gender || 'Male',
        ActiveStatus: patient.ActiveStatus || 'Active'
      });
      
      if (countryId) {
        loadStates(countryId);
      } else {
        setStates([]);
      }
    } else {
      setIsEditMode(false);
      setSelectedPatient(null);
      setFormData({
        ID: null,
        Name: '',
        DOB: '',
        Contact: '',
        Address: '',
        CountryID: null,
        StateID: null,
        Gender: 'Male',
        ActiveStatus: null
      });
      setStates([]);
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPatient(null);
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

  const getCountryName = (countryId) => {
    if (!countryId) return 'N/A';
    const country = countries.find(c => c.ID === countryId);
    return country ? country.Name : 'N/A';
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Patients Management</h2>
          <p className="text-gray-500 text-sm">Manage all patient records</p>
          <p className="text-xs text-gray-400 mt-1">Total: {patients.length} patients</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#57ABB2] to-[#DE9A0E] text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
          <FaUserPlus className="text-sm" />
          <span>Add New Patient</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients by name..."
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
                setFilteredPatients(patients);
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
            {filteredPatients.length > 0 && (
              <span className="ml-1">({filteredPatients.length} found)</span>
            )}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#57ABB2] border-t-transparent"></div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-100">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Country</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                    {searchTerm ? 'No patients found matching your search' : 'No patients added yet'}
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const countryName = getCountryName(patient.CountryID);
                  return (
                    <tr key={patient.ID} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs font-mono text-gray-500">{patient.ID}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#57ABB2]/20 to-[#DE9A0E]/20 flex items-center justify-center text-[#57ABB2] font-semibold">
                            {patient.Name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{patient.Name}</p>
                            <p className="text-xs text-gray-400">{patient.Gender}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-sm text-gray-600">{patient.Contact}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-sm text-gray-600">{countryName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(patient.ID, patient.ActiveStatus)}
                          className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${getStatusBadge(patient.ActiveStatus)} hover:opacity-80 flex items-center gap-1`}
                          disabled={!patient.ID}
                        >
                          {patient.ActiveStatus && patient.ActiveStatus.toLowerCase() === 'active' ? (
                            <FaToggleOn className="text-sm" />
                          ) : (
                            <FaToggleOff className="text-sm" />
                          )}
                          {patient.ActiveStatus || 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(patient)}
                            className="p-2 text-[#57ABB2] hover:bg-[#57ABB2]/10 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                            disabled={!patient.ID}
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(patient.ID, patient.Name)}
                            className="p-2 text-[#AE261B] hover:bg-[#AE261B]/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                            disabled={!patient.ID}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {isEditMode ? 'Edit Patient' : 'Add New Patient'}
                </h3>
                <p className="text-sm text-gray-500">
                  {isEditMode ? 'Update patient information' : 'Create a new patient record'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="Name"
                  value={formData.Name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border-2 ${errors.Name ? 'border-[#AE261B]' : 'border-gray-200'} focus:border-[#57ABB2] focus:outline-none transition-colors`}
                  placeholder="Enter full name"
                />
                {errors.Name && <p className="mt-1 text-xs text-[#AE261B]">{errors.Name}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                  <div className="relative">
                    <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      name="DOB"
                      value={formData.DOB}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 ${errors.DOB ? 'border-[#AE261B]' : 'border-gray-200'} focus:border-[#57ABB2] focus:outline-none transition-colors`}
                    />
                  </div>
                  {errors.DOB && <p className="mt-1 text-xs text-[#AE261B]">{errors.DOB}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    name="Gender"
                    value={formData.Gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="Contact"
                    value={formData.Contact}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 ${errors.Contact ? 'border-[#AE261B]' : 'border-gray-200'} focus:border-[#57ABB2] focus:outline-none transition-colors`}
                    placeholder="Enter 10-digit number"
                    maxLength="10"
                  />
                </div>
                {errors.Contact && <p className="mt-1 text-xs text-[#AE261B]">{errors.Contact}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
                  <textarea
                    name="Address"
                    value={formData.Address}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors resize-none"
                    placeholder="Enter address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <div className="relative">
                    <FaGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      name="CountryID"
                      value={formData.CountryID || ''}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors"
                    >
                      <option value="">Select Country</option>
                      {countries.map(country => (
                        <option key={country.ID} value={country.ID}>{country.Name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select
                    name="StateID"
                    value={formData.StateID || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors"
                    disabled={!formData.CountryID}
                  >
                    <option value="">Select State</option>
                    {states.map(state => (
                      <option key={state.ID} value={state.ID}>{state.Name}</option>
                    ))}
                  </select>
                  {!formData.CountryID && (
                    <p className="mt-1 text-xs text-gray-400">Please select a country first</p>
                  )}
                </div>
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
                      <span>{isEditMode ? 'Update Patient' : 'Create Patient'}</span>
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

export default Patients;
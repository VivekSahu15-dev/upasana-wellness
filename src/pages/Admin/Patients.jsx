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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('');
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
  const isMounted = useRef(true);

  // Get User ID from localStorage
  const getUserId = () => {
    const userId = localStorage.getItem('upasanaUserID');
    console.log('Getting User ID from localStorage:', userId);
    return userId || '1';
  };

  // Load Countries with better error handling
  const loadCountries = useCallback(async () => {
    try {
      const userId = getUserId();
      console.log('Loading countries with UserID:', userId);
      
      const response = await axiosInstance.post(
        `/api/CountryMasterAPI/Search/${userId}`,
        {
          ID: null,
          Name: null,
          ChargeGST: null,
          ActiveStatus: null
        }
      );
      
      console.log('Country API Response:', response.data);
      
      // Check if response is valid JSON data
      if (response.data && Array.isArray(response.data)) {
        setCountries(response.data);
        console.log('Countries loaded:', response.data.length);
      } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setCountries(response.data.data);
        console.log('Countries loaded from data property:', response.data.data.length);
      } else {
        console.warn('Unexpected country response format:', response.data);
        // Set default countries as fallback
        setCountries([
          { ID: 1, Name: 'India' },
          { ID: 2, Name: 'USA' },
          { ID: 3, Name: 'UK' },
          { ID: 4, Name: 'Canada' },
          { ID: 5, Name: 'Australia' }
        ]);
        toast.info('Using default country list');
      }
    } catch (error) {
      console.error('Error loading countries:', error);
      // Set default countries as fallback
      setCountries([
        { ID: 1, Name: 'India' },
        { ID: 2, Name: 'USA' },
        { ID: 3, Name: 'UK' },
        { ID: 4, Name: 'Canada' },
        { ID: 5, Name: 'Australia' }
      ]);
      toast.warning('Could not load countries, using default list');
    }
  }, []);

  // Load States based on selected country
  const loadStates = useCallback(async (countryId) => {
    if (!countryId) {
      setStates([]);
      return;
    }
    
    try {
      const userId = getUserId();
      console.log('Loading states with UserID:', userId, 'CountryID:', countryId);
      const response = await axiosInstance.post(
        `/api/StateMasterAPI/Search/${userId}`,
        { CountryID: parseInt(countryId) }
      );
      
      console.log('State API Response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setStates(response.data);
      } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setStates(response.data.data);
      } else {
        // Set default states as fallback
        const defaultStates = {
          1: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh'],
          2: ['California', 'Texas', 'New York', 'Florida', 'Illinois'],
          3: ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds'],
          4: ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba'],
          5: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia']
        };
        
        const stateList = defaultStates[parseInt(countryId)] || ['State 1', 'State 2', 'State 3'];
        setStates(stateList.map((name, index) => ({ ID: index + 1, Name: name })));
        toast.info('Using default state list');
      }
    } catch (error) {
      console.error('Error loading states:', error);
      setStates([]);
    }
  }, []);

  const loadPatients = useCallback(async () => {
    if (!isMounted.current) return;
    
    setLoading(true);
    try {
      const userId = getUserId();
      console.log('Loading patients with UserID:', userId);
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
      
      console.log('Patients API Response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setPatients(response.data);
        setFilteredPatients(response.data);
      } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setPatients(response.data.data);
        setFilteredPatients(response.data.data);
      } else {
        setPatients([]);
        setFilteredPatients([]);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    loadPatients();
    loadCountries();
    
    return () => {
      isMounted.current = false;
    };
  }, [loadPatients, loadCountries]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        handleSearch(searchTerm);
      } else {
        setFilteredPatients(patients);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, patients]);

  const handleSearch = useCallback(async (term) => {
    setSearchLoading(true);
    try {
      const userId = getUserId();
      const response = await axiosInstance.post(
        `/api/PatientsMasterAPI/Search/${userId}`,
        {
          ID: null,
          Name: term || null,
          DOB: null,
          Contact: term || null,
          Address: null,
          CountryID: null,
          StateID: null,
          Gender: null,
          ActiveStatus: null
        }
      );
      
      if (response.data && Array.isArray(response.data)) {
        setFilteredPatients(response.data);
      } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setFilteredPatients(response.data.data);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Handle country change - load states
    if (name === 'CountryID') {
      setSelectedCountry(value);
      setFormData(prev => ({ ...prev, [name]: value, StateID: null }));
      loadStates(value);
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
    
    if (!formData.CountryID) {
      newErrors.CountryID = 'Please select a country';
    }
    
    if (!formData.StateID) {
      newErrors.StateID = 'Please select a state';
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
      const patientData = {
        ID: isEditMode ? selectedPatient.ID : null,
        Name: formData.Name,
        DOB: formData.DOB,
        Contact: formData.Contact,
        Address: formData.Address || '',
        CountryID: parseInt(formData.CountryID),
        StateID: parseInt(formData.StateID),
        Gender: formData.Gender,
        ActiveStatus: isEditMode ? formData.ActiveStatus : null
      };

      const response = await axiosInstance.post(
        `/api/PatientsMasterAPI/Save/${userId}`,
        patientData
      );
      
      if (response.data && (response.data.success || response.data.ID)) {
        toast.success(isEditMode ? 'Patient updated successfully!' : 'Patient created successfully!');
        closeModal();
        loadPatients();
      } else {
        toast.error(response.data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error(error.response?.data?.message || 'Operation failed. Please try again.');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      try {
        const userId = getUserId();
        const response = await axiosInstance.post(
          `/api/PatientsMasterAPI/Save/${userId}`,
          {
            ID: id,
            ActiveStatus: 'Inactive'
          }
        );
        
        if (response.data && (response.data.success || response.data.ID)) {
          toast.success(`Patient ${name} deleted successfully!`);
          loadPatients();
        }
      } catch (error) {
        console.error('Error deleting patient:', error);
        toast.error('Failed to delete patient');
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const userId = getUserId();
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      const response = await axiosInstance.post(
        `/api/PatientsMasterAPI/Save/${userId}`,
        {
          ID: id,
          ActiveStatus: newStatus
        }
      );
      
      if (response.data && (response.data.success || response.data.ID)) {
        toast.success(`Patient ${newStatus.toLowerCase()}d successfully!`);
        loadPatients();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const openModal = (patient = null) => {
    if (patient) {
      setIsEditMode(true);
      setSelectedPatient(patient);
      setFormData({
        ID: patient.ID,
        Name: patient.Name || '',
        DOB: patient.DOB || '',
        Contact: patient.Contact || '',
        Address: patient.Address || '',
        CountryID: patient.CountryID || null,
        StateID: patient.StateID || null,
        Gender: patient.Gender || 'Male',
        ActiveStatus: patient.ActiveStatus || 'Active'
      });
      if (patient.CountryID) {
        setSelectedCountry(patient.CountryID.toString());
        loadStates(patient.CountryID);
      }
    } else {
      setIsEditMode(false);
      setSelectedPatient(null);
      setSelectedCountry('');
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
    setSelectedCountry('');
    setStates([]);
  };

  const getStatusBadge = (status) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    return status === 'Active' 
      ? 'bg-green-100 text-green-700'
      : 'bg-gray-100 text-gray-700';
  };

  const getCountryName = (countryId) => {
    const country = countries.find(c => c.ID === countryId);
    return country ? country.Name : '';
  };

  const getStateName = (stateId) => {
    const state = states.find(s => s.ID === stateId);
    return state ? state.Name : '';
  };

  return (
    <div>
      {/* Header */}
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
            placeholder="Search patients by name or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-12 py-2.5 rounded-xl border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors bg-white/50"
          />
          {searchLoading && (
            <FaSpinner className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#57ABB2] animate-spin" />
          )}
        </div>
      </div>

      {/* Patients Table */}
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
                filteredPatients.map((patient) => (
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
                      <p className="text-sm text-gray-600">{getCountryName(patient.CountryID)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(patient.ID, patient.ActiveStatus)}
                        className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${getStatusBadge(patient.ActiveStatus)} hover:opacity-80 flex items-center gap-1`}
                      >
                        {patient.ActiveStatus === 'Active' ? (
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
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(patient.ID, patient.Name)}
                          className="p-2 text-[#AE261B] hover:bg-[#AE261B]/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                  <div className="relative">
                    <FaGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      name="CountryID"
                      value={formData.CountryID || ''}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 ${errors.CountryID ? 'border-[#AE261B]' : 'border-gray-200'} focus:border-[#57ABB2] focus:outline-none transition-colors`}
                    >
                      <option value="">Select Country</option>
                      {countries.map(country => (
                        <option key={country.ID} value={country.ID}>{country.Name}</option>
                      ))}
                    </select>
                  </div>
                  {errors.CountryID && <p className="mt-1 text-xs text-[#AE261B]">{errors.CountryID}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <select
                    name="StateID"
                    value={formData.StateID || ''}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 ${errors.StateID ? 'border-[#AE261B]' : 'border-gray-200'} focus:border-[#57ABB2] focus:outline-none transition-colors`}
                    disabled={!formData.CountryID}
                  >
                    <option value="">Select State</option>
                    {states.map(state => (
                      <option key={state.ID} value={state.ID}>{state.Name}</option>
                    ))}
                  </select>
                  {errors.StateID && <p className="mt-1 text-xs text-[#AE261B]">{errors.StateID}</p>}
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
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#57ABB2] to-[#DE9A0E] text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                >
                  <FaSave />
                  {isEditMode ? 'Update Patient' : 'Create Patient'}
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
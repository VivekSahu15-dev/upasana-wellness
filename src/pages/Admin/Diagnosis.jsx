import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch,
  FaTimes,
  FaSave,
  FaSpinner,
  FaUser,
  FaStethoscope,
  FaRupeeSign,
  FaPlusCircle,
  FaMinusCircle,
  FaExclamationTriangle,
  FaCheckCircle,
  FaUserCog,
  FaFileInvoice,
  FaCalendarAlt,
  FaClock,
  FaPrint
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axiosInstance from '../../utils/axiosConfig';

const Diagnosis = () => {
  const [diagnoses, setDiagnoses] = useState([]);
  const [filteredDiagnoses, setFilteredDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [therapies, setTherapies] = useState([]);
  const [therapySearchTerm, setTherapySearchTerm] = useState('');
  const [filteredTherapies, setFilteredTherapies] = useState([]);
  const [showTherapyDropdown, setShowTherapyDropdown] = useState(false);
  const [formData, setFormData] = useState({
    ID: null,
    _summaryVar: {
      PatientID: null,
      Problems: '',
      Advice: '',
      Precautions: '',
      TotalTherapyAmount: 0,
      TherapyDiscount: 0,
      NetTherapyAmount: 0,
      TotalAmount: 0,
      DiscountAmount: 0,
      GrandTotal: 0,
      RoundOff: 0,
      NetPayableAmount: 0
    },
    _therapyList: []
  });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTherapy, setSelectedTherapy] = useState(null);
  const [therapyFormData, setTherapyFormData] = useState({
    TherapyID: null,
    TherapyName: '',
    Time1: '',
    Time2: '',
    Price: 0,
    TotalAmount: 0,
    DiscountAmount: 0,
    NetAmount: 0
  });
  const isMounted = useRef(true);
  const searchTimeout = useRef(null);
  const patientSearchTimeout = useRef(null);
  const therapySearchTimeout = useRef(null);

  // Get Admin User ID (for authentication and URL)
  const getAdminUserId = () => {
    const userId = localStorage.getItem('upasanaUserID');
    if (!userId) {
      window.location.href = '/admin';
      return null;
    }
    return userId;
  };

  // Get Admin User Data
  const getAdminUser = () => {
    const userData = localStorage.getItem('upasanaUser');
    if (!userData) return null;
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  };

  // Load diagnoses using Search/Summary endpoint
  const loadDiagnoses = useCallback(async () => {
    if (!isMounted.current) return;
    
    const adminId = getAdminUserId();
    if (!adminId) return;
    
    setLoading(true);
    try {
      // Using the Search/Summary endpoint
      const format = 'json'; // Can be any string for now
      const response = await axiosInstance.post(
        `/api/DiagnosisAPI/Search/Summary/${format}/${adminId}`,
        {
          Date: null,
          From: null,
          To: null,
          ID: null,
          PatientID: null
        }
      );
      
      console.log('Diagnoses response:', response.data);
      
      let data = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          data = response.data.data;
        }
      }
      
      setDiagnoses(data);
      setFilteredDiagnoses(data);
    } catch (error) {
      console.error('Error loading diagnoses:', error);
      toast.error('Failed to load diagnoses');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load patients for dropdown
  const loadPatients = useCallback(async (search = '') => {
    const adminId = getAdminUserId();
    if (!adminId) return;
    
    try {
      const response = await axiosInstance.post(
        `/api/PatientsMasterAPI/Search/${adminId}`,
        {
          ID: null,
          Name: search || null,
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
      
      setPatients(data);
      setFilteredPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  }, []);

  // Load therapies for dropdown
  const loadTherapies = useCallback(async (search = '') => {
    const adminId = getAdminUserId();
    if (!adminId) return;
    
    try {
      const response = await axiosInstance.post(
        `/api/TherapyMasterAPI/Search/${adminId}`,
        {
          ID: null,
          Name: search || null,
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
      
      setTherapies(data);
      setFilteredTherapies(data);
    } catch (error) {
      console.error('Error loading therapies:', error);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    loadDiagnoses();
    loadPatients();
    loadTherapies();
    
    return () => {
      isMounted.current = false;
    };
  }, [loadDiagnoses, loadPatients, loadTherapies]);

  // Search diagnoses with filters
  const searchDiagnoses = useCallback(async (term) => {
    if (!term || term.trim() === '') {
      setFilteredDiagnoses(diagnoses);
      return;
    }
    
    const adminId = getAdminUserId();
    if (!adminId) return;
    
    setSearchLoading(true);
    try {
      // Search by patient name - we'll use the Search/Summary endpoint
      const format = 'json';
      const response = await axiosInstance.post(
        `/api/DiagnosisAPI/Search/Summary/${format}/${adminId}`,
        {
          Date: null,
          From: null,
          To: null,
          ID: null,
          PatientID: null
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
      
      // Client-side filtering
      const filtered = data.filter(item => 
        item._patientVar?.Name?.toLowerCase().includes(term.toLowerCase()) ||
        item._summaryVar?.Problems?.toLowerCase().includes(term.toLowerCase())
      );
      
      setFilteredDiagnoses(filtered);
    } catch (error) {
      console.error('Error searching diagnoses:', error);
      // Fallback to client-side filtering
      const filtered = diagnoses.filter(item =>
        item._patientVar?.Name?.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredDiagnoses(filtered);
    } finally {
      setSearchLoading(false);
    }
  }, [diagnoses]);

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      searchDiagnoses(value);
    }, 500);
  };

  // Patient search for dropdown
  const handlePatientSearch = (e) => {
    const value = e.target.value;
    setPatientSearchTerm(value);
    setShowPatientDropdown(true);
    
    if (patientSearchTimeout.current) {
      clearTimeout(patientSearchTimeout.current);
    }
    
    patientSearchTimeout.current = setTimeout(() => {
      loadPatients(value);
    }, 300);
  };

  // Therapy search for dropdown
  const handleTherapySearch = (e) => {
    const value = e.target.value;
    setTherapySearchTerm(value);
    setShowTherapyDropdown(true);
    
    if (therapySearchTimeout.current) {
      clearTimeout(therapySearchTimeout.current);
    }
    
    therapySearchTimeout.current = setTimeout(() => {
      loadTherapies(value);
    }, 300);
  };

  // Select patient
  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      _summaryVar: {
        ...prev._summaryVar,
        PatientID: patient.ID || patient.id
      }
    }));
    setPatientSearchTerm(patient.Name || patient.name || '');
    setShowPatientDropdown(false);
  };

  // Select therapy for adding
  const selectTherapy = (therapy) => {
    setSelectedTherapy(therapy);
    const therapyId = therapy.ID || therapy.id;
    const therapyName = therapy.Name || therapy.name || '';
    const therapyPrice = therapy.Price || therapy.price || 0;
    
    setTherapyFormData(prev => ({
      ...prev,
      TherapyID: therapyId,
      TherapyName: therapyName,
      Price: therapyPrice,
      TotalAmount: therapyPrice,
      NetAmount: therapyPrice
    }));
    setTherapySearchTerm(therapyName);
    setShowTherapyDropdown(false);
  };

  // Add therapy to list
  const addTherapy = () => {
    if (!therapyFormData.TherapyID) {
      toast.warning('Please select a therapy');
      return;
    }
    
    if (!therapyFormData.Time1) {
      toast.warning('Please select start time');
      return;
    }
    
    if (!therapyFormData.Time2) {
      toast.warning('Please select end time');
      return;
    }
    
    const price = parseFloat(therapyFormData.Price) || 0;
    const discount = parseFloat(therapyFormData.DiscountAmount) || 0;
    const totalAmount = price;
    const netAmount = totalAmount - discount;
    
    const newTherapy = {
      TherapyID: therapyFormData.TherapyID,
      TherapyName: therapyFormData.TherapyName || selectedTherapy?.Name || '',
      Time1: therapyFormData.Time1,
      Time2: therapyFormData.Time2,
      Price: price,
      TotalAmount: totalAmount,
      DiscountAmount: discount,
      NetAmount: netAmount > 0 ? netAmount : 0
    };
    
    setFormData(prev => ({
      ...prev,
      _therapyList: [...prev._therapyList, newTherapy]
    }));
    
    // Reset therapy form
    setTherapyFormData({
      TherapyID: null,
      TherapyName: '',
      Time1: '',
      Time2: '',
      Price: 0,
      TotalAmount: 0,
      DiscountAmount: 0,
      NetAmount: 0
    });
    setSelectedTherapy(null);
    setTherapySearchTerm('');
    
    // Recalculate totals
    calculateTotals([...formData._therapyList, newTherapy]);
  };

  // Remove therapy from list
  const removeTherapy = (index) => {
    const updatedList = formData._therapyList.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      _therapyList: updatedList
    }));
    calculateTotals(updatedList);
  };

  // Calculate totals
  const calculateTotals = (therapyList) => {
    let totalTherapyAmount = 0;
    let totalDiscount = 0;
    let netTherapyAmount = 0;
    
    therapyList.forEach(therapy => {
      totalTherapyAmount += parseFloat(therapy.TotalAmount) || 0;
      totalDiscount += parseFloat(therapy.DiscountAmount) || 0;
      netTherapyAmount += parseFloat(therapy.NetAmount) || 0;
    });
    
    setFormData(prev => ({
      ...prev,
      _summaryVar: {
        ...prev._summaryVar,
        TotalTherapyAmount: totalTherapyAmount,
        TherapyDiscount: totalDiscount,
        NetTherapyAmount: netTherapyAmount,
        TotalAmount: totalTherapyAmount,
        DiscountAmount: totalDiscount,
        GrandTotal: netTherapyAmount,
        RoundOff: 0,
        NetPayableAmount: netTherapyAmount
      }
    }));
  };

  // Update therapy amount on change
  const updateTherapyAmounts = (field, value) => {
    const updatedForm = { ...therapyFormData, [field]: value };
    
    const price = parseFloat(updatedForm.Price) || 0;
    const discount = parseFloat(updatedForm.DiscountAmount) || 0;
    const totalAmount = price;
    const netAmount = totalAmount - discount;
    
    setTherapyFormData({
      ...updatedForm,
      TotalAmount: totalAmount,
      NetAmount: netAmount > 0 ? netAmount : 0
    });
  };

  const handleTherapyInputChange = (e) => {
    const { name, value } = e.target;
    updateTherapyAmounts(name, value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    setFormData(prev => ({
      ...prev,
      _summaryVar: {
        ...prev._summaryVar,
        [name]: value
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData._summaryVar.PatientID) {
      newErrors.PatientID = 'Please select a patient';
    }
    
    if (!formData._summaryVar.Problems || formData._summaryVar.Problems.trim() === '') {
      newErrors.Problems = 'Please enter the problems';
    }
    
    if (formData._therapyList.length === 0) {
      newErrors.TherapyList = 'Please add at least one therapy';
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

    const adminId = getAdminUserId();
    if (!adminId) {
      toast.error('Admin user not found. Please login again.');
      return;
    }

    const patientId = formData._summaryVar.PatientID;
    if (!patientId) {
      toast.error('Patient not selected');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Build the request body according to the updated PDF
      const requestData = {
        ID: isEditMode ? selectedDiagnosis.ID : null,
        _invoiceVar: {
          _summaryVar: {
            PatientID: patientId,
            Problems: formData._summaryVar.Problems,
            Advice: formData._summaryVar.Advice || '',
            Precautions: formData._summaryVar.Precautions || '',
            TotalTherapyAmount: formData._summaryVar.TotalTherapyAmount,
            TherapyDiscount: formData._summaryVar.TherapyDiscount,
            NetTherapyAmount: formData._summaryVar.NetTherapyAmount,
            TotalAmount: formData._summaryVar.TotalAmount,
            DiscountAmount: formData._summaryVar.DiscountAmount,
            GrandTotal: formData._summaryVar.GrandTotal,
            RoundOff: formData._summaryVar.RoundOff,
            NetPayableAmount: formData._summaryVar.NetPayableAmount
          },
          _therapyList: formData._therapyList.map(therapy => ({
            TherapyID: therapy.TherapyID,
            Time1: therapy.Time1,
            Time2: therapy.Time2,
            Price: therapy.Price,
            TotalAmount: therapy.TotalAmount,
            DiscountAmount: therapy.DiscountAmount || 0,
            NetAmount: therapy.NetAmount
          }))
        }
      };

      console.log('Saving diagnosis for patient ID:', patientId);
      console.log('User ID (admin):', adminId);
      console.log('Request data:', JSON.stringify(requestData, null, 2));

      // Using the updated endpoint from PDF: Save/{_userID:long}
      const response = await axiosInstance.post(
        `/api/DiagnosisAPI/Save/${adminId}`,
        requestData
      );
      
      console.log('Save response:', response.data);
      
      // Check if save was successful
      if (response.status === 200 || response.status === 201) {
        toast.success(isEditMode ? 'Diagnosis updated successfully!' : 'Diagnosis created successfully!');
        closeModal();
        loadDiagnoses();
      } else {
        toast.error(response.data?.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving diagnosis:', error);
      
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      
      let errorMsg = 'Operation failed. Please try again.';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          if (error.response.data.includes('<!DOCTYPE html>')) {
            errorMsg = 'Server error occurred. Please check the console for details.';
          } else {
            errorMsg = error.response.data;
          }
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message;
        } else if (error.response.data.error) {
          errorMsg = error.response.data.error;
        }
      }
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id, patientName) => {
    if (!id) {
      toast.error('Cannot delete: Invalid ID');
      return;
    }
    
    const adminId = getAdminUserId();
    if (!adminId) {
      toast.error('Admin user not found. Please login again.');
      return;
    }
    
    const confirmId = toast.info(
      <div>
        <p className="font-medium">Delete Diagnosis</p>
        <p className="text-sm text-gray-500">Are you sure you want to delete diagnosis for "{patientName}"?</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              toast.dismiss(confirmId);
              performDelete(id, adminId);
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

  const performDelete = async (id, adminId) => {
    try {
      // Use Save endpoint with ActiveStatus: Inactive to delete
      const response = await axiosInstance.post(
        `/api/DiagnosisAPI/Save/${adminId}`,
        {
          ID: id,
          ActiveStatus: 'Inactive'
        }
      );
      
      if (response.status === 200 || response.status === 201) {
        toast.success('Diagnosis deleted successfully!');
        loadDiagnoses();
      } else {
        toast.error(response.data?.message || 'Failed to delete diagnosis');
      }
    } catch (error) {
      console.error('Error deleting diagnosis:', error);
      toast.error(error.response?.data?.message || 'Failed to delete diagnosis');
    }
  };

  const openModal = (diagnosis = null) => {
    if (diagnosis) {
      setIsEditMode(true);
      setSelectedDiagnosis(diagnosis);
      
      const summary = diagnosis._summaryVar || {};
      const therapyList = diagnosis._therapyList || [];
      
      if (summary.PatientID) {
        const patient = patients.find(p => (p.ID || p.id) === summary.PatientID);
        if (patient) {
          setSelectedPatient(patient);
          setPatientSearchTerm(patient.Name || '');
        }
      }
      
      setFormData({
        ID: diagnosis.ID || diagnosis.id || null,
        _summaryVar: {
          PatientID: summary.PatientID || null,
          Problems: summary.Problems || '',
          Advice: summary.Advice || '',
          Precautions: summary.Precautions || '',
          TotalTherapyAmount: summary.TotalTherapyAmount || 0,
          TherapyDiscount: summary.TherapyDiscount || 0,
          NetTherapyAmount: summary.NetTherapyAmount || 0,
          TotalAmount: summary.TotalAmount || 0,
          DiscountAmount: summary.DiscountAmount || 0,
          GrandTotal: summary.GrandTotal || 0,
          RoundOff: summary.RoundOff || 0,
          NetPayableAmount: summary.NetPayableAmount || 0
        },
        _therapyList: therapyList.map(t => ({
          TherapyID: t.TherapyID || t.therapyId || null,
          TherapyName: t._therapy?.Name || t.TherapyName || '',
          Time1: t.Time1 || t.time1 || '',
          Time2: t.Time2 || t.time2 || '',
          Price: t.Price || t.price || 0,
          TotalAmount: t.TotalAmount || t.totalAmount || 0,
          DiscountAmount: t.DiscountAmount || t.discountAmount || 0,
          NetAmount: t.NetAmount || t.netAmount || 0
        }))
      });
      
      calculateTotals(therapyList);
    } else {
      setIsEditMode(false);
      setSelectedDiagnosis(null);
      setSelectedPatient(null);
      setPatientSearchTerm('');
      
      setFormData({
        ID: null,
        _summaryVar: {
          PatientID: null,
          Problems: '',
          Advice: '',
          Precautions: '',
          TotalTherapyAmount: 0,
          TherapyDiscount: 0,
          NetTherapyAmount: 0,
          TotalAmount: 0,
          DiscountAmount: 0,
          GrandTotal: 0,
          RoundOff: 0,
          NetPayableAmount: 0
        },
        _therapyList: []
      });
      setTherapyFormData({
        TherapyID: null,
        TherapyName: '',
        Time1: '',
        Time2: '',
        Price: 0,
        TotalAmount: 0,
        DiscountAmount: 0,
        NetAmount: 0
      });
      setSelectedTherapy(null);
      setTherapySearchTerm('');
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDiagnosis(null);
    setErrors({});
    setIsSubmitting(false);
    setShowPatientDropdown(false);
    setShowTherapyDropdown(false);
  };

  const getStatusBadge = (status) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    const statusLower = status.toLowerCase();
    return statusLower === 'active' 
      ? 'bg-green-100 text-green-700'
      : 'bg-gray-100 text-gray-700';
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Diagnosis Management</h2>
          <p className="text-gray-500 text-sm">Manage patient diagnoses and therapy sessions</p>
          <p className="text-xs text-gray-400 mt-1">Total: {diagnoses.length} diagnoses</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#57ABB2] to-[#DE9A0E] text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
          <FaPlus className="text-sm" />
          <span>New Diagnosis</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search diagnoses by patient or problem..."
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
                setFilteredDiagnoses(diagnoses);
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
            {filteredDiagnoses.length > 0 && (
              <span className="ml-1">({filteredDiagnoses.length} found)</span>
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Problems</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Therapies</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDiagnoses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                    {searchTerm ? 'No diagnoses found matching your search' : 'No diagnoses added yet'}
                  </td>
                </tr>
              ) : (
                filteredDiagnoses.map((diagnosis) => {
                  const summary = diagnosis._summaryVar || {};
                  const patient = diagnosis._patientVar || {};
                  const therapyList = diagnosis._therapyList || [];
                  
                  return (
                    <tr key={diagnosis.ID || diagnosis.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs font-mono text-gray-500">{diagnosis.ID || diagnosis.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#57ABB2]/20 to-[#DE9A0E]/20 flex items-center justify-center text-[#57ABB2] font-semibold">
                            {patient.Name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{patient.Name || 'Unknown'}</p>
                            <p className="text-xs text-gray-400">ID: {patient.ID || patient.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-sm text-gray-600 truncate max-w-xs">
                          {summary.Problems || 'No problems recorded'}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-sm text-gray-600">{therapyList.length} therapy(ies)</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-[#57ABB2]">
                          ₹{summary.NetPayableAmount || summary.GrandTotal || 0}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(diagnosis)}
                            className="p-2 text-[#57ABB2] hover:bg-[#57ABB2]/10 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(diagnosis.ID || diagnosis.id, patient.Name)}
                            className="p-2 text-[#AE261B] hover:bg-[#AE261B]/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modal-content">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {isEditMode ? 'Edit Diagnosis' : 'New Diagnosis'}
                </h3>
                <p className="text-sm text-gray-500">
                  {isEditMode ? 'Update diagnosis details' : 'Create a new diagnosis record'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <FaTimes className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Created By Info */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 flex items-center gap-3">
                <FaUserCog className="text-[#57ABB2] text-lg" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Created By (User ID)</p>
                  <p className="text-sm text-gray-600">
                    {getAdminUser()?.name || 'Admin'} (ID: {getAdminUserId() || 'N/A'})
                  </p>
                  <p className="text-xs text-gray-400">This diagnosis will be recorded with your User ID</p>
                </div>
              </div>

              {/* Patient Selection */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search and select patient..."
                    value={patientSearchTerm}
                    onChange={handlePatientSearch}
                    onFocus={() => setShowPatientDropdown(true)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 ${errors.PatientID ? 'border-[#AE261B]' : 'border-gray-200'} focus:border-[#57ABB2] focus:outline-none transition-colors`}
                  />
                </div>
                {showPatientDropdown && filteredPatients.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredPatients.map(patient => (
                      <button
                        key={patient.ID || patient.id}
                        type="button"
                        onClick={() => selectPatient(patient)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <span className="font-medium">{patient.Name || patient.name}</span>
                        <span className="text-xs text-gray-400">ID: {patient.ID || patient.id}</span>
                      </button>
                    ))}
                  </div>
                )}
                {errors.PatientID && (
                  <p className="mt-1.5 text-xs text-[#AE261B] flex items-center gap-1">
                    <FaExclamationTriangle className="text-xs" />
                    {errors.PatientID}
                  </p>
                )}
                {selectedPatient && (
                  <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <FaCheckCircle className="text-xs" />
                    Selected: {selectedPatient.Name} (ID: {selectedPatient.ID || selectedPatient.id})
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Problems *</label>
                  <textarea
                    name="Problems"
                    value={formData._summaryVar.Problems}
                    onChange={handleInputChange}
                    rows="3"
                    className={`w-full px-4 py-2.5 rounded-lg border-2 ${errors.Problems ? 'border-[#AE261B]' : 'border-gray-200'} focus:border-[#57ABB2] focus:outline-none transition-colors resize-none`}
                    placeholder="Describe the problems..."
                  />
                  {errors.Problems && (
                    <p className="mt-1.5 text-xs text-[#AE261B] flex items-center gap-1">
                      <FaExclamationTriangle className="text-xs" />
                      {errors.Problems}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Advice</label>
                  <textarea
                    name="Advice"
                    value={formData._summaryVar.Advice}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors resize-none"
                    placeholder="Provide advice..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precautions</label>
                <textarea
                  name="Precautions"
                  value={formData._summaryVar.Precautions}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors resize-none"
                  placeholder="List precautions..."
                />
              </div>

              {/* Therapy List */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Therapies *</label>
                {errors.TherapyList && (
                  <p className="mt-1.5 text-xs text-[#AE261B] flex items-center gap-1">
                    <FaExclamationTriangle className="text-xs" />
                    {errors.TherapyList}
                  </p>
                )}
                
                {/* Add Therapy */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3 p-4 bg-gray-50 rounded-lg">
                  <div className="relative md:col-span-2">
                    <input
                      type="text"
                      placeholder="Search therapy..."
                      value={therapySearchTerm}
                      onChange={handleTherapySearch}
                      onFocus={() => setShowTherapyDropdown(true)}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors"
                    />
                    {showTherapyDropdown && filteredTherapies.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                        {filteredTherapies.map(therapy => (
                          <button
                            key={therapy.ID || therapy.id}
                            type="button"
                            onClick={() => selectTherapy(therapy)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <span>{therapy.Name || therapy.name}</span>
                            <span className="text-xs text-[#57ABB2]">₹{therapy.Price || therapy.price}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="time"
                      name="Time1"
                      value={therapyFormData.Time1}
                      onChange={handleTherapyInputChange}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors"
                      placeholder="Start"
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      name="Time2"
                      value={therapyFormData.Time2}
                      onChange={handleTherapyInputChange}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors"
                      placeholder="End"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      name="DiscountAmount"
                      value={therapyFormData.DiscountAmount}
                      onChange={handleTherapyInputChange}
                      placeholder="Discount"
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={addTherapy}
                      className="w-full py-2 bg-[#57ABB2] text-white rounded-lg hover:bg-[#57ABB2]/80 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <FaPlusCircle className="text-sm" />
                      Add
                    </button>
                  </div>
                </div>

                {/* Therapy List Table */}
                {formData._therapyList.length > 0 ? (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Therapy</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Time</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Price</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Discount</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Net</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {formData._therapyList.map((therapy, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm">
                              {therapy.TherapyName || 'Unnamed'}
                            </td>
                            <td className="px-3 py-2 text-sm">{therapy.Time1} - {therapy.Time2}</td>
                            <td className="px-3 py-2 text-sm text-right">₹{therapy.Price}</td>
                            <td className="px-3 py-2 text-sm text-right">₹{therapy.DiscountAmount || 0}</td>
                            <td className="px-3 py-2 text-sm text-right font-medium text-[#57ABB2]">₹{therapy.NetAmount || therapy.Price}</td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeTherapy(index)}
                                className="text-[#AE261B] hover:text-[#AE261B]/80 transition-colors cursor-pointer"
                              >
                                <FaMinusCircle />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t">
                        <tr>
                          <td colSpan="2" className="px-3 py-2 text-right font-medium">Totals:</td>
                          <td className="px-3 py-2 text-right font-medium">₹{formData._summaryVar.TotalTherapyAmount}</td>
                          <td className="px-3 py-2 text-right font-medium">₹{formData._summaryVar.TherapyDiscount}</td>
                          <td className="px-3 py-2 text-right font-medium text-[#57ABB2]">₹{formData._summaryVar.NetTherapyAmount}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-4 border-2 border-dashed rounded-lg">No therapies added yet</p>
                )}
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-2">Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Total Therapy Amount</p>
                    <p className="text-lg font-semibold text-gray-800">₹{formData._summaryVar.TotalTherapyAmount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Therapy Discount</p>
                    <p className="text-lg font-semibold text-[#AE261B]">-₹{formData._summaryVar.TherapyDiscount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Net Therapy Amount</p>
                    <p className="text-lg font-semibold text-[#57ABB2]">₹{formData._summaryVar.NetTherapyAmount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Net Payable</p>
                    <p className="text-lg font-bold text-[#DE9A0E]">₹{formData._summaryVar.NetPayableAmount}</p>
                  </div>
                </div>
              </div>

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
                      <span>{isEditMode ? 'Update Diagnosis' : 'Create Diagnosis'}</span>
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

export default Diagnosis;
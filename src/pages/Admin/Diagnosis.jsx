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
  FaSun,
  FaMoon,
  FaCalendarAlt
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
    Date: '',
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
    time1: '',
    time2: '',
    Price: 0,
    DiscountAmount: 0
  });
  const isMounted = useRef(true);
  const searchTimeout = useRef(null);
  const patientSearchTimeout = useRef(null);
  const therapySearchTimeout = useRef(null);

  const getAdminUserId = () => {
    const userId = localStorage.getItem('upasanaUserID');
    if (!userId) {
      window.location.href = '/admin';
      return null;
    }
    return userId;
  };

  const getAdminUser = () => {
    const userData = localStorage.getItem('upasanaUser');
    if (!userData) return null;
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  };

  // Format time to ISO datetime string with given date
  const formatTimeToISO = (timeStr, dateStr) => {
    if (!timeStr) return null;
    const date = dateStr ? new Date(dateStr) : new Date();
    const [hours, minutes] = timeStr.split(':');
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date.toISOString();
  };

  // Extract time from ISO string for display
  const extractTimeFromISO = (isoString) => {
    if (!isoString) return null;
    try {
      const date = new Date(isoString);
      return date.toTimeString().slice(0, 5);
    } catch {
      return null;
    }
  };

  // Format time for display in table
  const formatTimeDisplay = (isoString) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '-';
    }
  };

  // Format date for display
  const formatDateDisplay = (isoString) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  const loadDiagnoses = useCallback(async () => {
    if (!isMounted.current) return;
    
    const adminId = getAdminUserId();
    if (!adminId) return;
    
    setLoading(true);
    try {
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
        } else if (response.data.result && Array.isArray(response.data.result)) {
          data = response.data.result;
        }
      }
      
      const normalizedData = data.map(item => {
        let summary = item._summaryVar || item;
        let patient = item._patientVar || {};
        
        return {
          ID: item.ID || item.id || null,
          Date: item.Date || item.date || '',
          _summaryVar: {
            PatientID: summary.PatientID || summary.patientId || null,
            Problems: summary.Problems || summary.problems || '',
            Advice: summary.Advice || summary.advice || '',
            Precautions: summary.Precautions || summary.precautions || '',
            TotalTherapyAmount: summary.TotalTherapyAmount || summary.totalTherapyAmount || 0,
            TherapyDiscount: summary.TherapyDiscount || summary.therapyDiscount || 0,
            NetTherapyAmount: summary.NetTherapyAmount || summary.netTherapyAmount || 0,
            TotalAmount: summary.TotalAmount || summary.totalAmount || 0,
            DiscountAmount: summary.DiscountAmount || summary.discountAmount || 0,
            GrandTotal: summary.GrandTotal || summary.grandTotal || 0,
            RoundOff: summary.RoundOff || summary.roundOff || 0,
            NetPayableAmount: summary.NetPayableAmount || summary.netPayableAmount || 0
          },
          _patientVar: {
            ID: patient.ID || patient.id || null,
            Name: patient.Name || patient.name || 'Unknown',
            Contact: patient.Contact || patient.contact || ''
          },
          _therapyList: []
        };
      });
      
      setDiagnoses(normalizedData);
      setFilteredDiagnoses(normalizedData);
    } catch (error) {
      console.error('Error loading diagnoses:', error);
      toast.error('Failed to load diagnoses');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch full invoice details for editing - using the correct endpoint
  const fetchInvoiceDetails = useCallback(async (diagnosisId, adminId) => {
    try {
      // Try different date formats
      const format = 'json';
      
      // Try with empty date
      let url = `/api/DiagnosisAPI/Search/Invoice/${format}//${diagnosisId}/${adminId}`;
      console.log('Trying URL:', url);
      
      let response = await axiosInstance.get(url);
      
      // If that fails, try with null
      if (!response.data || typeof response.data === 'string' && response.data.includes('<!DOCTYPE')) {
        url = `/api/DiagnosisAPI/Search/Invoice/${format}/null/${diagnosisId}/${adminId}`;
        console.log('Trying URL:', url);
        response = await axiosInstance.get(url);
      }
      
      console.log('Response status:', response.status);
      
      // If response is HTML, it's an error
      if (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE')) {
        console.error('Received HTML instead of JSON');
        return null;
      }
      
      let invoiceData = response.data;
      if (response.data.data) {
        invoiceData = response.data.data;
      }
      if (response.data.result) {
        invoiceData = response.data.result;
      }
      
      console.log('Invoice data:', invoiceData);
      return invoiceData;
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      return null;
    }
  }, []);

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

  const searchDiagnoses = useCallback(async (term) => {
    if (!term || term.trim() === '') {
      setFilteredDiagnoses(diagnoses);
      return;
    }
    
    const adminId = getAdminUserId();
    if (!adminId) return;
    
    setSearchLoading(true);
    try {
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
      
      const normalizedData = data.map(item => {
        let summary = item._summaryVar || item;
        let patient = item._patientVar || {};
        
        return {
          ID: item.ID || item.id || null,
          Date: item.Date || item.date || '',
          _summaryVar: {
            PatientID: summary.PatientID || summary.patientId || null,
            Problems: summary.Problems || summary.problems || '',
            Advice: summary.Advice || summary.advice || '',
            Precautions: summary.Precautions || summary.precautions || '',
            TotalTherapyAmount: summary.TotalTherapyAmount || summary.totalTherapyAmount || 0,
            TherapyDiscount: summary.TherapyDiscount || summary.therapyDiscount || 0,
            NetTherapyAmount: summary.NetTherapyAmount || summary.netTherapyAmount || 0,
            TotalAmount: summary.TotalAmount || summary.totalAmount || 0,
            DiscountAmount: summary.DiscountAmount || summary.discountAmount || 0,
            GrandTotal: summary.GrandTotal || summary.grandTotal || 0,
            RoundOff: summary.RoundOff || summary.roundOff || 0,
            NetPayableAmount: summary.NetPayableAmount || summary.netPayableAmount || 0
          },
          _patientVar: {
            ID: patient.ID || patient.id || null,
            Name: patient.Name || patient.name || 'Unknown',
            Contact: patient.Contact || patient.contact || ''
          },
          _therapyList: []
        };
      });
      
      const filtered = normalizedData.filter(item => 
        item._patientVar?.Name?.toLowerCase().includes(term.toLowerCase()) ||
        item._summaryVar?.Problems?.toLowerCase().includes(term.toLowerCase())
      );
      
      setFilteredDiagnoses(filtered);
    } catch (error) {
      console.error('Error searching diagnoses:', error);
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

  const selectTherapy = (therapy) => {
    setSelectedTherapy(therapy);
    const therapyId = therapy.ID || therapy.id;
    const therapyName = therapy.Name || therapy.name || '';
    const therapyPrice = therapy.Price || therapy.price || 0;
    
    setTherapyFormData(prev => ({
      ...prev,
      TherapyID: therapyId,
      TherapyName: therapyName,
      Price: therapyPrice
    }));
    setTherapySearchTerm(therapyName);
    setShowTherapyDropdown(false);
  };

  const addTherapy = () => {
    if (!therapyFormData.TherapyID) {
      toast.warning('Please select a therapy');
      return;
    }
    
    const price = parseFloat(therapyFormData.Price) || 0;
    const discount = parseFloat(therapyFormData.DiscountAmount) || 0;
    
    const diagnosisDate = formData.Date || new Date().toISOString().split('T')[0];
    
    const time1 = therapyFormData.time1 ? formatTimeToISO(therapyFormData.time1, diagnosisDate) : null;
    const time2 = therapyFormData.time2 ? formatTimeToISO(therapyFormData.time2, diagnosisDate) : null;
    
    const newTherapy = {
      therapyID: therapyFormData.TherapyID,
      TherapyName: therapyFormData.TherapyName || selectedTherapy?.Name || '',
      time1: time1,
      time2: time2,
      price: price,
      discountAmount: discount
    };
    
    setFormData(prev => ({
      ...prev,
      _therapyList: [...prev._therapyList, newTherapy]
    }));
    
    setTherapyFormData({
      TherapyID: null,
      TherapyName: '',
      time1: '',
      time2: '',
      Price: 0,
      DiscountAmount: 0
    });
    setSelectedTherapy(null);
    setTherapySearchTerm('');
    
    calculateTotals([...formData._therapyList, newTherapy]);
  };

  const removeTherapy = (index) => {
    const updatedList = formData._therapyList.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      _therapyList: updatedList
    }));
    calculateTotals(updatedList);
  };

  const calculateTotals = (therapyList) => {
    let totalTherapyAmount = 0;
    let totalDiscount = 0;
    let netTherapyAmount = 0;
    
    therapyList.forEach(therapy => {
      const price = parseFloat(therapy.price) || 0;
      const discount = parseFloat(therapy.discountAmount) || 0;
      totalTherapyAmount += price;
      totalDiscount += discount;
      netTherapyAmount += (price - discount);
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

  const handleTherapyInputChange = (e) => {
    const { name, value } = e.target;
    setTherapyFormData(prev => ({ ...prev, [name]: value }));
  };

  const clearTimeField = (field) => {
    setTherapyFormData(prev => ({ ...prev, [field]: '' }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (name === 'Date') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({
        ...prev,
        _summaryVar: {
          ...prev._summaryVar,
          [name]: value
        }
      }));
    }
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
      const requestData = {
        ID: isEditMode ? selectedDiagnosis.ID : null,
        Date: formData.Date || null,
        _summaryVar: {
          PatientID: patientId,
          Problems: formData._summaryVar.Problems,
          Advice: formData._summaryVar.Advice || '',
          Precautions: formData._summaryVar.Precautions || ''
        },
        _therapyList: formData._therapyList.map(therapy => ({
          therapyID: therapy.therapyID || therapy.TherapyID,
          time1: therapy.time1 || null,
          time2: therapy.time2 || null,
          price: therapy.price || therapy.Price || 0,
          discountAmount: therapy.discountAmount || therapy.DiscountAmount || 0
        }))
      };

      console.log('Saving diagnosis:', JSON.stringify(requestData, null, 2));

      const response = await axiosInstance.post(
        `/api/DiagnosisAPI/Save/${adminId}`,
        requestData
      );
      
      console.log('Response:', response.data);
      
      if (response.status === 200 || response.status === 201) {
        toast.success(isEditMode ? 'Diagnosis updated successfully!' : 'Diagnosis created successfully!');
        closeModal();
        loadDiagnoses();
      } else {
        toast.error(response.data?.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving diagnosis:', error);
      
      let errorMsg = 'Operation failed. Please try again.';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          if (error.response.data.includes('<!DOCTYPE html>')) {
            errorMsg = 'Server error occurred. Check console.';
          } else {
            errorMsg = error.response.data;
          }
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message;
        } else if (error.response.data.title) {
          errorMsg = error.response.data.title;
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

  const openModal = async (diagnosis = null) => {
    if (diagnosis) {
      setIsEditMode(true);
      setSelectedDiagnosis(diagnosis);
      
      console.log('=== EDITING DIAGNOSIS ID:', diagnosis.ID);
      console.log('Diagnosis from list:', diagnosis);
      
      const adminId = getAdminUserId();
      if (!adminId) {
        toast.error('Admin user not found');
        setIsModalOpen(false);
        return;
      }
      
      // Try to fetch full invoice details
      const invoiceData = await fetchInvoiceDetails(diagnosis.ID, adminId);
      
      let summary = {};
      let therapyList = [];
      let patient = {};
      let dateValue = '';
      
      if (invoiceData && typeof invoiceData === 'object' && !invoiceData.includes) {
        console.log('Using invoice data for edit');
        summary = invoiceData._summaryVar || invoiceData._summaryVar || {};
        therapyList = invoiceData._therapyList || invoiceData._therapyList || [];
        patient = invoiceData._patientVar || invoiceData._patientVar || {};
        dateValue = invoiceData.Date || invoiceData.date || '';
      } else {
        console.log('Using list data for edit (invoice fetch failed)');
        summary = diagnosis._summaryVar || {};
        therapyList = diagnosis._therapyList || [];
        patient = diagnosis._patientVar || {};
        dateValue = diagnosis.Date || '';
      }
      
      console.log('Summary:', summary);
      console.log('Raw therapy list:', therapyList);
      console.log('Patient:', patient);
      
      // Set the patient
      if (summary.PatientID) {
        const foundPatient = patients.find(p => (p.ID || p.id) === summary.PatientID);
        setSelectedPatient(foundPatient || {
          ID: summary.PatientID,
          Name: patient.Name || 'Unknown'
        });
        setPatientSearchTerm(patient.Name || '');
      }
      
      // Format date for input
      if (dateValue) {
        try {
          const d = new Date(dateValue);
          dateValue = d.toISOString().split('T')[0];
        } catch {
          dateValue = '';
        }
      }
      
      // IMPORTANT: Format therapies - handle the actual data structure from backend
      const formattedTherapyList = therapyList.map((t, index) => {
        // Try to get therapy name from various places
        let therapyName = 'Unnamed';
        
        // Check if _therapy exists and has Name
        if (t._therapy && t._therapy.Name) {
          therapyName = t._therapy.Name;
        } 
        // Check direct properties
        else if (t.TherapyName) {
          therapyName = t.TherapyName;
        } else if (t.therapyName) {
          therapyName = t.therapyName;
        } else if (t.Name) {
          therapyName = t.Name;
        } else if (t.name) {
          therapyName = t.name;
        }
        // If still unnamed, try to find by therapyID from the therapies list
        else {
          const therapyId = t.therapyID || t.TherapyID || t.id;
          if (therapyId) {
            const foundTherapy = therapies.find(th => (th.ID || th.id) === therapyId);
            if (foundTherapy) {
              therapyName = foundTherapy.Name || foundTherapy.name || 'Unnamed';
            }
          }
        }
        
        // Get time values
        let time1Display = '';
        let time2Display = '';
        
        const time1Val = t.time1 || t.Time1 || null;
        const time2Val = t.time2 || t.Time2 || null;
        
        if (time1Val) {
          time1Display = extractTimeFromISO(time1Val) || time1Val;
        }
        if (time2Val) {
          time2Display = extractTimeFromISO(time2Val) || time2Val;
        }
        
        return {
          therapyID: t.therapyID || t.TherapyID || t.id || null,
          TherapyName: therapyName,
          time1: time1Display,
          time2: time2Display,
          price: t.price || t.Price || 0,
          discountAmount: t.discountAmount || t.DiscountAmount || 0
        };
      });
      
      console.log('Formatted therapy list:', formattedTherapyList);
      
      setFormData({
        ID: diagnosis.ID || null,
        Date: dateValue,
        _summaryVar: {
          PatientID: summary.PatientID || summary.patientId || null,
          Problems: summary.Problems || summary.problems || '',
          Advice: summary.Advice || summary.advice || '',
          Precautions: summary.Precautions || summary.precautions || '',
          TotalTherapyAmount: summary.TotalTherapyAmount || summary.totalTherapyAmount || 0,
          TherapyDiscount: summary.TherapyDiscount || summary.therapyDiscount || 0,
          NetTherapyAmount: summary.NetTherapyAmount || summary.netTherapyAmount || 0,
          TotalAmount: summary.TotalAmount || summary.totalAmount || 0,
          DiscountAmount: summary.DiscountAmount || summary.discountAmount || 0,
          GrandTotal: summary.GrandTotal || summary.grandTotal || 0,
          RoundOff: summary.RoundOff || summary.roundOff || 0,
          NetPayableAmount: summary.NetPayableAmount || summary.netPayableAmount || 0
        },
        _therapyList: formattedTherapyList
      });
      
      calculateTotals(formattedTherapyList);
    } else {
      setIsEditMode(false);
      setSelectedDiagnosis(null);
      setSelectedPatient(null);
      setPatientSearchTerm('');
      
      const today = new Date().toISOString().split('T')[0];
      
      setFormData({
        ID: null,
        Date: today,
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
        time1: '',
        time2: '',
        Price: 0,
        DiscountAmount: 0
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Problems</th>
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
                  const totalAmount = summary.NetPayableAmount || summary.GrandTotal || 0;
                  
                  return (
                    <tr key={diagnosis.ID} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs font-mono text-gray-500">{diagnosis.ID}</p>
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
                        <p className="text-sm text-gray-600">{formatDateDisplay(diagnosis.Date)}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-sm text-gray-600 truncate max-w-xs">
                          {summary.Problems || 'No problems recorded'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-[#57ABB2]">
                          ₹{totalAmount}
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
                            onClick={() => handleDelete(diagnosis.ID, patient.Name || 'Unknown')}
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
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 flex items-center gap-3">
                <FaUserCog className="text-[#57ABB2] text-lg" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Created By</p>
                  <p className="text-sm text-gray-600">
                    {getAdminUser()?.name || 'Admin'} (ID: {getAdminUserId() || 'N/A'})
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaCalendarAlt className="inline mr-2 text-[#57ABB2]" />
                  Diagnosis Date
                </label>
                <input
                  type="date"
                  name="Date"
                  value={formData.Date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors"
                />
              </div>

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
                    <label className="block text-xs text-gray-500 mb-1">
                      <FaSun className="inline mr-1 text-yellow-500" />
                      Morning
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        name="time1"
                        value={therapyFormData.time1}
                        onChange={handleTherapyInputChange}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors pr-8"
                      />
                      {therapyFormData.time1 && (
                        <button
                          type="button"
                          onClick={() => clearTimeField('time1')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                          title="Clear time"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Optional</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      <FaMoon className="inline mr-1 text-blue-500" />
                      Evening
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        name="time2"
                        value={therapyFormData.time2}
                        onChange={handleTherapyInputChange}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors pr-8"
                      />
                      {therapyFormData.time2 && (
                        <button
                          type="button"
                          onClick={() => clearTimeField('time2')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                          title="Clear time"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Optional</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Discount</label>
                    <input
                      type="number"
                      name="DiscountAmount"
                      value={therapyFormData.DiscountAmount}
                      onChange={handleTherapyInputChange}
                      placeholder="Discount"
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-[#57ABB2] focus:outline-none transition-colors"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="flex items-end">
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

                {formData._therapyList.length > 0 ? (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Therapy</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Morning</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Evening</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Price</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Discount</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {formData._therapyList.map((therapy, index) => {
                          const time1Display = therapy.time1 ? formatTimeDisplay(therapy.time1) : '-';
                          const time2Display = therapy.time2 ? formatTimeDisplay(therapy.time2) : '-';
                          
                          return (
                            <tr key={index}>
                              <td className="px-3 py-2 text-sm">{therapy.TherapyName || 'Unnamed'}</td>
                              <td className="px-3 py-2 text-sm">{time1Display}</td>
                              <td className="px-3 py-2 text-sm">{time2Display}</td>
                              <td className="px-3 py-2 text-sm text-right">₹{therapy.price || 0}</td>
                              <td className="px-3 py-2 text-sm text-right">₹{therapy.discountAmount || 0}</td>
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
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t">
                        <tr>
                          <td colSpan="3" className="px-3 py-2 text-right font-medium">Totals:</td>
                          <td className="px-3 py-2 text-right font-medium">₹{formData._summaryVar.TotalTherapyAmount}</td>
                          <td className="px-3 py-2 text-right font-medium">₹{formData._summaryVar.TherapyDiscount}</td>
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
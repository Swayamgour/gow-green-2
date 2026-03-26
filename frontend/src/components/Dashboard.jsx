import { useState, useEffect, useCallback, useRef } from 'react';
import './Dashboard.css';
import {
  fetchExecutives,
  createExecutive,
  deleteExecutive,
  updateExecutive
} from '../services/executive.service';
import {
  fetchLeads,
  createLead,
  deleteLead,
  updateLead,
  updateLeadStatus,
} from '../services/lead.service';
import { SERVER_URL } from '../services/api';
import Leads from './Leads';
import MOM from './MOM';
import Customers from './Customers';
import Products from './Products';
import Quotations from './Quotations';
import TDS from './TDS';
import Reports from './Reports';
import { clearSession, getUser } from '../services/auth.service';
import Switch from "@mui/material/Switch";
import axios from "axios";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getPhotoUrl = (path) => (path ? `${SERVER_URL}/${path}` : null);

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' ? '✓' : '✕'} {message}
    </div>
  );
}

// Confirmation Dialog Component
function ConfirmationDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-card" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-lead-avatar" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </div>
            <div>
              <h3 className="modal-lead-name">{title}</h3>
              <p className="modal-lead-sub">{message}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onCancel}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center', gap: '12px', paddingTop: '20px' }}>
          {/* <button className="btn-reset" onClick={onCancel}>
            Cancel
          </button> */}
          <button className="btn-primary" style={{ background: '#dc2626', borderColor: '#dc2626' }} onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// Change Password Modal Component
function ChangePasswordModal({ isOpen, executive, onClose, onPasswordChange }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      await onPasswordChange(executive._id, executive.name, newPassword);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={handleClose}>
      <div className="modal-card" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-lead-avatar" style={{ background: '#eff6ff', color: '#3b82f6' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <h3 className="modal-lead-name">Change Password</h3>
              <p className="modal-lead-sub">{executive?.name}</p>
            </div>
          </div>
          <button className="modal-close" onClick={handleClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px' }}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-secondary)' }}>
              New Password <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                className="eye-btn"
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-secondary)' }}>
              Confirm Password <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                className="eye-btn"
                type="button"
                onClick={() => setShowConfirmPassword(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}
              >
                {showConfirmPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#dc2626',
              padding: '10px 12px',
              borderRadius: 8,
              fontSize: 12,
              marginTop: 12
            }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: 8, fontSize: 11, color: '#9ca3af' }}>
            Password must be at least 6 characters long
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '12px' }}>
          {/* <button className="btn-reset" onClick={handleClose}>
            Cancel
          </button> */}
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <span className="spinner" style={{ marginRight: 6 }} />
                Saving...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Update Password
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function Dashboard({ user, onLogout }) {
  const currentUser = getUser();
  const isAdmin = currentUser?.role === 'admin';
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('gg_theme') === 'dark');

  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null
  });

  // Change password modal state
  const [changePasswordModal, setChangePasswordModal] = useState({
    isOpen: false,
    executive: null
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('gg_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const [toast, setToast] = useState(null);

  const [loginToast, setLoginToast] = useState('');
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const avatarMenuRef = useRef(null);
  const [customersKey, setCustomersKey] = useState(0);

  useEffect(() => {
    const msg = sessionStorage.getItem('gg_login_msg');
    if (msg) {
      setLoginToast(msg);
      sessionStorage.removeItem('gg_login_msg');
      setTimeout(() => setLoginToast(null), 3500);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target)) {
        setShowAvatarMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Executives state
  const [executives, setExecutives] = useState([]);
  const [execLoading, setExecLoading] = useState(false);
  const [showAddExecutive, setShowAddExecutive] = useState(false);
  const [execSaving, setExecSaving] = useState(false);
  const [leadsMenuOpen, setLeadsMenuOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [executiveForm, setExecutiveForm] = useState({
    name: '', phone: '', email: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pwModal, setPwModal] = useState(null); // { id, name, password, needsReset }
  const [showPasswordModel, setShowPasswordModel] = useState(false)

  // Leads state
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [leadSaving, setLeadSaving] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [viewLead, setViewLead] = useState(null); // lead object to show in modal
  const [viewTimelineLead, setViewTimelineLead] = useState(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [showAddRemark, setShowAddRemark] = useState(false);
  const [newRemark, setNewRemark] = useState('');
  const [remarkBold, setRemarkBold] = useState(false);
  const [remarkItalic, setRemarkItalic] = useState(false);
  const [remarkUnderline, setRemarkUnderline] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: '', phone: '', email: '', source: '', status: '',
    followUpDate: '', expectedValue: '', remarks: '',
  });
  const [remarksBold, setRemarksBold] = useState(false);
  const [remarksItalic, setRemarksItalic] = useState(false);
  const [remarksUnderline, setRemarksUnderline] = useState(false);


  // Dashboard stats (static placeholders — extend as needed)
  const stats = [
    { label: 'Total Leads', value: leads.length.toString(), trend: 'up' },
    { label: 'Active Leads', value: leads.filter(l => l.leadStatus === 'in-progress').length.toString(), trend: 'up' },
    { label: 'Executives', value: executives.length.toString(), change: '', trend: 'up' },
    { label: 'Closed Won', value: leads.filter(l => l.leadStatus === 'won').length.toString(), change: '', trend: 'up' },
  ];

  const showToast = (message, type = 'success') => setToast({ message, type });

  const navigateTo = (tabId) => {
    setActiveTab(tabId);
    setShowAddExecutive(false);
    setShowAddLead(false);
    setSidebarOpen(false);
  };

  // ─── Load executives ────────────────────────────────────────────────────────
  const loadExecutives = useCallback(async () => {
    setExecLoading(true);
    try {
      const res = await fetchExecutives();
      setExecutives(res.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load executives', 'error');
    } finally {
      setExecLoading(false);
    }
  }, []);

  // ─── Load leads ─────────────────────────────────────────────────────────────
  const loadLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const res = await fetchLeads();
      setLeads(res.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load leads', 'error');
    } finally {
      setLeadsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExecutives();
    loadLeads();
  }, [loadExecutives, loadLeads]);

  // ─── Refresh leads and customers when navigating to relevant tabs ────────────
  useEffect(() => {
    if (['lead-pipeline', 'lead-sources', 'follow-up', 'lead-timeline', 'overview'].includes(activeTab)) {
      loadLeads();
    }
    if (activeTab === 'customers') {
      setCustomersKey(k => k + 1);
    }
  }, [activeTab]);

  // ─── Executive handlers ─────────────────────────────────────────────────────
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleExecutiveReset = () => {
    setExecutiveForm({ name: '', phone: '', email: '', password: '', confirmPassword: '' });
    setPhotoPreview(null);
    setPhotoFile(null);
  };

  const handleSaveExecutive = async () => {
    const { name, phone, email, password, confirmPassword } = executiveForm;
    const phoneRegex = /^[0-9]{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || name.trim().length < 2)
      return showToast('Name must be at least 2 characters', 'error');
    if (!phone || !phoneRegex.test(phone))
      return showToast('Phone must be exactly 10 digits', 'error');
    if (!email || !emailRegex.test(email))
      return showToast('Please enter a valid email address', 'error');
    if (!password || password.length < 6)
      return showToast('Password must be at least 6 characters', 'error');
    if (password !== confirmPassword) {
      return showToast('Passwords do not match', 'error');
    }

    setExecSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('phone', phone);
      fd.append('email', email);
      fd.append('password', password);
      fd.append('confirmPassword', confirmPassword);
      if (photoFile) fd.append('avatar', photoFile);

      const result = await createExecutive(fd);
      if (result && result.success === false) {
        return showToast(result.message || 'Failed to save executive', 'error');
      }
      showToast('Executive saved successfully');
      handleExecutiveReset();
      setShowAddExecutive(false);
      loadExecutives();
    } catch (err) {
      showToast(err.message || 'Failed to save executive', 'error');
    } finally {
      setExecSaving(false);
    }
  };

  const handleDeleteExecutive = async (id) => {
    setConfirmationDialog({
      isOpen: true,
      title: 'Delete Executive',
      message: 'Are you sure you want to delete this executive? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteExecutive(id);
          showToast('Executive deleted');
          loadExecutives();
          setConfirmationDialog({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null });
        } catch (err) {
          showToast(err.message || 'Failed to delete', 'error');
          setConfirmationDialog({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null });
        }
      },
      onCancel: () => {
        setConfirmationDialog({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null });
      }
    });
  };

  const handleChangeExecPassword = async (id, name, newPassword) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/executives/${id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('gg_token')}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Password updated for ${name}`);
        return true;
      } else {
        showToast(data.message || 'Failed to update password', 'error');
        return false;
      }
    } catch (err) {
      showToast('Failed to update password', 'error');
      return false;
    }
  };

  // ─── Lead handlers ──────────────────────────────────────────────────────────
  const handleLeadReset = () => {
    setLeadForm({
      name: '', phone: '', email: '', source: '', status: '',
      followUpDate: '', expectedValue: '', remarks: '',
    });
    setSelectedAssignee(null);
  };

  const handleSaveLead = async () => {
    const { name: leadName, phone, source, status } = leadForm;
    if (!leadName || !phone || !source || !status) {
      return showToast('Lead name, phone, source and status are required', 'error');
    }

    setLeadSaving(true);
    try {
      await createLead({
        ...leadForm,
        assignedTo: selectedAssignee || undefined,
        expectedValue: leadForm.expectedValue ? Number(leadForm.expectedValue) : 0,
      });
      showToast('Lead saved successfully');
      handleLeadReset();
      setShowAddLead(false);
      loadLeads();
    } catch (err) {
      showToast(err.message || 'Failed to save lead', 'error');
    } finally {
      setLeadSaving(false);
    }
  };

  const handleDeleteLead = async (id) => {
    setConfirmationDialog({
      isOpen: true,
      title: 'Delete Lead',
      message: 'Are you sure you want to delete this lead? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteLead(id);
          showToast('Lead deleted');
          loadLeads();
          setConfirmationDialog({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null });
        } catch (err) {
          showToast(err.message || 'Failed to delete', 'error');
          setConfirmationDialog({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null });
        }
      },
      onCancel: () => {
        setConfirmationDialog({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null });
      }
    });
  };

  const handleStatusChange = async (id, status) => {
    setConfirmationDialog({
      isOpen: true,
      title: 'Change Status',
      message: `Are you sure you want to change this lead's status to "${status}"?`,
      onConfirm: async () => {
        try {
          await updateLeadStatus(id, status);
          showToast('Status updated');
          loadLeads();
          setConfirmationDialog({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null });
        } catch (err) {
          showToast(err.message || 'Failed to update status', 'error');
          setConfirmationDialog({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null });
        }
      },
      onCancel: () => {
        setConfirmationDialog({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null });
      }
    });
  };

  // ─── Modal field save (assignedTo / followUpDate) ─────────────────────────
  const handleModalFieldSave = async (field, value) => {
    if (!viewLead) return;
    setModalSaving(true);
    try {
      await updateLead(viewLead._id, { [field]: value });

      if (field === 'assignedTo') {
        // Store full exec object so the card highlights immediately
        const exec = executives.find(e => String(e._id) === String(value));
        setViewLead(prev => ({ ...prev, assignedTo: exec || value }));
      } else {
        setViewLead(prev => ({ ...prev, [field]: value }));
      }

      showToast('Saved');
      loadLeads();
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setModalSaving(false);
    }
  };

  // ─── Add remark ───────────────────────────────────────────────────────────
  const handleAddRemark = async () => {
    if (!newRemark.trim()) return showToast('Remark cannot be empty', 'error');
    setModalSaving(true);
    try {
      const combined = viewLead.remarks
        ? `${viewLead.remarks}\n\n${newRemark.trim()}`
        : newRemark.trim();
      await updateLead(viewLead._id, { remarks: combined });
      setViewLead(prev => ({ ...prev, remarks: combined }));
      setNewRemark('');
      setShowAddRemark(false);
      setRemarkBold(false); setRemarkItalic(false); setRemarkUnderline(false);
      showToast('Remark added');
      await loadLeads();
    } catch (err) {
      showToast(err.message || 'Failed to add remark', 'error');
    } finally {
      setModalSaving(false);
    }
  };

  const leadSubItems = [
    {
      id: 'leads', label: 'All Leads',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>,
    },
    {
      id: 'lead-sources', label: 'Lead Sources',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>,
    },
    {
      id: 'lead-pipeline', label: 'Lead Pipeline',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M13 6h3a2 2 0 0 1 2 2v7" /><path d="M11 18H8a2 2 0 0 1-2-2V9" /></svg>,
    },
    {
      id: 'follow-up', label: 'Follow Up',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    },
    {
      id: 'lead-timeline', label: 'Lead Timeline',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
    },
  ];

  const leadTabIds = leadSubItems.map(item => item.id);

  const handleToggle = async (exec) => {
    const updatedStatus = exec.status === "active" ? "inactive" : "active";

    setConfirmationDialog({
      isOpen: true,
      title: 'Change Status',
      message: `Are you sure you want to change ${exec.name}'s status from "${exec.status}" to "${updatedStatus}"?`,
      onConfirm: async () => {
        try {
          await updateExecutive(exec._id, { status: updatedStatus });

          setExecutives((prev) =>
            prev.map((item) =>
              item._id === exec._id
                ? { ...item, status: updatedStatus }
                : item
            )
          );

          showToast("Status updated");
          setConfirmationDialog({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null });
        } catch (err) {
          console.log(err);
          showToast(
            err.response?.data?.message || err.message || "Failed to update status",
            "error"
          );
          setConfirmationDialog({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null });
        }
      },
      onCancel: () => {
        setConfirmationDialog({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null });
      }
    });
  };

  const navItems = [
    {
      id: 'overview',
      label: 'Dashboard',
      badge: null,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>,
    },
    ...(isAdmin ? [{
      id: 'sales-executives', label: 'Sales Executives',
      badge: executives.length || null,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    }] : []),
    {
      id: 'leads-parent', label: 'Leads',
      badge: leads.filter(l => l.leadStatus === 'open').length || null,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>,
    },
    { id: 'customers', label: 'Customers', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
    { id: 'products', label: 'Products', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg> },
    { id: 'quotations', label: 'Quotations', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg> },
    { id: 'tds', label: 'TDS Documents', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg> },
    ...(isAdmin ? [{
      id: 'reports', label: 'Reports',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
    }] : []),
    // {
    //   id: 'mom', label: 'Minutes of Meeting', badge: null,
    //   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
    // },
  ];

  // ─── Page title ───────────────────────────────────────────────────────────────
  const pageTitle = [...navItems, ...leadSubItems].find(n => n.id === activeTab)?.label || 'Dashboard';

  // ─── Render content ───────────────────────────────────────────────────────────
  const renderContent = () => {
    // ── Sales Executives ──────────────────────────────────────────────────────
    if (activeTab === 'sales-executives') {
      if (!isAdmin) return null;
      return (
        <div className="crm-page">
          <div className="crm-page-header">
            <h2>Sales Executives</h2>
            <button className="btn-primary" onClick={() => setShowAddExecutive(v => !v)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Add Executive
            </button>
          </div>

          {showAddExecutive && (
            <div className="crm-form-card">
              <div className="crm-form-topbar" />
              <div className="crm-form-body">
                {/* Photo */}
                <div className="profile-photo-section">
                  <div className="profile-avatar-upload">
                    {photoPreview
                      ? <img src={photoPreview} alt="Preview" className="avatar-preview" />
                      : <div className="avatar-placeholder">EX</div>}
                    <label className="camera-btn" htmlFor="photo-upload">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                    </label>
                    <input id="photo-upload" type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                  </div>
                  <div className="profile-photo-info">
                    <h4>Profile Photo</h4>
                    <p>Upload a profile picture (JPG, PNG, GIF)</p>
                    <label htmlFor="photo-upload" className="upload-link">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      Upload Photo
                    </label>
                  </div>
                </div>
                <div className="form-divider" />

                <div className="form-group full-width">
                  <label>Full Name <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    <input type="text" placeholder="Enter executive's full name" value={executiveForm.name}
                      onChange={e => setExecutiveForm({ ...executiveForm, name: e.target.value })} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number <span className="required">*</span></label>
                    <div className="input-wrapper">
                      <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.9 2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17.5z" /></svg>
                      <input
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={executiveForm.phone}
                        maxLength={10}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setExecutiveForm({ ...executiveForm, phone: val });
                        }}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email Address <span className="required">*</span></label>
                    <div className="input-wrapper">
                      <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                      <input type="email" placeholder="executive@company.com" value={executiveForm.email}
                        onChange={e => setExecutiveForm({ ...executiveForm, email: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Password <span className="required">*</span></label>
                    <div className="input-wrapper">
                      <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                      <input type={showPassword ? 'text' : 'password'} placeholder="Create password"
                        value={executiveForm.password}
                        onChange={e => setExecutiveForm({ ...executiveForm, password: e.target.value })} />
                      <button className="eye-btn" type="button" onClick={() => setShowPassword(v => !v)}>
                        {showPassword
                          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Confirm Password <span className="required">*</span></label>
                    <div className="input-wrapper">
                      <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                      <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm password"
                        value={executiveForm.confirmPassword}
                        onChange={e => setExecutiveForm({ ...executiveForm, confirmPassword: e.target.value })} />
                      <button className="eye-btn" type="button" onClick={() => setShowConfirmPassword(v => !v)}>
                        {showConfirmPassword
                          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-reset" onClick={handleExecutiveReset}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.95" /></svg>
                    Reset Form
                  </button>
                  <button className="btn-primary" onClick={handleSaveExecutive} disabled={execSaving}>
                    {execSaving ? <span className="spinner" /> : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                    )}
                    {execSaving ? 'Saving...' : 'Save Executive'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Executives List */}
          <div className="card">
            <div className="card-header">
              <h3>All Executives ({executives.length})</h3>
              {execLoading && <span className="loading-text">Loading...</span>}
            </div>
            {executives.length === 0 && !execLoading ? (
              <div className="empty-state">No executives added yet. Click "Add Executive" to get started.</div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executives.map(exec => (
                      <tr key={exec._id}>
                        <td>
                          {exec.avatar
                            ? <img src={getPhotoUrl(exec.avatar)} alt={exec.name} className="exec-avatar" />
                            : <div className="exec-avatar-placeholder">{exec.name[0]}</div>}
                        </td>
                        <td>{exec.name}</td>
                        <td>{exec.phone}</td>
                        <td>{exec.email}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <Switch
                              checked={exec.status === "active"}
                              onChange={() => handleToggle(exec)}
                              inputProps={{ "aria-label": "controlled" }}
                              color="success"
                            />
                            <span
                              className={`status-badge ${exec.status === "active" ? "active" : "inactive"}`}
                            >
                              {exec.status === "active" ? "Enable" : "Disable"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button
                              className="action-btn"
                              style={{ background: '#eff6ff', color: '#3b82f6' }}
                              title="Change Password"
                              onClick={() => setChangePasswordModal({ isOpen: true, executive: exec })}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            </button>
                            {/*  */}

                            {/* <button
                              className="action-btn"
                              style={{ background: '#f0fdf4', color: '#16a34a' }}
                              title="View Password"
                              onClick={async () => {
                                setShowPasswordModel(true);

                                try {
                                  const token = localStorage.getItem('gg_token');

                                  const res = await axios.get(
                                    `${SERVER_URL}/api/executives/${exec._id}/view-password`,
                                    {
                                      headers: {
                                        Authorization: `Bearer ${token}`, // ✅ fixed
                                      },
                                    }
                                  );

                                  const data = res.data;

                                  if (data.success) {
                                    setPwModal({
                                      id: exec._id,
                                      name: exec.name,
                                      password: data.password,
                                      needsReset: data.password.startsWith('(Password was set before'),
                                    });
                                  } else {
                                    showToast(data.message || 'Could not retrieve password', 'error');
                                  }

                                } catch (err) {
                                  console.error(err);

                                  // 🔥 better error handling
                                  const msg =
                                    err.response?.data?.message ||
                                    err.message ||
                                    'Failed to retrieve password';

                                  showToast(msg, 'error');
                                }
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button> */}

                            <button className="action-btn delete" onClick={() => handleDeleteExecutive(exec._id)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'leads') return <Leads />;

    if (activeTab === 'lead-sources') return (
      <div className="crm-page">
        <div className="crm-page-header"><h2>Lead Sources</h2></div>
        <div className="card">
          <div className="card-header"><h3>Leads by Source</h3></div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Source</th><th>Total Leads</th><th>Won</th><th>Lost</th><th>In Progress</th><th>Win Rate</th></tr></thead>
              <tbody>
                {Object.entries(
                  leads.reduce((acc, l) => {
                    const src = l.leadSource || l.source || 'Unknown';
                    if (!acc[src]) acc[src] = { total: 0, won: 0, lost: 0, inProgress: 0 };
                    acc[src].total++;
                    if (l.leadStatus === 'won') acc[src].won++;
                    else if (l.leadStatus === 'lost') acc[src].lost++;
                    else acc[src].inProgress++;
                    return acc;
                  }, {})
                ).map(([src, data]) => (
                  <tr key={src}>
                    <td style={{ fontWeight: 600 }}>{src}</td>
                    <td>{data.total}</td>
                    <td><span className="status-badge status-closed-won">{data.won}</span></td>
                    <td><span className="status-badge status-closed-lost">{data.lost}</span></td>
                    <td>{data.inProgress}</td>
                    <td>{data.total > 0 ? `${Math.round((data.won / data.total) * 100)}%` : '0%'}</td>
                  </tr>
                ))}
                {leads.length === 0 && <tr><td colSpan={6}><div className="empty-state">No leads yet.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );

    if (activeTab === 'lead-pipeline') return (
      <div className="crm-page">
        <div className="crm-page-header"><h2>Lead Pipeline</h2></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 16 }}>
          {['open', 'in-progress', 'follow-up', 'won', 'lost'].map(status => {
            const group = leads.filter(l => l.leadStatus === status);
            const colors = { open: '#dbeafe', 'in-progress': '#fef3c7', 'follow-up': '#ede9fe', won: '#dcfce7', lost: '#fee2e2' };
            const textColors = { open: '#1d4ed8', 'in-progress': '#92400e', 'follow-up': '#6d28d9', won: '#166534', lost: '#991b1b' };
            return (
              <div key={status} style={{ background: 'var(--bg-card)', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ background: colors[status], padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: textColors[status], textTransform: 'capitalize' }}>{status.replace('-', ' ')}</span>
                  <span style={{ float: 'right', fontWeight: 700, fontSize: 18, color: textColors[status] }}>{group.length}</span>
                </div>
                <div style={{ padding: '8px 0', maxHeight: 400, overflowY: 'auto' }}>
                  {group.length === 0 && <div className="empty-state" style={{ padding: '20px 16px' }}>No leads</div>}
                  {group.map(l => (
                    <div key={l._id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--bg-secondary)' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{l.leadName || l.name}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{l.company || l.leadSource || ''}</div>
                      {l.expectedValue > 0 && <div style={{ fontSize: 12, fontWeight: 600, color: '#059669', marginTop: 3 }}>₹{Number(l.expectedValue).toLocaleString('en-IN')}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );

    if (activeTab === 'follow-up') return (
      <div className="crm-page">
        <div className="crm-page-header"><h2>Follow Up</h2></div>
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h3>Leads with Follow-Up Scheduled</h3></div>
          <div className="table-container">
            <table className="data-table">
              <thead>

                <tr>
                  <th>#</th>
                  <th>Lead Name</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Follow-Up Date</th>
                  <th>Days Left</th>
                </tr>
              </thead>
              <tbody>
                {leads
                  .filter(l => l.followUpDate)
                  .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate))
                  .map((l, i) => {
                    const days = Math.ceil((new Date(l.followUpDate) - new Date()) / (1000 * 60 * 60 * 24));
                    const isOverdue = days < 0;
                    const isToday = days === 0;
                    return (
                      <tr key={l._id}>
                        <td className="row-num">{i + 1}</td>
                        <td className="lead-name-cell">{l.leadName || l.name}</td>
                        <td>{l.company || '—'}</td>
                        <td>{l.phone}</td>
                        <td><span className={`status-badge status-${l.leadStatus}`}>{l.leadStatus}</span></td>
                        <td>{new Date(l.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td>
                          <span style={{
                            fontWeight: 600, fontSize: 12, padding: '2px 10px', borderRadius: 20,
                            background: isOverdue ? '#fee2e2' : isToday ? '#fef3c7' : '#dcfce7',
                            color: isOverdue ? '#dc2626' : isToday ? '#92400e' : '#166534'
                          }}>
                            {isOverdue ? `${Math.abs(days)}d overdue` : isToday ? 'Today' : `${days}d left`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                {leads.filter(l => l.followUpDate).length === 0 && (
                  <tr><td colSpan={7}><div className="empty-state">No follow-ups scheduled.</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Recent Activity Log</h3></div>
          <div style={{ padding: '8px 0', maxHeight: 500, overflowY: 'auto' }}>
            {leads.flatMap(l =>
              (l.activityLog || []).map(a => ({ ...a, leadName: l.leadName || l.name, leadId: l._id }))
            ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50).map((event, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--bg-secondary)', alignItems: 'flex-start' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{event.leadName}</span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(event.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 500, marginTop: 2 }}>{event.action}</div>
                  {event.details && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>{event.details}</div>}
                  {event.changedBy && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>by {event.changedBy}</div>}
                </div>
              </div>
            ))}
            {leads.every(l => !l.activityLog?.length) && <div className="empty-state">No activity yet.</div>}
          </div>
        </div>
      </div>
    );

    if (activeTab === 'lead-timeline') return (
      <div className="crm-page">
        <div className="crm-page-header"><h2>Lead Timeline</h2></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {leads.length === 0 && <div className="empty-state">No leads yet.</div>}
          {[...leads].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((l) => {
            const statusColors = { open: '#3b82f6', 'in-progress': '#f59e0b', 'follow-up': '#8b5cf6', won: '#22c55e', lost: '#ef4444' };
            const statusBg = { open: '#dbeafe', 'in-progress': '#fef3c7', 'follow-up': '#ede9fe', won: '#dcfce7', lost: '#fee2e2' };
            const allEvents = [
              { timestamp: l.createdAt, action: 'Lead Created', details: `"${l.leadName}" was added`, isCreation: true },
              ...(l.activityLog || []).map(a => ({ ...a, isCreation: false })),
              ...(l.notes || []).map(n => ({ action: 'Note Added', details: n.text, changedBy: n.addedBy || '', timestamp: n.createdAt, isCreation: false, isNote: true })),
            ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            return (
              <div
                key={l._id}
                onClick={() => setViewTimelineLead(l)}
                style={{
                  background: 'var(--bg-card)', border: '1px solid #e5e7eb',
                  borderRadius: 12, padding: 16, cursor: 'pointer',
                  transition: 'all 0.15s', borderLeft: `4px solid ${statusColors[l.leadStatus] || '#9ca3af'}`,
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `linear-gradient(135deg, ${statusColors[l.leadStatus] || '#9ca3af'}33, ${statusColors[l.leadStatus] || '#9ca3af'}66)`,
                      color: statusColors[l.leadStatus] || '#9ca3af',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 15,
                    }}>
                      {(l.leadName || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{l.leadName}</div>
                      {l.company && <div style={{ fontSize: 12, color: '#9ca3af' }}>{l.company}</div>}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                    background: statusBg[l.leadStatus] || '#f3f4f6',
                    color: statusColors[l.leadStatus] || '#6b7280',
                  }}>
                    {l.leadStatus}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af' }}>
                  <span>{allEvents.length} event{allEvents.length !== 1 ? 's' : ''}</span>
                  <span style={{ color: '#6366f1', fontWeight: 600 }}>View Timeline →</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline Detail Modal */}
        {viewTimelineLead && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,15,30,0.5)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={() => setViewTimelineLead(null)}
          >
            <div
              style={{ background: 'var(--bg-card)', borderRadius: 18, width: '100%', maxWidth: 560, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#fff', fontWeight: 700, fontSize: 17,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {(viewTimelineLead.leadName || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{viewTimelineLead.leadName}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{viewTimelineLead.company || viewTimelineLead.phone}</div>
                  </div>
                </div>
                <button
                  onClick={() => setViewTimelineLead(null)}
                  style={{ width: 32, height: 32, border: 'none', background: '#f3f4f6', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#6b7280' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>

              <div style={{ overflowY: 'auto', flex: 1, padding: '16px 24px' }}>
                {(() => {
                  const allEvents = [
                    { timestamp: viewTimelineLead.createdAt, action: 'Lead Created', details: `Lead "${viewTimelineLead.leadName}" was created`, isCreation: true },
                    ...(viewTimelineLead.activityLog || []).map(a => ({ ...a, isCreation: false })),
                    ...(viewTimelineLead.notes || []).map(n => ({ action: 'Note Added', details: n.text, changedBy: n.addedBy || '', timestamp: n.createdAt, isCreation: false, isNote: true })),
                  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                  if (allEvents.length === 0) return <div className="empty-state">No activity recorded yet.</div>;

                  return allEvents.map((event, ei) => (
                    <div key={ei} style={{ display: 'flex', gap: 14, paddingBottom: 16, position: 'relative' }}>
                      {ei < allEvents.length - 1 && (
                        <div style={{ position: 'absolute', left: 11, top: 24, bottom: 0, width: 2, background: '#f0f2f5' }} />
                      )}
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: event.isCreation ? '#ede9fe' : event.isNote ? '#fef3c7' : '#f3f4f6',
                        border: `2px solid ${event.isCreation ? '#6366f1' : event.isNote ? '#f59e0b' : '#d1d5db'}`,
                        zIndex: 1,
                      }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: event.isCreation ? '#6366f1' : event.isNote ? '#f59e0b' : '#9ca3af',
                        }} />
                      </div>
                      <div style={{ flex: 1, paddingTop: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                          <span style={{
                            fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                            background: event.isCreation ? '#ede9fe' : event.isNote ? '#fef9c3' : '#f3f4f6',
                            color: event.isCreation ? '#6366f1' : event.isNote ? '#d97706' : '#374151',
                          }}>
                            {event.action}
                          </span>
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>
                            {new Date(event.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {event.details && (
                          <div style={{
                            fontSize: 13, color: event.isNote ? 'var(--text-primary)' : 'var(--text-secondary, #6b7280)',
                            background: event.isNote ? '#fffbeb' : 'transparent',
                            padding: event.isNote ? '8px 12px' : '0',
                            borderRadius: event.isNote ? 8 : 0,
                            borderLeft: event.isNote ? '3px solid #f59e0b' : 'none',
                            lineHeight: 1.5,
                          }}>
                            {event.details}
                          </div>
                        )}
                        {event.changedBy && !event.isCreation && (
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>by {event.changedBy}</div>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div style={{ padding: '14px 24px', borderTop: '1px solid #f0f2f5', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                <button className="btn-reset" onClick={() => setViewTimelineLead(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );

    if (activeTab === 'mom') return <MOM />;
    if (activeTab === 'products') return <Products />;
    if (activeTab === 'quotations') return <Quotations />;
    if (activeTab === 'tds') return <TDS />;
    if (activeTab === 'customers') return <Customers key={customersKey} />;
    if (activeTab === 'reports') return <Reports />;

    return (
      <>
        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className="stat-card">
              <div className="stat-header">
                <span className="stat-label">{stat.label}</span>
                {stat.change && <span className={`stat-change ${stat.trend}`}>{stat.change}</span>}
              </div>
              <div className="stat-value">{stat.value}</div>
            </div>
          ))}
        </div>
        <div className="content-grid">
          <div className="card">
            <div className="card-header">
              <h3>Recent Leads</h3>
              <button className="btn-secondary" onClick={() => setActiveTab('lead-pipeline')}>View All</button>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.slice(0, 5).map(lead => (
                    <tr key={lead._id}>
                      <td>{lead.leadName || '—'}</td>
                      <td>{lead.phone}</td>
                      <td className="capitalize">{lead.leadSource || '—'}</td>
                      <td><span className={`status-badge status-${lead.leadStatus}`}>{lead.leadStatus}</span></td>
                      <td className="value">{lead.expectedValue ? `₹${Number(lead.expectedValue).toLocaleString('en-IN')}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {leads.length === 0 && <div className="empty-state">No leads yet.</div>}
            </div>
          </div>
          <div className="card activity-card">
            <div className="card-header"><h3>Executives ({executives.length})</h3></div>
            <div className="activity-list">
              {executives.slice(0, 5).map((exec, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-dot" />
                  <div className="activity-content">
                    <p className="activity-action">{exec.name}</p>
                    <p className="activity-meta">{exec.phone} • {exec.email}</p>
                  </div>
                </div>
              ))}
              {executives.length === 0 && <div className="empty-state">No executives yet.</div>}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="dashboard">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      {loginToast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: '#dcfce7', color: '#166534',
          border: '1px solid #bbf7d0', borderRadius: 12,
          padding: '14px 20px', fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          animation: 'slideIn 0.3s ease',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          {loginToast}
        </div>
      )}

      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => {
          setSidebarOpen(false);
          setLeadsMenuOpen(false);
        }}
      />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          {/* <div className="logo-icon">C</div> */}
          <span className="logo-text">Glow Green</span>
        </div>
        <div className="sidebar-user">
          <div className="user-avatar-sidebar">{(currentUser?.name || 'U')[0].toUpperCase()}</div>
          <div className="user-info">
            <span className="user-name">{currentUser?.name || user?.name || 'User'}</span>
            {/* <span className="user-role">{currentUser?.role === 'admin' ? 'Admin' : 'Executive'} · <span className="online-dot" /> Online</span> */}
          </div>
          {/* <button className="bell-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
          </button> */}
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <div key={item.id}>
              <button
                className={`nav-item ${(item.id === 'leads-parent' ? (leadsMenuOpen || leadTabIds.includes(activeTab)) : activeTab === item.id) ? 'active' : ''}`}
                onClick={() => {
                  if (item.id === 'leads-parent') {
                    setLeadsMenuOpen(v => !v);
                    return;
                  }
                  navigateTo(item.id);
                }}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.id === 'leads-parent' ? (
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ marginLeft: 'auto', transition: 'transform 0.2s ease', transform: leadsMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                ) : null}
                {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
              </button>

              {item.id === 'leads-parent' && leadsMenuOpen && (
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  background: 'var(--bg-secondary)',
                  borderLeft: '2px solid #6366f1',
                  marginLeft: 16, marginRight: 8,
                  borderRadius: '0 0 8px 8px',
                  overflow: 'hidden', marginBottom: 4,
                }}>
                  {leadSubItems.map(subItem => (
                    <button
                      key={subItem.id}
                      className={`nav-item ${activeTab === subItem.id ? 'active' : ''}`}
                      style={{ paddingLeft: 20, fontSize: 13 }}
                      onClick={() => { navigateTo(subItem.id); }}
                    >
                      <span className="nav-icon">{subItem.icon}</span>
                      <span className="nav-label">{subItem.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{(currentUser?.name || 'U')[0].toUpperCase()}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{currentUser?.name || 'User'}</span>
              <span className="sidebar-user-role">{currentUser?.role === 'admin' ? '🔑 Admin' : '👤 Executive'}</span>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={() => {
            const userName = currentUser?.name || 'User';
            clearSession();
            sessionStorage.setItem('gg_logout_msg', `${userName} logged out successfully`);
            window.location.href = '/';
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="dashboard-header">
          <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(v => !v)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1>{activeTab === 'overview' ? 'Dashboard' : pageTitle}</h1>
          </div>
          <div className="header-right">
            <div style={{ position: 'relative' }} ref={avatarMenuRef}>
              <button
                className="header-avatar"
                onClick={() => setShowAvatarMenu(v => !v)}
                style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
              >
                {(user?.email?.[0] || 'U').toUpperCase()}
              </button>

              {showAvatarMenu && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 1000,
                  background: 'var(--bg-card)', border: '1px solid #e5e7eb', borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 200, overflow: 'hidden',
                }}>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{currentUser?.name || 'User'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{currentUser?.role === 'admin' ? '🔑 Admin' : '👤 Executive'}</div>
                  </div>
                  <div style={{ height: 1, background: '#e5e7eb' }} />
                  <button
                    onClick={() => {
                      setShowAvatarMenu(false);
                      const userName = currentUser?.name || 'User';
                      clearSession();
                      sessionStorage.setItem('gg_logout_msg', `${userName} logged out successfully`);
                      window.location.href = '/';
                    }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 14px', border: 'none', textAlign: 'left', cursor: 'pointer',
                      color: '#dc2626', background: '#fff5f5', fontWeight: 600,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="page-content">{renderContent()}</div>
      </div>

      {/* ── Lead View Modal ─────────────────────────────────────────────────── */}
      {viewLead && (
        <div className="modal-overlay" onClick={() => { setViewLead(null); setShowAddRemark(false); setNewRemark(''); }}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-lead-avatar">{(viewLead.leadName || '?')[0].toUpperCase()}</div>
                <div>
                  <h3 className="modal-lead-name">{viewLead.leadName}</h3>
                  <p className="modal-lead-sub">{viewLead.email || 'No email provided'}</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => { setViewLead(null); setShowAddRemark(false); setNewRemark(''); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="modal-status-bar">
              <span className="modal-status-label">Status</span>
              <select
                className={`status-select status-${viewLead.leadStatus}`}
                value={viewLead.leadStatus}
                onChange={async e => {
                  const newStatus = e.target.value;
                  await handleStatusChange(viewLead._id, newStatus);
                  setViewLead(prev => ({ ...prev, leadStatus: newStatus }));
                }}
              >
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="follow-up">Follow Up</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
              {modalSaving && <span className="modal-saving-badge">Saving…</span>}
            </div>
            <div className="modal-body">
              <div className="modal-detail-grid">
                <div className="modal-detail-item">
                  <span className="modal-detail-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.9 2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17.5z" /></svg>
                    Phone
                  </span>
                  <span className="modal-detail-value">{viewLead.phone}</span>
                </div>
                <div className="modal-detail-item">
                  <span className="modal-detail-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                    Source
                  </span>
                  <span className="modal-detail-value capitalize">{viewLead.source || '—'}</span>
                </div>
                <div className="modal-detail-item">
                  <span className="modal-detail-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    Added On
                  </span>
                  <span className="modal-detail-value">
                    {viewLead.createdAt ? new Date(viewLead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </span>
                </div>
                <div className="modal-detail-item">
                  <span className="modal-detail-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    Priority
                  </span>
                  <span className={`modal-detail-value priority-badge priority-${viewLead.priority || 'medium'}`}>
                    {viewLead.priority || 'medium'}
                  </span>
                </div>
              </div>
              <div className="modal-edit-section">
                <span className="modal-detail-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                  Assigned To
                </span>
                <div className="modal-edit-row">
                  <div className="assignee-grid modal-assignee-grid">
                    {executives.map(exec => (
                      <button
                        key={exec._id}
                        type="button"
                        className={`assignee-card ${String(viewLead.assignedTo?._id || viewLead.assignedTo || '') === String(exec._id) ? 'selected' : ''}`}
                        onClick={() => handleModalFieldSave('assignedTo', exec._id)}
                      >
                        <span className="assignee-name">{exec.name.toUpperCase()}</span>
                        <span className="assignee-phone">{exec.phone}</span>
                      </button>
                    ))}
                    {executives.length === 0 && <p className="hint-text">No executives available.</p>}
                  </div>
                </div>
              </div>
              <div className="modal-edit-section">
                <span className="modal-detail-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  Follow Up Date
                </span>
                <div className="modal-edit-row">
                  <div className="input-wrapper modal-date-input">
                    <svg className="input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    <input
                      type="date"
                      defaultValue={viewLead.followUpDate ? new Date(viewLead.followUpDate).toISOString().split('T')[0] : ''}
                      onBlur={e => { if (e.target.value) handleModalFieldSave('followUpDate', e.target.value); }}
                      onChange={e => { if (e.target.value) handleModalFieldSave('followUpDate', e.target.value); }}
                    />
                  </div>
                  {viewLead.followUpDate && (
                    <span className="modal-date-display">
                      {new Date(viewLead.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              {viewLead.remarks && (
                <div className="modal-edit-section">
                  <span className="modal-detail-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    Remarks / Notes
                  </span>
                  <p className="modal-remarks-text">{viewLead.remarks}</p>
                </div>
              )}
              <div className="modal-edit-section">
                {!showAddRemark ? (
                  <button className="btn-add-remark" onClick={() => setShowAddRemark(true)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Add Remark
                  </button>
                ) : (
                  <div className="modal-remark-form">
                    <span className="modal-detail-label">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                      New Remark
                    </span>
                    <div className="rich-text-editor">
                      <div className="rich-text-toolbar">
                        <button type="button" className={`toolbar-btn ${remarkBold ? 'active' : ''}`} onClick={() => setRemarkBold(v => !v)}><b>B</b></button>
                        <button type="button" className={`toolbar-btn ${remarkItalic ? 'active' : ''}`} onClick={() => setRemarkItalic(v => !v)}><i>I</i></button>
                        <button type="button" className={`toolbar-btn ${remarkUnderline ? 'active' : ''}`} onClick={() => setRemarkUnderline(v => !v)}><u>U</u></button>
                        <div className="toolbar-divider" />
                        <button type="button" className="toolbar-btn" onClick={() => setNewRemark(v => v + '\n• ')}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                        </button>
                        <button type="button" className="toolbar-btn" onClick={() => setNewRemark('')}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.95" /></svg>
                        </button>
                      </div>
                      <textarea
                        className="rich-text-area"
                        placeholder="Write your remark or note..."
                        value={newRemark}
                        onChange={e => setNewRemark(e.target.value)}
                        style={{
                          fontWeight: remarkBold ? 'bold' : 'normal',
                          fontStyle: remarkItalic ? 'italic' : 'normal',
                          textDecoration: remarkUnderline ? 'underline' : 'none',
                        }}
                        rows={4}
                      />
                    </div>
                    <div className="modal-remark-actions">
                      <button className="btn-reset" onClick={() => { setShowAddRemark(false); setNewRemark(''); }}>Cancel</button>
                      <button className="btn-primary" onClick={handleAddRemark} disabled={modalSaving}>
                        {modalSaving ? <span className="spinner" /> : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                        )}
                        {modalSaving ? 'Saving...' : 'Save Remark'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-reset" onClick={() => { setViewLead(null); setShowAddRemark(false); setNewRemark(''); }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Password Modal ─────────────────────────────────────────────── */}
      {pwModal ?
        (
          <div className="modal-overlay" onClick={() => setPwModal(null)}>
            <div className="modal-card" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-group">
                  <div className="modal-lead-avatar" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="modal-lead-name">{pwModal.needsReset ? 'Set Password' : 'View Password'}</h3>
                    <p className="modal-lead-sub">{pwModal.name}</p>
                  </div>
                </div>
                <button className="modal-close" onClick={() => { setPwModal(null); setShowPasswordModel(false) }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="modal-body" style={{ padding: '20px 24px' }}>
                {!pwModal.needsReset ? (
                  <>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Current Password</p>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'var(--bg-secondary)', border: '1px solid #e5e7eb',
                      borderRadius: 8, padding: '10px 14px',
                    }}>
                      <code style={{ flex: 1, fontSize: 15, fontWeight: 700, letterSpacing: 1, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                        {pwModal.password}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(pwModal.password).then(() => { showToast('Password copied!'); setPwModal(null); setShowPasswordModel(false) })}
                        style={{ flexShrink: 0, background: '#eff6ff', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: '#3b82f6', fontWeight: 600, fontSize: 12 }}
                      >
                        Copy
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{
                      background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a',
                      borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 12, lineHeight: 1.4,
                    }}>
                      This account was created before password storage was added. Set a new password below to save it.
                    </div>
                    <div className="input-wrapper">
                      <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                      <input id="pw-reset-input" type="text" placeholder="Enter new password (min 6 characters)" style={{ fontFamily: 'monospace' }} />
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                {pwModal.needsReset && (
                  <button
                    className="btn-primary"
                    onClick={async () => {
                      const newPw = document.getElementById('pw-reset-input')?.value?.trim() || '';
                      if (!newPw || newPw.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
                      await handleChangeExecPassword(pwModal.id, pwModal.name, newPw);
                      setPwModal(null);
                    }}
                  >
                    Save Password
                  </button>
                )}
              </div>
            </div>
          </div>)

        : (

          showPasswordModel &&

          <div className="modal-overlay" onClick={() => setPwModal(null)}>
            <div className="modal-card" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-group">
                  <div className="modal-lead-avatar" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>

                </div>
                <button className="modal-close" onClick={() => { setPwModal(null); setShowPasswordModel(false) }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="modal-body" style={{ padding: '20px 24px' }}>

                {/* <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Current Password</p> */}

                <p>Loading...</p>

              </div>

            </div>
          </div>




        )
      }

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordModal.isOpen}
        executive={changePasswordModal.executive}
        onClose={() => setChangePasswordModal({ isOpen: false, executive: null })}
        onPasswordChange={handleChangeExecPassword}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        onConfirm={confirmationDialog.onConfirm}
        onCancel={confirmationDialog.onCancel}
      />
    </div >
  );
}

export default Dashboard;
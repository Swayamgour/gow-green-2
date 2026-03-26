import { useState, useEffect, useCallback } from 'react';
import { Component } from 'react';
import {
  fetchLeads, createLead, updateLead, deleteLead,
  updateLeadStatus, updateLeadCategory, addLeadNote, deleteLeadNote
} from '../services/lead.service';
import { fetchExecutives } from '../services/executive.service';
import { getUser } from '../services/auth.service';
import './Leads.css';
import jsPDF from "jspdf";
import ConfirmDialog from './ConfirmDialog';

const SOURCES = ['Website', 'Referral', 'Social Media', 'Cold Call', 'Email', 'Exhibition', 'WhatsApp', 'Other'];
const STATUSES = ['open', 'in-progress', 'follow-up', 'won', 'lost'];
const CATEGORIES = [
  { key: 'new', label: 'New', desc: 'Fresh enquiries', color: '#0ea5e9' },
  { key: 'routine', label: 'Routine', desc: 'Regular customers', color: '#22c55e' },
  { key: 'closed', label: 'Closed / Old', desc: 'Inactive / no-deal leads', color: '#ef4444' },
];

const STATUS_COLORS = {
  'open': { bg: '#dbeafe', text: '#1d4ed8' },
  'in-progress': { bg: '#fef3c7', text: '#92400e' },
  'follow-up': { bg: '#ede9fe', text: '#6d28d9' },
  'won': { bg: '#dcfce7', text: '#166534' },
  'lost': { bg: '#fee2e2', text: '#991b1b' },
};

const emptyForm = {
  leadName: '', phone: '', email: '', company: '',
  leadSource: '', category: 'new', leadStatus: 'open',
  assignedTo: '', followUpDate: '', expectedValue: '', remarks: ''
};

class LeadsErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 24, color: '#991b1b', background: '#fee2e2', borderRadius: 8, margin: 24 }}>
        <strong>Leads Error:</strong> {this.state.error.message}
        <pre style={{ fontSize: 11, marginTop: 8 }}>{this.state.error.stack}</pre>
      </div>
    );
    return this.props.children;
  }
}

function Leads() {
  const [leads, setLeads] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [viewLead, setViewLead] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [toast, setToast] = useState(null);
  const isAdmin = getUser()?.role === 'admin';



  const [activeViewTab, setActiveViewTab] = useState("details");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      const [leadsRes, execRes] = await Promise.all([
        fetchLeads(params),
        fetchExecutives(),
      ]);
      setLeads(leadsRes.data || []);
      setExecutives(execRes.data || []);

      // Always fetch unfiltered for tab counts
      if (filterCategory || filterStatus || search) {
        const allRes = await fetchLeads({});
        setAllLeads(allRes.data || []);
      } else {
        setAllLeads(leadsRes.data || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleOpenForm = (lead = null) => {
    if (lead) {
      setEditLead(lead);
      setForm({
        leadName: lead.leadName || '',
        phone: lead.phone || '',
        email: lead.email || '',
        company: lead.company || '',
        leadSource: lead.leadSource || '',
        category: lead.category || 'new',
        leadStatus: lead.leadStatus || 'open',
        assignedTo: lead.assignedTo?._id || '',
        followUpDate: lead.followUpDate ? lead.followUpDate.split('T')[0] : '',
        expectedValue: lead.expectedValue || '',
        remarks: lead.remarks || '',
      });
    } else {
      setEditLead(null);
      setForm({ ...emptyForm, category: filterCategory || 'new' });
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    const phoneRegex = /^[0-9]{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.leadName || form.leadName.trim().length < 2)
      return showToast('Lead name must be at least 2 characters', 'error');
    if (!form.phone || !phoneRegex.test(form.phone))
      return showToast('Phone must be exactly 10 digits', 'error');
    if (form.email && !emailRegex.test(form.email))
      return showToast('Please enter a valid email address', 'error');

    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.followUpDate) delete payload.followUpDate;
      if (editLead) {
        await updateLead(editLead._id, payload);
        showToast('Lead updated');
      } else {
        await createLead(payload);
        showToast('Lead added');
      }
      setShowForm(false);
      setEditLead(null);
      setForm(emptyForm);
      load();
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await deleteLead(id);
      showToast('Lead deleted');
      if (viewLead?._id === id) setViewLead(null);
      load();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };




  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteLead(deleteId);
      showToast("Lead deleted");
      if (viewLead?._id === deleteId) setViewLead(null);
      load();
    } catch (err) {
      showToast(err.message || "Failed to delete", "error");
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };


  const handleQuickStatus = async (lead, status) => {
    try {
      await updateLeadStatus(lead._id, status);
      if (viewLead?._id === lead._id) setViewLead(prev => ({ ...prev, leadStatus: status }));
      await load();
      if (status === 'won') {
        showToast(`Lead marked as Won — customer record created automatically`, 'success');
      }
    } catch { showToast('Failed to update status', 'error'); }
  };

  const handleQuickCategory = async (lead, category) => {
    try {
      await updateLeadCategory(lead._id, category);
      if (viewLead?._id === lead._id) setViewLead(prev => ({ ...prev, category }));
      load();
    } catch { showToast('Failed to update category', 'error'); }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setNoteLoading(true);
    try {
      const res = await addLeadNote(viewLead._id, newNote.trim());
      setViewLead(res.data);
      setNewNote('');
      showToast('Note added');
      load();
    } catch (err) {
      showToast(err.message || 'Failed to add note', 'error');
    } finally {
      setNoteLoading(false);
    }
  };




  // import jsPDF from "jspdf";

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    let y = 10;

    // 🔹 Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(viewLead.leadName || "Lead", 10, y);

    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(viewLead.company || viewLead.phone || "", 10, y);

    y += 10;

    // 🔹 Divider
    doc.setDrawColor(200);
    doc.line(10, y, 200, y);
    y += 8;

    // 🔹 Activity Timeline
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Activity Timeline", 10, y);

    y += 6;

    (viewLead.activityLog || []).forEach((event) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");

      // Action badge style text
      doc.text(`• ${event.action}`, 10, y);
      y += 5;

      doc.setFont("helvetica", "normal");

      if (event.details) {
        doc.text(event.details, 12, y, { maxWidth: 180 });
        y += 5;
      }

      if (event.changedBy) {
        doc.setTextColor(120);
        doc.text(`by ${event.changedBy}`, 12, y);
        doc.setTextColor(0);
        y += 5;
      }

      const date = new Date(event.timestamp).toLocaleString("en-IN");
      doc.setTextColor(150);
      // doc.text(`🕐 ${date}`, 12, y);
      doc.text(`Time: ${date}`, 12, y);
      doc.setTextColor(0);

      y += 8;
    });

    y += 4;

    // 🔹 Divider
    doc.setDrawColor(200);
    doc.line(10, y, 200, y);
    y += 8;

    // 🔹 Notes Section
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Notes & Follow-up History", 10, y);

    y += 6;

    (viewLead.notes || []).forEach((note) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      doc.text(`• ${note.text}`, 10, y, { maxWidth: 180 });
      y += 5;

      const date = new Date(note.createdAt).toLocaleString("en-IN");
      doc.setTextColor(150);
      // doc.text(`🕐 ${date}`, 12, y);
      doc.text(`Time: ${date}`, 12, y);
      doc.setTextColor(0);

      y += 8;
    });

    // 🔹 Save
    doc.save(`${viewLead.leadName}-history.pdf`);
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const res = await deleteLeadNote(viewLead._id, noteId);
      setViewLead(res.data);
      showToast('Note deleted');
    } catch { showToast('Failed to delete note', 'error'); }
  };

  const counts = {
    all: allLeads.length,
    new: allLeads.filter(l => l.category === 'new').length,
    routine: allLeads.filter(l => l.category === 'routine').length,
    closed: allLeads.filter(l => l.category === 'closed').length,
  };

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const formatDateTime = (d) => d
    ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  const isOverdue = (date) => date && new Date(date) < new Date();

  return (
    <div className="leads-page">

      {toast && (
        <div className={`leads-toast leads-toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="leads-header">
        <div>
          <h2>Lead Management</h2>
          <p>Track enquiries across New, Routine and Closed categories</p>
        </div>
        {isAdmin && <button className="leads-btn-primary" onClick={() => handleOpenForm()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Lead
        </button>}
      </div>

      {/* Stats */}
      <div className="leads-stats">
        {[
          { label: 'Total Leads', value: counts.all, color: '#6366f1', icon: '📋' },
          { label: 'New', value: counts.new, color: '#0ea5e9', icon: '🆕' },
          { label: 'Routine', value: counts.routine, color: '#22c55e', icon: '🔄' },
          { label: 'Closed / Old', value: counts.closed, color: '#ef4444', icon: '🔒' },
          { label: 'Follow-up Due', value: allLeads.filter(l => l.followUpDate && isOverdue(l.followUpDate) && l.leadStatus !== 'won' && l.leadStatus !== 'lost').length, color: '#f59e0b', icon: '⏰' },
          { label: 'Won', value: allLeads.filter(l => l.leadStatus === 'won').length, color: '#10b981', icon: '🏆' },
        ].map((s, i) => (
          <div key={i} className="leads-stat-card" style={{ borderLeftColor: s.color }}>
            <div className="leads-stat-icon">{s.icon}</div>
            <div>
              <div className="leads-stat-num" style={{ color: s.color }}>{s.value}</div>
              <div className="leads-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Tabs */}
      <div className="leads-tabs">
        <button
          className={`leads-tab ${filterCategory === '' ? 'active' : ''}`}
          style={{ '--tab-clr': '#6366f1' }}
          onClick={() => setFilterCategory('')}>
          All <span className="leads-tab-count">{counts.all}</span>
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={`leads-tab ${filterCategory === cat.key ? 'active' : ''}`}
            style={{ '--tab-clr': cat.color }}
            onClick={() => setFilterCategory(cat.key)}>
            {cat.label}
            <span className="leads-tab-count">{counts[cat.key]}</span>
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="leads-filters">
        <div className="leads-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            type="text"
            placeholder="Search name, phone, company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="leads-clear" onClick={() => setSearch('')}>✕</button>}
        </div>
        <select
          className="leads-filter-select"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="leads-card">
        <div className="leads-card-header">
          <h3>Leads ({leads.length})</h3>
          {loading && <span className="leads-loading">Loading...</span>}
        </div>

        {leads.length === 0 && !loading ? (
          <div className="leads-empty">
            <div className="leads-empty-icon">📋</div>
            <p>No leads found. Add your first lead.</p>
            {isAdmin && <button className="leads-btn-primary" onClick={() => handleOpenForm()}>Add Lead</button>}
          </div>
        ) : (
          <div className="leads-table-wrap">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Lead Name</th>
                  <th>Phone</th>
                  <th>Company</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Follow-Up</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, i) => (
                  <tr key={lead._id} className={isOverdue(lead.followUpDate) && !['won', 'lost'].includes(lead.leadStatus) ? 'overdue-row' : ''}>
                    <td className="leads-num">{i + 1}</td>
                    <td className="leads-name-cell">
                      <div className="leads-avatar">{(lead.leadName || '?')[0].toUpperCase()}</div>
                      <div>
                        <span className="leads-name">{lead.leadName}</span>
                        {lead.expectedValue > 0 && (
                          <span className="leads-value">₹{Number(lead.expectedValue).toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    </td>
                    <td>{lead.phone}</td>
                    <td>{lead.company || '—'}</td>
                    <td>
                      <select
                        className={`leads-cat-select cat-${lead.category}`}
                        value={lead.category}
                        onChange={e => handleQuickCategory(lead, e.target.value)}
                        onClick={e => e.stopPropagation()}>
                        <option value="new">New</option>
                        <option value="routine">Routine</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="leads-status-select"
                        value={lead.leadStatus}
                        style={{
                          background: STATUS_COLORS[lead.leadStatus]?.bg,
                          color: STATUS_COLORS[lead.leadStatus]?.text,
                        }}
                        onChange={e => handleQuickStatus(lead, e.target.value)}
                        onClick={e => e.stopPropagation()}>
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td>{lead.assignedTo?.name || '—'}</td>
                    <td className={isOverdue(lead.followUpDate) && !['won', 'lost'].includes(lead.leadStatus) ? 'overdue-date' : ''}>
                      {lead.followUpDate ? (
                        <span title={formatDate(lead.followUpDate)}>
                          {isOverdue(lead.followUpDate) && !['won', 'lost'].includes(lead.leadStatus) ? '⏰ ' : ''}
                          {formatDate(lead.followUpDate)}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <span className="leads-note-count">{lead.notes?.length || 0} notes</span>
                    </td>
                    <td className="leads-actions">
                      <button className="leads-action view" onClick={() => setViewLead(lead)} title="View & Notes">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      </button>
                      <button className="leads-action edit" onClick={() => handleOpenForm(lead)} title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button className="leads-action delete" onClick={() => handleDeleteClick(lead?._id)} title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal ─────────────────────────── */}
      {showForm && (
        <div className="leads-overlay" onClick={() => setShowForm(false)}>
          <div className="leads-modal" onClick={e => e.stopPropagation()}>
            <div className="leads-modal-head">
              <h3>{editLead ? 'Edit Lead' : 'Add New Lead'}</h3>
              <button className="leads-modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>

            <div className="leads-modal-body">
              {/* Category picker */}
              <div className="leads-cat-picker">
                <label>Category <span className="req">*</span></label>
                <div className="leads-cat-options">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.key}
                      className={`leads-cat-opt ${form.category === cat.key ? 'active' : ''}`}
                      style={{ '--cat-clr': cat.color }}
                      onClick={() => setForm({ ...form, category: cat.key })}>
                      <strong>{cat.label}</strong>
                      <span>{cat.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="leads-form-row">
                <div className="leads-form-group">
                  <label>Lead Name <span className="req">*</span></label>
                  <input type="text" placeholder="Full name" value={form.leadName}
                    onChange={e => setForm({ ...form, leadName: e.target.value })} />
                </div>
                <div className="leads-form-group">
                  <label>Phone <span className="req">*</span></label>
                  <input type="tel" placeholder="Mobile number" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
                </div>
              </div>

              <div className="leads-form-row">
                <div className="leads-form-group">
                  <label>Email</label>
                  <input type="email" placeholder="email@example.com" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="leads-form-group">
                  <label>Company</label>
                  <input type="text" placeholder="Company name" value={form.company}
                    onChange={e => setForm({ ...form, company: e.target.value })} />
                </div>
              </div>

              <div className="leads-form-row">
                <div className="leads-form-group">
                  <label>Lead Source</label>
                  <select value={form.leadSource} onChange={e => setForm({ ...form, leadSource: e.target.value })}>
                    <option value="">Select source</option>
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="leads-form-group">
                  <label>Status</label>
                  <select value={form.leadStatus} onChange={e => setForm({ ...form, leadStatus: e.target.value })}>
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="leads-form-row">
                <div className="form-group">
                  <label>Assigned To</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                    <select
                      style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13.5px', color: '#1a1a2e', background: 'transparent', fontFamily: 'inherit', cursor: 'pointer' }}
                      value={form.assignedTo || ''}
                      onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                    >
                      <option value="">-- Unassigned --</option>
                      {executives.map(exec => (
                        <option key={exec._id} value={exec._id}>{exec.name} — {exec.phone}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="leads-form-group">
                  <label>Follow-Up Date</label>
                  <input type="date" value={form.followUpDate}
                    onChange={e => setForm({ ...form, followUpDate: e.target.value })} />
                </div>
              </div>

              <div className="leads-form-row">
                <div className="leads-form-group">
                  <label>Expected Value (₹)</label>
                  <input type="number" placeholder="0" min="0" value={form.expectedValue}
                    onChange={e => setForm({ ...form, expectedValue: e.target.value })} />
                </div>
              </div>

              <div className="leads-form-group full">
                <label>Remarks</label>
                <textarea rows={2} placeholder="Any remarks or additional info..." value={form.remarks}
                  onChange={e => setForm({ ...form, remarks: e.target.value })} />
              </div>
            </div>

            <div className="leads-modal-foot">
              {/* <button className="leads-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button> */}
              <button className="leads-btn-primary" onClick={handleSave} disabled={saving}>
                {saving && <span className="leads-spinner" />}
                {saving ? 'Saving...' : editLead ? 'Update Lead' : 'Add Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View / Notes Modal ─────────────────────── */}
      {viewLead && (
        <div className="leads-overlay" onClick={() => setViewLead(null)}>
          <div className="leads-modal leads-modal-view" onClick={e => e.stopPropagation()}>
            <div className="leads-modal-head">
              <div className="leads-view-title">
                <div className="leads-view-avatar">{(viewLead.leadName || '?')[0].toUpperCase()}</div>
                <div>
                  <h3>{viewLead.leadName}</h3>
                  <p>{viewLead.company || viewLead.phone}</p>
                </div>
              </div>
              <button className="leads-modal-close" onClick={() => setViewLead(null)}>✕</button>
            </div>


            <div style={{ display: "flex", gap: "10px",  paddingLeft: '10PX' , marginTop:'10px' }}>
              <button
                className={`tab-btn ${activeViewTab === "details" ? "active" : ""}`}
                onClick={() => setActiveViewTab("details")}
              >
                Details
              </button>

              <button
                className={`tab-btn ${activeViewTab === "history" ? "active" : ""}`}
                onClick={() => setActiveViewTab("history")}
              >
                History
              </button>
            </div>

            <div className="leads-modal-body">
              {/* Quick category change */}
              {activeViewTab === "details" && (

                <>
                  <div className="leads-view-cats">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.key}
                        className={`leads-view-cat-btn ${viewLead.category === cat.key ? 'active' : ''}`}
                        style={{ '--cat-clr': cat.color }}
                        onClick={() => handleQuickCategory(viewLead, cat.key)}>
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Details */}
                  <div className="leads-detail-grid">
                    <div className="leads-detail-item">
                      <span className="leads-dl">Phone</span>
                      <span className="leads-dv">{viewLead.phone}</span>
                    </div>
                    <div className="leads-detail-item">
                      <span className="leads-dl">Email</span>
                      <span className="leads-dv">{viewLead.email || '—'}</span>
                    </div>
                    <div className="leads-detail-item">
                      <span className="leads-dl">Source</span>
                      <span className="leads-dv">{viewLead.leadSource || '—'}</span>
                    </div>
                    <div className="leads-detail-item">
                      <span className="leads-dl">Assigned To</span>
                      <span className="leads-dv">{viewLead.assignedTo?.name || '—'}</span>
                    </div>
                    <div className="leads-detail-item">
                      <span className="leads-dl">Follow-Up</span>
                      <span className={`leads-dv ${isOverdue(viewLead.followUpDate) ? 'overdue-text' : ''}`}>
                        {formatDate(viewLead.followUpDate)}
                      </span>
                    </div>
                    <div className="leads-detail-item">
                      <span className="leads-dl">Expected Value</span>
                      <span className="leads-dv">{viewLead.expectedValue ? `₹${Number(viewLead.expectedValue).toLocaleString('en-IN')}` : '—'}</span>
                    </div>
                    {viewLead.remarks && (
                      <div className="leads-detail-item full">
                        <span className="leads-dl">Remarks</span>
                        <span className="leads-dv">{viewLead.remarks}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Notes */}
              {activeViewTab === "history" &&
                <>
                  <div className="leads-notes-section" style={{ marginBottom: 16 }}>
                    <h4>📋 Activity Timeline <span>({viewLead.activityLog?.length || 0})</span></h4>
                    <div className="leads-notes-list">
                      {(!viewLead.activityLog || viewLead.activityLog.length === 0) && (
                        <p className="leads-no-notes">No activity recorded yet.</p>
                      )}
                      {[...(viewLead.activityLog || [])].reverse().map((event, i) => (
                        <div key={i} className="leads-note-item">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: 20 }}>{event.action}</span>
                            {event.changedBy && <span style={{ fontSize: 11, color: '#9ca3af' }}>by {event.changedBy}</span>}
                          </div>
                          {event.details && <div className="leads-note-text">{event.details}</div>}
                          <div className="leads-note-meta">
                            <span className="leads-note-time">
                              🕐 {new Date(event.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="leads-notes-section">
                    <h4>📝 Notes & Follow-up History <span>({viewLead.notes?.length || 0})</span></h4>
                    <div className="leads-notes-list">
                      {(!viewLead.notes || viewLead.notes.length === 0) && (
                        <p className="leads-no-notes">No notes yet. Add your first note below.</p>
                      )}
                      {[...(viewLead.notes || [])].reverse().map((note) => (
                        <div key={note._id} className="leads-note-item">
                          <div className="leads-note-text">{note.text}</div>
                          <div className="leads-note-meta">
                            <span className="leads-note-time">
                              🕐 {formatDateTime(note.createdAt)}
                            </span>
                            <button
                              className="leads-note-del"
                              onClick={() => handleDeleteNote(note._id)}
                              title="Delete note">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="leads-add-note">
                      <textarea
                        rows={2}
                        placeholder="Add a note or follow-up update..."
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAddNote(); }}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <label
                          title="Scan handwritten note"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                            background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
                            borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: scanning ? 'not-allowed' : 'pointer',
                            opacity: scanning ? 0.7 : 1,
                          }}>
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            disabled={scanning}
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              setScanError('');
                              setScanning(true);
                              try {
                                const fd = new FormData();
                                fd.append('image', file);
                                const token = localStorage.getItem('gg_token');
                                const res = await fetch(
                                  `${import.meta.env.VITE_API_URL}/api/leads/${viewLead._id}/scan-note`,
                                  { method: 'POST', headers: { Authorizaion: `Bearer ${token}` }, body: fd }
                                );
                                const data = await res.json();
                                if (data.success) {
                                  setNewNote(prev => prev ? `${prev}\n${data.text}` : data.text);
                                } else {
                                  setScanError(data.message || 'Scan failed');
                                }
                              } catch (err) {
                                setScanError('Scan failed. Please try again.');
                              } finally {
                                setScanning(false);
                                e.target.value = '';
                              }
                            }}
                          />
                          {scanning
                            ? <><span className="leads-spinner" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} /> Scanning...</>
                            : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg> Scan Note</>
                          }
                        </label>
                        <button
                          className="leads-btn-primary"
                          style={{ flex: 1 }}
                          onClick={handleAddNote}
                          disabled={noteLoading || !newNote.trim()}>
                          {noteLoading ? <span className="leads-spinner" /> : 'Add Note'}
                        </button>
                      </div>
                      {scanError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>{scanError}</div>}
                    </div>
                    <p className="leads-note-hint">Tip: Ctrl+Enter to save note quickly</p>
                  </div>

                  <button style={{ marginTop: '5px' }} className="leads-btn-primary " onClick={handleDownloadPDF}>
                    Download History PDF
                  </button>
                </>

              }
            </div>

            <div className="leads-modal-foot">
              {/* <button className="leads-btn-ghost" onClick={() => setViewLead(null)}>Close</button> */}
              <button className="leads-btn-primary" onClick={() => { setViewLead(null); handleOpenForm(viewLead); }}>
                Edit Lead
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        message="Are you sure you want to delete this lead?"
      />
    </div>
  );
}

const WrappedLeads = () => <LeadsErrorBoundary><Leads /></LeadsErrorBoundary>;
export default WrappedLeads;
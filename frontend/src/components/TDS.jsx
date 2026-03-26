import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchTDSList, fetchTDSCategories, uploadTDS,
  updateTDS, deleteTDS, downloadTDS, getTDSFileUrl
} from '../services/tds.service';
import './TDS.css';

const FILE_ICONS = {
  'application/pdf': { icon: '📄', label: 'PDF',   color: '#dc2626' },
  'application/msword': { icon: '📝', label: 'DOC', color: '#2563eb' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📝', label: 'DOCX', color: '#2563eb' },
  'application/vnd.ms-excel': { icon: '📊', label: 'XLS', color: '#16a34a' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: '📊', label: 'XLSX', color: '#16a34a' },
  'image/jpeg': { icon: '🖼️', label: 'JPG', color: '#9333ea' },
  'image/jpg':  { icon: '🖼️', label: 'JPG', color: '#9333ea' },
  'image/png':  { icon: '🖼️', label: 'PNG', color: '#9333ea' },
};

const getFileInfo = (mime) => FILE_ICONS[mime] || { icon: '📎', label: 'FILE', color: '#6b7280' };

const emptyForm = {
  productName: '', productCode: '', category: '',
  version: '', description: '', tags: '', status: 'active'
};

export default function TDS() {
  const [docs, setDocs]               = useState([]);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(false);
  const [search, setSearch]           = useState('');
  const [filterCat, setFilterCat]     = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [showUpload, setShowUpload]   = useState(false);
  const [editDoc, setEditDoc]         = useState(null);
  const [viewDoc, setViewDoc]         = useState(null);
  const [form, setForm]               = useState(emptyForm);
  const [file, setFile]               = useState(null);
  const [dragOver, setDragOver]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [downloading, setDownloading] = useState({});
  const [toast, setToast]             = useState(null);
  const fileInputRef                  = useRef();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)       params.search   = search;
      if (filterCat)    params.category = filterCat;
      if (filterStatus) params.status   = filterStatus;
      const [docsRes, catsRes] = await Promise.all([
        fetchTDSList(params),
        fetchTDSCategories(),
      ]);
      setDocs(docsRes.data || []);
      setCategories(catsRes.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterCat, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setForm(emptyForm); setFile(null); };

  const handleOpenUpload = () => {
    setEditDoc(null);
    resetForm();
    setShowUpload(true);
  };

  const handleOpenEdit = (doc) => {
    setEditDoc(doc);
    setFile(null);
    setForm({
      productName: doc.productName || '',
      productCode: doc.productCode || '',
      category:    doc.category    || '',
      version:     doc.version     || '',
      description: doc.description || '',
      tags:        (doc.tags || []).join(', '),
      status:      doc.status      || 'active',
    });
    setShowUpload(true);
    setViewDoc(null);
  };

  const handleFileSelect = (f) => {
    if (!f) return;
    const allowed = ['application/pdf','application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg','image/png','image/jpg'];
    if (!allowed.includes(f.type)) {
      showToast('Only PDF, Word, Excel and image files allowed', 'error');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      showToast('File must be under 20 MB', 'error');
      return;
    }
    setFile(f);
    // Auto-fill product name from filename if empty
    if (!form.productName) {
      const name = f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setForm(prev => ({ ...prev, productName: name }));
    }
  };

  const handleSave = async () => {
    if (!form.productName) return showToast('Product name is required', 'error');
    if (!form.version)     return showToast('Version is required', 'error');
    if (!editDoc && !file) return showToast('Please select a file to upload', 'error');

    setSaving(true);
    try {
      if (editDoc) {
        // Metadata update only
        await updateTDS(editDoc._id, {
          ...form,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
        });
        showToast('Document updated');
      } else {
        // New upload
        const fd = new FormData();
        fd.append('file', file);
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        const res = await uploadTDS(fd);
        if (!res.success) throw new Error(res.message);
        showToast('Document uploaded');
      }
      setShowUpload(false);
      resetForm();
      setEditDoc(null);
      load();
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document? The file will also be removed.')) return;
    try {
      await deleteTDS(id);
      showToast('Document deleted');
      if (viewDoc?._id === id) setViewDoc(null);
      load();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  const handleDownload = async (doc) => {
    setDownloading(d => ({ ...d, [doc._id]: true }));
    try {
      downloadTDS(doc._id, doc.fileName);
    } catch {
      showToast('Download failed', 'error');
    } finally {
      setTimeout(() => setDownloading(d => ({ ...d, [doc._id]: false })), 1500);
    }
  };

  const handleArchive = async (doc) => {
    try {
      const newStatus = doc.status === 'active' ? 'archived' : 'active';
      await updateTDS(doc._id, { status: newStatus });
      showToast(newStatus === 'archived' ? 'Document archived' : 'Document restored');
      if (viewDoc?._id === doc._id) setViewDoc(prev => ({ ...prev, status: newStatus }));
      load();
    } catch { showToast('Failed', 'error'); }
  };

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  const activeDocs   = docs.filter(d => d.status === 'active');
  const archivedDocs = docs.filter(d => d.status === 'archived');

  // ── Category counts
  const catCounts = {};
  docs.forEach(d => { catCounts[d.category] = (catCounts[d.category] || 0) + 1; });

  return (
    <div className="tds-page">

      {toast && (
        <div className={`tds-toast tds-toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="tds-header">
        <div>
          <h2>TDS — Technical Data System</h2>
          <p>Upload, version and download technical documents for your products</p>
        </div>
        <button className="tds-btn-primary" onClick={handleOpenUpload}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload Document
        </button>
      </div>

      {/* Stats */}
      <div className="tds-stats">
        {[
          { label: 'Total Documents', value: docs.length,        color: '#6366f1', icon: '🗂️' },
          { label: 'Active',          value: activeDocs.length,  color: '#16a34a', icon: '✅' },
          { label: 'Archived',        value: archivedDocs.length,color: '#6b7280', icon: '📦' },
          { label: 'Categories',      value: Object.keys(catCounts).filter(Boolean).length, color: '#0ea5e9', icon: '🏷️' },
        ].map((s, i) => (
          <div key={i} className="tds-stat-card" style={{ borderLeftColor: s.color }}>
            <div className="tds-stat-icon">{s.icon}</div>
            <div>
              <div className="tds-stat-num" style={{ color: s.color }}>{s.value}</div>
              <div className="tds-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="tds-filters">
        <div className="tds-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search product, version, tags..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="tds-clear" onClick={() => setSearch('')}>✕</button>}
        </div>
        <select className="tds-filter-sel" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="tds-status-tabs">
          {[
            { v: 'active',   l: 'Active' },
            { v: 'archived', l: 'Archived' },
            { v: '',         l: 'All' },
          ].map(tab => (
            <button
              key={tab.v}
              className={`tds-status-tab ${filterStatus === tab.v ? 'active' : ''}`}
              onClick={() => setFilterStatus(tab.v)}>
              {tab.l}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      {docs.length === 0 && !loading ? (
        <div className="tds-empty">
          <div className="tds-empty-icon">📁</div>
          <h3>No documents yet</h3>
          <p>Upload your first Technical Data Sheet to get started.</p>
          <button className="tds-btn-primary" onClick={handleOpenUpload}>Upload Document</button>
        </div>
      ) : (
        <div className="tds-grid">
          {loading && docs.length === 0 && (
            <div className="tds-grid-loading">Loading documents...</div>
          )}
          {docs.map(doc => {
            const fi = getFileInfo(doc.mimeType);
            return (
              <div key={doc._id} className={`tds-card ${doc.status === 'archived' ? 'archived' : ''}`}>
                {/* File type badge */}
                <div className="tds-card-top">
                  <div className="tds-file-icon" style={{ background: fi.color + '18', color: fi.color }}>
                    {fi.icon}
                  </div>
                  <div className="tds-card-badges">
                    <span className="tds-type-badge" style={{ background: fi.color + '18', color: fi.color }}>
                      {fi.label}
                    </span>
                    <span className={`tds-status-badge ${doc.status}`}>
                      {doc.status === 'archived' ? '📦 Archived' : '✅ Active'}
                    </span>
                  </div>
                </div>

                {/* Main info */}
                <div className="tds-card-body">
                  <h4 className="tds-card-title">{doc.productName}</h4>
                  {doc.productCode && <span className="tds-card-code">{doc.productCode}</span>}
                  <div className="tds-card-meta">
                    <span className="tds-version">🔖 {doc.version}</span>
                    {doc.category && <span className="tds-category">{doc.category}</span>}
                  </div>
                  {doc.description && (
                    <p className="tds-card-desc">{doc.description}</p>
                  )}
                  {doc.tags?.length > 0 && (
                    <div className="tds-tags">
                      {doc.tags.map((t, i) => <span key={i} className="tds-tag">{t}</span>)}
                    </div>
                  )}
                  <div className="tds-card-footer">
                    <span className="tds-file-name" title={doc.fileName}>📎 {doc.fileName}</span>
                    <span className="tds-file-size">{doc.fileSizeFormatted}</span>
                  </div>
                  <div className="tds-card-date">Uploaded {fmtDate(doc.createdAt)}</div>
                </div>

                {/* Actions */}
                <div className="tds-card-actions">
                  {/* <button
                    className="tds-action-btn download"
                    onClick={() => handleDownload(doc)}
                    disabled={downloading[doc._id]}
                    title="Download">
                    {downloading[doc._id]
                      ? <span className="tds-spin" />
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
                    Download
                  </button> */}
                  <button className="tds-action-btn view" onClick={() => setViewDoc(doc)} title="Details">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    Details
                  </button>
                  <div className="tds-card-more">
                    <button className="tds-more-btn">⋯</button>
                    <div className="tds-more-menu">
                      <button onClick={() => handleOpenEdit(doc)}>✏️ Edit Info</button>
                      <button onClick={() => handleArchive(doc)}>
                        {doc.status === 'active' ? '📦 Archive' : '✅ Restore'}
                      </button>
                      <button className="danger" onClick={() => handleDelete(doc._id)}>🗑️ Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Upload / Edit Modal ─────────────────────── */}
      {showUpload && (
        <div className="tds-overlay" onClick={() => setShowUpload(false)}>
          <div className="tds-modal" onClick={e => e.stopPropagation()}>
            <div className="tds-modal-head">
              <h3>{editDoc ? '✏️ Edit Document Info' : '⬆️ Upload TDS Document'}</h3>
              <button className="tds-modal-close" onClick={() => setShowUpload(false)}>✕</button>
            </div>

            <div className="tds-modal-body">
              {/* File drop zone — only for new uploads */}
              {!editDoc && (
                <div
                  className={`tds-dropzone ${dragOver ? 'drag' : ''} ${file ? 'has-file' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
                  onClick={() => fileInputRef.current.click()}>
                  {file ? (
                    <div className="tds-file-selected">
                      <span className="tds-file-sel-icon">{getFileInfo(file.type).icon}</span>
                      <div>
                        <p className="tds-file-sel-name">{file.name}</p>
                        <p className="tds-file-sel-size">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button className="tds-file-sel-remove"
                        onClick={e => { e.stopPropagation(); setFile(null); }}>✕</button>
                    </div>
                  ) : (
                    <>
                      <div className="tds-dz-icon">📁</div>
                      <p className="tds-dz-title">Drop file here or click to browse</p>
                      <p className="tds-dz-sub">PDF, Word, Excel, Images — max 20 MB</p>
                    </>
                  )}
                </div>
              )}
              <input ref={fileInputRef} type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                hidden onChange={e => handleFileSelect(e.target.files[0])} />

              {editDoc && (
                <div className="tds-edit-file-info">
                  <span>{getFileInfo(editDoc.mimeType).icon}</span>
                  <span>{editDoc.fileName}</span>
                  <span className="tds-edit-file-note">(file cannot be changed — delete and re-upload if needed)</span>
                </div>
              )}

              <div className="tds-form-row">
                <div className="tds-fg">
                  <label>Product Name <span className="req">*</span></label>
                  <input type="text" placeholder="e.g. Epoxy Adhesive XL-200" value={form.productName}
                    onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} />
                </div>
                <div className="tds-fg">
                  <label>Product Code</label>
                  <input type="text" placeholder="e.g. P001" value={form.productCode}
                    onChange={e => setForm(f => ({ ...f, productCode: e.target.value }))} />
                </div>
              </div>

              <div className="tds-form-row">
                <div className="tds-fg">
                  <label>Version <span className="req">*</span></label>
                  <input type="text" placeholder="e.g. v1.0, v2.1, 2024-A" value={form.version}
                    onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
                </div>
                <div className="tds-fg">
                  <label>Category</label>
                  <input type="text" placeholder="e.g. Adhesives, Coatings" value={form.category}
                    list="tds-cats"
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                  <datalist id="tds-cats">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>

              <div className="tds-fg full">
                <label>Description</label>
                <textarea rows={2} placeholder="Brief description of this TDS document..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="tds-form-row" style={{ marginTop: 12 }}>
                <div className="tds-fg">
                  <label>Tags <span className="tds-hint">(comma separated)</span></label>
                  <input type="text" placeholder="e.g. waterproof, industrial, grade-A" value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
                </div>
                {editDoc && (
                  <div className="tds-fg">
                    <label>Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="tds-modal-foot">
              <button className="tds-btn-ghost" onClick={() => setShowUpload(false)}>Cancel</button>
              <button className="tds-btn-primary" onClick={handleSave} disabled={saving}>
                {saving && <span className="tds-spin" />}
                {saving ? 'Saving...' : editDoc ? '💾 Update Info' : '⬆️ Upload Document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Details Modal ──────────────────────── */}
      {viewDoc && (
        <div className="tds-overlay" onClick={() => setViewDoc(null)}>
          <div className="tds-modal" onClick={e => e.stopPropagation()}>
            <div className="tds-modal-head">
              <h3>Document Details</h3>
              <button className="tds-modal-close" onClick={() => setViewDoc(null)}>✕</button>
            </div>
            <div className="tds-modal-body">
              {/* Big file icon */}
              <div className="tds-view-hero">
                <div className="tds-view-icon" style={{ color: getFileInfo(viewDoc.mimeType).color,
                  background: getFileInfo(viewDoc.mimeType).color + '15' }}>
                  {getFileInfo(viewDoc.mimeType).icon}
                </div>
                <div>
                  <h3>{viewDoc.productName}</h3>
                  {viewDoc.productCode && <span className="tds-view-code">{viewDoc.productCode}</span>}
                </div>
              </div>

              <div className="tds-view-grid">
                {[
                  ['Version',    viewDoc.version],
                  ['Category',   viewDoc.category  || '—'],
                  ['File Name',  viewDoc.fileName],
                  ['File Size',  viewDoc.fileSizeFormatted],
                  ['File Type',  getFileInfo(viewDoc.mimeType).label],
                  ['Status',     viewDoc.status],
                  ['Uploaded',   fmtDate(viewDoc.createdAt)],
                  ['Last Updated', fmtDate(viewDoc.updatedAt)],
                ].map(([label, val]) => (
                  <div key={label} className="tds-view-item">
                    <span className="tds-vl">{label}</span>
                    <span className="tds-vv">{val}</span>
                  </div>
                ))}
                {viewDoc.description && (
                  <div className="tds-view-item full">
                    <span className="tds-vl">Description</span>
                    <span className="tds-vv">{viewDoc.description}</span>
                  </div>
                )}
              </div>

              {viewDoc.tags?.length > 0 && (
                <div className="tds-view-tags">
                  <span className="tds-vl">Tags</span>
                  <div className="tds-tags" style={{ marginTop: 6 }}>
                    {viewDoc.tags.map((t, i) => <span key={i} className="tds-tag">{t}</span>)}
                  </div>
                </div>
              )}
            </div>
            <div className="tds-modal-foot">
              <button className="tds-btn-ghost" onClick={() => setViewDoc(null)}>Close</button>
              <button className="tds-btn-outline-edit" onClick={() => handleOpenEdit(viewDoc)}>✏️ Edit Info</button>
              <button className="tds-btn-primary" onClick={() => handleDownload(viewDoc)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
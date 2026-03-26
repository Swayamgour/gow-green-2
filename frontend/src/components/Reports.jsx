import { useState } from 'react';
import {
  exportLeadsReport, exportCustomersReport, exportProductsReport,
  exportQuotationsReport, exportMasterReport
} from '../services/reports.service';
import './Reports.css';

const LEAD_STATUSES = ['open', 'in-progress', 'follow-up', 'won', 'lost'];
const CATEGORIES    = ['new', 'routine', 'closed'];
const PRODUCT_TYPES = ['RM', 'FM'];
const QT_STATUSES   = ['draft', 'sent', 'accepted', 'rejected', 'expired'];

const today = () => new Date().toISOString().split('T')[0];
const firstOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
};
const firstOfYear = () => `${new Date().getFullYear()}-01-01`;

const QUICK_RANGES = [
  { label: 'This Month', from: firstOfMonth, to: today },
  { label: 'This Year',  from: firstOfYear,  to: today },
  { label: 'All Time',   from: () => '',     to: () => '' },
];

const REPORT_CARDS = [
  {
    id:      'leads',
    title:   'Leads Report',
    desc:    'All leads with status, follow-up dates, expected values and notes count.',
    icon:    '📋',
    color:   '#6366f1',
    bg:      '#ede9fe',
    sheets:  ['All Leads', 'Summary'],
    fn:      exportLeadsReport,
    filters: ['dateRange', 'leadStatus', 'category'],
  },
  {
    id:      'customers',
    title:   'Customer Report',
    desc:    'Full customer list with category, assigned executive and contact details.',
    icon:    '👥',
    color:   '#059669',
    bg:      '#d1fae5',
    sheets:  ['Customers', 'Summary'],
    fn:      exportCustomersReport,
    filters: ['dateRange', 'customerStatus', 'category'],
  },
  {
    id:      'products',
    title:   'Product Report',
    desc:    'RM and FM product catalogue with pricing, stock and HSN codes.',
    icon:    '📦',
    color:   '#0ea5e9',
    bg:      '#e0f2fe',
    sheets:  ['All Products', 'RM Products', 'FM Products', 'Summary'],
    fn:      exportProductsReport,
    filters: ['productType', 'productStatus'],
  },
  {
    id:      'quotations',
    title:   'Quotation Report',
    desc:    'Quotation summary and line-item breakdown with totals and tax.',
    icon:    '📄',
    color:   '#f59e0b',
    bg:      '#fef3c7',
    sheets:  ['Quotations', 'Line Items', 'Summary'],
    fn:      exportQuotationsReport,
    filters: ['dateRange', 'quotationStatus'],
  },
  {
    id:      'master',
    title:   'Master Report',
    desc:    'Combined workbook — Dashboard + Leads + Customers + Products + Quotations.',
    icon:    '🗂️',
    color:   '#1a3c6e',
    bg:      '#dbeafe',
    sheets:  ['Dashboard', 'Leads', 'Customers', 'Products', 'Quotations'],
    fn:      exportMasterReport,
    filters: ['dateRange'],
    featured: true,
  },
];

export default function Reports() {
  const [loading, setLoading]   = useState({});
  const [toast, setToast]       = useState(null);
  const [expanded, setExpanded] = useState(null); // which card's filters are open
  const [filters, setFilters]   = useState({
    from:           firstOfMonth(),
    to:             today(),
    leadStatus:     '',
    customerStatus: '',
    category:       '',
    productType:    '',
    productStatus:  '',
    quotationStatus:'',
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const setF = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  const applyQuickRange = (range) => {
    setF('from', range.from());
    setF('to',   range.to());
  };

  const handleExport = async (card) => {
    setLoading(l => ({ ...l, [card.id]: true }));
    try {
      const params = {};
      if (card.filters.includes('dateRange')) {
        if (filters.from) params.from = filters.from;
        if (filters.to)   params.to   = filters.to;
      }
      if (card.filters.includes('leadStatus')     && filters.leadStatus)     params.status   = filters.leadStatus;
      if (card.filters.includes('customerStatus') && filters.customerStatus) params.status   = filters.customerStatus;
      if (card.filters.includes('category')       && filters.category)       params.category = filters.category;
      if (card.filters.includes('productType')    && filters.productType)    params.type     = filters.productType;
      if (card.filters.includes('productStatus')  && filters.productStatus)  params.status   = filters.productStatus;
      if (card.filters.includes('quotationStatus')&& filters.quotationStatus)params.status   = filters.quotationStatus;

      await card.fn(params);
      showToast(`${card.title} downloaded successfully`);
    } catch (err) {
      showToast(err.message || 'Export failed', 'error');
    } finally {
      setLoading(l => ({ ...l, [card.id]: false }));
    }
  };

  return (
    <div className="rpt-page">
      {toast && (
        <div className={`rpt-toast rpt-toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="rpt-header">
        <div>
          <h2>Reporting & Export</h2>
          <p>Download formatted Excel reports for any module with optional filters</p>
        </div>
      </div>

      {/* Global date range + quick ranges */}
      <div className="rpt-global-filters">
        <div className="rpt-gf-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Date Range
        </div>
        <div className="rpt-date-inputs">
          <div className="rpt-date-group">
            <label>From</label>
            <input type="date" value={filters.from} onChange={e => setF('from', e.target.value)} />
          </div>
          <span className="rpt-date-sep">—</span>
          <div className="rpt-date-group">
            <label>To</label>
            <input type="date" value={filters.to} onChange={e => setF('to', e.target.value)} />
          </div>
        </div>
        <div className="rpt-quick-ranges">
          {QUICK_RANGES.map(r => (
            <button key={r.label} className="rpt-qr-btn"
              onClick={() => applyQuickRange(r)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Report Cards */}
      <div className="rpt-cards">
        {REPORT_CARDS.map(card => (
          <div key={card.id} className={`rpt-card ${card.featured ? 'featured' : ''}`}>
            {card.featured && <div className="rpt-featured-badge">⭐ Full Export</div>}

            <div className="rpt-card-top">
              <div className="rpt-card-icon" style={{ background: card.bg, color: card.color }}>
                {card.icon}
              </div>
              <div className="rpt-card-info">
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </div>
            </div>

            {/* Sheets preview */}
            <div className="rpt-sheets">
              {card.sheets.map(s => (
                <span key={s} className="rpt-sheet-tag">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                  {s}
                </span>
              ))}
            </div>
            <div className="rpt-card-divider" />

            {/* Collapsible filters */}
            {card.filters.length > 1 && (
              <div className="rpt-filter-toggle">
                <button
                  className={`rpt-filter-toggle-btn ${expanded === card.id ? 'open' : ''}`}
                  onClick={() => setExpanded(expanded === card.id ? null : card.id)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
                  Additional Filters
                  <svg className={`rpt-chevron ${expanded === card.id ? 'up' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </button>

                {expanded === card.id && (
                  <div className="rpt-filter-panel">
                    {card.filters.includes('leadStatus') && (
                      <div className="rpt-fg">
                        <label>Lead Status</label>
                        <select value={filters.leadStatus} onChange={e => setF('leadStatus', e.target.value)}>
                          <option value="">All Statuses</option>
                          {LEAD_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </div>
                    )}
                    {card.filters.includes('customerStatus') && (
                      <div className="rpt-fg">
                        <label>Customer Status</label>
                        <select value={filters.customerStatus} onChange={e => setF('customerStatus', e.target.value)}>
                          <option value="">All</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    )}
                    {card.filters.includes('category') && (
                      <div className="rpt-fg">
                        <label>Category</label>
                        <select value={filters.category} onChange={e => setF('category', e.target.value)}>
                          <option value="">All Categories</option>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                        </select>
                      </div>
                    )}
                    {card.filters.includes('productType') && (
                      <div className="rpt-fg">
                        <label>Product Type</label>
                        <select value={filters.productType} onChange={e => setF('productType', e.target.value)}>
                          <option value="">All Types</option>
                          {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    )}
                    {card.filters.includes('productStatus') && (
                      <div className="rpt-fg">
                        <label>Product Status</label>
                        <select value={filters.productStatus} onChange={e => setF('productStatus', e.target.value)}>
                          <option value="">All</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    )}
                    {card.filters.includes('quotationStatus') && (
                      <div className="rpt-fg">
                        <label>Quotation Status</label>
                        <select value={filters.quotationStatus} onChange={e => setF('quotationStatus', e.target.value)}>
                          <option value="">All Statuses</option>
                          {QT_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Export button */}
            <button
              className="rpt-export-btn"
              style={{ '--btn-color': card.color, '--btn-bg': card.bg }}
              onClick={() => handleExport(card)}
              disabled={loading[card.id]}>
              {loading[card.id] ? (
                <>
                  <span className="rpt-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download Report
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Help section */}
     
    </div>
  );
}
// Products.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchProducts, createProduct, updateProduct, deleteProduct,
  exportProductsExcel, downloadProductTemplate, importProductsExcel
} from '../services/product.service';
import './Products.css';

// Common units
const UNITS = ['kg', 'g', 'litre', 'ml', 'pcs', 'box', 'bag', 'ton', 'metre', 'other'];
const BUNCH_CATS = ['A', 'B', 'C', 'D', 'Special'];
const BRAND_NAMES = ['Brand A', 'Brand B', 'Brand C', 'Brand D', 'Local'];

// Empty form based on backend schema
const emptyForm = {
  name: '',
  code: '',
  type: 'RM',
  hsn: '',
  image: '',
  price: 0,
  status: 'Active',

  // Type-specific details
  rmDetails: {
    category1: '',
    category2: '',
    category3: '',
    unit: '',
    bunchCat: '',
    noCheckMakeQty: 0,
    minQty: 0,
    maxQty: 0,
    masterPrice: 0,
    category4: '',
    category5: '',
    imp1: '',
    imp2: ''
  },
  smDetails: {
    category1: '',
    category2: '',
    category3: '',
    category4: '',
    category5: '',
    minQty: 0,
    maxQty: 0
  },
  fmDetails: {
    category1: '',
    category2: '',
    category3: '',
    brandName: '',
    minQty: 0,
    reOrderQty: 0,
    weightPerBox: 0,
    qtyPerBox: 0,
    masterPrice: 0,
    pMasterPrice: 0,
    scrapFgCat: '',
    cat4: '',
    cat5: '',
    fgWeight: '',
    fgCost: 0
  }
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('basic'); // For modal tabs
  const fileInputRef = useRef();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterType) params.type = filterType;
      const res = await fetchProducts(params);
      setProducts(res.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterType]);

  useEffect(() => { load(); }, [load]);

  const handleOpenForm = (product = null) => {
    if (product) {
      setEditProduct(product);
      // Merge existing product data with empty form structure
      setForm({
        ...emptyForm,
        ...product,
        rmDetails: { ...emptyForm.rmDetails, ...(product.rmDetails || {}) },
        smDetails: { ...emptyForm.smDetails, ...(product.smDetails || {}) },
        fmDetails: { ...emptyForm.fmDetails, ...(product.fmDetails || {}) }
      });
    } else {
      setEditProduct(null);
      setForm({
        ...emptyForm,
        type: filterType || 'RM'
      });
    }
    setActiveTab('basic');
    setShowForm(true);
  };

  const handleInputChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDetailChange = (type, field, value) => {
    const detailKey = `${type.toLowerCase()}Details`;
    setForm(prev => ({
      ...prev,
      [detailKey]: {
        ...prev[detailKey],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!form.name) return showToast('Product name is required', 'error');
    if (!form.type) return showToast('Product type is required', 'error');

    setSaving(true);
    try {
      // Prepare data based on type
      const productData = {
        name: form.name,
        code: form.code,
        type: form.type,
        hsn: form.hsn,
        image: form.image,
        price: Number(form.price) || 0,
        status: form.status
      };

      // Add type-specific details
      if (form.type === 'RM') {
        productData.rmDetails = {
          category1: form.rmDetails.category1,
          category2: form.rmDetails.category2,
          category3: form.rmDetails.category3,
          unit: form.rmDetails.unit,
          bunchCat: form.rmDetails.bunchCat,
          noCheckMakeQty: Number(form.rmDetails.noCheckMakeQty) || 0,
          minQty: Number(form.rmDetails.minQty) || 0,
          maxQty: Number(form.rmDetails.maxQty) || 0,
          masterPrice: Number(form.rmDetails.masterPrice) || 0,
          category4: form.rmDetails.category4,
          category5: form.rmDetails.category5,
          imp1: form.rmDetails.imp1,
          imp2: form.rmDetails.imp2
        };
      } else if (form.type === 'SM') {
        productData.smDetails = {
          category1: form.smDetails.category1,
          category2: form.smDetails.category2,
          category3: form.smDetails.category3,
          category4: form.smDetails.category4,
          category5: form.smDetails.category5,
          minQty: Number(form.smDetails.minQty) || 0,
          maxQty: Number(form.smDetails.maxQty) || 0
        };
      } else if (form.type === 'FM') {
        productData.fmDetails = {
          category1: form.fmDetails.category1,
          category2: form.fmDetails.category2,
          category3: form.fmDetails.category3,
          brandName: form.fmDetails.brandName,
          minQty: Number(form.fmDetails.minQty) || 0,
          reOrderQty: Number(form.fmDetails.reOrderQty) || 0,
          weightPerBox: Number(form.fmDetails.weightPerBox) || 0,
          qtyPerBox: Number(form.fmDetails.qtyPerBox) || 0,
          masterPrice: Number(form.fmDetails.masterPrice) || 0,
          pMasterPrice: Number(form.fmDetails.pMasterPrice) || 0,
          scrapFgCat: form.fmDetails.scrapFgCat,
          cat4: form.fmDetails.cat4,
          cat5: form.fmDetails.cat5,
          fgWeight: form.fmDetails.fgWeight,
          fgCost: Number(form.fmDetails.fgCost) || 0
        };
      }

      if (editProduct) {
        await updateProduct(editProduct._id, productData);
        showToast('Product updated successfully');
      } else {
        await createProduct(productData);
        showToast('Product added successfully');
      }

      setShowForm(false);
      setEditProduct(null);
      setForm(emptyForm);
      load();
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      showToast('Product deleted successfully');
      load();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  const handleImport = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportLoading(true);

    try {
      const res = await importProductsExcel(file, type); // 👈 type pass

      if (res.success) {
        showToast(`${type} imported successfully (${res.data.created} created)`);
        load();
      } else {
        showToast(res.message || 'Import failed', 'error');
      }
    } catch {
      showToast('Import failed', 'error');
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  };

  // Calculate counts
  const rmCount = products.filter(p => p.type === 'RM').length;
  const smCount = products.filter(p => p.type === 'SM').length;
  const fmCount = products.filter(p => p.type === 'FM').length;

  // Render RM Details Form
  const renderRMDetails = () => (
    <div className="prod-details-section">
      <h4>Raw Material Details</h4>
      <div className="prod-form-row">
        <div className="prod-form-group">
          <label>Category 1</label>
          <input type="text" placeholder="Category 1" value={form.rmDetails.category1}
            onChange={e => handleDetailChange('rm', 'category1', e.target.value)} />
        </div>
        <div className="prod-form-group">
          <label>Category 2</label>
          <input type="text" placeholder="Category 2" value={form.rmDetails.category2}
            onChange={e => handleDetailChange('rm', 'category2', e.target.value)} />
        </div>
      </div>

      <div className="prod-form-row">
        <div className="prod-form-group">
          <label>Category 3</label>
          <input type="text" placeholder="Category 3" value={form.rmDetails.category3}
            onChange={e => handleDetailChange('rm', 'category3', e.target.value)} />
        </div>
        <div className="prod-form-group">
          <label>Unit</label>
          <select value={form.rmDetails.unit} onChange={e => handleDetailChange('rm', 'unit', e.target.value)}>
            <option value="">Select Unit</option>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <div className="prod-form-row">
        <div className="prod-form-group">
          <label>Bunch Category</label>
          <select value={form.rmDetails.bunchCat} onChange={e => handleDetailChange('rm', 'bunchCat', e.target.value)}>
            <option value="">Select Bunch Cat</option>
            {BUNCH_CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="prod-form-group">
          <label>No Check Make Qty</label>
          <input type="number" placeholder="0" value={form.rmDetails.noCheckMakeQty}
            onChange={e => handleDetailChange('rm', 'noCheckMakeQty', e.target.value)} />
        </div>
      </div>

      <div className="prod-form-row">
        <div className="prod-form-group">
          <label>Min Quantity</label>
          <input type="number" placeholder="0" value={form.rmDetails.minQty}
            onChange={e => handleDetailChange('rm', 'minQty', e.target.value)} />
        </div>
        <div className="prod-form-group">
          <label>Max Quantity</label>
          <input type="number" placeholder="0" value={form.rmDetails.maxQty}
            onChange={e => handleDetailChange('rm', 'maxQty', e.target.value)} />
        </div>
      </div>

      <div className="prod-form-row">
        <div className="prod-form-group">
          <label>Master Price</label>
          <input type="number" placeholder="0" value={form.rmDetails.masterPrice}
            onChange={e => handleDetailChange('rm', 'masterPrice', e.target.value)} />
        </div>
        <div className="prod-form-group">
          <label>Category 4</label>
          <input type="text" placeholder="Category 4" value={form.rmDetails.category4}
            onChange={e => handleDetailChange('rm', 'category4', e.target.value)} />
        </div>
      </div>

      <div className="prod-form-row">
        <div className="prod-form-group">
          <label>Category 5</label>
          <input type="text" placeholder="Category 5" value={form.rmDetails.category5}
            onChange={e => handleDetailChange('rm', 'category5', e.target.value)} />
        </div>
        <div className="prod-form-group">
          <label>Import 1</label>
          <input type="text" placeholder="Import 1" value={form.rmDetails.imp1}
            onChange={e => handleDetailChange('rm', 'imp1', e.target.value)} />
        </div>
      </div>

      <div className="prod-form-group full">
        <label>Import 2</label>
        <input type="text" placeholder="Import 2" value={form.rmDetails.imp2}
          onChange={e => handleDetailChange('rm', 'imp2', e.target.value)} />
      </div>
    </div>
  );

  // Render SM Details Form
  const renderSMDetails = () => (
    <div className="prod-details-section">
      <h4>Semi-Finished Goods Details</h4>
      <div className="prod-form-row">
        <div className="prod-form-group">
          <label>Category 1</label>
          <input type="text" placeholder="Category 1" value={form.smDetails.category1}
            onChange={e => handleDetailChange('sm', 'category1', e.target.value)} />
        </div>
        <div className="prod-form-group">
          <label>Category 2</label>
          <input type="text" placeholder="Category 2" value={form.smDetails.category2}
            onChange={e => handleDetailChange('sm', 'category2', e.target.value)} />
        </div>
      </div>

      <div className="prod-form-row">
        <div className="prod-form-group">
          <label>Category 3</label>
          <input type="text" placeholder="Category 3" value={form.smDetails.category3}
            onChange={e => handleDetailChange('sm', 'category3', e.target.value)} />
        </div>
        <div className="prod-form-group">
          <label>Category 4</label>
          <input type="text" placeholder="Category 4" value={form.smDetails.category4}
            onChange={e => handleDetailChange('sm', 'category4', e.target.value)} />
        </div>
      </div>

      <div className="prod-form-row">
        <div className="prod-form-group">
          <label>Category 5</label>
          <input type="text" placeholder="Category 5" value={form.smDetails.category5}
            onChange={e => handleDetailChange('sm', 'category5', e.target.value)} />
        </div>
        <div className="prod-form-group">
          <label>Min Quantity</label>
          <input type="number" placeholder="0" value={form.smDetails.minQty}
            onChange={e => handleDetailChange('sm', 'minQty', e.target.value)} />
        </div>
      </div>

      <div className="prod-form-group full">
        <label>Max Quantity</label>
        <input type="number" placeholder="0" value={form.smDetails.maxQty}
          onChange={e => handleDetailChange('sm', 'maxQty', e.target.value)} />
      </div>
    </div>
  );

  // Render FM Details Form
  const renderFMDetails = () => (
    <div className="prod-details-section">
      <h4>Finished Goods Details</h4>
      <div className="prod-form-row">
        <div className="prod-form-group">
          <label>Category 1</label>
          <input type="text" placeholder="Category 1" value={form.fmDetails.category1}
            onChange={e => handleDetailChange('fm', 'category1', e.target.value)} />
        </div>
        <div className="prod-form-group">
          <label>Category 2</label>
          <input type="text" placeholder="Category 2" value={form.fmDetails.category2}
            onChange={e => handleDetailChange('fm', 'category2', e.target.value)} />
        </div>
      </div>

      <div className="prod-form-row">
        <div className="prod-form-group">
          <label>Category 3</label>
          <input type="text" placeholder="Category 3" value={form.fmDetails.category3}
            onChange={e => handleDetailChange('fm', 'category3', e.target.value)} />
        </div>
        <div className="prod-form-group">
          <label>Brand Name</label>
          <select value={form.fmDetails.brandName} onChange={e => handleDetailChange('fm', 'brandName', e.target.value)}>
            <option value="">Select Brand</option>
            {BRAND_NAMES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div className="prod-form-row">
        <div className="prod-form-group">
          <label>Min Quantity</label>
          <input type="number" placeholder="0" value={form.fmDetails.minQty}
            onChange={e => handleDetailChange('fm', 'minQty', e.target.value)} />
        </div>
        <div className="prod-form-group">
          <label>Reorder Quantity</label>
          <input type="number" placeholder="0" value={form.fmDetails.reOrderQty}
            onChange={e => handleDetailChange('fm', 'reOrderQty', e.target.value)} />
        </div>
      </div>

      <div className="prod-form-row">
        <div className="prod-form-group">
          <label>Weight Per Box</label>
          <input type="number" placeholder="0" value={form.fmDetails.weightPerBox}
            onChange={e => handleDetailChange('fm', 'weightPerBox', e.target.value)} />
        </div>
        <div className="prod-form-group">
          <label>Quantity Per Box</label>
          <input type="number" placeholder="0" value={form.fmDetails.qtyPerBox}
            onChange={e => handleDetailChange('fm', 'qtyPerBox', e.target.value)} />
        </div>
      </div>

      <div className="prod-form-row">
        <div className="prod-form-group">
          <label>Master Price</label>
          <input type="number" placeholder="0" value={form.fmDetails.masterPrice}
            onChange={e => handleDetailChange('fm', 'masterPrice', e.target.value)} />
        </div>
        <div className="prod-form-group">
          <label>Purchase Master Price</label>
          <input type="number" placeholder="0" value={form.fmDetails.pMasterPrice}
            onChange={e => handleDetailChange('fm', 'pMasterPrice', e.target.value)} />
        </div>
      </div>

      <div className="prod-form-row">
        <div className="prod-form-group">
          <label>Scrap FG Category</label>
          <input type="text" placeholder="Scrap Category" value={form.fmDetails.scrapFgCat}
            onChange={e => handleDetailChange('fm', 'scrapFgCat', e.target.value)} />
        </div>
        <div className="prod-form-group">
          <label>Category 4</label>
          <input type="text" placeholder="Category 4" value={form.fmDetails.cat4}
            onChange={e => handleDetailChange('fm', 'cat4', e.target.value)} />
        </div>
      </div>

      <div className="prod-form-row">
        <div className="prod-form-group">
          <label>Category 5</label>
          <input type="text" placeholder="Category 5" value={form.fmDetails.cat5}
            onChange={e => handleDetailChange('fm', 'cat5', e.target.value)} />
        </div>
        <div className="prod-form-group">
          <label>FG Weight</label>
          <input type="text" placeholder="e.g. 500g" value={form.fmDetails.fgWeight}
            onChange={e => handleDetailChange('fm', 'fgWeight', e.target.value)} />
        </div>
      </div>

      <div className="prod-form-group full">
        <label>FG Cost</label>
        <input type="number" placeholder="0" value={form.fmDetails.fgCost}
          onChange={e => handleDetailChange('fm', 'fgCost', e.target.value)} />
      </div>
    </div>
  );

  return (
    <div className="prod-page">
      {toast && (
        <div className={`prod-toast prod-toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="prod-header">
        <div>
          <h2>Product Management</h2>
          <p>Manage Raw Materials (RM), Semi-Finished (SM), and Finished Goods (FM)</p>
        </div>
        <div className="prod-header-actions">

          {/* ✅ TEMPLATE GROUP */}
          <div className="prod-export-group">
            <button onClick={() => downloadProductTemplate('RM')} className="prod-btn-outline prod-export-rm">
              Template RM
            </button>
            <button onClick={() => downloadProductTemplate('SM')} className="prod-btn-outline prod-export-sm">
              Template SM
            </button>
            <button onClick={() => downloadProductTemplate('FM')} className="prod-btn-outline prod-export-fm">
              Template FM
            </button>
          </div>

          {/* ✅ IMPORT GROUP */}
          <div className="prod-export-group">

            {/* RM */}
            <label className="prod-btn-outline prod-export-rm">
              Import RM
              <input
                type="file"
                hidden
                accept=".xlsx,.xls"
                onChange={(e) => handleImport(e, 'RM')}
              />
            </label>

            {/* SM */}
            <label className="prod-btn-outline prod-export-sm">
              Import SM
              <input
                type="file"
                hidden
                accept=".xlsx,.xls"
                onChange={(e) => handleImport(e, 'SM')}
              />
            </label>

            {/* FM */}
            <label className="prod-btn-outline prod-export-fm">
              Import FM
              <input
                type="file"
                hidden
                accept=".xlsx,.xls"
                onChange={(e) => handleImport(e, 'FM')}
              />
            </label>

          </div>

          {/* ✅ EXPORT GROUP */}
          <div className="prod-export-group">
            <button onClick={() => exportProductsExcel('RM')} className="prod-btn-outline prod-export-rm">
              Export RM
            </button>
            <button onClick={() => exportProductsExcel('SM')} className="prod-btn-outline prod-export-sm">
              Export SM
            </button>
            <button onClick={() => exportProductsExcel('FM')} className="prod-btn-outline prod-export-fm">
              Export FM
            </button>
          </div>

          {/* ✅ ADD BUTTON */}
          <button className="prod-btn-primary" onClick={() => handleOpenForm()}>
            Add Product
          </button>

        </div>
      </div>

      {/* Stats */}
      <div className="prod-stats">
        <div className="prod-stat-card prod-stat-all">
          <div className="prod-stat-icon">📦</div>
          <div>
            <div className="prod-stat-num">{products.length}</div>
            <div className="prod-stat-label">Total Products</div>
          </div>
        </div>
        <div className="prod-stat-card prod-stat-rm">
          <div className="prod-stat-icon">🌿</div>
          <div>
            <div className="prod-stat-num">{rmCount}</div>
            <div className="prod-stat-label">Raw Materials</div>
          </div>
        </div>
        <div className="prod-stat-card prod-stat-sm">
          <div className="prod-stat-icon">⚙️</div>
          <div>
            <div className="prod-stat-num">{smCount}</div>
            <div className="prod-stat-label">Semi-Finished</div>
          </div>
        </div>
        <div className="prod-stat-card prod-stat-fm">
          <div className="prod-stat-icon">✅</div>
          <div>
            <div className="prod-stat-num">{fmCount}</div>
            <div className="prod-stat-label">Finished Goods</div>
          </div>
        </div>
        <div className="prod-stat-card prod-stat-active">
          <div className="prod-stat-icon">🟢</div>
          <div>
            <div className="prod-stat-num">{products.filter(p => p.status === 'Active').length}</div>
            <div className="prod-stat-label">Active</div>
          </div>
        </div>
      </div>

      {/* Type Tabs */}
      <div className="prod-tabs">
        {[
          { key: '', label: 'All Products', className: '' },
          { key: 'RM', label: '🌿 Raw Materials', className: 'rm' },
          { key: 'SM', label: '⚙️ Semi-Finished', className: 'sm' },
          { key: 'FM', label: '✅ Finished Goods', className: 'fm' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`prod-tab ${filterType === tab.key ? 'active' : ''} ${tab.className}`}
            onClick={() => setFilterType(tab.key)}>
            {tab.label}
            {/* <span className="prod-tab-count">{tab.count}</span> */}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="prod-search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, code, or HSN..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button className="prod-search-clear" onClick={() => setSearch('')}>✕</button>}
      </div>

      {/* Table */}
      <div className="prod-card">
        <div className="prod-table-header">
          <h3>Products List ({products.length})</h3>
          {loading && <span className="prod-loading-text">Loading...</span>}
        </div>

        {products.length === 0 && !loading ? (
          <div className="prod-empty">
            <div className="prod-empty-icon">📦</div>
            <p>No products found. Add your first product or import from Excel.</p>
            <button className="prod-btn-primary" onClick={() => handleOpenForm()}>
              Add Product
            </button>
          </div>
        ) : (
          <div className="prod-table-wrap">
            <table className="prod-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product Name</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>HSN</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={p._id}>
                    <td className="prod-num">{i + 1}</td>
                    <td className="prod-name-cell">
                      <div className={`prod-type-dot ${p.type.toLowerCase()}`} />
                      <span>{p.name}</span>
                    </td>
                    <td className="prod-code">{p.code || '—'}</td>
                    <td>
                      <span className={`prod-type-badge ${p.type.toLowerCase()}`}>
                        {p.type}
                      </span>
                    </td>
                    <td>{p.hsn || '—'}</td>
                    <td className="prod-price">
                      {p.price ? `₹${Number(p.price).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td>
                      <span className={`prod-status-badge ${p.status.toLowerCase()}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="prod-actions">
                      <button
                        className="prod-action edit"
                        onClick={() => handleOpenForm(p)}
                        title="Edit"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="prod-action delete"
                        onClick={() => handleDelete(p._id)}
                        title="Delete"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="prod-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="prod-modal prod-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="prod-modal-header">
              <h3>{editProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="prod-modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>

            {/* Modal Tabs */}
            <div className="prod-modal-tabs">
              <button
                className={`prod-modal-tab ${activeTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                Basic Info
              </button>
              <button
                className={`prod-modal-tab ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
                disabled={!form.type}
              >
                {form.type === 'RM' ? 'Raw Material Details' :
                  form.type === 'SM' ? 'Semi-Finished Details' :
                    form.type === 'FM' ? 'Finished Goods Details' : 'Type Details'}
              </button>
            </div>

            <div className="prod-modal-body">
              {activeTab === 'basic' ? (
                <>
                  {/* Type selector */}
                  {!editProduct && <div className="prod-type-selector">
                    <label>Product Type <span className="req">*</span></label>
                    <div className="prod-type-toggle">
                      <button
                        type="button"
                        className={`prod-type-btn rm ${form.type === 'RM' ? 'active' : ''}`}
                        onClick={() => {
                          setForm({ ...emptyForm, type: 'RM' });
                          setActiveTab('details');
                        }}>
                        🌿 Raw Material (RM)
                      </button>
                      <button
                        type="button"
                        className={`prod-type-btn sm ${form.type === 'SM' ? 'active' : ''}`}
                        onClick={() => {
                          setForm({ ...emptyForm, type: 'SM' });
                          setActiveTab('details');
                        }}>
                        ⚙️ Semi-Finished (SM)
                      </button>
                      <button
                        type="button"
                        className={`prod-type-btn fm ${form.type === 'FM' ? 'active' : ''}`}
                        onClick={() => {
                          setForm({ ...emptyForm, type: 'FM' });
                          setActiveTab('details');
                        }}>
                        ✅ Finished Good (FM)
                      </button>
                    </div>
                  </div>}

                  <div className="prod-form-row">
                    <div className="prod-form-group">
                      <label>Product Name <span className="req">*</span></label>
                      <input
                        type="text"
                        placeholder="Enter product name"
                        value={form.name}
                        onChange={e => handleInputChange('name', e.target.value)}
                      />
                    </div>
                    <div className="prod-form-group">
                      <label>Product Code</label>
                      <input
                        type="text"
                        placeholder="e.g. P001"
                        value={form.code}
                        onChange={e => handleInputChange('code', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="prod-form-row">
                    <div className="prod-form-group">
                      <label>HSN Code</label>
                      <input
                        type="text"
                        placeholder="HSN/SAC code"
                        value={form.hsn}
                        onChange={e => handleInputChange('hsn', e.target.value)}
                      />
                    </div>
                    <div className="prod-form-group">
                      <label>Price (₹)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        min="0"
                        value={form.price}
                        onChange={e => handleInputChange('price', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="prod-form-group full">
                    <label>Image URL</label>
                    <input
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      value={form.image}
                      onChange={e => handleInputChange('image', e.target.value)}
                    />
                  </div>

                  <div className="prod-form-group full">
                    <label>Status</label>
                    <select value={form.status} onChange={e => handleInputChange('status', e.target.value)}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {form.type === 'RM' && renderRMDetails()}
                  {form.type === 'SM' && renderSMDetails()}
                  {form.type === 'FM' && renderFMDetails()}
                </>
              )}
            </div>

            <div className="prod-modal-footer">
              <button
                className="prod-btn-ghost"
                onClick={() => {
                  if (activeTab === 'details' && form.type) {
                    setActiveTab('basic');
                  } else {
                    setShowForm(false);
                  }
                }}>
                {activeTab === 'details' && form.type ? 'Back' : 'Cancel'}
              </button>

              {activeTab === 'basic' ? (
                <button
                  className="prod-btn-primary"
                  onClick={() => setActiveTab('details')}
                  disabled={!form.type}>
                  Next: Details →
                </button>
              ) : (
                <button
                  className="prod-btn-primary"
                  onClick={handleSave}
                  disabled={saving || !form.name}>
                  {saving && <span className="prod-spinner" />}
                  {saving ? 'Saving...' : editProduct ? 'Update Product' : 'Add Product'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
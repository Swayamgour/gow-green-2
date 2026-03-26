import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchCustomers, createCustomer, updateCustomer, deleteCustomer,
  addCustomerNote, exportCustomersExcel, downloadCustomerTemplate, importCustomersExcel
} from '../services/Customer.service';
import './Customers.css';

const CATEGORIES = ['new', 'routine', 'closed'];
const SOURCES = ['Website', 'Referral', 'Social Media', 'Cold Call', 'Email Campaign', 'Exhibition', 'Other'];

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [viewCustomer, setViewCustomer] = useState(null);
  const [toast, setToast] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'address', 'owner', 'account', 'store', 'gst', 'bank', 'shipping'

  const [dateFilter, setDateFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const fileInputRef = useRef();

  const [form, setForm] = useState({
    // Basic Information
    name: '',
    tp: '',
    code: '',
    gstin: '',
    pname: '',
    source: '',

    // Address Fields
    add1: '',
    add2: '',
    city: '',
    pin: '',

    // Owner Information
    oname: '',
    omobile: '',
    ophone: '',
    oemail: '',

    // Account Information
    amobile: '',
    aphone: '',
    aemail: '',

    // Store Information
    smobile: '',
    sphone: '',
    semail: '',

    // State Information
    stname: '',
    stcode: '',

    // Tax Information
    panno: '',
    margin: 0,

    // Billing Address Details
    billadd: '',
    despadd: '',
    billadd2: '',
    billadd3: '',
    despadd2: '',
    despadd3: '',

    // GST Information
    gstnbill: '',
    gstnship: '',

    // Agent Information
    agentid: '',
    svrpost: '',
    grp: '',

    // Bank Details
    accno: '',
    benif_name: '',
    bankname: '',
    branchname: '',
    branchadd: '',
    ifsc_code: '',

    // Job Work
    jobwork: '',
    active: 'Y',
    sman_id: '',

    // Shipping Details
    shippanno: '',
    state: '',
    disp_statename: '',
    disp_statecode: '',
    disp_pin: '',

    // Additional Fields
    freight: 0,
    shippingname: '',
    conperson: '',
    smanid: '',
    salemanname: '',
    activeyn: 'Y'
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};

      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;

      if (dateFilter === "today") {
        params.date = "today";
      }

      if (dateFilter === "yesterday") {
        params.date = "yesterday";
      }

      if (dateFilter === "custom") {
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
      }

      const res = await fetchCustomers(params);
      setCustomers(res.data || []);

      if (filterCategory || search) {
        const allRes = await fetchCustomers({});
        setAllCustomers(allRes.data || []);
      } else {
        setAllCustomers(res.data || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory, dateFilter, fromDate, toDate]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => setForm({
    name: '',
    tp: '',
    code: '',
    gstin: '',
    pname: '',
    source: '',
    add1: '',
    add2: '',
    city: '',
    pin: '',
    oname: '',
    omobile: '',
    ophone: '',
    oemail: '',
    amobile: '',
    aphone: '',
    aemail: '',
    smobile: '',
    sphone: '',
    semail: '',
    stname: '',
    stcode: '',
    panno: '',
    margin: 0,
    billadd: '',
    despadd: '',
    billadd2: '',
    billadd3: '',
    despadd2: '',
    despadd3: '',
    gstnbill: '',
    gstnship: '',
    agentid: '',
    svrpost: '',
    grp: '',
    accno: '',
    benif_name: '',
    bankname: '',
    branchname: '',
    branchadd: '',
    ifsc_code: '',
    jobwork: '',
    active: 'Y',
    sman_id: '',
    shippanno: '',
    state: '',
    disp_statename: '',
    disp_statecode: '',
    disp_pin: '',
    freight: 0,
    shippingname: '',
    conperson: '',
    smanid: '',
    salemanname: '',
    activeyn: 'Y'
  });

  const handleOpenForm = (customer = null) => {
    if (customer) {
      setEditCustomer(customer);
      setForm({
        name: customer.name || '',
        tp: customer.tp || '',
        code: customer.code || '',
        gstin: customer.gstin || '',
        pname: customer.pname || '',
        source: customer.source || '',
        add1: customer.add1 || '',
        add2: customer.add2 || '',
        city: customer.city || '',
        pin: customer.pin || '',
        oname: customer.oname || '',
        omobile: customer.omobile || '',
        ophone: customer.ophone || '',
        oemail: customer.oemail || '',
        amobile: customer.amobile || '',
        aphone: customer.aphone || '',
        aemail: customer.aemail || '',
        smobile: customer.smobile || '',
        sphone: customer.sphone || '',
        semail: customer.semail || '',
        stname: customer.stname || '',
        stcode: customer.stcode || '',
        panno: customer.panno || '',
        margin: customer.margin || 0,
        billadd: customer.billadd || '',
        despadd: customer.despadd || '',
        billadd2: customer.billadd2 || '',
        billadd3: customer.billadd3 || '',
        despadd2: customer.despadd2 || '',
        despadd3: customer.despadd3 || '',
        gstnbill: customer.gstnbill || '',
        gstnship: customer.gstnship || '',
        agentid: customer.agentid || '',
        svrpost: customer.svrpost || '',
        grp: customer.grp || '',
        accno: customer.accno || '',
        benif_name: customer.benif_name || '',
        bankname: customer.bankname || '',
        branchname: customer.branchname || '',
        branchadd: customer.branchadd || '',
        ifsc_code: customer.ifsc_code || '',
        jobwork: customer.jobwork || '',
        active: customer.active || 'Y',
        sman_id: customer.sman_id || '',
        shippanno: customer.shippanno || '',
        state: customer.state || '',
        disp_statename: customer.disp_statename || '',
        disp_statecode: customer.disp_statecode || '',
        disp_pin: customer.disp_pin || '',
        freight: customer.freight || 0,
        shippingname: customer.shippingname || '',
        conperson: customer.conperson || '',
        smanid: customer.smanid || '',
        salemanname: customer.salemanname || '',
        activeyn: customer.activeyn || 'Y'
      });
    } else {
      setEditCustomer(null);
      resetForm();
    }
    setShowForm(true);
    setActiveTab('basic');
  };

  const handleSave = async () => {
    if (!form.name || form.name.trim().length < 2)
      return showToast('Name must be at least 2 characters', 'error');

    // Validate mobile number if provided
    if (form.omobile && !/^[0-9]{10}$/.test(form.omobile))
      return showToast('Owner mobile must be exactly 10 digits', 'error');

    setSaving(true);
    try {
      if (editCustomer) {
        await updateCustomer(editCustomer._id, form);
        showToast('Customer updated');
      } else {
        await createCustomer(form);
        showToast('Customer added');
      }
      setShowForm(false);
      resetForm();
      setEditCustomer(null);
      load();
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await deleteCustomer(id);
      showToast('Customer deleted');
      load();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setNoteLoading(true);
    try {
      const res = await addCustomerNote(viewCustomer._id, newNote.trim());
      setViewCustomer(res.data);
      setNewNote('');
      showToast('Note added');
      load();
    } catch (err) {
      showToast(err.message || 'Failed to add note', 'error');
    } finally {
      setNoteLoading(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportLoading(true);
    try {
      const res = await importCustomersExcel(file);
      if (res.success) {
        showToast(`${res.imported} customers imported`);
        load();
      } else {
        showToast(res.message || 'Import failed', 'error');
      }
    } catch (err) {
      showToast('Import failed', 'error');
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  };

  const handleExport = (e) => {
    if (e) e.preventDefault();
    const params = {};
    if (search) params.search = search;
    if (filterCategory) params.category = filterCategory;
    if (dateFilter === "today") params.date = "today";
    if (dateFilter === "yesterday") params.date = "yesterday";
    if (dateFilter === "custom") {
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
    }
    exportCustomersExcel(params);
  };

  const catCounts = {
    all: allCustomers.length,
    new: allCustomers.filter(c => c.category === 'new').length,
    routine: allCustomers.filter(c => c.category === 'routine').length,
    closed: allCustomers.filter(c => c.category === 'closed').length,
  };

  // Render form fields based on active tab
  const renderFormFields = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <>
            <div className="cust-form-row">
              <div className="cust-form-group">
                <label>Name <span className="req">*</span></label>
                <input type="text" placeholder="Customer name" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="cust-form-group">
                <label>Company Name</label>
                <input type="text" placeholder="Company name" value={form.pname}
                  onChange={e => setForm({ ...form, pname: e.target.value })} />
              </div>
            </div>
            <div className="cust-form-row">
              <div className="cust-form-group">
                <label>Phone/TP</label>
                <input type="tel" placeholder="Phone number" value={form.tp}
                  onChange={e => setForm({ ...form, tp: e.target.value })} />
              </div>
              <div className="cust-form-group">
                <label>Code</label>
                <input type="text" placeholder="Customer code" value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })} />
              </div>
            </div>
            <div className="cust-form-row">
              <div className="cust-form-group">
                <label>GSTIN</label>
                <input type="text" placeholder="GSTIN number" value={form.gstin}
                  onChange={e => setForm({ ...form, gstin: e.target.value })} />
              </div>
              <div className="cust-form-group">
                <label>Source</label>
                <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                  <option value="">Select Source</option>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="cust-form-row">
              <div className="cust-form-group">
                <label>PAN Number</label>
                <input type="text" placeholder="PAN number" value={form.panno}
                  onChange={e => setForm({ ...form, panno: e.target.value })} />
              </div>
              <div className="cust-form-group">
                <label>Margin (%)</label>
                <input type="number" placeholder="Margin percentage" value={form.margin}
                  onChange={e => setForm({ ...form, margin: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          </>
        );

      case 'address':
        return (
          <>
            <div className="cust-form-group full">
              <label>Address Line 1</label>
              <input type="text" placeholder="Address line 1" value={form.add1}
                onChange={e => setForm({ ...form, add1: e.target.value })} />
            </div>
            <div className="cust-form-group full">
              <label>Address Line 2</label>
              <input type="text" placeholder="Address line 2" value={form.add2}
                onChange={e => setForm({ ...form, add2: e.target.value })} />
            </div>
            <div className="cust-form-row">
              <div className="cust-form-group">
                <label>City</label>
                <input type="text" placeholder="City" value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="cust-form-group">
                <label>PIN Code</label>
                <input type="text" placeholder="PIN code" value={form.pin}
                  onChange={e => setForm({ ...form, pin: e.target.value })} />
              </div>
            </div>
            <div className="cust-form-row">
              <div className="cust-form-group">
                <label>State Name</label>
                <input type="text" placeholder="State name" value={form.stname}
                  onChange={e => setForm({ ...form, stname: e.target.value })} />
              </div>
              <div className="cust-form-group">
                <label>State Code</label>
                <input type="text" placeholder="State code" value={form.stcode}
                  onChange={e => setForm({ ...form, stcode: e.target.value })} />
              </div>
            </div>
          </>
        );

      case 'owner':
        return (
          <>
            <div className="cust-form-row">
              <div className="cust-form-group">
                <label>Owner Name</label>
                <input type="text" placeholder="Owner name" value={form.oname}
                  onChange={e => setForm({ ...form, oname: e.target.value })} />
              </div>
              <div className="cust-form-group">
                <label>Owner Mobile</label>
                <input type="tel" placeholder="10-digit mobile" value={form.omobile}
                  onChange={e => setForm({ ...form, omobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
              </div>
            </div>
            <div className="cust-form-row">
              <div className="cust-form-group">
                <label>Owner Phone</label>
                <input type="tel" placeholder="Phone number" value={form.ophone}
                  onChange={e => setForm({ ...form, ophone: e.target.value })} />
              </div>
              <div className="cust-form-group">
                <label>Owner Email</label>
                <input type="email" placeholder="Email address" value={form.oemail}
                  onChange={e => setForm({ ...form, oemail: e.target.value })} />
              </div>
            </div>
          </>
        );

      case 'account':
        return (
          <>
            <div className="cust-form-row">
              <div className="cust-form-group">
                <label>Account Mobile</label>
                <input type="tel" placeholder="Mobile number" value={form.amobile}
                  onChange={e => setForm({ ...form, amobile: e.target.value })} />
              </div>
              <div className="cust-form-group">
                <label>Account Phone</label>
                <input type="tel" placeholder="Phone number" value={form.aphone}
                  onChange={e => setForm({ ...form, aphone: e.target.value })} />
              </div>
            </div>
            <div className="cust-form-group full">
              <label>Account Email</label>
              <input type="email" placeholder="Email address" value={form.aemail}
                onChange={e => setForm({ ...form, aemail: e.target.value })} />
            </div>
          </>
        );

      case 'store':
        return (
          <>
            <div className="cust-form-row">
              <div className="cust-form-group">
                <label>Store Mobile</label>
                <input type="tel" placeholder="Mobile number" value={form.smobile}
                  onChange={e => setForm({ ...form, smobile: e.target.value })} />
              </div>
              <div className="cust-form-group">
                <label>Store Phone</label>
                <input type="tel" placeholder="Phone number" value={form.sphone}
                  onChange={e => setForm({ ...form, sphone: e.target.value })} />
              </div>
            </div>
            <div className="cust-form-group full">
              <label>Store Email</label>
              <input type="email" placeholder="Email address" value={form.semail}
                onChange={e => setForm({ ...form, semail: e.target.value })} />
            </div>
          </>
        );

      case 'gst':
        return (
          <>
            <div className="cust-form-group full">
              <label>Billing Address</label>
              <textarea rows={2} placeholder="Billing address" value={form.billadd}
                onChange={e => setForm({ ...form, billadd: e.target.value })} />
            </div>
            <div className="cust-form-group full">
              <label>Billing Address Line 2</label>
              <input type="text" placeholder="Billing address line 2" value={form.billadd2}
                onChange={e => setForm({ ...form, billadd2: e.target.value })} />
            </div>
            <div className="cust-form-group full">
              <label>Billing Address Line 3</label>
              <input type="text" placeholder="Billing address line 3" value={form.billadd3}
                onChange={e => setForm({ ...form, billadd3: e.target.value })} />
            </div>
            <div className="cust-form-group full">
              <label>GSTIN (Billing)</label>
              <input type="text" placeholder="GSTIN for billing" value={form.gstnbill}
                onChange={e => setForm({ ...form, gstnbill: e.target.value })} />
            </div>
            <div className="cust-form-group full">
              <label>GSTIN (Shipping)</label>
              <input type="text" placeholder="GSTIN for shipping" value={form.gstnship}
                onChange={e => setForm({ ...form, gstnship: e.target.value })} />
            </div>
          </>
        );

      case 'bank':
        return (
          <>
            <div className="cust-form-group full">
              <label>Account Number</label>
              <input type="text" placeholder="Bank account number" value={form.accno}
                onChange={e => setForm({ ...form, accno: e.target.value })} />
            </div>
            <div className="cust-form-group full">
              <label>Beneficiary Name</label>
              <input type="text" placeholder="Beneficiary name" value={form.benif_name}
                onChange={e => setForm({ ...form, benif_name: e.target.value })} />
            </div>
            <div className="cust-form-row">
              <div className="cust-form-group">
                <label>Bank Name</label>
                <input type="text" placeholder="Bank name" value={form.bankname}
                  onChange={e => setForm({ ...form, bankname: e.target.value })} />
              </div>
              <div className="cust-form-group">
                <label>Branch Name</label>
                <input type="text" placeholder="Branch name" value={form.branchname}
                  onChange={e => setForm({ ...form, branchname: e.target.value })} />
              </div>
            </div>
            <div className="cust-form-group full">
              <label>Branch Address</label>
              <input type="text" placeholder="Branch address" value={form.branchadd}
                onChange={e => setForm({ ...form, branchadd: e.target.value })} />
            </div>
            <div className="cust-form-group full">
              <label>IFSC Code</label>
              <input type="text" placeholder="IFSC code" value={form.ifsc_code}
                onChange={e => setForm({ ...form, ifsc_code: e.target.value.toUpperCase() })} />
            </div>
          </>
        );

      case 'shipping':
        return (
          <>
            <div className="cust-form-group full">
              <label>Shipping Name</label>
              <input type="text" placeholder="Shipping name" value={form.shippingname}
                onChange={e => setForm({ ...form, shippingname: e.target.value })} />
            </div>
            <div className="cust-form-group full">
              <label>Dispatch Address</label>
              <textarea rows={2} placeholder="Dispatch address" value={form.despadd}
                onChange={e => setForm({ ...form, despadd: e.target.value })} />
            </div>
            <div className="cust-form-group full">
              <label>Dispatch Address Line 2</label>
              <input type="text" placeholder="Dispatch address line 2" value={form.despadd2}
                onChange={e => setForm({ ...form, despadd2: e.target.value })} />
            </div>
            <div className="cust-form-group full">
              <label>Dispatch Address Line 3</label>
              <input type="text" placeholder="Dispatch address line 3" value={form.despadd3}
                onChange={e => setForm({ ...form, despadd3: e.target.value })} />
            </div>
            <div className="cust-form-row">
              <div className="cust-form-group">
                <label>Dispatch State Name</label>
                <input type="text" placeholder="Dispatch state name" value={form.disp_statename}
                  onChange={e => setForm({ ...form, disp_statename: e.target.value })} />
              </div>
              <div className="cust-form-group">
                <label>Dispatch State Code</label>
                <input type="text" placeholder="Dispatch state code" value={form.disp_statecode}
                  onChange={e => setForm({ ...form, disp_statecode: e.target.value })} />
              </div>
            </div>
            <div className="cust-form-row">
              <div className="cust-form-group">
                <label>Dispatch PIN</label>
                <input type="text" placeholder="Dispatch PIN code" value={form.disp_pin}
                  onChange={e => setForm({ ...form, disp_pin: e.target.value })} />
              </div>
              <div className="cust-form-group">
                <label>Shipping PAN</label>
                <input type="text" placeholder="Shipping PAN number" value={form.shippanno}
                  onChange={e => setForm({ ...form, shippanno: e.target.value })} />
              </div>
            </div>
            <div className="cust-form-row">
              <div className="cust-form-group">
                <label>Contact Person</label>
                <input type="text" placeholder="Contact person" value={form.conperson}
                  onChange={e => setForm({ ...form, conperson: e.target.value })} />
              </div>
              <div className="cust-form-group">
                <label>Freight</label>
                <input type="number" placeholder="Freight charges" value={form.freight}
                  onChange={e => setForm({ ...form, freight: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="cust-page">
      {/* Toast */}
      {toast && (
        <div className={`cust-toast cust-toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="cust-header">
        <div>
          <h2>Customer Management</h2>
          <p>Manage all your customers — New, Routine & Closed</p>
        </div>
        <div className="cust-header-actions">
          <button className="cust-btn-outline" onClick={downloadCustomerTemplate} title="Download Excel Template">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Template
          </button>
          <label className={`cust-btn-outline ${importLoading ? 'loading' : ''}`}>
            {importLoading ? (
              <span className="cust-spinner" />
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            )}
            {importLoading ? 'Importing...' : 'Import Excel'}
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" hidden onChange={handleImport} />
          </label>
          <button className="cust-btn-outline" onClick={handleExport}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Export Excel
          </button>
          <button className="cust-btn-primary" onClick={() => handleOpenForm()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Customer
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="cust-tabs">
        {[
          { key: '', label: 'All', count: catCounts.all, color: '#4f46e5' },
          { key: 'new', label: 'New', count: catCounts.new, color: '#0ea5e9' },
          { key: 'routine', label: 'Routine', count: catCounts.routine, color: '#22c55e' },
          { key: 'closed', label: 'Closed / Old', count: catCounts.closed, color: '#ef4444' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`cust-tab ${filterCategory === tab.key ? 'active' : ''}`}
            style={{ '--tab-color': tab.color }}
            onClick={() => setFilterCategory(tab.key)}>
            {tab.label}
            <span className="cust-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="cust-search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input
          type="text"
          placeholder="Search by name, company, phone or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button onClick={() => setSearch('')} className="cust-search-clear">✕</button>}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #ddd" }}
        >
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="custom">Between Dates</option>
        </select>

        {dateFilter === "custom" && (
          <>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ padding: "6px", borderRadius: "6px", border: "1px solid #ddd" }}
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ padding: "6px", borderRadius: "6px", border: "1px solid #ddd" }}
            />
          </>
        )}
      </div>

      {/* Table */}
      <div className="cust-card">
        <div className="cust-table-header">
          <h3>Customers ({customers.length})</h3>
          {loading && <span className="cust-loading">Loading...</span>}
        </div>
        {customers.length === 0 && !loading ? (
          <div className="cust-empty">
            <div className="cust-empty-icon">👥</div>
            <p>No customers found. Add your first customer or import from Excel.</p>
          </div>
        ) : (
          <div className="cust-table-wrap">
            <table className="cust-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Category</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={c._id}>
                    <td className="cust-num">{i + 1}</td>
                    <td className="cust-name-cell">
                      <div className="cust-avatar">{c.name?.[0]?.toUpperCase() || '?'}</div>
                      <span>{c.name}</span>
                    </td>
                    <td>{c.pname || '—'}</td>
                    <td>{c.omobile || c.tp || '—'}</td>
                    <td>{c.city || '—'}</td>
                    <td><span className={`cust-cat-badge cust-cat-${c.category}`}>{c.category || 'new'}</span></td>
                    <td>{c.source || '—'}</td>
                    <td><span className={`cust-status-badge ${c.activeyn === 'Y' ? 'active' : 'inactive'}`}>{c.activeyn === 'Y' ? 'Active' : 'Inactive'}</span></td>
                    <td className="cust-actions">
                      <button className="cust-action view" onClick={() => setViewCustomer(c)} title="View">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      </button>
                      <button className="cust-action edit" onClick={() => handleOpenForm(c)} title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button className="cust-action delete" onClick={() => handleDelete(c._id)} title="Delete">
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

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="cust-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="cust-modal cust-modal-large" onClick={e => e.stopPropagation()}>
            <div className="cust-modal-header">
              <h3>{editCustomer ? 'Edit Customer' : 'Add Customer'}</h3>
              <button className="cust-modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>

            {/* Tab Navigation */}
            <div className="cust-tab-nav">
              <button className={`cust-tab-btn ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>
                Basic Info
              </button>
              <button className={`cust-tab-btn ${activeTab === 'address' ? 'active' : ''}`} onClick={() => setActiveTab('address')}>
                Address
              </button>
              <button className={`cust-tab-btn ${activeTab === 'owner' ? 'active' : ''}`} onClick={() => setActiveTab('owner')}>
                Owner Info
              </button>
              <button className={`cust-tab-btn ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
                Account Info
              </button>
              <button className={`cust-tab-btn ${activeTab === 'store' ? 'active' : ''}`} onClick={() => setActiveTab('store')}>
                Store Info
              </button>
              <button className={`cust-tab-btn ${activeTab === 'gst' ? 'active' : ''}`} onClick={() => setActiveTab('gst')}>
                GST Details
              </button>
              <button className={`cust-tab-btn ${activeTab === 'bank' ? 'active' : ''}`} onClick={() => setActiveTab('bank')}>
                Bank Details
              </button>
              <button className={`cust-tab-btn ${activeTab === 'shipping' ? 'active' : ''}`} onClick={() => setActiveTab('shipping')}>
                Shipping
              </button>
            </div>

            <div className="cust-modal-body">
              {renderFormFields()}
            </div>

            <div className="cust-modal-footer">
              <button className="cust-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="cust-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="cust-spinner" /> : null}
                {saving ? 'Saving...' : editCustomer ? 'Update Customer' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewCustomer && (
        <div className="cust-modal-overlay" onClick={() => setViewCustomer(null)}>
          <div className="cust-modal cust-modal-view" onClick={e => e.stopPropagation()}>
            <div className="cust-modal-header">
              <div className="cust-view-title">
                <div className="cust-view-avatar">{viewCustomer.name?.[0]?.toUpperCase() || '?'}</div>
                <div>
                  <h3>{viewCustomer.name}</h3>
                  <p>{viewCustomer.pname || 'No company'}</p>
                </div>
              </div>
              <button className="cust-modal-close" onClick={() => setViewCustomer(null)}>✕</button>
            </div>

            <div className="cust-modal-body">
              {/* Details grid */}
              <div className="cust-detail-grid">
                <div className="cust-detail-item">
                  <span className="cust-detail-label">Phone/TP</span>
                  <span className="cust-detail-value">{viewCustomer.tp || '—'}</span>
                </div>
                <div className="cust-detail-item">
                  <span className="cust-detail-label">Code</span>
                  <span className="cust-detail-value">{viewCustomer.code || '—'}</span>
                </div>
                <div className="cust-detail-item">
                  <span className="cust-detail-label">GSTIN</span>
                  <span className="cust-detail-value">{viewCustomer.gstin || '—'}</span>
                </div>
                <div className="cust-detail-item">
                  <span className="cust-detail-label">Source</span>
                  <span className="cust-detail-value">{viewCustomer.source || '—'}</span>
                </div>
                <div className="cust-detail-item full">
                  <span className="cust-detail-label">Address</span>
                  <span className="cust-detail-value">{viewCustomer.add1 || '—'} {viewCustomer.add2 || ''}</span>
                </div>
                <div className="cust-detail-item">
                  <span className="cust-detail-label">City</span>
                  <span className="cust-detail-value">{viewCustomer.city || '—'}</span>
                </div>
                <div className="cust-detail-item">
                  <span className="cust-detail-label">PIN</span>
                  <span className="cust-detail-value">{viewCustomer.pin || '—'}</span>
                </div>
                <div className="cust-detail-item">
                  <span className="cust-detail-label">Owner</span>
                  <span className="cust-detail-value">{viewCustomer.oname || '—'}</span>
                </div>
                <div className="cust-detail-item">
                  <span className="cust-detail-label">Owner Mobile</span>
                  <span className="cust-detail-value">{viewCustomer.omobile || '—'}</span>
                </div>
              </div>

              {/* Notes */}
              <div className="cust-notes-section">
                <h4>Notes & History</h4>
                <div className="cust-notes-list">
                  {viewCustomer.notes?.length === 0 && (
                    <p className="cust-no-notes">No notes yet.</p>
                  )}
                  {[...(viewCustomer.notes || [])].reverse().map((note, i) => (
                    <div key={i} className="cust-note-item">
                      <p>{note.text}</p>
                      <span>{new Date(note.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
                <div className="cust-add-note">
                  <textarea
                    rows={2}
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                  />
                  <button className="cust-btn-primary" onClick={handleAddNote} disabled={noteLoading || !newNote.trim()}>
                    {noteLoading ? <span className="cust-spinner" /> : 'Add Note'}
                  </button>
                </div>
              </div>
            </div>

            <div className="cust-modal-footer">
              <button className="cust-btn-ghost" onClick={() => setViewCustomer(null)}>Close</button>
              <button className="cust-btn-primary" onClick={() => { setViewCustomer(null); handleOpenForm(viewCustomer); }}>
                Edit Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
const ExcelJS = require('exceljs');
const Lead = require('../models/Lead.model');
const Customer = require('../models/Customer.model');
const Product = require('../models/Product.model');
const Quotation = require('../models/Quotation.model');

// ─────────────────────────────────────────────
// 🔥 COMMON DATE FILTER FUNCTION
// ─────────────────────────────────────────────
const getDateFilter = (from, to, field = "createdAt") => {
  const filter = {};
  if (from || to) {
    filter[field] = {};
    if (from) filter[field].$gte = new Date(from);
    if (to) filter[field].$lte = new Date(to + "T23:59:59");
  }
  return filter;
};

// ─────────────────────────────────────────────
// ✅ LEADS REPORT
// ─────────────────────────────────────────────
const exportLeads = async (req, res) => {
  try {
    const { from, to, status, assignedTo } = req.query;

    const filter = {
      ...getDateFilter(from, to, "createdAt"),
    };

    if (status) filter.leadStatus = status;
    if (assignedTo) filter.assignedTo = assignedTo;

    const leads = await Lead.find(filter)
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: leads.length, data: leads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// ✅ CUSTOMER REPORT
// ─────────────────────────────────────────────
const exportCustomers = async (req, res) => {
  try {
    const { from, to, status } = req.query;

    const filter = {
      ...getDateFilter(from, to, "createdAt"),
    };

    if (status) filter.status = status;

    const customers = await Customer.find(filter)
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: customers.length, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// ✅ PRODUCT REPORT (IMPORTANT)
// ─────────────────────────────────────────────
const exportProducts = async (req, res) => {
  try {
    const { from, to, type } = req.query;

    // ⚠️ Product me createdAt tabhi kaam karega jab timestamps ho
    const filter = {
      ...getDateFilter(from, to, "createdAt"),
    };

    if (type) filter.type = type;

    const products = await Product.find(filter).sort({ createdAt: -1 });

    return res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// ✅ QUOTATION REPORT (FIXED)
// ─────────────────────────────────────────────
const exportQuotations = async (req, res) => {
  try {
    const { from, to, status } = req.query;

    // 🔥 IMPORTANT: field = date (NOT createdAt)
    const filter = {
      ...getDateFilter(from, to, "date"),
    };

    if (status) filter.status = status;

    const quotations = await Quotation.find(filter)
      .populate("preparedBy", "name")
      .sort({ date: -1 });

    return res.json({ success: true, count: quotations.length, data: quotations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// ✅ MASTER REPORT (ALL FIXED)
// ─────────────────────────────────────────────
const exportMaster = async (req, res) => {
  try {
    const { from, to } = req.query;

    const leadFilter = getDateFilter(from, to, "createdAt");
    const customerFilter = getDateFilter(from, to, "createdAt");
    const productFilter = getDateFilter(from, to, "createdAt");
    const quotationFilter = getDateFilter(from, to, "date"); // 🔥 FIX

    const [leads, customers, products, quotations] = await Promise.all([
      Lead.find(leadFilter),
      Customer.find(customerFilter),
      Product.find(productFilter),
      Quotation.find(quotationFilter),
    ]);

    return res.json({
      success: true,
      filters: { from, to },

      summary: {
        leads: leads.length,
        customers: customers.length,
        products: products.length,
        quotations: quotations.length,
      },

      data: {
        leads,
        customers,
        products,
        quotations,
      },
    });
    

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  exportLeads,
  exportCustomers,
  exportProducts,
  exportQuotations,
  exportMaster,
};
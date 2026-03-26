const Executive = require('../models/Executive.model');

const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  // Basic Information
  id: { type: Number, default: null },
  name: { type: String, required: true, trim: true },
  tp: { type: String, trim: true, default: '' },
  code: { type: String, trim: true, default: '' },
  gstin: { type: String, trim: true, default: '' },
  pname: { type: String, trim: true, default: '' },
  source: { type: String },

  // Address Fields
  add1: { type: String, trim: true, default: '' },
  add2: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  pin: { type: String, trim: true, default: '' },

  // Owner Information
  oname: { type: String, trim: true, default: '' },
  omobile: { type: String, trim: true, default: '' },
  ophone: { type: String, trim: true, default: '' },
  oemail: { type: String, trim: true, default: '' },

  // Account Information
  amobile: { type: String, trim: true, default: '' },
  aphone: { type: String, trim: true, default: '' },
  aemail: { type: String, trim: true, default: '' },

  // Store Information
  smobile: { type: String, trim: true, default: '' },
  sphone: { type: String, trim: true, default: '' },
  semail: { type: String, trim: true, default: '' },

  // State Information
  stname: { type: String, trim: true, default: '' },
  stcode: { type: String, trim: true, default: '' },

  // Tax Information
  panno: { type: String, trim: true, default: '' },
  margin: { type: Number, default: 0 },

  // Billing Address Details
  billadd: { type: String, trim: true, default: '' },
  despadd: { type: String, trim: true, default: '' },
  billadd2: { type: String, trim: true, default: '' },
  billadd3: { type: String, trim: true, default: '' },
  despadd2: { type: String, trim: true, default: '' },
  despadd3: { type: String, trim: true, default: '' },

  // GST Information
  gstnbill: { type: String, trim: true, default: '' },
  gstnship: { type: String, trim: true, default: '' },

  // Agent Information
  agentid: { type: String, trim: true, default: '' },
  svrpost: { type: String, trim: true, default: '' },
  grp: { type: String, trim: true, default: '' },

  // Bank Details
  accno: { type: String, trim: true, default: '' },
  benif_name: { type: String, trim: true, default: '' },
  bankname: { type: String, trim: true, default: '' },
  branchname: { type: String, trim: true, default: '' },
  branchadd: { type: String, trim: true, default: '' },
  ifsc_code: { type: String, trim: true, default: '' },

  // Job Work
  jobwork: { type: String, trim: true, default: '' },
  active: { type: String, trim: true, default: '' },
  sman_id: { type: String, trim: true, default: '' },

  // Shipping Details
  shippanno: { type: String, trim: true, default: '' },
  state: { type: String, trim: true, default: '' },
  disp_statename: { type: String, trim: true, default: '' },
  disp_statecode: { type: String, trim: true, default: '' },
  disp_pin: { type: String, trim: true, default: '' },

  // Additional Fields
  freight: { type: Number, default: 0 },
  shippingname: { type: String, trim: true, default: '' },
  conperson: { type: String, trim: true, default: '' },
  smanid: { type: String, trim: true, default: '' },
  salemanname: { type: String, trim: true, default: '' },
  activeyn: { type: String, trim: true, default: 'Y' },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Executive'
  }

}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
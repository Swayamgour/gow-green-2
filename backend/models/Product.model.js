const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

  // ✅ COMMON
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true, default: '' },

  type: {
    type: String,
    enum: ['RM', 'SM', 'FM'],
    required: true
  },

  hsn: { type: String, default: '' },
  image: { type: String, default: '' },
  price: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },

  // =========================
  // ✅ RM DETAILS
  // =========================
  rmDetails: {
    category1: String,
    category2: String,
    category3: String,

    unit: String,
    bunchCat: String,

    noCheckMakeQty: Number,
    minQty: Number,
    maxQty: Number,

    masterPrice: Number,

    category4: String,
    category5: String,

    imp1: String,
    imp2: String
  },

  // =========================
  // ✅ SM DETAILS (SFG)
  // =========================
  smDetails: {
    category1: String,
    category2: String,
    category3: String,
    category4: String,
    category5: String,

    minQty: Number,
    maxQty: Number
  },

  // =========================
  // ✅ FM DETAILS
  // =========================
  fmDetails: {
    category1: String,
    category2: String,
    category3: String,

    brandName: String,

    minQty: Number,
    reOrderQty: Number,

    weightPerBox: Number,
    qtyPerBox: Number,

    masterPrice: Number,
    pMasterPrice: Number,

    scrapFgCat: String,

    cat4: String,
    cat5: String,

    fgWeight: String,
    fgCost: Number
  }

}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
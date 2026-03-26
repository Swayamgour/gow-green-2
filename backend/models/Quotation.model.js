const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  srNo: { type: Number },
  description: { type: String, required: true },
  hsnCode: { type: String, default: '' },
  quantity: { type: Number, required: true, default: 1 },
  unit: { type: String, default: 'pcs' },
  rate: { type: Number, required: true, default: 0 },
  amount: { type: Number, required: true, default: 0 },
}, { _id: false });

const quotationSchema = new mongoose.Schema({
  quotationNo: { type: String, required: true, unique: true },
  series: { type: String, default: 'GG' },          // series prefix e.g. GG, QT
  date: { type: Date, default: Date.now },
  validTill: { type: Date, default: null },

  // Customer / party
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, trim: true, default: '' },
  customerEmail: { type: String, trim: true, default: '' },
  customerAddress: { type: String, trim: true, default: '' },
  customerGST: { type: String, trim: true, default: '' },

  // Line items
  items: [lineItemSchema],

  // Totals
  subtotal: { type: Number, default: 0 },
  discountType: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
  discountValue: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxType: { type: String, enum: ['none', 'gst', 'igst'], default: 'gst' },
  taxRate: { type: Number, default: 18 },
  taxAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },

  // Meta
  terms: { type: String, default: '' },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'], default: 'draft' },
  preparedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Executive', default: null },
  pdfPath: { type: String, default: '' },

  quotationNo: String,
  customerName: String,
  customerPhone: String,

}, { timestamps: true });

// Auto-generate quotation number before save
quotationSchema.pre('validate', async function (next) {
  if (!this.quotationNo) {
    const count = await mongoose.model('Quotation').countDocuments();
    const pad = String(count + 1).padStart(4, '0');
    this.quotationNo = `${this.series || 'GG'}-${pad}-${new Date().getFullYear()}`;
  }
  next();
});

module.exports = mongoose.model('Quotation', quotationSchema);
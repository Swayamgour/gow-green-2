const mongoose = require('mongoose');

const tdsSchema = new mongoose.Schema({
  productName:  { type: String, required: true, trim: true },
  productCode:  { type: String, trim: true, default: '' },
  category:     { type: String, trim: true, default: '' },   // e.g. Adhesives, Coatings
  version:      { type: String, required: true, trim: true }, // e.g. v1.0, v2.1
  description:  { type: String, trim: true, default: '' },

  // File info
  fileName:     { type: String, required: true },   // original file name
  storedName:   { type: String, required: true },   // uuid name on disk
  fileSize:     { type: Number, default: 0 },        // bytes
  mimeType:     { type: String, default: 'application/pdf' },

  // Visibility
  status:       { type: String, enum: ['active', 'archived'], default: 'active' },
  tags:         [{ type: String, trim: true }],

}, { timestamps: true });

module.exports = mongoose.model('TDS', tdsSchema);
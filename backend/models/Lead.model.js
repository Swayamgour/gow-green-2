const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const leadSchema = new mongoose.Schema({
  leadName:     { type: String, required: true, trim: true },
  phone:        { type: String, required: true, trim: true },
  email:        { type: String, trim: true, default: '' },
  company:      { type: String, trim: true, default: '' },
  leadSource:   { type: String, trim: true, default: '' },

  // Category: New = fresh enquiry, Routine = regular customer, Closed = inactive/old
  category: {
    type: String,
    enum: ['new', 'routine', 'closed'],
    default: 'new'
  },

  leadStatus: {
    type: String,
    enum: ['open', 'in-progress', 'won', 'lost', 'follow-up'],
    default: 'open'
  },

  assignedTo:    { type: mongoose.Schema.Types.ObjectId, ref: 'Executive', default: null },
  followUpDate:  { type: Date, default: null },
  expectedValue: { type: Number, default: 0 },
  remarks:       { type: String, trim: true, default: '' },

  // Notes with timestamps
  notes: [noteSchema],

  activityLog: [
    {
      action:    { type: String, required: true },
      details:   { type: String, default: '' },
      changedBy: { type: String, default: 'System' },
      timestamp: { type: Date,   default: Date.now },
    }
  ],

}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
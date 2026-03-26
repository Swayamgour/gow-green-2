const mongoose = require('mongoose');

const executiveSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
   phone: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
   password: { type: String, required: false, default: '' },
    avatar: {
      type: String,       // base64 string stored directly in DB
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Explicitly bind to the "executives" collection
module.exports = mongoose.model('Executive', executiveSchema, 'executives');
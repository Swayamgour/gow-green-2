const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const authUserSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['admin', 'executive'], required: true },
  isActive: { type: Boolean, default: true },
  plainPassword: { type: String, default: '' },
}, { timestamps: true });

// Hash password before save
authUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
authUserSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('AuthUser', authUserSchema);
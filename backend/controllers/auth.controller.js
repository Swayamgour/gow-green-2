const jwt      = require('jsonwebtoken');
const AuthUser = require('../models/AuthUser.model');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await AuthUser.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    if (!user.isActive)
      return res.status(401).json({ success: false, message: 'Account is deactivated' });

    return res.json({
      success: true,
      data: {
        _id:   user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        token: generateToken(user._id),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  return res.json({
    success: true,
    data: {
      _id:   req.user._id,
      name:  req.user.name,
      email: req.user.email,
      role:  req.user.role,
    },
  });
};

// POST /api/auth/register  (admin only — create new executive)
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password required' });

    const exists = await AuthUser.findOne({ email });
    if (exists)
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await AuthUser.create({
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'executive',
    });

    return res.status(201).json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/users  (admin only — list all users)
const getUsers = async (req, res) => {
  try {
    const users = await AuthUser.find().select('-password').sort({ createdAt: -1 });
    return res.json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/auth/users/:id/toggle  (admin only — activate/deactivate)
const toggleUser = async (req, res) => {
  try {
    const user = await AuthUser.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    return res.json({ success: true, data: { _id: user._id, isActive: user.isActive } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/seed  (one-time — creates default admin if none exists)
const seed = async (req, res) => {
  try {
    const exists = await AuthUser.findOne({ role: 'admin' });
    if (exists)
      return res.status(400).json({ success: false, message: 'Admin already exists' });

    const admin = await AuthUser.create({
      name:     'Admin',
      email:    'admin@glowgreen.com',
      password: 'admin@123',
      role:     'admin',
    });

    return res.status(201).json({
      success: true,
      message: 'Default admin created',
      data: { email: admin.email, password: 'admin@123' },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { login, getMe, register, getUsers, toggleUser, seed };